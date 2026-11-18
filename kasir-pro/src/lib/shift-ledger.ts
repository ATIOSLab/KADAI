/**
 * Selisih kas (variance) yang wajib tercatat di Buku Kas.
 *
 * Laci yang kurang Rp 9.000 berarti uang keluar tanpa transaksi; laci lebih
 * berarti ada uang masuk tanpa penjualan. Keduanya kejadian finansial, jadi
 * harus muncul sebagai entri Buku Kas tersendiri — bukan hanya angka di
 * Z-Report yang tidak pernah dibaca pembukuan.
 *
 * Fungsi ini murni (tanpa DB) supaya bisa diuji tanpa Postgres.
 */

export const SHIFT_VARIANCE_SYSTEM_KEYS = {
  SHORT: "SHIFT_VARIANCE_SHORT",
  OVER: "SHIFT_VARIANCE_OVER",
} as const;

/** Ambang sama dengan `varianceStatus`: selisih < Rp 0,005 dianggap pas. */
const BALANCED_EPSILON = 0.005;

export interface ShiftVarianceLedgerEntry {
  direction: "IN" | "OUT";
  systemKey: (typeof SHIFT_VARIANCE_SYSTEM_KEYS)[keyof typeof SHIFT_VARIANCE_SYSTEM_KEYS];
  /** Selalu positif; arah ditentukan oleh `direction`. */
  amount: number;
}

export function resolveShiftVarianceLedgerEntry(
  variance: number | null | undefined
): ShiftVarianceLedgerEntry | null {
  if (variance === null || variance === undefined || !Number.isFinite(variance)) {
    return null;
  }

  const rounded = Math.round((variance + Number.EPSILON) * 100) / 100;
  if (Math.abs(rounded) < BALANCED_EPSILON) return null;

  return rounded < 0
    ? {
        direction: "OUT",
        systemKey: SHIFT_VARIANCE_SYSTEM_KEYS.SHORT,
        amount: Math.abs(rounded),
      }
    : {
        direction: "IN",
        systemKey: SHIFT_VARIANCE_SYSTEM_KEYS.OVER,
        amount: rounded,
      };
}

/** Judul entri Buku Kas: menyebut nomor Z-Report supaya bisa ditelusuri. */
export function shiftVarianceLedgerTitle(input: {
  shiftNumber: string | null;
  cashierName: string | null;
  variance: number;
}) {
  const nomor = input.shiftNumber ? `Z-Report ${input.shiftNumber}` : "Z-Report";
  const kasir = input.cashierName ? ` — ${input.cashierName}` : "";
  const arah = input.variance < 0 ? "Kas Kurang" : "Kas Lebih";

  return `${nomor}: Selisih ${arah}${kasir}`;
}