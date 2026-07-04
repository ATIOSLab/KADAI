import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi").max(200),
  sku: z.string().min(1, "SKU wajib diisi").max(50),
  barcode: z.string().max(50).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  unit: z.string().trim().min(1, "Satuan wajib diisi").max(50),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  lowStockThreshold: z.number().int().min(0).default(10),
  image: z.string().optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial();

export const productFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
