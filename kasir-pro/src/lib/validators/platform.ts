import { z } from "zod";

/**
 * Validator khusus platform KADAI (diperuntukkan endpoint SUPER_ADMIN).
 * Role SUPER_ADMIN TIDAK tersedia pada createUserSchema/updateUserSchema
 * reguler (scope tenant), hanya dapat dibuat/diubah lewat endpoint platform
 * yang digate SUPER_ADMIN_ROLES — mencegah eskalasi privilege dari sisi validator.
 */

export const ownerCreateSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").max(72),
  supervisorPin: z
    .string()
    .regex(/^\d{6,8}$/, "PIN harus 6-8 digit angka")
    .optional()
    .nullable(),
  // Sertakan storeId untuk menautkan owner ke tenant EXISTING...
  storeId: z.string().min(1).optional(),
  // ...atau buat tenant (Store) baru sekaligus (onboarding klien baru).
  newStore: z
    .object({
      name: z.string().min(1, "Nama tenant wajib diisi").max(120),
      businessType: z
        .enum([
          "RETAIL",
          "FNB_CAFE",
          "FNB_RESTAURANT",
          "FNB_WARUNG",
          "BUILDING_SUPPLY",
          "PHARMACY",
          "SERVICE",
        ])
        .default("FNB_CAFE"),
      tier: z
        .enum(["FREE", "STARTER", "PRO_BUSINESS", "ENTERPRISE"])
        .default("PRO_BUSINESS"),
      cycle: z
        .enum(["MONTHLY", "QUARTERLY", "ANNUAL"])
        .default("MONTHLY"),
    })
    .optional(),
});

export const ownerUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6, "Password minimal 6 karakter").max(72).optional(),
  supervisorPin: z
    .string()
    .regex(/^\d{6,8}$/, "PIN harus 6-8 digit angka")
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
  storeId: z.string().min(1).nullable().optional(),
}).refine((d) => Object.keys(d).length > 0, {
  message: "Tidak ada field yang dikirim untuk diperbarui",
});

export const SUBSCRIPTION_ACTION = [
  "SET_TIER_CYCLE",
  "SET_STATUS",
  "SET_EXPIRY",
  "SUSPEND_TENANT",
] as const;
export type SubscriptionAction = (typeof SUBSCRIPTION_ACTION)[number];

export const subscriptionUpdateSchema = z
  .object({
    action: z.enum(SUBSCRIPTION_ACTION),
    tier: z.enum(["FREE", "STARTER", "PRO_BUSINESS", "ENTERPRISE"]).optional(),
    cycle: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]).optional(),
    status: z
      .enum(["ACTIVE", "PAST_DUE", "EXPIRED", "CANCELLED"])
      .optional(),
    expiresAt: z.string().datetime({ offset: true }).optional().nullable(),
    // SUSPEND_TENANT: ikut menonaktifkan seluruh akun owner tenant tsb?
    suspendOwners: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.action === "SET_TIER_CYCLE" && !data.tier) {
      ctx.addIssue({
        code: "custom",
        message: "Tier wajib diisi untuk aksi SET_TIER_CYCLE",
        path: ["tier"],
      });
    }
    if (data.action === "SET_STATUS" && !data.status) {
      ctx.addIssue({
        code: "custom",
        message: "Status wajib diisi untuk aksi SET_STATUS",
        path: ["status"],
      });
    }
  });

export type OwnerCreateInput = z.infer<typeof ownerCreateSchema>;
export type OwnerUpdateInput = z.infer<typeof ownerUpdateSchema>;
export type SubscriptionUpdateInput = z.infer<typeof subscriptionUpdateSchema>;
