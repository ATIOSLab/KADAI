import type { BillingCycle, SubscriptionTier } from "@prisma/client";

/**
 * Daftar harga resmi KADAI — sumber kebenaran tunggal untuk invoice & billing.
 * Selaras dengan PricingSection (landing) & halaman /harga.
 */
export const TIER_LABELS: Record<SubscriptionTier, string> = {
  FREE: "Starter",
  STARTER: "Professional",
  PRO_BUSINESS: "Business Pro",
  ENTERPRISE: "Enterprise",
};

export const TIER_PRICES: Record<SubscriptionTier, Record<BillingCycle, number>> = {
  FREE: { MONTHLY: 0, QUARTERLY: 0, ANNUAL: 0 },
  STARTER: { MONTHLY: 99_000, QUARTERLY: 267_300, ANNUAL: 950_400 },
  PRO_BUSINESS: { MONTHLY: 249_000, QUARTERLY: 672_300, ANNUAL: 2_390_400 },
  ENTERPRISE: { MONTHLY: 599_000, QUARTERLY: 1_617_300, ANNUAL: 5_750_400 },
};

export const CYCLE_MONTHS: Record<BillingCycle, number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  ANNUAL: 12,
};

export function cyclePrice(tier: SubscriptionTier, cycle: BillingCycle): number {
  return TIER_PRICES[tier][cycle];
}
