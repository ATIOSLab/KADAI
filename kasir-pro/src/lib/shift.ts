import type { PaymentType, Prisma } from "@prisma/client";

/**
 * Aritmetika shift kasir (laci) — dipakai bersama oleh:
 *  - POST /api/sales (menempelkan transaksi ke shift yang sedang terbuka),
 *  - GET/POST /api/pos/shifts (buka, lihat, tutup laci),
 *  - GET/POST /api/pos/shift-summary (layar X/Z-Report yang sudah ada).
 *
 * Aturan uang yang dipegang kasir:
 *   kas diharapkan = modal awal + penjualan tunai - refund tunai
 * Refund tunai bisa berasal dari transaksi shift SEBELUMNYA yang dibatalkan
 * pada shift ini; uangnya keluar dari laci sekarang, jadi harus ikut dihitung.
 */

export const SHIFT_PAYMENT_TYPES: readonly PaymentType[] = [
  "CASH",
  "QRIS",
  "BANK_TRANSFER",
  "E_WALLET",
  "TEMPO",
] as const;

export type ShiftDb = Pick<Prisma.TransactionClient, "sale">;

export interface ShiftSaleRow {
  totalAmount: Prisma.Decimal | number | string;
  taxAmount: Prisma.Decimal | number | string;
  discountAmount: Prisma.Decimal | number | string;
  serviceCharge: Prisma.Decimal | number | string;
  paymentType: PaymentType;
  isVoided: boolean;
  createdAt: Date;
}

export interface ShiftNumbers {
  totalSales: number;
  totalVoided: number;
  totalRevenue: number;
  totalCashSales: number;
  totalTax: number;
  totalDiscount: number;
  totalServiceCharge: number;
  priorCashRefunds: number;
  expectedCash: number;
  salesByPayment: Record<PaymentType, { count: number; total: number }>;
  firstTransactionTime: string | null;
  lastTransactionTime: string | null;
}

