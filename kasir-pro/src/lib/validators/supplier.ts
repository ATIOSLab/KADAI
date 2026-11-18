import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().trim().min(2, "Nama pemasok minimal 2 karakter").max(100, "Nama pemasok maksimal 100 karakter"),
  phone: z.string().trim().max(30, "Nomor telepon maksimal 30 karakter").optional().nullable(),
  email: z.string().trim().email("Format email tidak valid").max(100).optional().nullable().or(z.literal("")),
  address: z.string().trim().max(255, "Alamat maksimal 255 karakter").optional().nullable(),
});

export const updateSupplierSchema = createSupplierSchema.partial().extend({
  id: z.string().min(1, "ID pemasok wajib disertakan"),
  // Status aktif ikut bisa diubah di sini karena halaman Pemasok memakai satu
  // formulir untuk menyunting data dan menonaktifkan vendor. Sebelumnya nilai
  // ini dibuang diam-diam oleh zod: tombol melaporkan "berhasil" tetapi status
  // pemasok tidak berubah sama sekali.
  isActive: z.boolean().optional(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
