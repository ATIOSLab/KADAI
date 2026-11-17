import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentType } from "@prisma/client";
import { getSessionUserFromRequest } from "@/lib/session";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity-logger";
import { resolveTenantScope } from "@/lib/tenant-scope";
import { getBusinessDayStart } from "@/lib/business-day";
import { resolveBusinessTimezone } from "@/lib/business-timezone";

const CASHIER_SELECT = { id: true, name: true, role: true, outletId: true };

// GET /api/pos/shift-summary - Get current shift sales breakdown for the cashier
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return jsonError("Unauthorized", 401);
    }

    // Isolasi tenant: SUPER_ADMIN (operator platform) ditolak 403, akun tanpa store 403.
    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return jsonError(scope.message, scope.status);
    }

    const { searchParams } = new URL(request.url);
    const targetCashierId =
      sessionUser.role === "ADMIN" || sessionUser.role === "MANAGER"
        ? searchParams.get("cashierId") || sessionUser.id
        : sessionUser.id;

    // Shift window: awal hari pada zona bisnis toko (bukan jam server UTC)
    const timezone = await resolveBusinessTimezone();
    const todayStart = getBusinessDayStart(new Date(), timezone);

    const [sales, scopedCashier, store] = await Promise.all([
      // Semua agregasi shift dibatasi ke tenant pemanggil (sale.outlet.storeId)
      prisma.sale.findMany({
        where: {
          cashierId: targetCashierId,
          createdAt: { gte: todayStart },
          outlet: { storeId: scope.storeId },
        },
        orderBy: { createdAt: "asc" },
      }),
      // Kasir yang dilihat wajib anggota tenant pemanggil
      prisma.user.findFirst({
        where: { id: targetCashierId, storeId: scope.storeId },
        select: CASHIER_SELECT,
      }),
      // Store mengikuti tenant pemanggil, bukan "store pertama di DB"
      prisma.store.findUnique({
        where: { id: scope.storeId },
        select: { name: true, address: true, phone: true },
      }),
    ]);

    // Fallback aman: hanya untuk diri sendiri (tidak pernah membuka data tenant lain)
    let cashierUser = scopedCashier;
    if (!cashierUser && targetCashierId === sessionUser.id) {
      cashierUser = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: CASHIER_SELECT,
      });
    }
    if (!cashierUser) {
      return jsonError("Kasir tidak ditemukan pada tenant Anda", 404);
    }

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

    // Isolasi tenant: SUPER_ADMIN (operator platform) ditolak 403, akun tanpa store 403.
    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return jsonError(scope.message, scope.status);
    }

    const body = await request.json();
    const { startingCash, actualCash, notes } = body;

    if (typeof startingCash !== "number" || typeof actualCash !== "number") {
      return jsonError("Nilai modal awal dan fisik kas harus berupa angka", 400);
    }

    // Query active sales for today — dibatasi ke tenant pemanggil
    const timezone = await resolveBusinessTimezone();
    const todayStart = getBusinessDayStart(new Date(), timezone);

    const sales = await prisma.sale.findMany({
      where: {
        cashierId: sessionUser.id,
        createdAt: { gte: todayStart },
        isVoided: false,
        outlet: { storeId: scope.storeId },
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
      // Aksi sendiri: sebelumnya memakai SALE_CREATED, sehingga riwayat
      // aktivitas melaporkan "Transaksi Dibuat" untuk penutupan kas.
      action: "SHIFT_CLOSED",
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
