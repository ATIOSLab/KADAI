import { z } from "zod";

export const createBatchSchema = z.object({
  productId: z.string().min(1, "Produk wajib dipilih"),
  // Cabang tempat stok masuk. Bila tidak dikirim, server memakai cabang
  // pengguna atau cabang utama tenant (lihat POST /api/batches). Sebelumnya
  // kolom ini tidak ada di skema sehingga stok restock tersimpan tanpa cabang
  // dan tidak bisa dijual di cabang mana pun.
  outletId: z.string().min(1, "Cabang tidak valid").optional().nullable(),
  quantity: z.number().int().min(1, "Jumlah minimal 1 unit"),
  costPrice: z.number().positive("Harga modal harus positif"),
  sellingPrice: z.number().positive("Harga jual harus positif"),
  supplierId: z.string().optional().nullable(),
  purchaseDate: z.string().or(z.date()).optional(),
  expiryDate: z.string().or(z.date()).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const batchFilterSchema = z.object({
  productId: z.string().optional(),
  hasRemaining: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type BatchFilterInput = z.infer<typeof batchFilterSchema>;
