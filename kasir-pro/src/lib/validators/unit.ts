import { z } from "zod";

export const createUnitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama satuan wajib diisi")
    .max(50, "Nama satuan maksimal 50 karakter"),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
