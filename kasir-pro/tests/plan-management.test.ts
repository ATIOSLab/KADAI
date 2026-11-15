import test from "node:test";
import assert from "node:assert/strict";
import { ActionType } from "@prisma/client";
import { canAccessPath } from "../src/lib/rbac";
import {
  planCreateSchema,
  planUpdateSchema,
  planLimitsSchema,
} from "../src/lib/validators/platform";
import { TIER_PRICES } from "../src/lib/pricing";

// ═══════════════════════════════════════════════════════════════
// PLAN MANAGEMENT — katalog paket dikelola Super Admin
// ═══════════════════════════════════════════════════════════════

test("halaman /platform/plans hanya dapat diakses SUPER_ADMIN", () => {
  assert.equal(canAccessPath("/platform/plans", "SUPER_ADMIN"), true);
  for (const role of ["ADMIN", "MANAGER", "CASHIER", "KITCHEN", "INVENTORY", "ACCOUNTANT"] as const) {
    assert.equal(canAccessPath("/platform/plans", role), false, `${role} tidak boleh akses /platform/plans`);
  }
});

test("ActionType memuat audit plan (sinkron schema + migrasi)", () => {
  assert.ok(Object.values(ActionType).includes("PLAN_CREATED" as never));
  assert.ok(Object.values(ActionType).includes("PLAN_UPDATED" as never));
  assert.ok(Object.values(ActionType).includes("PLAN_ARCHIVED" as never));
});

test("planCreateSchema menolak paket FREE berharga > 0", () => {
  const base = {
    name: "Starter",
    features: ["1 Gerai & 1 Akun Kasir"],
    limits: { maxOutlets: 1, maxUsers: 1, maxProducts: 50, maxSku: 50 },
  };

  const paidFree = planCreateSchema.safeParse({
    ...base,
    code: "FREE",
    prices: { MONTHLY: 99_000, QUARTERLY: 0, ANNUAL: 0 },
  });
  assert.equal(paidFree.success, false, "FREE dengan harga > 0 harus ditolak");

  const freeZero = planCreateSchema.safeParse({
    ...base,
    code: "FREE",
    prices: { MONTHLY: 0, QUARTERLY: 0, ANNUAL: 0 },
  });
  assert.equal(freeZero.success, true, "FREE Rp 0 semua siklus harus lolos");
});

test("planCreateSchema: kode paket wajib huruf besar/angka/garis bawah", () => {
  const bad = planCreateSchema.safeParse({
    code: "business-pro",
    name: "Business Pro",
    prices: { MONTHLY: 249_000, QUARTERLY: 672_300, ANNUAL: 2_390_400 },
  });
  assert.equal(bad.success, false, "kode dengan huruf kecil/dash harus ditolak");

  const good = planCreateSchema.safeParse({
    code: "PRO_BUSINESS",
    name: "Business Pro",
    features: ["Hingga 3 Gerai"],
    limits: { maxOutlets: 3, maxUsers: null, maxProducts: null },
    prices: { MONTHLY: 249_000, QUARTERLY: 672_300, ANNUAL: 2_390_400 },
    sortOrder: 30,
  });
  assert.equal(good.success, true);
  if (good.success) {
    assert.equal(good.data.isActive, true, "default isActive = true");
    assert.equal(good.data.sortOrder, 30);
  }
});

test("planCreateSchema menolak harga negatif (anti-manipulasi billing)", () => {
  const negative = planCreateSchema.safeParse({
    code: "STARTER",
    name: "Professional",
    prices: { MONTHLY: -1, QUARTERLY: 267_300, ANNUAL: 950_400 },
  });
  assert.equal(negative.success, false);
});

test("planUpdateSchema: payload kosong ditolak, pembaruan sebagian lolos", () => {
  assert.equal(planUpdateSchema.safeParse({}).success, false);

  const partial = planUpdateSchema.safeParse({ prices: { MONTHLY: 109_000 } });
  assert.equal(partial.success, true);

  const archived = planUpdateSchema.safeParse({ isActive: false });
  assert.equal(archived.success, true);

  assert.equal(planUpdateSchema.safeParse({ sortOrder: -1 }).success, false);
});

test("limit paket: null = tanpa batas, angka 0 tetap batas eksplisit", () => {
  const unlimited = planLimitsSchema.safeParse({
    maxOutlets: null,
    maxUsers: null,
    maxProducts: null,
  });
  assert.equal(unlimited.success, true);
  if (unlimited.success) {
    assert.equal(unlimited.data.maxOutlets, null);
  }

  const zero = planLimitsSchema.safeParse({ maxOutlets: 0 });
  assert.equal(zero.success, true);
  if (zero.success) assert.equal(zero.data.maxOutlets, 0);

  assert.equal(planLimitsSchema.safeParse({ maxOutlets: -2 }).success, false);
});

test("harga tahunan engine konsisten dengan diskon 20% (sumber kebenaran invoice)", () => {
  for (const tier of ["STARTER", "PRO_BUSINESS", "ENTERPRISE"] as const) {
    const monthly = TIER_PRICES[tier].MONTHLY;
    assert.equal(
      TIER_PRICES[tier].ANNUAL,
      Math.round(monthly * 12 * 0.8),
      `${tier}: ANNUAL harus = 20% dari 12x harga bulanan`
    );
  }
  assert.deepEqual(TIER_PRICES.FREE, { MONTHLY: 0, QUARTERLY: 0, ANNUAL: 0 });
  assert.equal(TIER_PRICES.FREE.MONTHLY, 0, "paket FREE wajib Rp 0");
  assert.equal(TIER_PRICES.STARTER.MONTHLY, 99_000);
  assert.equal(TIER_PRICES.PRO_BUSINESS.MONTHLY, 249_000);
  assert.equal(TIER_PRICES.ENTERPRISE.MONTHLY, 599_000);
});
