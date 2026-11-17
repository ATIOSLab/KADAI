import test from "node:test";
import assert from "node:assert/strict";
import { previewSaleTotals, type PricingPreviewTotals } from "../src/lib/pricing-preview";

const RATES = { taxRate: 10, serviceChargeRate: 5, taxInclusive: false, enableRounding: true };

/** Rumus yang dipakai src/app/api/sales/route.ts saat menyimpan laba kotor. */
function grossProfit(totals: PricingPreviewTotals, hpp: number) {
  return totals.netSubtotal + totals.serviceCharge + totals.roundingAmount - hpp;
}

/**
 * Laporan (src/lib/reporting.ts) menghitung omzet neto = omzet kotor - PB1.
 * Kedua rumus wajib menghasilkan angka yang sama, kalau tidak laporan laba dan
 * rincian transaksi berbeda (dulu selisih sebesar total pembulatan).
 */
function netRevenueFromTotals(totals: PricingPreviewTotals) {
  return totals.totalAmount - totals.taxAmount;
}

test("laba kotor transaksi sama dengan omzet neto dikurangi HPP (pembulatan turun)", () => {
  const totals = previewSaleTotals({ subtotal: 2000, rates: RATES });
  assert.equal(totals.totalAmount, 2300);
  assert.equal(totals.roundingAmount, -10);

  const hpp = 1000;
  assert.equal(grossProfit(totals, hpp), 1090);
  assert.equal(netRevenueFromTotals(totals) - hpp, 1090);
});

test("laba kotor transaksi sama dengan omzet neto dikurangi HPP (pembulatan naik)", () => {
  const totals = previewSaleTotals({ subtotal: 38000, rates: RATES });
  assert.equal(totals.totalAmount, 43900);
  assert.equal(totals.roundingAmount, 10);

  const hpp = 14000;
  assert.equal(grossProfit(totals, hpp), 25910);
  assert.equal(netRevenueFromTotals(totals) - hpp, 25910);
});

test("pembulatan tidak aktif: kedua rumus tetap sama", () => {
  const totals = previewSaleTotals({
    subtotal: 12345,
    rates: { ...RATES, enableRounding: false },
  });
  assert.equal(totals.roundingAmount, 0);
  const hpp = 5000;
  assert.equal(grossProfit(totals, hpp), netRevenueFromTotals(totals) - hpp);
});