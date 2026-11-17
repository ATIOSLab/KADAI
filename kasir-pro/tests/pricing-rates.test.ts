import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateSaleTotals,
  calculateGrossProfit,
  resolvePricingRates,
} from "../src/lib/pricing-rates";
import { previewSaleTotals } from "../src/lib/pricing-preview";

// Kasus nyata di lapangan: resto dengan PB1 10% + service charge 5%.
const RESTO = { taxRate: 10, serviceChargeRate: 5, taxInclusive: false, enableRounding: true };

test("outlet menang atas toko, angka 0 tetap dihormati", () => {
  const outletWins = resolvePricingRates({
    outlet: { taxRate: 10, serviceChargeRate: 5 },
    store: { taxRate: 0, serviceChargeRate: 0 },
  });
  assert.equal(outletWins.taxRate, 10);
  assert.equal(outletWins.serviceChargeRate, 5);

  // Cabang yang sengaja tanpa PB1 tidak boleh mewarisi tarif toko.
  const outletZero = resolvePricingRates({
    outlet: { taxRate: 0, serviceChargeRate: 0 },
    store: { taxRate: 11, serviceChargeRate: 7 },
  });
  assert.equal(outletZero.taxRate, 0);
  assert.equal(outletZero.serviceChargeRate, 0);

  // Penjualan tanpa cabang jatuh ke tarif toko.
  const storeOnly = resolvePricingRates({ outlet: null, store: { taxRate: 11, serviceChargeRate: 7 } });
  assert.equal(storeOnly.taxRate, 11);
  assert.equal(storeOnly.serviceChargeRate, 7);

  // Tidak ada keduanya → tanpa pajak, bukan default 10/5.
  const none = resolvePricingRates({});
  assert.deepEqual(none, { taxRate: 0, serviceChargeRate: 0, taxInclusive: false, enableRounding: true });
});

test("PB1 dihitung dari subtotal + service charge (exclusive)", () => {
  const totals = calculateSaleTotals({ subtotal: 100000, rates: RESTO });
  assert.equal(Number(totals.serviceCharge), 5000);
  assert.equal(Number(totals.taxAmount), 10500); // 10% x (100000 + 5000)
  assert.equal(Number(totals.totalAmount), 115500);
  assert.equal(Number(totals.netSubtotal), 100000);
});

test("harga inklusif: PB1 dikeluarkan dari total, bukan ditambahkan", () => {
  const rates = { taxRate: 10, serviceChargeRate: 0, taxInclusive: true, enableRounding: false };
  const totals = calculateSaleTotals({ subtotal: 110000, rates });
  assert.equal(Number(totals.taxAmount), 10000);
  assert.equal(Number(totals.totalAmount), 110000);
  // Harga jual sudah termasuk PB1: yang dibayar tetap 110000, dan omzet neto
  // (pendapatan usaha) = 110000 - 10000 = 100000.
  assert.equal(Number(totals.netSubtotal), 110000);
});

test("pembulatan ke ratusan terdekat dicatat sebagai baris tersendiri", () => {
  const rates = { taxRate: 10, serviceChargeRate: 5, taxInclusive: false, enableRounding: true };
  const totals = calculateSaleTotals({ subtotal: 12000, rates });
  // 12000 + 600 + 1260 = 13860 -> dibulatkan ke 13900
  assert.equal(Number(totals.totalAmount), 13900);
  assert.equal(Number(totals.roundingAmount), 40);
  assert.equal(Number(totals.totalAmount), Number(totals.netSubtotal) + Number(totals.serviceCharge) + Number(totals.taxAmount) + Number(totals.roundingAmount));
});

test("diskon mengurangi dasar pengenaan pajak, bukan hanya tampilan", () => {
  const totals = calculateSaleTotals({ subtotal: 100000, discountAmount: 20000, rates: RESTO });
  assert.equal(Number(totals.netSubtotal), 80000);
  assert.equal(Number(totals.serviceCharge), 4000);
  assert.equal(Number(totals.taxAmount), 8400); // 10% x 84000
});

test("laba kotor memakai service charge sebagai pendapatan, bukan PB1", () => {
  const totals = calculateSaleTotals({ subtotal: 100000, rates: RESTO });
  const profit = calculateGrossProfit(totals, 40000);
  assert.equal(Number(profit), 65000); // 100000 + 5000 - 40000
});

test("diskon melebihi transaksi ditolak", () => {
  assert.throws(() => calculateSaleTotals({ subtotal: 10000, discountAmount: 15000, rates: RESTO }));
});

// Layar kasir memakai implementasi pratinjau (aritmetika JS, tanpa Decimal).
// Keduanya HARUS menghasilkan angka yang sama, kalau tidak struk berbeda dari
// yang dilihat kasir saat menerima uang.
test("pratinjau keranjang sama dengan perhitungan resmi", () => {
  const cases: { subtotal: number; discountAmount?: number; rates: typeof RESTO }[] = [
    { subtotal: 12000, rates: RESTO },
    { subtotal: 12000, rates: { ...RESTO, enableRounding: false } },
    { subtotal: 33333, rates: RESTO },
    { subtotal: 99999, discountAmount: 12345, rates: RESTO },
    { subtotal: 50000, rates: { taxRate: 11, serviceChargeRate: 7, taxInclusive: true, enableRounding: true } },
    { subtotal: 7777, rates: { taxRate: 0, serviceChargeRate: 0, taxInclusive: false, enableRounding: false } },
  ];

  for (const item of cases) {
    const official = calculateSaleTotals(item);
    const preview = previewSaleTotals(item);
    const label = `subtotal=${item.subtotal} diskon=${item.discountAmount ?? 0} tarif=${item.rates.taxRate}/${item.rates.serviceChargeRate} ${item.rates.taxInclusive ? "inklusif" : "eksklusif"} bulat=${item.rates.enableRounding}`;

    for (const field of ["netSubtotal", "serviceCharge", "taxAmount", "roundingAmount", "totalAmount"] as const) {
      const a = Number(official[field]);
      const b = preview[field];
      assert.ok(Math.abs(a - b) <= 1, `${label}: ${field} resmi=${a} pratinjau=${b}`);
    }
  }
});
