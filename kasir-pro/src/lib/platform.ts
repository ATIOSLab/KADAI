import { prisma } from "./prisma";
import { Prisma, SubscriptionTier } from "@prisma/client";
import { SessionUser } from "./session";

/**
 * Helper lapisan platform KADAI (khusus SUPER_ADMIN).
 * Semua guard di sini bersifat server-authoritative — bukan sekadar sembunyi UI.
 */

export function isPlatformAdmin(sessionUser: Pick<SessionUser, "role"> | null | undefined) {
  return sessionUser?.role === "SUPER_ADMIN";
}

/** Jumlah SUPER_ADMIN aktif (termasuk userId tertentu bila diberikan). */
export async function countActiveSuperAdmins(excludeUserId?: string) {
  return prisma.user.count({
    where: {
      role: "SUPER_ADMIN",
      isActive: true,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
  });
}

/**
 * Guard: SUPER_ADMIN terakhir yang aktif tidak boleh diturunkan/dinonaktifkan.
 * Mencegah lock-out platform selamanya.
 */
export async function ensureNotLastSuperAdmin(
  targetId: string,
  options?: { demotingToRole?: boolean }
) {
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { role: true, isActive: true },
  });
  if (!target) return false;

  const isTargetSuperAdmin = target.role === "SUPER_ADMIN";
  if (!isTargetSuperAdmin) return true; // bukan superadmin — tidak terpengaruh

  const remaining = await countActiveSuperAdmins(targetId);
  // Jika target masih aktif & akan dinonaktifkan (atau diubah role-nya) & tidak ada
  // SUPER_ADMIN aktif lain → tolak.
  if (target.isActive && remaining === 0) {
    return false;
  }
  return true;
}

/** Sinkronkan tier Store dengan StoreSubscription (satu sumber kebenaran billing). */
export async function syncStoreTier(storeId: string, tier: SubscriptionTier) {
  return prisma.store.update({
    where: { id: storeId },
    data: { tier },
  });
}

/** Membuat langganan awal untuk tenant baru (tanpa invoice). */
export async function provisionInitialSubscription(
  storeId: string,
  tier: SubscriptionTier,
  cycle: "MONTHLY" | "QUARTERLY" | "ANNUAL",
  months: number
) {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + months);

  const [subscription] = await prisma.$transaction([
    prisma.storeSubscription.create({
      data: {
        storeId,
        tier,
        cycle,
        status: "ACTIVE",
        startedAt: now,
        expiresAt,
      },
    }),
    prisma.store.update({
      where: { id: storeId },
      data: { tier },
    }),
  ]);

  return subscription;
}

/** Hari tersisa hingga expiresAt (negatif = sudah lewat). */
export function daysUntil(date: Date | null | undefined): number | null {
  if (!date) return null;
  const diff = date.getTime() - Date.now();
  return Math.floor(diff / 86_400_000);
}

export function formatCurrency(amount: number | Prisma.Decimal | null | undefined) {
  if (amount == null) return "Rp 0";
  const value = typeof amount === "number" ? amount : amount.toNumber();
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
