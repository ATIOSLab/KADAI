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
const fifo = lib("fifo.ts");
const adjustmentRoute = route("inventory/adjustment");
const produceRoute = route("products/[id]/produce");
const pricingRates = lib("pricing-rates.ts");
const pricingPreview = lib("pricing-preview.ts");
const posPricingRoute = route("pos/pricing");
const cartHook = readFileSync(new URL("../src/hooks/use-cart.ts", import.meta.url), "utf8");
const cartComponent = readFileSync(new URL("../src/components/pos/cart.tsx", import.meta.url), "utf8");
const orderRoute = route("order");

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

// --- Audit: penutupan shift kasir punya aksi sendiri -------------------------

test("penutupan shift dicatat sebagai SHIFT_CLOSED, bukan SALE_CREATED", () => {
  const shift = route("pos/shift-summary");
  assert.match(shift, /action: "SHIFT_CLOSED"/);
  assert.doesNotMatch(shift, /action: "SALE_CREATED"/);

  const presenter = lib("activity-log-presenter.ts");
  assert.match(presenter, /SHIFT_CLOSED: "Shift Kasir Ditutup"/);
  assert.match(presenter, /case "SHIFT_CLOSED":/);

  const page = readFileSync(new URL("../src/app/(dashboard)/activity-log/page.tsx", import.meta.url), "utf8");
  assert.match(page, /value: "SHIFT_CLOSED"/);

  const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
  assert.match(schema, /enum ActionType \{[\s\S]*?SHIFT_CLOSED/);
  const migration = readFileSync(
    new URL("../prisma/migrations/20261117060000_shift_closed_action/migration.sql", import.meta.url),
    "utf8"
  );
  assert.match(migration, /ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'SHIFT_CLOSED'/);
});

// --- Akuntansi: PB1 titipan negara, service charge pendapatan jasa ------------

test("laba kotor menyertakan service charge tetapi tidak PB1", () => {
  // Sale.grossProfit = (subtotal - diskon) + service charge + pembulatan - HPP
  // Pembulatan ikut karena ia uang yang benar-benar diterima kasir.
  assert.match(
    sales,
    /const grossProfit = netSubtotal[\s\S]{0,120}?\.add\(roundingAmount\)[\s\S]{0,40}?\.sub\(totalCost\)/
  );
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

// --- Stok: pemotongan batch harus "klaim bersyarat", bukan decrement buta -----

test("pemotongan batch tidak pernah membuat stok minus", () => {
  // fifo.ts (dipakai checkout) memakai updateMany bersyarat
  assert.match(fifo, /remainingQty: \{ gte: allocation\.quantity \}/);
  assert.match(fifo, /claim\.count !== 1/);
  assert.match(fifo, /"STOCK_ALREADY_TAKEN"/);
  // Bagian pemotongan tidak boleh lagi memakai update() buta (bagian pemulihan
  // void tetap memakai increment, itu memang disengaja).
  const deductionBlock = fifo.slice(fifo.indexOf("export async function applyFIFODeductions"), fifo.indexOf("Restore FIFO deductions"));
  assert.doesNotMatch(deductionBlock, /productBatch\.update\(\{/);

  // Penyesuaian stok (opname) dan produksi bahan baku memakai pola yang sama
  for (const [name, source] of [
    ["inventory/adjustment", adjustmentRoute],
    ["products/[id]/produce", produceRoute],
    ["inventory/transfers", transfers],
  ] as const) {
    assert.match(source, /remainingQty: \{ gte: (take|takeQty|deduct) /, `${name}: klaim batch bersyarat`);
    assert.match(source, /claim\.count !== 1/, `${name}: menolak kalau batch sudah terpakai`);
  }
});

test("transaksi yang memotong stok berjalan Serializable", () => {
  assert.match(sales, /isolationLevel: Prisma\.TransactionIsolationLevel\.Serializable/);
  assert.match(transfers, /isolationLevel: Prisma\.TransactionIsolationLevel\.Serializable/);
  assert.match(adjustmentRoute, /isolationLevel: Prisma\.TransactionIsolationLevel\.Serializable/);
  assert.match(produceRoute, /isolationLevel: Prisma\.TransactionIsolationLevel\.Serializable/);
});

// --- Tarif PB1 & service charge: satu sumber untuk kasir, menu QR, dan struk --

test("kasir dan struk memakai tarif yang sama", () => {
  // Checkout memakai resolver bersama, tidak lagi membaca tarif store langsung
  assert.match(sales, /resolvePricingRates\(\{ outlet: outletPricing, store \}\)/);
  assert.match(sales, /calculateSaleTotals\(\{/);
  assert.doesNotMatch(sales, /const serviceRate = Number\(store\?\.serviceChargeRate/);

  // Resolver: tarif cabang menang, angka 0 tetap dihormati
  assert.match(pricingRates, /taxRate: toRate\(outlet\?\.taxRate\) \?\? toRate\(store\?\.taxRate\) \?\? 0/);

  // Menu QR publik tidak lagi memakai default 10/5
  assert.match(orderRoute, /resolvePricingRates\(\{/);
  assert.doesNotMatch(orderRoute, /Number\(store\?\.taxRate \|\| 10\)/);

  // Keranjang menampilkan rincian dan memakai total yang benar-benar ditagih
  assert.match(cartHook, /getTotals: \(\) =>/);
  assert.match(cartHook, /previewSaleTotals\(\{/);
  assert.match(cartComponent, /totals\.serviceCharge > 0/);
  assert.match(cartComponent, /totals\.taxAmount > 0/);
  assert.match(posPricingRoute, /resolvePricingRates\(\{ outlet, store \}\)/);

  // Pratinjau kasir tidak boleh menarik runtime Prisma ke bundel browser
  assert.match(pricingPreview, /import type \{ PricingRates \}/);
  assert.doesNotMatch(pricingPreview, /runtime\/library/);
});

test("keranjang memakai total bertagih untuk tombol uang pas", () => {
  assert.match(cartHook, /return get\(\)\.getTotals\(\)\.totalAmount;/);
});

// --- Cetak ulang & riwayat: rincian tagihan tidak boleh hilang -----------------

test("cetak ulang struk tetap memuat PB1, service charge, dan pembulatan", () => {
  const saleDetailPage = readFileSync(
    new URL("../src/app/(dashboard)/sales/[id]/page.tsx", import.meta.url),
    "utf8"
  );
  const occurrences = saleDetailPage.match(/serviceCharge: serviceChargeAmount|serviceCharge={serviceChargeAmount}/g) ?? [];
  assert.ok(occurrences.length >= 3, `pratinjau struk, cetak thermal, dan printer ESC/POS harus memuat service charge (ditemukan ${occurrences.length})`);
  assert.match(saleDetailPage, /taxAmount: taxAmount|taxAmount={taxAmount}/);
  assert.match(saleDetailPage, /roundingAmount: roundingAmount|roundingAmount={roundingAmount}/);
  // Ringkasan transaksi juga menampilkan baris PB1 & service charge
  assert.match(saleDetailPage, /<span>Service Charge<\/span>/);
  assert.match(saleDetailPage, /<span>PB1<\/span>/);
});

test("transaksi batal tidak menampilkan laba", () => {
  const saleDetailPage = readFileSync(
    new URL("../src/app/(dashboard)/sales/[id]/page.tsx", import.meta.url),
    "utf8"
  );
  assert.match(saleDetailPage, /const grossProfit = sale\.isVoided \? 0 : Number\(sale\.grossProfit\)/);
  // Margin dihitung dari omzet neto (setelah PB1), bukan total bruto
  assert.match(saleDetailPage, /const netRevenue = totalAmount - taxAmount/);
  // Transaksi batal tidak menampilkan margin angka sama sekali.
  assert.match(saleDetailPage, /sale\.isVoided \|\| netRevenue <= 0 \? "-"/);
  assert.match(saleDetailPage, /marginPercent === "-" \? "-"/);
});

// --- Konfirmasi: jangan pakai dialog bawaan browser ---------------------------

test("konfirmasi memakai dialog aplikasi, bukan window.confirm", () => {
  const files: [string, string][] = [
    ["app/layout.tsx", readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8")],
    ["shared/confirm-dialog.tsx", readFileSync(new URL("../src/components/shared/confirm-dialog.tsx", import.meta.url), "utf8")],
    ["inventory/transfers", readFileSync(new URL("../src/app/(dashboard)/inventory/transfers/page.tsx", import.meta.url), "utf8")],
    ["tables", readFileSync(new URL("../src/app/(dashboard)/tables/page.tsx", import.meta.url), "utf8")],
    ["finance", readFileSync(new URL("../src/app/(dashboard)/finance/page.tsx", import.meta.url), "utf8")],
  ];
  const layout = files[0][1];
  assert.match(layout, /<ConfirmProvider>/);
  assert.match(files[1][1], /export function useConfirm/);
  for (const [name, source] of files.slice(2)) {
    assert.match(source, /useConfirm\(\)/, `${name}: memakai useConfirm`);
    assert.doesNotMatch(source, /[^A-Za-z]window\.confirm\(/, `${name}: window.confirm sudah tidak dipakai`);
  }
});

// --- Pelanggan: tier, catatan, dan filter ---------------------------------------

test("tier pelanggan memakai nilai yang sama dengan UI dan database", () => {
  const validator = readFileSync(new URL("../src/lib/validators/customer.ts", import.meta.url), "utf8");
  assert.match(validator, /export const MEMBER_TIERS = \["BRONZE", "SILVER", "GOLD", "PLATINUM"\]/);
  assert.match(validator, /\.default\("BRONZE"\)/);
  assert.doesNotMatch(validator, /z\.enum\(\["REGULAR"/, "enum REGULAR sudah tidak dipakai");
  // Nilai lawas tetap diterima agar integrasi lama tidak putus
  assert.match(validator, /REGULAR: "BRONZE"/);
});

test("catatan pelanggan tidak lagi hilang saat disimpan", () => {
  const validator = readFileSync(new URL("../src/lib/validators/customer.ts", import.meta.url), "utf8");
  const route = readFileSync(new URL("../src/app/api/customers/route.ts", import.meta.url), "utf8");
  assert.match(validator, /notes: z\.string\(\)\.trim\(\)\.max\(500/, "notes harus divalidasi");
  assert.match(route, /notes: validated\.notes \|\| null/, "POST menyimpan catatan");
  assert.match(route, /validated\.notes !== undefined && \{ notes: validated\.notes \|\| null \}/, "PUT menyimpan catatan");
});

test("filter tier pelanggan diproses di server", () => {
  const route = readFileSync(new URL("../src/app/api/customers/route.ts", import.meta.url), "utf8");
  assert.match(route, /searchParams\.get\("tier"\)/, "parameter tier dibaca");
  assert.match(route, /MEMBER_TIERS\.find/, "nilai tier divalidasi terhadap daftar resmi");
  assert.match(route, /\.\.\.\(tier && \{ memberTier: tier \}\)/, "filter diterapkan ke query");
  const page = readFileSync(new URL("../src/app/(dashboard)/customers/page.tsx", import.meta.url), "utf8");
  assert.match(page, /url \+= `&tier=\$\{tierFilter\}`/, "UI mengirim parameter tier");
});

test("pesan validasi Zod yang spesifik diteruskan ke pengguna", () => {
  const apiResponse = readFileSync(new URL("../src/lib/api-response.ts", import.meta.url), "utf8");
  assert.match(apiResponse, /describeZodIssue\(firstIssue\)/);
  assert.match(apiResponse, /function describeZodIssue/);
});

// --- Stok wajib punya cabang & retry bentrok tulis ---------------------------------

test("restock selalu menempelkan stok ke cabang", () => {
  const route = readFileSync(new URL("../src/app/api/batches/route.ts", import.meta.url), "utf8");
  assert.match(route, /let effectiveOutletId: string \| null = null/, "cabang efektif dihitung");
  assert.match(route, /outletId: effectiveOutletId/, "batch disimpan dengan cabang");
  assert.match(route, /OUTLET_REQUIRED/, "tanpa cabang ditolak, bukan disimpan tanpa cabang");
  const validator = readFileSync(new URL("../src/lib/validators/batch.ts", import.meta.url), "utf8");
  assert.match(validator, /outletId: z\.string\(\)\.min\(1, "Cabang tidak valid"\)\.optional\(\)\.nullable\(\)/);
});

test("impor produk menempelkan stok awal ke cabang", () => {
  const route = readFileSync(new URL("../src/app/api/products/import-batch/route.ts", import.meta.url), "utf8");
  assert.match(route, /let targetOutletId: string \| null = null/);
  assert.match(route, /outletId: targetOutletId/, "batch impor punya cabang");
});

test("stok lama tanpa cabang dipindahkan ke cabang utama", () => {
  const sql = readFileSync(
    new URL("../prisma/migrations/20261117130000_batch_outlet_backfill/migration.sql", import.meta.url),
    "utf8"
  );
  assert.match(sql, /UPDATE product_batches/);
  assert.match(sql, /WHERE pb\."outletId" IS NULL/);
  assert.match(sql, /o\."isMain" = true/);
});

test("transaksi Serializable dicoba ulang sebelum 500", () => {
  const helper = readFileSync(new URL("../src/lib/write-conflict-retry.ts", import.meta.url), "utf8");
  assert.match(helper, /code === "P2034" \|\| code === "P2028"/, "kode Prisma dikenali");
  assert.match(helper, /could not serialize/, "pesan PostgreSQL dikenali");
  assert.match(helper, /new ApiBusinessError\(exhaustedMessage, 409, exhaustedCode\)/, "habis percobaan -> 409");

  const transfers = readFileSync(new URL("../src/app/api/inventory/transfers/route.ts", import.meta.url), "utf8");
  assert.match(transfers, /withWriteConflictRetry\(\(\) => prisma\.\$transaction\(async \(tx\) => \{\s*\/\/ Klaim atomik/);
  assert.match(transfers, /exhaustedCode: "TRANSFER_BUSY"/);

  for (const [file, code] of [
    ["../src/app/api/inventory/adjustment/route.ts", "ADJUSTMENT_BUSY"],
    ["../src/app/api/products/[id]/produce/route.ts", "PRODUCTION_BUSY"],
  ]) {
    const src = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.match(src, /withWriteConflictRetry\(\(\) => prisma\.\$transaction/, `${file} memakai retry`);
    assert(src.includes(code), `${file} punya kode 409 ${code}`);
  }
});

test("halaman restock memilih cabang penerima stok", () => {
  const page = readFileSync(
    new URL("../src/app/(dashboard)/inventory/restock/page.tsx", import.meta.url),
    "utf8"
  );
  assert.match(page, /Cabang Penerima Stok/);
  assert.match(page, /outletId: selectedOutletId \|\| undefined/);
  assert.match(page, /fetch\("\/api\/outlets"\)/);
});
