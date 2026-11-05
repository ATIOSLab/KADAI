import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().trim().min(2, "Nama pelanggan minimal 2 karakter").max(100, "Nama pelanggan maksimal 100 karakter"),
  phone: z.string().trim().max(30, "Nomor telepon maksimal 30 karakter").optional().nullable(),
  email: z.string().trim().email("Format email tidak valid").max(100).optional().nullable().or(z.literal("")),
  address: z.string().trim().max(255, "Alamat maksimal 255 karakter").optional().nullable(),
  memberTier: z.enum(["REGULAR", "SILVER", "GOLD", "PLATINUM"]).default("REGULAR"),
  loyaltyPoints: z.coerce.number().int().min(0).default(0),
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  id: z.string().min(1, "ID pelanggan wajib disertakan"),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
