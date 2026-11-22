import { z } from "zod";
import { BUSINESS_TYPE_KEYS, DEFAULT_BUSINESS_TYPE } from "@/lib/business-catalog";

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
      businessType: z.enum(BUSINESS_TYPE_KEYS).default(DEFAULT_BUSINESS_TYPE),
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

const PLAN_CYCLES = ["MONTHLY", "QUARTERLY", "ANNUAL"] as const;

const planPriceAmount = z.number().int().min(0, "Harga tidak boleh negatif");

export const planLimitsSchema = z
  .object({
    maxOutlets: z.number().int().min(0).nullable().optional(),
    maxUsers: z.number().int().min(0).nullable().optional(),
    maxProducts: z.number().int().min(0).nullable().optional(),
    maxSku: z.number().int().min(0).nullable().optional(),
    kds: z.boolean().optional(),
    transferStock: z.boolean().optional(),
    centralKitchen: z.boolean().optional(),
  })
  .passthrough();

const planPricesSchema = z.object({
  MONTHLY: planPriceAmount,
  QUARTERLY: planPriceAmount,
  ANNUAL: planPriceAmount,
});

const planPricesUpdateSchema = z.object({
  MONTHLY: planPriceAmount.optional(),
  QUARTERLY: planPriceAmount.optional(),
  ANNUAL: planPriceAmount.optional(),
});

/**
 * Paket langganan platform. `code` immutable setelah dibuat (dipakai sebagai
 * pemetaan tier Store) dan hanya huruf besar/angka/garis bawah.
 * FREE wajib Rp 0 di semua siklus.
 */
export const planCreateSchema = z
  .object({
    code: z
      .string()
      .min(2, "Kode paket minimal 2 karakter")
      .max(40, "Kode paket maksimal 40 karakter")
      .regex(/^[A-Z0-9_]+$/, "Kode paket hanya boleh huruf besar, angka, dan garis bawah"),
    name: z.string().min(1, "Nama paket wajib diisi").max(100),
    description: z.string().max(500).optional().nullable(),
    badge: z.string().max(40).optional().nullable(),
    features: z.array(z.string().max(200)).default([]),
    limits: planLimitsSchema.default({}),
    prices: planPricesSchema,
    sortOrder: z.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.code === "FREE") {
      for (const cycle of PLAN_CYCLES) {
        if (data.prices[cycle] !== 0) {
          ctx.addIssue({
            code: "custom",
            message: "Paket FREE harus Rp 0 pada semua siklus",
            path: ["prices", cycle],
          });
        }
      }
    }
  });

export const planUpdateSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    badge: z.string().max(40).optional().nullable(),
    features: z.array(z.string().max(200)).optional(),
    limits: planLimitsSchema.optional(),
    prices: planPricesUpdateSchema.optional(),
    sortOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "Tidak ada field yang dikirim untuk diperbarui",
  });

export type OwnerCreateInput = z.infer<typeof ownerCreateSchema>;
export type OwnerUpdateInput = z.infer<typeof ownerUpdateSchema>;
export type SubscriptionUpdateInput = z.infer<typeof subscriptionUpdateSchema>;
export type PlanCreateInput = z.infer<typeof planCreateSchema>;
export type PlanUpdateInput = z.infer<typeof planUpdateSchema>;
