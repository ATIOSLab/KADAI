import { z } from "zod";

export const createUnitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama satuan wajib diisi")
    .max(50, "Nama satuan maksimal 50 karakter"),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;

/**
 * Ganti nama satuan. `id` wajib karena route-nya koleksi (`PUT /api/units`),
 * mengikuti pola yang sudah dipakai pemasok dan pelanggan.
 */
export const updateUnitSchema = z.object({
  id: z.string().min(1, "ID satuan wajib disertakan"),
  name: z
    .string()
    .trim()
    .min(1, "Nama satuan wajib diisi")
    .max(50, "Nama satuan maksimal 50 karakter"),
});

export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
