import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { resolveTenantScope } from "@/lib/tenant-scope";
import { getBusinessDayStart } from "@/lib/business-day";
import { resolveBusinessTimezone } from "@/lib/business-timezone";
import { ADMIN_MANAGER_ROLES, POS_ROLES, hasRequiredRole } from "@/lib/rbac";
import {
  buildShiftReport,
  loadPriorShiftCashRefunds,
  loadShiftSales,
  varianceStatus,
} from "@/lib/shift";
import { buildLiveShiftReport, closeCashShift } from "@/lib/shift-service";

const CASHIER_SELECT = { id: true, name: true, role: true } as const;
const STORE_SELECT = { name: true, address: true, phone: true } as const;

/**
 * Layar X/Z-Report yang sudah dipakai kasir.
 *
 * Sejak shift punya barisnya sendiri (CashShift), endpoint ini membaca laci yang
 * SEDANG TERBUKA bila ada. Bila kasir belum pernah membuka shift, rekap tetap
 * dihitung dari awal hari bisnis (perilaku lama) supaya layar tidak kosong.
 */
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) return jsonError("Unauthorized", 401);

    if (!hasRequiredRole(sessionUser.role, POS_ROLES)) {
      return jsonError("Role Anda tidak dapat melihat rekap shift", 403);
    }

    // Isolasi tenant: SUPER_ADMIN (operator platform) ditolak 403, akun tanpa store 403.
    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) return jsonError(scope.message, scope.status);

    const { searchParams } = new URL(request.url);
    const bolehLihatOrangLain = hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES);
    const targetCashierId = bolehLihatOrangLain
      ? searchParams.get("cashierId") || sessionUser.id
      : sessionUser.id;

    const cashierUser = await prisma.user.findFirst({
      where: { id: targetCashierId, storeId: scope.storeId },
      select: CASHIER_SELECT,
    });
    if (!cashierUser) {
      return jsonError("Kasir tidak ditemukan pada tenant Anda", 404);
    }

    const openShift = await prisma.cashShift.findFirst({
      where: { storeId: scope.storeId, cashierId: targetCashierId, status: "OPEN" },
      orderBy: { openedAt: "desc" },
    });

    if (openShift) {
      return jsonOk(await buildLiveShiftReport(openShift));
    }

    // Rekap ad-hoc: belum ada laci terbuka, hitung dari awal hari bisnis.
    const timezone = await resolveBusinessTimezone();
    const todayStart = getBusinessDayStart(new Date(), timezone);

    const [sales, priorCashRefunds, store] = await Promise.all([
      loadShiftSales(prisma, {
        shiftId: null,
        storeId: scope.storeId,
        cashierId: targetCashierId,
        outletId: null,
        openedAt: todayStart,
      }),
      loadPriorShiftCashRefunds(prisma, {
        storeId: scope.storeId,
        cashierId: targetCashierId,
        outletId: null,
        openedAt: todayStart,
      }),
      prisma.store.findUnique({ where: { id: scope.storeId }, select: STORE_SELECT }),
    ]);

    return jsonOk(
      buildShiftReport({
        shift: {
          id: null,
          status: "OPEN",
          outletId: null,
          openedAt: todayStart,
          openingCash: 0,
        },
        store,
        cashier: cashierUser,
        sales,
        priorCashRefunds,
      })
    );
  } catch (error) {
    return handleApiError(error, "GET /api/pos/shift-summary", "Gagal memuat rekap shift kasir");
  }
}

// POST /api/pos/shift-summary — tutup shift (Z-Report) dan SIMPAN hasilnya
export async function POST(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) return jsonError("Unauthorized", 401);

    if (!hasRequiredRole(sessionUser.role, POS_ROLES)) {
      return jsonError("Role Anda tidak dapat menutup shift kasir", 403);
    }

    // Isolasi tenant: SUPER_ADMIN (operator platform) ditolak 403, akun tanpa store 403.
    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) return jsonError(scope.message, scope.status);

    const body = await request.json();
    const actualCash = Number(body?.actualCash);
    const startingCashInput = Number(body?.startingCash ?? 0);
    const notes = typeof body?.notes === "string" ? body.notes : null;

    if (!Number.isFinite(actualCash) || actualCash < 0) {
      return jsonError("Fisik kas harus berupa angka tak negatif", 400);
    }
    if (!Number.isFinite(startingCashInput) || startingCashInput < 0) {
      return jsonError("Modal awal harus berupa angka tak negatif", 400);
    }

    let shift = await prisma.cashShift.findFirst({
      where: { storeId: scope.storeId, cashierId: sessionUser.id, status: "OPEN" },
      orderBy: { openedAt: "desc" },
    });

    // Kasir yang menutup tanpa pernah membuka shift: modal awal dari layar
    // dipakai, dan penjualan hari bisnis berjalan ikut terhitung. Barisnya tetap
    // dibuat supaya Z-Report punya identitas dan bisa dicetak ulang.
    if (!shift) {
      const timezone = await resolveBusinessTimezone();
      const todayStart = getBusinessDayStart(new Date(), timezone);
      shift = await prisma.cashShift.create({
        data: {
          storeId: scope.storeId,
          cashierId: sessionUser.id,
          openedAt: todayStart,
          openingCash: startingCashInput,
          openingNotes: "Dibuka otomatis saat penutupan shift (Z-Report)",
          status: "OPEN",
        },
      });
    }

    const { report, status } = await closeCashShift(shift, {
      actualCash,
      notes,
      actorUserId: sessionUser.id,
    });

    return jsonOk(
      {
        success: true,
        closingRecord: {
          shiftId: shift.id,
          cashierName: sessionUser.name,
          startingCash: report.shift.openingCash,
          cashSalesTotal: report.totalCashSales,
          cashRefunds: report.totalCashRefunds,
          expectedCash: report.expectedCash,
          actualCash: report.shift.closingCash,
          variance: report.shift.variance,
          status,
          totalTransactions: report.totalTransactions,
          closedAt: report.shift.closedAt,
        },
        report,
        varianceStatus: varianceStatus(report.shift.variance),
      },
      status === "BALANCED"
        ? "Shift ditutup, kas sesuai"
        : `Shift ditutup dengan selisih Rp ${Math.abs(
            report.shift.variance ?? 0
          ).toLocaleString("id-ID")}`
    );
  } catch (error) {
    return handleApiError(error, "POST /api/pos/shift-summary", "Gagal menutup shift kasir");
  }
}