function num(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "number" ? value : Number(value.toString());
  return Number.isFinite(parsed) ? parsed : 0;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function emptyPaymentMap(): Record<PaymentType, { count: number; total: number }> {
  const map = {} as Record<PaymentType, { count: number; total: number }>;
  for (const type of SHIFT_PAYMENT_TYPES) {
    map[type] = { count: 0, total: 0 };
  }
  return map;
}

export function summarizeShiftSales(
  sales: ShiftSaleRow[],
  options: { openingCash?: number; priorCashRefunds?: number } = {}
): ShiftNumbers {
  const openingCash = Number.isFinite(options.openingCash) ? Number(options.openingCash) : 0;
  const priorCashRefunds = Number.isFinite(options.priorCashRefunds)
    ? Number(options.priorCashRefunds)
    : 0;

  const salesByPayment = emptyPaymentMap();
  let totalRevenue = 0;
  let totalCashSales = 0;
  let totalTax = 0;
  let totalDiscount = 0;
  let totalServiceCharge = 0;
  let totalSales = 0;
  let totalVoided = 0;
  let first: Date | null = null;
  let last: Date | null = null;

  for (const sale of sales) {
    if (sale.isVoided) {
      totalVoided += 1;
      continue;
    }

    const amount = round2(num(sale.totalAmount));
    totalSales += 1;
    totalRevenue = round2(totalRevenue + amount);
    totalTax = round2(totalTax + num(sale.taxAmount));
    totalDiscount = round2(totalDiscount + num(sale.discountAmount));
    totalServiceCharge = round2(totalServiceCharge + num(sale.serviceCharge));

    const bucket = salesByPayment[sale.paymentType];
    if (bucket) {
      bucket.count += 1;
      bucket.total = round2(bucket.total + amount);
    }
    if (sale.paymentType === "CASH") {
      totalCashSales = round2(totalCashSales + amount);
    }

    if (!first || sale.createdAt < first) first = sale.createdAt;
    if (!last || sale.createdAt > last) last = sale.createdAt;
  }

  const expectedCash = round2(openingCash + totalCashSales - priorCashRefunds);

  return {
    totalSales,
    totalVoided,
    totalRevenue,
    totalCashSales,
    totalTax,
    totalDiscount,
    totalServiceCharge,
    priorCashRefunds: round2(priorCashRefunds),
    expectedCash,
    salesByPayment,
    firstTransactionTime: first ? first.toISOString() : null,
    lastTransactionTime: last ? last.toISOString() : null,
  };
}

export interface ShiftScope {
  /** Baris shift; null saat rekap ad-hoc (belum pernah buka shift). */
  shiftId: string | null;
  storeId: string;
  cashierId: string;
  outletId: string | null;
  openedAt: Date;
  until?: Date;
}

/**
 * Menarik penjualan milik satu laci:
 *  - transaksi yang sudah menempel ke shift ini, DAN
 *  - transaksi tanpa shift pada jendela waktu yang sama (kasir lama/perangkat
 *    yang belum pernah "buka shift"); tanpa klausa ini rekap akan kosong dan
 *    kasir terlihat seperti tidak menjual apa pun.
 */
export async function loadShiftSales(db: ShiftDb, scope: ShiftScope): Promise<ShiftSaleRow[]> {
  const until = scope.until ?? new Date();

  return db.sale.findMany({
    where: {
      storeId: scope.storeId,
      cashierId: scope.cashierId,
      ...(scope.outletId ? { outletId: scope.outletId } : {}),
      createdAt: { gte: scope.openedAt, lte: until },
      ...(scope.shiftId
        ? { OR: [{ shiftId: scope.shiftId }, { shiftId: null }] }
        : { shiftId: null }),
    },
    orderBy: { createdAt: "asc" },
    select: {
      totalAmount: true,
      taxAmount: true,
      discountAmount: true,
      serviceCharge: true,
      paymentType: true,
      isVoided: true,
      createdAt: true,
    },
  });
}

/**
 * Refund tunai dari transaksi shift sebelumnya yang dibatalkan pada shift ini.
 * Uangnya benar-benar keluar dari laci sekarang, jadi mengurangi kas yang
 * seharusnya ada — tanpa angka ini selisih kas terlihat "kurang" padahal pas.
 */
export async function loadPriorShiftCashRefunds(
  db: ShiftDb,
  scope: Omit<ShiftScope, "shiftId">
): Promise<number> {
  const until = scope.until ?? new Date();
  const rows = await db.sale.findMany({
    where: {
      storeId: scope.storeId,
      cashierId: scope.cashierId,
      ...(scope.outletId ? { outletId: scope.outletId } : {}),
      isVoided: true,
      paymentType: "CASH",
      createdAt: { lt: scope.openedAt },
      voidedAt: { gte: scope.openedAt, lte: until },
    },
    select: { totalAmount: true },
  });

  return round2(rows.reduce((sum, row) => round2(sum + num(row.totalAmount)), 0));
}

export interface ShiftReport {
  shift: {
    id: string | null;
    status: "OPEN" | "CLOSED";
    outletId: string | null;
    openedAt: string;
    closedAt: string | null;
    /** Nomor Z-Report; null selama laci masih terbuka. */
    number: string | null;
    openingCash: number;
    closingCash: number | null;
    expectedCash: number;
    variance: number | null;
    notes: string | null;
    /** Jumlah transaksi di laci ini yang dibatalkan SETELAH laporan ditutup. */
    lateVoidCount: number;
    lastLateVoidAt: string | null;
  };
  store: { name: string; address: string | null; phone: string | null };
  cashier: { id: string; name: string; role: string } | null;
  shiftDate: string;
  firstTransactionTime: string | null;
  lastTransactionTime: string | null;
  totalTransactions: number;
  totalVoided: number;
  totalRevenue: number;
  totalTax: number;
  totalDiscount: number;
  totalServiceCharge: number;
  totalCashSales: number;
  totalCashRefunds: number;
  expectedCash: number;
  salesByPayment: Record<PaymentType, { count: number; total: number }>;
}

export interface ShiftReportInput {
  shift: {
    id: string | null;
    status: "OPEN" | "CLOSED";
    outletId: string | null;
    openedAt: Date;
    closedAt?: Date | null;
    number?: string | null;
    openingCash: number;
    closingCash?: number | null;
    notes?: string | null;
    lateVoidCount?: number;
    lastLateVoidAt?: Date | null;
  };
  store: { name: string; address: string | null; phone: string | null } | null;
  cashier: { id: string; name: string; role: string } | null;
  sales: ShiftSaleRow[];
  priorCashRefunds?: number;
}

export function buildShiftReport(input: ShiftReportInput): ShiftReport {
  const numbers = summarizeShiftSales(input.sales, {
    openingCash: input.shift.openingCash,
    priorCashRefunds: input.priorCashRefunds ?? 0,
  });

  const closingCash = input.shift.closingCash ?? null;
  const variance =
    closingCash === null ? null : round2(closingCash - numbers.expectedCash);

  return {
    shift: {
      id: input.shift.id,
      status: input.shift.status,
      outletId: input.shift.outletId,
      openedAt: input.shift.openedAt.toISOString(),
      closedAt: input.shift.closedAt ? input.shift.closedAt.toISOString() : null,
      number: input.shift.number ?? null,
      openingCash: round2(input.shift.openingCash),
      closingCash: closingCash === null ? null : round2(closingCash),
      expectedCash: numbers.expectedCash,
      variance,
      notes: input.shift.notes ?? null,
      lateVoidCount: input.shift.lateVoidCount ?? 0,
      lastLateVoidAt: input.shift.lastLateVoidAt
        ? input.shift.lastLateVoidAt.toISOString()
        : null,
    },
    store: input.store ?? { name: "KADAI POS", address: null, phone: null },
    cashier: input.cashier,
    shiftDate: (input.shift.closedAt ?? new Date()).toISOString(),
    firstTransactionTime: numbers.firstTransactionTime,
    lastTransactionTime: numbers.lastTransactionTime,
    totalTransactions: numbers.totalSales,
    totalVoided: numbers.totalVoided,
    totalRevenue: numbers.totalRevenue,
    totalTax: numbers.totalTax,
    totalDiscount: numbers.totalDiscount,
    totalServiceCharge: numbers.totalServiceCharge,
    totalCashSales: numbers.totalCashSales,
    totalCashRefunds: numbers.priorCashRefunds,
    expectedCash: numbers.expectedCash,
    salesByPayment: numbers.salesByPayment,
  };
}

export function varianceStatus(variance: number | null): "BALANCED" | "OVER" | "SHORT" | "OPEN" {
  if (variance === null) return "OPEN";
  if (Math.abs(variance) < 0.005) return "BALANCED";
  return variance > 0 ? "OVER" : "SHORT";
}