import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = (p: string) => readFileSync(new URL(`../src/app/api/${p}/route.ts`, import.meta.url), "utf8");
const lib = (p: string) => readFileSync(new URL(`../src/lib/${p}`, import.meta.url), "utf8");
const sales = route("sales");
const voidRoute = route("sales/[id]/void");
const kds = route("kds");
const transfers = route("inventory/transfers");
const reporting = lib("reporting.ts");
const hpp = lib("hpp.ts");
const reportsPage = readFileSync(new URL("../src/app/(dashboard)/reports/page.tsx", import.meta.url), "utf8");

// --- Checkout: tabrakan tulis PostgreSQL (P2034) bukan kegagalan server -------

test("checkout mengulang tabrakan tulis Serializable (P2034) sebelum menyerah", () => {
  assert.match(sales, /function isRetryableWriteConflict/);
  assert.match(sales, /error\.code === "P2034"/);
  assert.match(sales, /isRetryableWriteConflict\(error\)/);
  // Retry harus punya jeda berjitter; mengulang pada milidetik yang sama
  // membuat dua kasir bentrok lagi.
  assert.match(sales, /setTimeout\(resolve,/);
});

test("tabrakan tulis yang menetap dijawab 409 TRANSACTION_CONFLICT, bukan 500", () => {
  assert.match(sales, /code: "TRANSACTION_CONFLICT"/);
  assert.match(sales, /status: 409/);
  // Cabang 409 harus berada sebelum perataan pesan generik 500
  const conflictAt = sales.indexOf("TRANSACTION_CONFLICT");
  const genericAt = sales.indexOf('const message = error instanceof Error ? error.message');
  assert.ok(conflictAt > 0 && genericAt > 0 && conflictAt < genericAt);
});

// --- Void: tiket dapur tidak boleh tetap hidup --------------------------------

test("void transaksi membatalkan tiket KDS yang masih aktif", () => {
  assert.match(voidRoute, /kDSOrder\.updateMany\(/);
  assert.match(voidRoute, /status: \{ in: \["QUEUED", "COOKING", "READY"\] \}/);
  assert.match(voidRoute, /data: \{ status: "CANCELED" \}/);
  // Pembatalan tiket harus di dalam transaksi void yang sama
  const txStart = voidRoute.indexOf("prisma.$transaction(async (tx) => {");
  const cancelAt = voidRoute.indexOf("kDSOrder.updateMany(");
  assert.ok(txStart > 0 && cancelAt > txStart, "pembatalan KDS harus di dalam transaksi void");
});

test("papan KDS menyaring tiket milik transaksi yang sudah di-void", () => {
  assert.match(kds, /isVoided: false/);
  const hits = kds.match(/isVoided: false/g) ?? [];
  // Satu di whereClause dasar, satu di cabang filter outlet
  assert.ok(hits.length >= 2, `filter isVoided hanya ${hits.length}x di route KDS`);
});

test("void mengembalikan statistik CRM pelanggan (belanja, kunjungan, poin)", () => {
  assert.match(voidRoute, /if \(sale\.customerId\)/);
  assert.match(voidRoute, /totalSpent: spentAfterVoid\.isNegative\(\) \? new Decimal\(0\) : spentAfterVoid/);
  assert.match(voidRoute, /visitCount: Math\.max\(0, customer\.visitCount - 1\)/);
  assert.match(voidRoute, /loyaltyPoints: Math\.max\(0, customer\.loyaltyPoints - pointsBack\)/);
  // Poin yang ditarik harus memakai rumus yang sama dengan saat sale (floor 10.000)
  assert.match(sales, /Math\.floor\(Number\(totalAmount\) \/ 10000\)/);
  assert.match(voidRoute, /Math\.floor\(Number\(sale\.totalAmount\) \/ 10000\)/);
});

// --- Transfer: penerimaan stok harus diklaim atomik ---------------------------

test("penerimaan transfer memakai klaim atomik IN_TRANSIT -> RECEIVED", () => {
  assert.match(transfers, /updateMany\(\{\s*where: \{ id: validated\.id, status: \{ in: \["IN_TRANSIT", "DRAFT"\] \} \}/);
  assert.match(transfers, /claim\.count !== 1/);
  assert.match(transfers, /"TRANSFER_ALREADY_RECEIVED"/);
  assert.match(transfers, /isolationLevel: Prisma\.TransactionIsolationLevel\.Serializable/);
});

test("status transfer tidak lagi diubah non-atomik di akhir transaksi", () => {
  // Pola lama: baca status di luar transaksi, lalu tx.stockTransfer.update({
  // where: { id } }) di akhir — dua klik "Terima" sama-sama lolos.
  assert.doesNotMatch(
    transfers,
    /tx\.stockTransfer\.update\(\{\s*where: \{ id: validated\.id \},[\s\S]{0,160}status: "RECEIVED"/
  );
});

// --- Restock bersamaan: nomor batch juga unik global -------------------------

test("restock memakai nomor batch dengan percobaan ulang, bukan 500", () => {
  const batches = route("batches");
  assert.match(batches, /withUniqueNumberRetry\(/);
  assert.match(batches, /uniqueFields: \["batchNumber"\]/);
  assert.match(batches, /"BATCH_NUMBER_CONFLICT"/);
  // Galat bisnis harus dijawab dengan statusnya sendiri, bukan 500 generik
  assert.match(batches, /if \(error instanceof ApiBusinessError\)/);
});

// --- Akuntansi: PB1 titipan negara, service charge pendapatan jasa ------------

test("laba kotor menyertakan service charge tetapi tidak PB1", () => {
  // Sale.grossProfit = (subtotal - diskon) + service charge - HPP
  assert.match(sales, /const grossProfit = netSubtotal\.add\(serviceCharge\)\.sub\(totalCost\)/);
  // HPP per transaksi memakai definisi yang sama: uang masuk - PB1 - HPP
  assert.match(hpp, /grossProfit: sale\.totalAmount\.sub\(sale\.taxAmount\)\.sub\(totalHPP\)/);
});

test("laporan memisahkan PB1 dan service charge serta memakai omzet neto", () => {
  assert.match(reporting, /const netRevenue = totalRevenue - taxCollected;/);
  assert.match(reporting, /taxCollected,/);
  assert.match(reporting, /serviceChargeCollected,/);
  assert.match(reporting, /netRevenue,/);
  // Margin tidak boleh lagi dibagi omzet bruto (yang masih mengandung PB1)
  assert.doesNotMatch(reporting, /margin: totalRevenue > 0 \?/);
  assert.match(reporting, /margin: netRevenue > 0 \?/);
  assert.match(reporting, /margin: netRevenue > 0 \? Number\(\(\(profit \/ netRevenue\) \* 100\)\.toFixed\(1\)\) : 0/);
});

test("halaman laporan menampilkan pajak, service charge, dan omzet neto", () => {
  assert.match(reportsPage, /Pajak PB1/);
  assert.match(reportsPage, /Omzet Neto/);
  assert.match(reportsPage, /Service Charge/);
  assert.match(reportsPage, /report\.kpi\.taxCollected/);
  assert.match(reportsPage, /report\.kpi\.netRevenue/);
});
