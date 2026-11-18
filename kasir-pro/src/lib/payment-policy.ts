/**
 * Aturan kelengkapan bukti bayar.
 *
 * Dua hal yang membuat pembukuan tidak bisa dipertanggungjawabkan:
 *  - penjualan kredit (TEMPO) tanpa nama penanggung utang: piutangnya tidak
 *    bisa ditagih siapa pun, dan pemilik tidak tahu siapa yang berutang;
 *  - pembayaran non-tunai bernilai besar tanpa nomor referensi: tidak ada cara
 *    mencocokkannya dengan mutasi bank/EDC, jadi transfer yang tidak pernah
 *    masuk pun bisa tercatat sebagai penjualan lunas.
 *
 * Nilai kecil tetap dilonggarkan supaya antrean kasir tidak macet hanya karena
 * nomor referensi belum sempat dicatat.
 */

/** Mulai nilai ini, pembayaran non-tunai wajib punya nomor referensi. */
export const NON_CASH_REFERENCE_THRESHOLD = 250_000;

/** Nama penanggung utang minimal sepanjang ini (biar bukan "a"). */
export const MIN_DEBTOR_NAME_LENGTH = 3;

export type PaymentPolicyViolation =
  | "TEMPO_REQUIRES_CUSTOMER"
  | "NON_CASH_REFERENCE_REQUIRED";

export interface PaymentPolicyDecision {
  ok: boolean;
  code?: PaymentPolicyViolation;
  message?: string;
}

export function evaluatePaymentPolicy(input: {
  paymentType: string;
  /** Total tagihan yang sudah dihitung server (bukan angka kiriman klien). */
  totalAmount: number;
  paymentRef?: string | null;
  customerId?: string | null;
  customerName?: string | null;
}): PaymentPolicyDecision {
  const ref = (input.paymentRef ?? "").trim();
  const nama = (input.customerName ?? "").trim();

  if (input.paymentType === "TEMPO" && !input.customerId && nama.length < MIN_DEBTOR_NAME_LENGTH) {
    return {
      ok: false,
      code: "TEMPO_REQUIRES_CUSTOMER",
      message:
        "Penjualan tempo wajib mencantumkan pelanggan (nama minimal " +
        `${MIN_DEBTOR_NAME_LENGTH} karakter) supaya piutangnya bisa ditagih.`,
    };
  }

  const nonTunai =
    input.paymentType === "BANK_TRANSFER" ||
    input.paymentType === "QRIS" ||
    input.paymentType === "E_WALLET";

  if (nonTunai && ref.length === 0 && input.totalAmount >= NON_CASH_REFERENCE_THRESHOLD) {
    return {
      ok: false,
      code: "NON_CASH_REFERENCE_REQUIRED",
      message:
        "Pembayaran non-tunai mulai Rp " +
        `${NON_CASH_REFERENCE_THRESHOLD.toLocaleString("id-ID")} wajib disertai nomor referensi ` +
        "(no. approval EDC / ID transaksi QRIS).",
    };
  }

  return { ok: true };
}
