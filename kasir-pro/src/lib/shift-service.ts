import type { CashShift, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import { ApiBusinessError } from "@/lib/api-response";
import { getBusinessDayStart } from "@/lib/business-day";
import { resolveBusinessTimezone } from "@/lib/business-timezone";
import { generateShiftNumber } from "@/lib/utils";
import { ensureFinanceCategories } from "@/lib/finance";
import {
  resolveShiftVarianceLedgerEntry,
  shiftVarianceLedgerTitle,
} from "@/lib/shift-ledger";
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
  /** Entri Buku Kas penampung selisih kas; null bila kas pas. */
  ledgerEntryId: string | null;
}

/**
 * Mencatat selisih kas ke Buku Kas sebagai entri tersendiri.
 *
 * Satu entri per shift (`FinanceEntry.cashShiftId` unik), arah mengikuti tanda
 * selisih: kurang = uang keluar, lebih = uang masuk. Shift yang pas tidak
 * menghasilkan entri apa pun.
 */
async function recordShiftVarianceEntry(
  tx: Prisma.TransactionClient,
  input: {
    shift: CashShift;
    report: ShiftReport;
    actorUserId: string;
  }
) {
  const entry = resolveShiftVarianceLedgerEntry(input.report.shift.variance);
  if (!entry) return null;

  const category = await tx.financeCategory.findUnique({
    where: { systemKey: entry.systemKey },
    select: { id: true },
  });

  if (!category) {
    // Kategori sistem wajib ada; lebih baik tutup shift digagalkan daripada
    // selisih kas hilang dari pembukuan tanpa jejak.
    throw new ApiBusinessError(
      `Kategori Buku Kas "${entry.systemKey}" tidak ditemukan`,
      500,
      "FINANCE_CATEGORY_MISSING"
    );
  }

  const kasir = input.report.cashier?.name ?? null;
  return tx.financeEntry.create({
    data: {
      amount: entry.amount,
      direction: entry.direction,
      source: "SHIFT_VARIANCE",
      title: shiftVarianceLedgerTitle({
        shiftNumber: input.report.shift.number,
        cashierName: kasir,
        variance: input.report.shift.variance ?? 0,
      }),
      notes: `Kas fisik ${input.report.shift.closingCash ?? 0} vs kas diharapkan ${input.report.expectedCash}`,
      entryDate: input.report.shift.closedAt
        ? new Date(input.report.shift.closedAt)
        : new Date(),
      storeId: input.shift.storeId,
      categoryId: category.id,
      createdByUserId: input.actorUserId,
      cashShiftId: input.shift.id,
    },
    select: { id: true, direction: true, amount: true },
  });
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

  // Kategori Buku Kas untuk selisih kas harus ada SEBELUM transaksi penutupan;
  // memanggil ensure di dalam transaksi akan mengulang upsert 9 kategori pada
  // setiap penutupan laci.
  await ensureFinanceCategories(prisma);

  let report: ShiftReport | null = null;
  let claimed = 0;
  let ledgerEntryId: string | null = null;

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
        lateVoidCount: shift.lateVoidCount,
        lastLateVoidAt: shift.lastLateVoidAt,
        reprintCount: shift.reprintCount,
      },
      store,
      cashier,
      sales,
      priorCashRefunds,
    });

    try {
      // Klaim atomik + entri Buku Kas dalam SATU transaksi: kalau pencatatan
      // selisih gagal, penutupan shift ikut dibatalkan sehingga laci tertutup
      // tidak pernah kehilangan jejak uangnya.
      const claim = await prisma.$transaction(async (tx) => {
        const result = await tx.cashShift.updateMany({
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

        if (result.count === 1) {
          const ledger = await recordShiftVarianceEntry(tx, {
            shift,
            report: candidate,
            actorUserId: input.actorUserId,
          });
          return { count: result.count, ledgerId: ledger?.id ?? null };
        }

        return { count: result.count, ledgerId: null };
      });

      report = candidate;
      claimed = claim.count;
      ledgerEntryId = claim.ledgerId;
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
      ledgerEntryId,
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

  return { report, status, ledgerEntryId };
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
      lateVoidCount: shift.lateVoidCount,
      lastLateVoidAt: shift.lastLateVoidAt,
    },
    store,
    cashier,
    sales,
    priorCashRefunds,
  });
}