/**
 * Kebijakan diskon manual pada layar kasir.
 *
 * Sebelum ini `discountAmount` dari klien diterima apa adanya: kasir bisa
 * mengirim diskon sebesar seluruh subtotal sehingga nota tercetak Rp 0 tanpa
 * satu pun jejak siapa yang menggeser harga dan mengapa. Modul ini yang
 * menentukan batas wajar per role, dan apakah diskon sebesar itu butuh
 * persetujuan supervisor (PIN).
 *
 * Angka batas hidup di `Store.maxCashierDiscountPercent` supaya tiap tenant
 * bisa menyesuaikannya sendiri.
 */

export const DEFAULT_MAX_CASHIER_DISCOUNT_PERCENT = 10;

/** Role yang dibatasi batas diskon tenant. Manager/Admin/owner bertanggung jawab penuh. */
export const DISCOUNT_LIMITED_ROLES = ["CASHIER"] as const;

export type DiscountDecision = "NONE" | "WITHIN_LIMIT" | "NEEDS_APPROVAL" | "APPROVED";

export interface DiscountPolicyInput {
  role: string;
  /** Nilai transaksi sebelum diskon, dihitung server (bukan kiriman klien). */
  subtotal: number;
  /** Total diskon: diskon per item + diskon nota. */
  discountAmount: number;
  /** Batas persen untuk kasir; null/undefined memakai default. */
  maxCashierDiscountPercent?: number | null;
  /** True bila PIN supervisor sudah diverifikasi untuk transaksi ini. */
  supervisorApproved?: boolean;
}

export interface DiscountPolicyResult {
  /** Persentase diskon terhadap subtotal (2 desimal). */
  percent: number;
  /** Nilai rupiah maksimum yang boleh diberikan tanpa persetujuan. */
  limitAmount: number;
  /** Batas persen yang berlaku untuk role ini (null = tanpa batas). */
  limitPercent: number | null;
  /** Diskon melampaui batas dan belum ada persetujuan supervisor. */
  requiresApproval: boolean;
  /** Boleh dilanjutkan atau tidak. */
  allowed: boolean;
  decision: DiscountDecision;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function resolveDiscountLimitPercent(
  role: string,
  maxCashierDiscountPercent?: number | null
): number | null {
  if (!(DISCOUNT_LIMITED_ROLES as readonly string[]).includes(role)) {
    return null;
  }
  const configured =
    maxCashierDiscountPercent === null || maxCashierDiscountPercent === undefined
      ? DEFAULT_MAX_CASHIER_DISCOUNT_PERCENT
      : maxCashierDiscountPercent;
  if (!Number.isFinite(configured) || configured < 0) {
    return DEFAULT_MAX_CASHIER_DISCOUNT_PERCENT;
  }
  return Math.min(100, configured);
}

export function evaluateDiscountPolicy(input: DiscountPolicyInput): DiscountPolicyResult {
  const subtotal = Number.isFinite(input.subtotal) ? Math.max(0, input.subtotal) : 0;
  const discount = Number.isFinite(input.discountAmount) ? Math.max(0, input.discountAmount) : 0;
  const limitPercent = resolveDiscountLimitPercent(input.role, input.maxCashierDiscountPercent);

  const percent = subtotal > 0 ? round2((discount / subtotal) * 100) : 0;
  if (discount <= 0) {
    return {
      percent: 0,
      limitAmount: 0,
      limitPercent,
      requiresApproval: false,
      allowed: true,
      decision: "NONE",
    };
  }

  if (limitPercent === null) {
    return {
      percent,
      limitAmount: subtotal,
      limitPercent: null,
      requiresApproval: false,
      allowed: true,
      decision: "WITHIN_LIMIT",
    };
  }

  const limitAmount = round2((subtotal * limitPercent) / 100);
  // Toleransi 0,5 sen: batas dihitung persen, nilai diskon dalam rupiah.
  const withinLimit = discount <= limitAmount + 0.005;

  if (withinLimit) {
    return {
      percent,
      limitAmount,
      limitPercent,
      requiresApproval: false,
      allowed: true,
      decision: "WITHIN_LIMIT",
    };
  }

  const approved = Boolean(input.supervisorApproved);
  return {
    percent,
    limitAmount,
    limitPercent,
    requiresApproval: !approved,
    allowed: approved,
    decision: approved ? "APPROVED" : "NEEDS_APPROVAL",
  };
}

/** Pesan siap tampil di kasir saat diskon butuh persetujuan supervisor. */
export function discountApprovalMessage(result: DiscountPolicyResult): string {
  const batas = result.limitPercent ?? 0;
  return `Diskon ${result.percent}% melebihi batas kasir ${batas}% (maks Rp ${result.limitAmount.toLocaleString(
    "id-ID"
  )}). Minta PIN Supervisor untuk menyetujui.`;
}