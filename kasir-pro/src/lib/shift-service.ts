import type { CashShift } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import { ApiBusinessError } from "@/lib/api-response";
import {
  buildShiftReport,
  loadPriorShiftCashRefunds,
  loadShiftSales,
  varianceStatus,
  type ShiftReport,
} from "@/lib/shift";

const STORE_SELECT = { name: true, address: true, phone: true } as const;
const CASHIER_SELECT = { id: true, name: true, role: true } as const;

export interface CloseShiftResult {
  report: ShiftReport;
  status: ReturnType<typeof varianceStatus>;
}

/**
 * Menutup satu laci kasir dan MENYIMPAN hasilnya.
 *
 * Dipakai oleh dua pintu masuk (layar Shift/Z-Report dan /api/pos/shifts/[id])
 * supaya angka yang dicetak, angka yang disimpan, dan selisih kas yang
 * dilaporkan tidak pernah berbeda antar layar.
 */
export async function closeCashShift(
  shift: CashShift,
  input: { actualCash: number; notes?: string | null; actorUserId: string }
): Promise<CloseShiftResult> {
  const closedAt = new Date();
  const notes = input.notes?.trim() || null;

  const [sales, priorCashRefunds, store, cashier] = await Promise.all([
    loadShiftSales(prisma, {
      shiftId: shift.id,
      storeId: shift.storeId,
      cashierId: shift.cashierId,
      outletId: shift.outletId,
      openedAt: shift.openedAt,
      until: closedAt,
    }),
    loadPriorShiftCashRefunds(prisma, {
      storeId: shift.storeId,
      cashierId: shift.cashierId,
      outletId: shift.outletId,
      openedAt: shift.openedAt,
      until: closedAt,
    }),
    prisma.store.findUnique({ where: { id: shift.storeId }, select: STORE_SELECT }),
    prisma.user.findUnique({ where: { id: shift.cashierId }, select: CASHIER_SELECT }),
  ]);

  const report = buildShiftReport({
    shift: {
      id: shift.id,
      status: "CLOSED",
      outletId: shift.outletId,
      openedAt: shift.openedAt,
      closedAt,
      openingCash: Number(shift.openingCash),
      closingCash: input.actualCash,
      notes: notes ?? shift.closingNotes,
    },
    store,
    cashier,
    sales,
    priorCashRefunds,
  });

  // Klaim atomik: dua perangkat yang menekan "Tutup Shift" bersamaan tidak
  // boleh menghasilkan dua Z-Report dengan angka berbeda.
  const claim = await prisma.cashShift.updateMany({
    where: { id: shift.id, status: "OPEN" },
    data: {
      status: "CLOSED",
      closedAt,
      closingCash: input.actualCash,
      closingNotes: notes,
      expectedCash: report.expectedCash,
      variance: report.shift.variance,
      totalSales: report.totalTransactions,
      totalVoided: report.totalVoided,
      totalRevenue: report.totalRevenue,
      totalCashSales: report.totalCashSales,
      totalRefunds: report.totalCashRefunds,
      totalTax: report.totalTax,
      totalDiscount: report.totalDiscount,
      reportJson: report as unknown as object,
    },
  });

  if (claim.count !== 1) {
    throw new ApiBusinessError("Shift ini baru saja ditutup", 409, "SHIFT_ALREADY_CLOSED");
  }

  const status = varianceStatus(report.shift.variance);
  await logActivity({
    userId: input.actorUserId,
    action: "SHIFT_CLOSED",
    entity: "CashShift",
    entityId: shift.id,
    details: {
      cashierId: shift.cashierId,
      openingCash: report.shift.openingCash,
      closingCash: report.shift.closingCash,
      expectedCash: report.expectedCash,
      variance: report.shift.variance,
      varianceStatus: status,
      totalTransactions: report.totalTransactions,
      totalRevenue: report.totalRevenue,
      notes,
    },
  });

  return { report, status };
}

/** Rekap hidup satu laci (dipakai GET /api/pos/shifts). */
export async function buildLiveShiftReport(shift: CashShift): Promise<ShiftReport> {
  const [sales, priorCashRefunds, store, cashier] = await Promise.all([
    loadShiftSales(prisma, {
      shiftId: shift.id,
      storeId: shift.storeId,
      cashierId: shift.cashierId,
      outletId: shift.outletId,
      openedAt: shift.openedAt,
    }),
    loadPriorShiftCashRefunds(prisma, {
      storeId: shift.storeId,
      cashierId: shift.cashierId,
      outletId: shift.outletId,
      openedAt: shift.openedAt,
    }),
    prisma.store.findUnique({ where: { id: shift.storeId }, select: STORE_SELECT }),
    prisma.user.findUnique({ where: { id: shift.cashierId }, select: CASHIER_SELECT }),
  ]);

  return buildShiftReport({
    shift: {
      id: shift.id,
      status: shift.status,
      outletId: shift.outletId,
      openedAt: shift.openedAt,
      closedAt: shift.closedAt,
      openingCash: Number(shift.openingCash),
      closingCash: shift.closingCash === null ? null : Number(shift.closingCash),
      notes: shift.closingNotes,
    },
    store,
    cashier,
    sales,
    priorCashRefunds,
  });
}