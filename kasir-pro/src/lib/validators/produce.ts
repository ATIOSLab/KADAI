import { z } from "zod";

export const produceBatchSchema = z.object({
  quantityToProduce: z.coerce.number().int().min(1, "Jumlah produksi minimal 1 unit").max(100000, "Jumlah produksi maksimal 100.000 unit"),
  outletId: z.string().optional().nullable(),
  batchNumber: z.string().trim().max(100).optional().nullable(),
  expiryDate: z.string().trim().optional().nullable(),
  notes: z.string().trim().max(500, "Catatan maksimal 500 karakter").optional().nullable(),
});

export type ProduceBatchInput = z.infer<typeof produceBatchSchema>;
