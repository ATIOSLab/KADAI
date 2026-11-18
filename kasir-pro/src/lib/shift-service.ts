import type { CashShift } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import { ApiBusinessError } from "@/lib/api-response";
import { getBusinessDayStart } from "@/lib/business-day";
import { resolveBusinessTimezone } from "@/lib/business-timezone";
import { generateShiftNumber } from "@/lib/utils";
import {
  buildShiftReport,
  loadPriorShiftCashRefunds,
  loadShiftSales,
  varianceStatus,
  type ShiftReport,
} from "@/lib/shift";

const STORE_SELECT = { name: true, address: true, phone: true } as const;
const CASHIER_SELECT = { id: true, name: true, role: true } as const;

/** Batas percobaan nomor Z-Report saat dua kasir menutup laci bersamaan. */
const MAX_NUMBER_ATTEMPTS = 20;

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2002"
  );
}

/**
 * Nomor Z-Report berikutnya untuk hari bisnis berjalan.
 *
 * Nomor dihitung dari jumlah laci yang SUDAH ditutup hari itu lalu digeser
 * `offset` langkah; pemanggil mengulang dengan offset lebih besar bila nomor
 * yang sama baru saja dipakai kasir lain (indeks unik store+nomor menolaknya).
 * Konsekuensinya nomor bisa melompat saat banyak laci ditutup bersamaan —
 * nomor adalah identitas dokumen, bukan urutan kejadian.
 */
async function buildShiftNumberCandidate(
  storeId: string,
  at: Date,
  timezone: string,
  offset: number
) {
  const dayStart = getBusinessDayStart(at, timezone);
  const usedToday = await prisma.cashShift.count({
    where: { storeId, closedAt: { gte: dayStart }, shiftNumber: { not: null } },
  });

  return generateShiftNumber(usedToday + 1 + offset, at, timezone);
}

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

  const timezone = await resolveBusinessTimezone();

  let report: ShiftReport | null = null;
  let claimed = 0;

  // Nomor Z-Report dialokasikan bersamaan dengan klaim laci: bila dua kasir
  // menutup laci pada detik yang sama, indeks unik store+nomor menolak nomor
  // kembar dan percobaan diulang dengan nomor berikutnya.
  for (let attempt = 0; attempt < MAX_NUMBER_ATTEMPTS && report === null; attempt += 1) {
    const shiftNumber = await buildShiftNumberCandidate(
      shift.storeId,
      closedAt,
      timezone,
      attempt
    );

    const candidate = buildShiftReport({
      shift: {
        id: shift.id,
        status: "CLOSED",
        outletId: shift.outletId,
        openedAt: shift.openedAt,
        closedAt,
        number: shiftNumber,
        openingCash: Number(shift.openingCash),
        closingCash: input.actualCash,
        notes: notes ?? shift.closingNotes,
      },
      store,
      cashier,
      sales,
      priorCashRefunds,
    });

    try {
      // Klaim atomik: dua perangkat yang menekan "Tutup Shift" bersamaan tidak
      // boleh menghasilkan dua Z-Report dengan angka berbeda.
      const claim = await prisma.cashShift.updateMany({
        where: { id: shift.id, status: "OPEN" },
        data: {
          status: "CLOSED",
          shiftNumber,
          closedAt,
          closingCash: input.actualCash,
          closingNotes: notes,
          expectedCash: candidate.expectedCash,
          variance: candidate.shift.variance,
          totalSales: candidate.totalTransactions,
          totalVoided: candidate.totalVoided,
          totalRevenue: candidate.totalRevenue,
          totalCashSales: candidate.totalCashSales,
          totalRefunds: candidate.totalCashRefunds,
          totalTax: candidate.totalTax,
          totalDiscount: candidate.totalDiscount,
          reportJson: candidate as unknown as object,
        },
      });

      report = candidate;
      claimed = claim.count;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      // Nomor baru saja dipakai kasir lain — ulangi dengan nomor berikutnya.
    }
  }

  if (!report) {
    throw new ApiBusinessError(
      "Nomor Z-Report bentrok terus. Coba tutup shift lagi.",
      409,
      "SHIFT_NUMBER_CONFLICT"
    );
  }

  if (claimed !== 1) {
    throw new ApiBusinessError("Shift ini baru saja ditutup", 409, "SHIFT_ALREADY_CLOSED");
  }

  const status = varianceStatus(report.shift.variance);
  await logActivity({
    userId: input.actorUserId,
    action: "SHIFT_CLOSED",
    entity: "CashShift",
    entityId: shift.id,
    details: {
      shiftNumber: report.shift.number,
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
      number: shift.shiftNumber,
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