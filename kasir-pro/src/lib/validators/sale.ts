import { z } from "zod";

export const cartItemSchema = z.object({
  productId: z.string().min(1, "Produk wajib dipilih"),
  productName: z.string().min(1, "Nama produk wajib diisi"),
  quantity: z.number().int("Jumlah harus bilangan bulat").min(1, "Jumlah minimal 1 unit"),
  unitPrice: z.number("Harga satuan harus berupa angka").positive("Harga satuan harus lebih dari 0"),
  discountAmount: z.number("Diskon harus berupa angka").min(0, "Diskon tidak boleh negatif").default(0),
  selectedBatchId: z.string().optional().nullable(),
});

export const PAYMENT_TYPES = ["CASH", "BANK_TRANSFER", "QRIS", "E_WALLET", "TEMPO"] as const;
export const ORDER_TYPES = ["DINE_IN", "TAKEAWAY", "DELIVERY"] as const;
export const CATERING_STATUSES = ["BOOKED", "CONFIRMED", "IN_PRODUCTION", "DELIVERED", "COMPLETED", "CANCELLED"] as const;

/// Wajib memakai offset zona bisnis (mis. `2026-12-01T10:00:00+07:00`) supaya
/// jam acara yang tampil kembali identik dengan jam yang dipilih pemesan.
export const cateringInstantSchema = z
  .string()
  .refine((v) => Number.isFinite(Date.parse(v)), "Tanggal/jam acara tidak valid");

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Keranjang tidak boleh kosong"),
  paymentType: z.enum(PAYMENT_TYPES, {
    message: "Metode pembayaran tidak dikenal (CASH, BANK_TRANSFER, QRIS, E_WALLET, TEMPO)",
  }),
  orderType: z
    .enum(ORDER_TYPES, { message: "Jenis pesanan tidak dikenal (DINE_IN, TAKEAWAY, DELIVERY)" })
    .default("DINE_IN"),
  outletId: z.string().optional().nullable(),
  tableId: z.string().optional().nullable(),
  paymentRef: z.string().optional().nullable(),
  customerName: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  discountAmount: z.number().min(0).default(0),
  /// Alasan diskon manual. Wajib bila ada diskon (item maupun nota) supaya
  /// harga yang digeser selalu punya jejak; server menolak diskon tanpa alasannya.
  discountReason: z
    .string()
    .trim()
    .max(200, "Alasan diskon terlalu panjang")
    .optional()
    .nullable(),
  /// PIN supervisor untuk diskon di atas batas kasir (atau pembatalan transaksi).
  supervisorPin: z
    .string()
    .regex(/^\d{6,8}$/, "PIN supervisor harus 6-8 digit angka")
    .optional()
    .nullable(),
  /// Uang tunai yang diserahkan tamu. Diisi kasir untuk pembayaran CASH;
  /// server menolak nilai yang kurang dari total tagihan.
  paidAmount: z
    .number("Uang diterima harus berupa angka")
    .min(0, "Uang diterima tidak boleh negatif")
    .max(1e12, "Batas transaksi terlampaui")
    .optional()
    .nullable(),
  notes: z.string().max(500).optional().nullable(),
  idempotencyKey: z.string().max(128).optional().nullable(),
  // === BOOKING CATERING ===
  // Kehadiran `cateringEventDate` menjadikan transaksi ini booking katering.
  // Server memaksa paymentType=TEMPO (tagihan/piutang) dan mencatat DP pertama
  // ke buku kas catering; sisa tagihan dihitung dari total - akumulasi.
  cateringEventDate: cateringInstantSchema.optional().nullable(),
  cateringDeliveryAt: cateringInstantSchema.optional().nullable(),
  cateringDeposit: z
    .number("Uang muka harus berupa angka")
    .min(0, "Uang muka tidak boleh negatif")
    .max(1e12, "Batas uang muka terlampaui")
    .optional()
    .nullable(),
  /// Metode pembayaran DP. Wajib bila DP > 0 (CASH/BANK_TRANSFER/QRIS/E_WALLET).
  cateringDepositMethod: z
    .enum(["CASH", "BANK_TRANSFER", "QRIS", "E_WALLET"], {
      message: "Metode uang muka tidak dikenal",
    })
    .optional()
    .nullable(),
  cateringNote: z.string().max(500, "Catatan acara terlalu panjang").optional().nullable(),
});

export const saleFilterSchema = z.object({
  search: z.string().optional(),
  cashierId: z.string().optional(),
  outletId: z.string().optional(),
  paymentType: z
    .enum(PAYMENT_TYPES, { message: "Metode pembayaran tidak dikenal" })
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isVoided: z.boolean().optional(),
  /// Filter daftar booking catering (katering & event).
  catering: z.literal("true").optional(),
  cateringStatus: z
    .enum(CATERING_STATUSES, { message: "Status catering tidak dikenal" })
    .optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

/// Penerimaan uang booking catering (DP pertama dicatat saat booking dibuat;
/// endpoint ini untuk cicilan berikutnya dan pelunasan).
export const cateringPaymentSchema = z.object({
  amount: z
    .number("Nominal pembayaran harus berupa angka")
    .positive("Nominal pembayaran harus lebih dari 0")
    .max(1e12, "Batas transaksi terlampaui"),
  method: z.enum(["CASH", "BANK_TRANSFER", "QRIS", "E_WALLET"], {
    message: "Metode pembayaran tidak dikenal",
  }),
  note: z.string().trim().max(200, "Catatan terlalu panjang").optional().nullable(),
  idempotencyKey: z.string().max(128).optional().nullable(),
});

/// Perpindahan status booking: maju satu tahap, atau pembatalan.
export const cateringStatusSchema = z.object({
  status: z.enum(CATERING_STATUSES, { message: "Status catering tidak dikenal" }),
  note: z.string().trim().max(200, "Catatan terlalu panjang").optional().nullable(),
});

export const voidSaleSchema = z.object({
  reason: z.string().min(1, "Alasan void wajib diisi").max(500),
});

/** Alasan koreksi susulan (laci sudah ditutup) wajib benar-benar menjelaskan. */
export const voidSaleAfterCloseSchema = voidSaleSchema.extend({
  reason: z
    .string()
    .min(15, "Pembatalan setelah laci ditutup wajib menyertakan alasan yang jelas (min. 15 karakter)")
    .max(500),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type SaleFilterInput = z.infer<typeof saleFilterSchema>;
export type VoidSaleInput = z.infer<typeof voidSaleSchema>;
export type CateringPaymentInput = z.infer<typeof cateringPaymentSchema>;
export type CateringStatusInput = z.infer<typeof cateringStatusSchema>;
