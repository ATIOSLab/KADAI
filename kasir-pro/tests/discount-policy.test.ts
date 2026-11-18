import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_MAX_CASHIER_DISCOUNT_PERCENT,
  discountApprovalMessage,
  evaluateDiscountPolicy,
  resolveDiscountLimitPercent,
} from "../src/lib/discount-policy";

test("kasir boleh diskon kecil tanpa PIN", () => {
  const result = evaluateDiscountPolicy({
    role: "CASHIER",
    subtotal: 100_000,
    discountAmount: 5_000,
    maxCashierDiscountPercent: 10,
  });

  assert.equal(result.decision, "WITHIN_LIMIT");
  assert.equal(result.allowed, true);
  assert.equal(result.requiresApproval, false);
  assert.equal(result.limitAmount, 10_000);
  assert.equal(result.percent, 5);
});

test("diskon di atas batas kasir wajib persetujuan supervisor", () => {
  const result = evaluateDiscountPolicy({
    role: "CASHIER",
    subtotal: 100_000,
    discountAmount: 25_000,
    maxCashierDiscountPercent: 10,
  });

  assert.equal(result.decision, "NEEDS_APPROVAL");
  assert.equal(result.allowed, false);
  assert.equal(result.requiresApproval, true);
  assert.match(discountApprovalMessage(result), /25%/);
  assert.match(discountApprovalMessage(result), /10%/);
});

test("persetujuan supervisor membuka jalan, jejaknya tetap tercatat APPROVED", () => {
  const result = evaluateDiscountPolicy({
    role: "CASHIER",
    subtotal: 100_000,
    discountAmount: 25_000,
    maxCashierDiscountPercent: 10,
    supervisorApproved: true,
  });

  assert.equal(result.decision, "APPROVED");
  assert.equal(result.allowed, true);
  assert.equal(result.requiresApproval, false);
});

test("manager dan admin tidak dibatasi batas diskon kasir", () => {
  for (const role of ["MANAGER", "ADMIN", "OWNER"]) {
    const result = evaluateDiscountPolicy({
      role,
      subtotal: 100_000,
      discountAmount: 90_000,
      maxCashierDiscountPercent: 10,
    });
    assert.equal(result.limitPercent, null, `${role} seharusnya tanpa batas`);
    assert.equal(result.allowed, true);
    assert.equal(result.decision, "WITHIN_LIMIT");
  }
});

test("tanpa diskon keputusannya NONE dan tidak pernah butuh PIN", () => {
  const result = evaluateDiscountPolicy({
    role: "CASHIER",
    subtotal: 100_000,
    discountAmount: 0,
  });
  assert.equal(result.decision, "NONE");
  assert.equal(result.allowed, true);
  assert.equal(result.percent, 0);
});

test("batas tenant yang tidak wajar jatuh ke default, bukan membuka diskon 100%", () => {
  assert.equal(resolveDiscountLimitPercent("CASHIER", -5), DEFAULT_MAX_CASHIER_DISCOUNT_PERCENT);
  assert.equal(resolveDiscountLimitPercent("CASHIER", Number.NaN), DEFAULT_MAX_CASHIER_DISCOUNT_PERCENT);
  assert.equal(resolveDiscountLimitPercent("CASHIER", 500), 100);
  assert.equal(resolveDiscountLimitPercent("CASHIER", 15), 15);
});

test("subtotal nol tidak menghasilkan pembagian tak terhingga", () => {
  const result = evaluateDiscountPolicy({
    role: "CASHIER",
    subtotal: 0,
    discountAmount: 10_000,
    maxCashierDiscountPercent: 10,
  });
  assert.equal(result.percent, 0);
  assert.equal(result.allowed, false);
});

test("toleransi setengah sen: diskon tepat di batas tidak memicu PIN", () => {
  const result = evaluateDiscountPolicy({
    role: "CASHIER",
    subtotal: 33_333,
    discountAmount: 3_333.3,
    maxCashierDiscountPercent: 10,
  });
  assert.equal(result.allowed, true);
  assert.equal(result.decision, "WITHIN_LIMIT");
});