import { z } from "zod";

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().positive(),
  discountAmount: z.number().min(0).default(0),
  selectedBatchId: z.string().optional().nullable(),
});

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Keranjang tidak boleh kosong"),
  paymentType: z.enum(["CASH", "BANK_TRANSFER", "QRIS", "E_WALLET", "TEMPO"]),
  orderType: z.enum(["DINE_IN", "TAKEAWAY", "DELIVERY"]).default("DINE_IN"),
  outletId: z.string().optional().nullable(),
  tableId: z.string().optional().nullable(),
  paymentRef: z.string().optional().nullable(),
  customerName: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  discountAmount: z.number().min(0).default(0),
  notes: z.string().max(500).optional().nullable(),
  idempotencyKey: z.string().max(128).optional().nullable(),
});

export const saleFilterSchema = z.object({
  search: z.string().optional(),
  cashierId: z.string().optional(),
  outletId: z.string().optional(),
  paymentType: z.enum(["CASH", "BANK_TRANSFER", "QRIS", "E_WALLET", "TEMPO"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isVoided: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const voidSaleSchema = z.object({
  reason: z.string().min(1, "Alasan void wajib diisi").max(500),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type SaleFilterInput = z.infer<typeof saleFilterSchema>;
export type VoidSaleInput = z.infer<typeof voidSaleSchema>;
