import { z } from "zod";

export const createTransferItemSchema = z.object({
  productId: z.string().min(1, "ID produk wajib diisi"),
  quantity: z.coerce.number().int().min(1, "Jumlah minimal 1 unit"),
  costPrice: z.coerce.number().min(0, "HPP tidak boleh negatif").default(0),
  notes: z.string().trim().max(255).optional().nullable(),
});

export const createTransferSchema = z.object({
  sourceOutletId: z.string().min(1, "Cabang asal wajib dipilih"),
  destinationOutletId: z.string().min(1, "Cabang tujuan wajib dipilih"),
  notes: z.string().trim().max(500, "Catatan maksimal 500 karakter").optional().nullable(),
  items: z.array(createTransferItemSchema).min(1, "Minimal harus ada 1 barang yang ditransfer"),
}).refine((data) => data.sourceOutletId !== data.destinationOutletId, {
  message: "Cabang asal dan cabang tujuan tidak boleh sama",
  path: ["destinationOutletId"],
});

export const updateTransferStatusSchema = z.object({
  id: z.string().min(1, "ID transfer wajib disertakan"),
  action: z.enum(["RECEIVE", "CANCEL"]),
});

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type UpdateTransferStatusInput = z.infer<typeof updateTransferStatusSchema>;
