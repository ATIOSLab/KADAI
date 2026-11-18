import { z } from "zod";

/**
 * Tier keanggotaan pelanggan.
 *
 * Nilai di sini harus sama dengan yang dipakai UI dan kolom
 * `Customer.memberTier` (default "BRONZE"). Sebelumnya validator memakai
 * "REGULAR" sementara form, filter tier, dan badge memakai "BRONZE": menyimpan
 * pelanggan baru dengan tier bawaan ditolak 400 "Format data yang dikirim tidak
 * valid", dan pelanggan bertier "REGULAR" tidak muncul di filter mana pun.
 */
export const MEMBER_TIERS = ["BRONZE", "SILVER", "GOLD", "PLATINUM"] as const;
export type MemberTier = (typeof MEMBER_TIERS)[number];

const TIER_ALIASES: Record<string, MemberTier> = {
  // Nilai lawas / masukan luar: dipetakan, bukan ditolak, agar integrasi yang
  // masih mengirim "REGULAR" atau huruf kecil tetap berjalan.
  REGULAR: "BRONZE",
};

const normalizeTier = (value: unknown) => {
  if (typeof value !== "string") return value;
  const upper = value.trim().toUpperCase();
  return TIER_ALIASES[upper] ?? upper;
};

const memberTierSchema = z
  .preprocess(
    normalizeTier,
    z.enum(MEMBER_TIERS, {
      message: `Tier keanggotaan tidak dikenal (${MEMBER_TIERS.join(", ")})`,
    })
  )
  .default("BRONZE");

export const createCustomerSchema = z.object({
  name: z.string().trim().min(2, "Nama pelanggan minimal 2 karakter").max(100, "Nama pelanggan maksimal 100 karakter"),
  phone: z
    .string()
    .trim()
    .max(30, "Nomor telepon maksimal 30 karakter")
    .optional()
    .nullable()
    .or(z.literal("")),
  email: z.string().trim().email("Format email tidak valid").max(100).optional().nullable().or(z.literal("")),
  address: z.string().trim().max(255, "Alamat maksimal 255 karakter").optional().nullable().or(z.literal("")),
  notes: z.string().trim().max(500, "Catatan maksimal 500 karakter").optional().nullable().or(z.literal("")),
  memberTier: memberTierSchema,
  loyaltyPoints: z.coerce.number().int().min(0).default(0),
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  id: z.string().min(1, "ID pelanggan wajib disertakan"),
  // Menonaktifkan pelanggan lewat formulir ubah (sama seperti tombol hapus).
  isActive: z.boolean().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
