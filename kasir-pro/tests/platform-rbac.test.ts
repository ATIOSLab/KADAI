import test from "node:test";
import assert from "node:assert/strict";
import {
  APP_ROLES,
  SUPER_ADMIN_ROLES,
  ADMIN_ONLY_ROLES,
  hasRequiredRole,
  canAccessPath,
  getDefaultPathForRole,
  isAppRole,
} from "../src/lib/rbac";
import { createUserSchema, updateUserSchema } from "../src/lib/validators/user";
import {
  ownerCreateSchema,
  ownerUpdateSchema,
  subscriptionUpdateSchema,
} from "../src/lib/validators/platform";

// ═══════════════════════════════════════════════════════════════
// RBAC — Role SUPER_ADMIN (operator platform)
// ═══════════════════════════════════════════════════════════════

test("APP_ROLES memuat 7 role termasuk SUPER_ADMIN", () => {
  assert.equal(APP_ROLES.length, 7);
  assert.ok(APP_ROLES.includes("SUPER_ADMIN"));
  assert.ok(isAppRole("SUPER_ADMIN"));
  assert.equal(isAppRole("ROOT"), false);
});

test("SUPER_ADMIN satu-satunya role yang lolos gerbang platform, dan mewarisi kemampuan ADMIN", () => {
  assert.equal(hasRequiredRole("SUPER_ADMIN", SUPER_ADMIN_ROLES), true);
  assert.equal(hasRequiredRole("ADMIN", SUPER_ADMIN_ROLES), false);
  assert.equal(hasRequiredRole("MANAGER", SUPER_ADMIN_ROLES), false);

  // SUPER_ADMIN mewarisi seluruh gerbang admin/owner (dukungan lintas tenant)
  assert.equal(hasRequiredRole("SUPER_ADMIN", ADMIN_ONLY_ROLES), true);
  assert.equal(hasRequiredRole("ADMIN", ADMIN_ONLY_ROLES), true);
  assert.equal(hasRequiredRole("CASHIER", ADMIN_ONLY_ROLES), false);
  assert.equal(hasRequiredRole(null, ADMIN_ONLY_ROLES), false);
});

test("route guard /platform/* hanya untuk SUPER_ADMIN, fitur billing/demo/referral juga SUPER_ADMIN", () => {
  for (const path of ["/platform", "/platform/owners", "/platform/subscriptions"]) {
    assert.equal(canAccessPath(path, "SUPER_ADMIN"), true, `SUPER_ADMIN harus akses ${path}`);
    assert.equal(canAccessPath(path, "ADMIN"), false, `ADMIN tidak boleh akses ${path}`);
    assert.equal(canAccessPath(path, "CASHIER"), false, `CASHIER tidak boleh akses ${path}`);
  }

  // Fitur platform: billing/referral/demo → SUPER_ADMIN (bukan lagi owner)
  assert.equal(canAccessPath("/demo-requests", "SUPER_ADMIN"), true);
  assert.equal(canAccessPath("/demo-requests", "ADMIN"), false);
  assert.equal(canAccessPath("/referrals", "SUPER_ADMIN"), true);
  assert.equal(canAccessPath("/referrals", "ADMIN"), false);

  // Owner tetap mengelola staf tenant-nya sendiri
  assert.equal(canAccessPath("/settings", "ADMIN"), true);
  assert.equal(canAccessPath("/settings", "SUPER_ADMIN"), true);
  assert.equal(canAccessPath("/settings", "CASHIER"), false);
});

test("default landing page SUPER_ADMIN adalah /platform", () => {
  assert.equal(getDefaultPathForRole("SUPER_ADMIN"), "/platform");
  assert.equal(getDefaultPathForRole("CASHIER"), "/pos");
});

// ═══════════════════════════════════════════════════════════════
// Anti-eskalasi privilege — validator level
// ═══════════════════════════════════════════════════════════════

test("createUserSchema/updateUserSchema tenant menolak role SUPER_ADMIN", () => {
  const create = createUserSchema.safeParse({
    name: "Staff",
    email: "staff@kadai.test",
    password: "rahasia123",
    role: "SUPER_ADMIN",
  });
  assert.equal(create.success, false);

  const update = updateUserSchema.safeParse({ role: "SUPER_ADMIN" });
  assert.equal(update.success, false);

  // Role tenant yang sah tetap diterima
  assert.equal(updateUserSchema.safeParse({ role: "MANAGER" }).success, true);
});

test("ownerCreateSchema wajib email valid + password min 6, dan mendukung onboarding tenant baru", () => {
  const invalidEmail = ownerCreateSchema.safeParse({
    name: "Owner",
    email: "bukan-email",
    password: "rahasia123",
    newStore: { name: "Toko A" },
  });
  assert.equal(invalidEmail.success, false);

  const shortPassword = ownerCreateSchema.safeParse({
    name: "Owner",
    email: "owner@toko.test",
    password: "123",
  });
  assert.equal(shortPassword.success, false);

  const ok = ownerCreateSchema.safeParse({
    name: "Owner",
    email: "owner@toko.test",
    password: "rahasia123",
    newStore: { name: "Kopi Senja Bandung" },
  });
  assert.equal(ok.success, true);
  if (ok.success) {
    // default tenant baru: FNB_CAFE + PRO_BUSINESS + MONTHLY
    assert.equal(ok.data.newStore?.businessType, "FNB_CAFE");
    assert.equal(ok.data.newStore?.tier, "PRO_BUSINESS");
    assert.equal(ok.data.newStore?.cycle, "MONTHLY");
  }
});

test("ownerUpdateSchema menolak payload kosong", () => {
  assert.equal(ownerUpdateSchema.safeParse({}).success, false);
  assert.equal(ownerUpdateSchema.safeParse({ isActive: false }).success, true);
});

test("subscriptionUpdateSchema memvalidasi aksi kelola langganan", () => {
  // SET_TIER_CYCLE wajib tier
  assert.equal(subscriptionUpdateSchema.safeParse({ action: "SET_TIER_CYCLE" }).success, false);
  assert.equal(
    subscriptionUpdateSchema.safeParse({ action: "SET_TIER_CYCLE", tier: "ENTERPRISE", cycle: "ANNUAL" }).success,
    true
  );

  // SET_STATUS wajib status
  assert.equal(subscriptionUpdateSchema.safeParse({ action: "SET_STATUS" }).success, false);
  assert.equal(subscriptionUpdateSchema.safeParse({ action: "SET_STATUS", status: "PAST_DUE" }).success, true);

  // SET_EXPIRY menerima null (unlimited)
  const expiry = subscriptionUpdateSchema.safeParse({ action: "SET_EXPIRY", expiresAt: null });
  assert.equal(expiry.success, true);

  // SUSPEND_TENANT default menonaktifkan owner
  const suspend = subscriptionUpdateSchema.safeParse({ action: "SUSPEND_TENANT" });
  assert.equal(suspend.success, true);
  if (suspend.success) assert.equal(suspend.data.suspendOwners, true);

  // Aksi tak dikenal ditolak
  assert.equal(subscriptionUpdateSchema.safeParse({ action: "DROP_TABLE" }).success, false);
});
