import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentType } from "@prisma/client";
import { getSessionUserFromRequest } from "@/lib/session";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity-logger";

// GET /api/pos/shift-summary - Get current shift sales breakdown for the cashier
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return jsonError("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const targetCashierId =
      sessionUser.role === "ADMIN" || sessionUser.role === "MANAGER"
        ? searchParams.get("cashierId") || sessionUser.id
        : sessionUser.id;

    // Shift window: default to start of today in local time
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [sales, cashierUser, store] = await Promise.all([
      prisma.sale.findMany({
        where: {
          cashierId: targetCashierId,
          createdAt: { gte: todayStart },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.user.findUnique({
        where: { id: targetCashierId },
        select: { id: true, name: true, role: true, outletId: true },
      }),
      prisma.store.findFirst({
        select: { name: true, address: true, phone: true },
      }),
    ]);

    const activeSales = sales.filter((s) => !s.isVoided);
    const voidedSales = sales.filter((s) => s.isVoided);

    const salesByPayment: Record<PaymentType, { count: number; total: number }> = {
      CASH: { count: 0, total: 0 },
      QRIS: { count: 0, total: 0 },
      BANK_TRANSFER: { count: 0, total: 0 },
      E_WALLET: { count: 0, total: 0 },
      TEMPO: { count: 0, total: 0 },
    };

    let totalRevenue = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    let totalServiceCharge = 0;

    for (const sale of activeSales) {
      const amount = Number(sale.totalAmount);
      totalRevenue += amount;
      totalTax += Number(sale.taxAmount);
      totalDiscount += Number(sale.discountAmount);
      totalServiceCharge += Number(sale.serviceCharge);

      if (salesByPayment[sale.paymentType]) {
        salesByPayment[sale.paymentType].count += 1;
        salesByPayment[sale.paymentType].total += amount;
      }
    }

    const firstTime = activeSales[0]?.createdAt ?? null;
    const lastTime = activeSales[activeSales.length - 1]?.createdAt ?? null;

    return jsonOk({
      store: store ?? { name: "KADAI POS", address: null, phone: null },
      cashier: cashierUser,
      shiftDate: new Date().toISOString(),
      firstTransactionTime: firstTime,
      lastTransactionTime: lastTime,
      totalTransactions: activeSales.length,
      totalVoided: voidedSales.length,
      totalRevenue,
      totalTax,
      totalDiscount,
      totalServiceCharge,
      salesByPayment,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/pos/shift-summary", "Gagal memuat rekap shift kasir");
  }
}

// POST /api/pos/shift-summary - Submit Z-Report (Shift Closing)
export async function POST(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return jsonError("Unauthorized", 401);
    }

    const body = await request.json();
    const { startingCash, actualCash, notes } = body;

    if (typeof startingCash !== "number" || typeof actualCash !== "number") {
      return jsonError("Nilai modal awal dan fisik kas harus berupa angka", 400);
    }

    // Query active sales for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const sales = await prisma.sale.findMany({
      where: {
        cashierId: sessionUser.id,
        createdAt: { gte: todayStart },
        isVoided: false,
      },
    });

    const cashSalesTotal = sales
      .filter((s) => s.paymentType === "CASH")
      .reduce((sum, s) => sum + Number(s.totalAmount), 0);

    const expectedCash = startingCash + cashSalesTotal;
    const variance = actualCash - expectedCash;

    // Log the closing event to immutable ActivityLog
    await logActivity({
      userId: sessionUser.id,
      action: "SALE_CREATED", // reuse existing action or audit log
      entity: "CashShift",
      entityId: `SHIFT-${sessionUser.id}-${Date.now()}`,
      details: {
        type: "SHIFT_CLOSING_Z_REPORT",
        cashierName: sessionUser.name,
        startingCash,
        cashSalesTotal,
        expectedCash,
        actualCash,
        variance,
        totalTransactions: sales.length,
        notes: notes || null,
        closedAt: new Date().toISOString(),
      },
    });

    return jsonOk({
      success: true,
      closingRecord: {
        cashierName: sessionUser.name,
        startingCash,
        cashSalesTotal,
        expectedCash,
        actualCash,
        variance,
        status: variance === 0 ? "BALANCED" : variance > 0 ? "OVER" : "SHORT",
        closedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error, "POST /api/pos/shift-summary", "Gagal menutup shift kasir");
  }
}
