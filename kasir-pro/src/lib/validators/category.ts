import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi").max(100),
  description: z.string().max(500).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
