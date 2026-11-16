import { prisma } from "@/lib/prisma";

/**
 * Batasan operasional paket langganan (disimpan sebagai JSON di
 * SubscriptionPlan.limits). Nilai null / tidak ada = tidak dibatasi.
 * Baca langsung ke DB (bukan cache aktif getPlans) agar limit tetap
 * ter-enforce meski paket diarsipkan.
 */
export interface PlanLimits {
  maxOutlets?: number | null;
  maxUsers?: number | null;
  maxProducts?: number | null;
  maxSku?: number | null;
  kds?: boolean;
  transferStock?: boolean;
  centralKitchen?: boolean;
  [key: string]: unknown;
}

export type LimitCheck =
  | { allowed: true }
  | { allowed: false; message: string };

/**
 * Ambil limits paket tenant berdasarkan tier Store. Mengembalikan null
 * (fail-open) jika tenant/tier/paket tidak ditemukan.
 */
export async function getTenantPlanLimits(
  storeId: string | null | undefined
): Promise<PlanLimits | null> {
  if (!storeId) {
    return null;
  }

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { tier: true },
  });
  if (!store) {
    return null;
  }

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { code: store.tier },
    select: { limits: true },
  });
  if (!plan) {
    return null;
  }

  return (plan.limits ?? {}) as PlanLimits;
}

/**
 * Cek kuota cabang. Tambahan default 1 (pembuatan cabang baru).
 */
export async function checkOutletLimit(
  storeId: string | null | undefined,
  additional = 1
): Promise<LimitCheck> {
  const limits = await getTenantPlanLimits(storeId);
  if (!limits || limits.maxOutlets == null) {
    return { allowed: true };
  }

  const count = await prisma.outlet.count({
    where: { storeId, isDemo: false }, // row demo tidak dihitung — kuota untuk data operasional asli
  });
  if (count + additional > limits.maxOutlets) {
    return {
      allowed: false,
      message: `Paket Anda dibatasi maksimal ${limits.maxOutlets} cabang.`,
    };
  }
  return { allowed: true };
}

/**
 * Cek kuota akun pengguna. Tambahan default 1 (pembuatan user baru).
 */
export async function checkUserLimit(
  storeId: string | null | undefined,
  additional = 1
): Promise<LimitCheck> {
  const limits = await getTenantPlanLimits(storeId);
  if (!limits || limits.maxUsers == null) {
    return { allowed: true };
  }

  const count = await prisma.user.count({
    where: { storeId, isDemo: false }, // row demo tidak dihitung — kuota untuk akun operasional asli
  });
  if (count + additional > limits.maxUsers) {
    return {
      allowed: false,
      message: `Paket Anda dibatasi maksimal ${limits.maxUsers} akun pengguna.`,
    };
  }
  return { allowed: true };
}

/**
 * Cek kuota produk. Tambahan default 1 (pembuatan produk baru).
 * Catatan: skema saat ini single-tenant — produk tidak punya storeId,
 * jadi hitungannya seluruh produk non-demo di sistem.
 */
export async function checkProductLimit(
  storeId: string | null | undefined,
  additional = 1
): Promise<LimitCheck> {
  const limits = await getTenantPlanLimits(storeId);
  if (!limits || limits.maxProducts == null) {
    return { allowed: true };
  }

  // Kuota dihitung per tenant (produk milik store ini saja); row demo/global tidak dihitung
  const count = await prisma.product.count({
    where: { isDemo: false, ...(storeId ? { storeId } : {}) },
  });
  if (count + additional > limits.maxProducts) {
    return {
      allowed: false,
      message: `Paket Anda dibatasi maksimal ${limits.maxProducts} produk.`,
    };
  }
  return { allowed: true };
}

/**
 * Fitur paket yang dijual sebagai flag (KDS, transfer stok, dapur pusat).
 * Semantik: hanya `false` EKSPLISIT yang memblokir — `true`, `undefined`, atau
 * paket yang belum punya kunci tersebut tetap diizinkan (fail-open), supaya
 * tenant lama tidak mati ketika katalog paket belum lengkap.
 */
export type PlanFeature = "kds" | "transferStock" | "centralKitchen";

const PLAN_FEATURE_LABELS: Record<PlanFeature, string> = {
  kds: "Kitchen Display System (KDS)",
  transferStock: "transfer stok antar cabang",
  centralKitchen: "dapur pusat (central kitchen)",
};

export async function checkFeature(
  storeId: string | null | undefined,
  feature: PlanFeature
): Promise<LimitCheck> {
  const limits = await getTenantPlanLimits(storeId);
  if (!limits || limits[feature] !== false) {
    return { allowed: true };
  }

  return {
    allowed: false,
    message: `Paket Anda tidak mencakup fitur ${PLAN_FEATURE_LABELS[feature]}. Upgrade paket untuk mengaktifkannya.`,
  };
}

/**
 * Cek kuota SKU (produk yang punya kode SKU). null / tidak ada = tanpa batas.
 */
export async function checkSkuLimit(
  storeId: string | null | undefined,
  additional = 1
): Promise<LimitCheck> {
  const limits = await getTenantPlanLimits(storeId);
  if (!limits || limits.maxSku == null) {
    return { allowed: true };
  }

  // Product.sku wajib (String non-null) → setiap produk aktif = satu SKU
  const count = await prisma.product.count({
    where: { storeId, isActive: true },
  });
  if (count + additional > limits.maxSku) {
    return {
      allowed: false,
      message: `Paket Anda dibatasi maksimal ${limits.maxSku} SKU.`,
    };
  }
  return { allowed: true };
}
