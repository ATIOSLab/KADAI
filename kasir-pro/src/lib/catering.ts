import type { CateringStatus, PaymentType } from "@prisma/client";

/**
 * Domain booking catering — fungsi murni tanpa I/O, agar aturan bisnis bisa
 * diuji langsung dan dipakai konsisten oleh route handler.
 */

export const CATERING_STATUSES = [
  "BOOKED",
  "CONFIRMED",
  "IN_PRODUCTION",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
] as const satisfies readonly CateringStatus[];

export const CATERING_STATUS_LABELS: Record<CateringStatus, string> = {
  BOOKED: "Dipesan",
  CONFIRMED: "Disetujui",
  IN_PRODUCTION: "Diproduksi",
  DELIVERED: "Terkirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

/** Warna chip status (Tailwind classes). */
export const CATERING_STATUS_STYLES: Record<CateringStatus, string> = {
  BOOKED: "bg-slate-100 text-slate-700 border-slate-200",
  CONFIRMED: "bg-sky-50 text-sky-700 border-sky-200",
  IN_PRODUCTION: "bg-amber-50 text-amber-700 border-amber-200",
  DELIVERED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-600 border-rose-200 line-through",
};

/** Matriks transisi sah. Komplit/selesai dan batal adalah terminal. */
const CATERING_TRANSITIONS: Record<CateringStatus, readonly CateringStatus[]> = {
  BOOKED: ["CONFIRMED", "IN_PRODUCTION", "CANCELLED"],
  CONFIRMED: ["IN_PRODUCTION", "CANCELLED"],
  IN_PRODUCTION: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionCateringStatus(
  from: CateringStatus,
  to: CateringStatus
): boolean {
  if (from === to) return true;
  return CATERING_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Sisa tagihan = total - akumulasi yang sudah diterima (DP + cicilan). */
export function cateringRemaining(
  total: number | string,
  paid: number | string | null | undefined
): number {
  const t = Number(total) || 0;
  const p = Number(paid) || 0;
  const sisa = t - p;
  return sisa < 0 ? 0 : sisa;
}

export function isCateringPaidInFull(
  total: number | string,
  paid: number | string | null | undefined
): boolean {
  return cateringRemaining(total, paid) <= 0;
}

/** Metode uang masuk yang sah untuk buku kas DP/cicilan (piutang tidak pernah sah). */
export const CATERING_PAYMENT_METHODS = [
  "CASH",
  "BANK_TRANSFER",
  "QRIS",
  "E_WALLET",
] as const satisfies readonly PaymentType[];
