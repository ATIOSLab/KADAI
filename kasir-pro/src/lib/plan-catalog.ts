import { prisma } from "@/lib/prisma";
import { CYCLE_MONTHS, TIER_LABELS, TIER_PRICES } from "@/lib/pricing";
import type { BillingCycle, PlanPrice, SubscriptionPlan, SubscriptionTier } from "@prisma/client";

/**
 * PLAN CATALOG — baca katalog paket langganan dari DB (SubscriptionPlan + PlanPrice).
 * Server-only. Client pages tetap membaca konstanta murni dari @/lib/pricing.
 */

export type PlanWithPrices = SubscriptionPlan & { prices: PlanPrice[] };

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { at: number; plans: PlanWithPrices[] } | null = null;

export function invalidatePlanCatalog(): void {
  cache = null;
}

async function loadPlans(): Promise<PlanWithPrices[]> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.plans;

  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    include: { prices: true },
  });

  cache = { at: now, plans };
  return plans;
}

export async function getPlans(): Promise<PlanWithPrices[]> {
  return loadPlans();
}

/** Harga resmi per tier & cycle — DB menang, fallback ke TIER_PRICES. */
export async function cyclePrice(tier: SubscriptionTier, cycle: BillingCycle): Promise<number> {
  const plans = await loadPlans();
  const plan = plans.find((p) => p.code === tier);
  const price = plan?.prices.find((p) => p.cycle === cycle);
  if (price) return Number(price.amount);
  return TIER_PRICES[tier][cycle];
}

/** Nama paket resmi — DB menang, fallback ke TIER_LABELS. */
export async function getPlanLabel(tier: SubscriptionTier): Promise<string> {
  const plans = await loadPlans();
  const plan = plans.find((p) => p.code === tier);
  return plan?.name ?? TIER_LABELS[tier];
}

export function pricesByCycle(plan: PlanWithPrices): Record<BillingCycle, number> {
  const map = {} as Record<BillingCycle, number>;
  for (const price of plan.prices) map[price.cycle] = Number(price.amount);
  return map;
}

export { CYCLE_MONTHS };
