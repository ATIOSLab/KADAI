import { z } from "zod";

export const createTableSchema = z.object({
  tableNo: z.string().trim().min(1, "Nomor meja wajib diisi").max(20, "Nomor meja maksimal 20 karakter"),
  section: z.string().trim().default("Utama"),
  capacity: z.coerce.number().int().min(1, "Kapasitas minimal 1 orang").max(100, "Kapasitas maksimal 100 orang").default(4),
  isOccupied: z.boolean().default(false),
  outletId: z.string().optional().nullable(),
});

export const updateTableSchema = createTableSchema.partial().extend({
  id: z.string().min(1, "ID meja wajib disertakan"),
});

export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
