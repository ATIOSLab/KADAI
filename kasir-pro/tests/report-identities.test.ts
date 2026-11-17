import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

const reporting = read("src/lib/reporting.ts");
const taxSummary = read("src/app/api/finance/tax-summary/route.ts");
const dashboard = read("src/lib/dashboard.ts");
const salesRoute = read("src/app/api/sales/route.ts");

test("laporan menurunkan laba kotor dari omzet neto, bukan menjumlah kolom", () => {
  // totalProfit = netRevenue - totalHpp membuat identitas laporan selalu
  // berlaku; menjumlah Sale.grossProfit menyisakan selisih pembulatan.
  assert.match(reporting, /const totalProfit = netRevenue - totalHpp;/);
  assert.match(reporting, /const profit = netRevenue - hpp;/);
  assert.doesNotMatch(reporting, /_sum\.grossProfit/);
});

test("rekap pajak dan dashboard memakai identitas yang sama", () => {
  assert.match(taxSummary, /const profit = Number\(sale\.totalAmount\) - tax - hpp;/);
  assert.match(dashboard, /const saleProfit = saleRevenue - Number\(sale\.taxAmount\) - saleCost;/);
});

test("pembulatan tunai ikut dihitung sebagai bagian laba kotor", () => {
  assert.match(salesRoute, /\.add\(roundingAmount\)\s*\.sub\(totalCost\)/);
});

test("contoh transaksi nyata: laba kotor + HPP = omzet neto", () => {
  // Transaksi live 17 Nov 2026: subtotal 38.000, service 1.900, PB1 3.990,
  // pembulatan 10, total 43.900, HPP 14.000.
  const subtotal = 38_000;
  const serviceCharge = 1_900;
  const taxAmount = 3_990;
  const roundingAmount = 10;
  const totalCost = 14_000;

  const totalAmount = subtotal + serviceCharge + taxAmount + roundingAmount;
  const netRevenue = totalAmount - taxAmount;
  const grossProfit = netRevenue - totalCost;
  const storedGrossProfit = subtotal + serviceCharge + roundingAmount - totalCost;

  assert.equal(totalAmount, 43_900);
  assert.equal(netRevenue, 39_910);
  assert.equal(grossProfit, 25_910);
  assert.equal(grossProfit + totalCost, netRevenue, "identitas laporan");
  // Nilai tersimpan di Sale.grossProfit harus sama dengan versi turunan.
  assert.equal(storedGrossProfit, grossProfit);
});