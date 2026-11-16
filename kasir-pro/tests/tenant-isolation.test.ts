import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const apiDir = new URL("../src/app/api", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const route = (p: string) => read(`src/app/api/${p}/route.ts`);

/** Kedelapan model yang dulu global dan kini wajib punya kunci tenant. */
const TENANT_MODELS = [
  "Category",
  "Product",
  "Customer",
  "Supplier",
  "Unit",
  "FinanceCategory",
  "FinanceEntry",
  "StockAdjustment",
] as const;

/** Model tenant yang query-nya harus memakai resolveTenantScope di route ber-sesi. */
const SCOPED_MODEL_QUERY =
  /\b(prisma|tx)\.(product|category|customer|supplier|unit|financeEntry|financeCategory|stockAdjustment)\b/;

/** Endpoint publik tanpa sesi: tenant diturunkan dari meja QR, bukan dari session user. */
const PUBLIC_ROUTES = new Set(["order"]);

function modelBlock(schema: string, model: string): string {
  const start = schema.indexOf(`model ${model} {`);
  assert.notEqual(start, -1, `model ${model} tidak ditemukan di schema.prisma`);
  const end = schema.indexOf("\n}", start);
  return schema.slice(start, end === -1 ? undefined : end + 2);
}

function routeFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) routeFiles(full, acc);
    else if (entry.name === "route.ts") acc.push(full);
  }
  return acc;
}

test("8 model katalog punya storeId + FK SetNull + index tenant", () => {
  const schema = read("prisma/schema.prisma");
  for (const model of TENANT_MODELS) {
    const block = modelBlock(schema, model);
    assert.match(block, /storeId\s+String\?/, `${model} harus punya storeId nullable`);
    assert.match(
      block,
      /references: \[id\], onDelete: SetNull/,
      `${model} harus punya FK ke Store dengan onDelete: SetNull`
    );
    assert.match(
      block,
      /@@index\(\[storeId(, [A-Za-z]+)?\]\)/,
      `${model} harus punya index yang dimulai storeId`
    );
  }
});

test("unique constraint dilunakkan per tenant, kecuali identitas platform", () => {
  const schema = read("prisma/schema.prisma");
  const perTenant = [
    ["Category", "@@unique([storeId, name])"],
    ["Product", "@@unique([storeId, sku])"],
    ["Product", "@@unique([storeId, barcode])"],
    ["Unit", "@@unique([storeId, normalizedName])"],
    ["Customer", "@@unique([storeId, phone])"],
    ["FinanceCategory", "@@unique([storeId, name, direction])"],
  ] as const;
  for (const [model, constraint] of perTenant) {
    assert.ok(
      modelBlock(schema, model).includes(constraint),
      `${model} harus memakai ${constraint}`
    );
  }
  // Kategori sistem platform dipakai semua tenant → tetap unik global.
  assert.match(modelBlock(schema, "FinanceCategory"), /systemKey\s+String\?\s+@unique/);
});

test("setiap route ber-sesi yang menyentuh model tenant memanggil resolveTenantScope", () => {
  const files = routeFiles(apiDir);
  assert.ok(files.length > 20, `harus menemukan route API, dapat ${files.length}`);
  const scoped: string[] = [];
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    if (!SCOPED_MODEL_QUERY.test(src)) continue;
    const key = relative(apiDir, dirname(file)).replace(/\\/g, "/");
    if (PUBLIC_ROUTES.has(key)) {
      assert.doesNotMatch(
        src,
        /resolveTenantScope/,
        `${key} publik tanpa sesi: tidak boleh mengandalkan session user`
      );
      assert.match(src, /storeId/, `${key} harus menurunkan store dari meja QR`);
      continue;
    }
    scoped.push(key);
    assert.match(src, /resolveTenantScope/, `${key} menyentuh model tenant tanpa scope`);
    assert.match(src, /if \(!sessionUser\b/, `${key} harus menolak request tanpa sesi`);
  }
  assert.ok(scoped.length >= 18, `route terscope terlalu sedikit: ${scoped.length}`);
});

test("lib agregasi (dashboard, laporan, kuota) menerima storeId", () => {
  assert.match(read("src/lib/dashboard.ts"), /storeId\?: string \| null/);
  assert.match(read("src/lib/dashboard.ts"), /outlet: \{ storeId: options\.storeId \}/);
  assert.match(read("src/lib/reporting.ts"), /storeId\?: string \| null/);
  assert.match(read("src/lib/reporting.ts"), /\{ outlet: \{ storeId \} \}/);
  assert.match(read("src/lib/plan-limits.ts"), /storeId/);
});

test("seeder demo meng-klaim per tenant, bukan lintas tenant", () => {
  const js = read("prisma/seed-demo-clusters.js");
  assert.match(js, /findFirst\(\{ where: \{ sku: prod\.sku, storeId: null \} \}\)/);
  assert.match(js, /findFirst\(\{ where: \{ sku: prod\.sku, storeId: tenantId \} \}\)/);
  assert.doesNotMatch(
    js,
    /findFirst\(\{ where: \{ sku: prod\.sku \} \}\)/,
    "klaim SKU tanpa scope bisa mencuri produk tenant lain"
  );
  const ts = read("src/lib/demo-seeder.ts");
  assert.match(ts, /storeId: null/);
  assert.match(ts, /storeId: tenantId/);
});

test("migrasi scoping + backfill tersedia dan backfill tidak menebak", () => {
  const scoping = read(
    "prisma/migrations/20261116160000_tenant_scoping_catalog/migration.sql"
  );
  assert.match(scoping, /ADD COLUMN "storeId" TEXT/);
  assert.match(scoping, /ON DELETE SET NULL/);
  assert.match(scoping, /DROP INDEX "categories_name_key"/);

  const backfill = read(
    "prisma/migrations/20261116160100_backfill_tenant_scoping/migration.sql"
  );
  assert.match(backfill, /UPDATE "finance_entries"/);
  assert.match(backfill, /NOTICE/, "baris tanpa jalur relasi harus dilaporkan, bukan ditebak");

  const barcode = read(
    "prisma/migrations/20261116170000_product_barcode_per_tenant/migration.sql"
  );
  assert.match(barcode, /DROP INDEX IF EXISTS "products_barcode_key"/);
  assert.match(barcode, /ON "products" \("storeId", "barcode"\)/);
  assert.match(barcode, /products_storeId_barcode_key/);
});

test("penjualan lintas tenant ditolak dengan 404, bukan 500", () => {
  const sales = route("sales");
  // Id produk tenant lain harus tampak "tidak ada" (404), bukan kegagalan server
  assert.match(
    sales,
    /if \(!product\) \{\s*throw new ApiBusinessError\(\s*"Produk tidak ditemukan pada tenant Anda",\s*404/
  );
  assert.doesNotMatch(sales, /if \(!product\) throw new Error\(/);
  assert.match(sales, /const isNotFound = message\.includes\("tidak ditemukan"\)/);
  assert.match(sales, /storeId: scope\.storeId/);
  assert.match(
    sales,
    /where: \{ id: data\.outletId, storeId: scope\.storeId \}/,
    "outlet yang dipilih klien wajib divalidasi kepemilikannya"
  );
});

test("endpoint publik QR tetap tanpa sesi dan memvalidasi meja", () => {
  const order = route("order");
  assert.doesNotMatch(order, /resolveTenantScope/);
  assert.match(order, /storeId/);
  assert.match(order, /table/i);
});

// ── Regresi UAT produksi (16 Nov 2026) ─────────────────────────────────────────
// Temuan UAT: beberapa sumbu sistem belum ter-scope, dan satu perbaikan isolasi
// sebelumnya membuat POS gagal checkout. Tes di bawah mengunci semua itu.

test("nomor invoice penjualan unik per tenant, bukan global (regresi checkout 500)", () => {
  const schema = read("prisma/schema.prisma");
  const sale = modelBlock(schema, "Sale");
  assert.doesNotMatch(
    sale,
    /invoiceNumber\s+String\s+@unique/,
    "invoiceNumber unik global bertabrakan dengan penomoran per tenant → POS 500"
  );
  assert.match(sale, /storeId\s+String\?/, "Sale wajib menyimpan storeId pemilik");
  assert.match(sale, /@@unique\(\[storeId, invoiceNumber\]\)/, "keunikan invoice harus per tenant");

  const sales = route("sales");
  assert.match(sales, /storeId: scope\.storeId/, "baris penjualan wajib menyertakan storeId tenant");
  assert.match(sales, /createSaleWithRetry/, "checkout wajib retry saat nomor invoice bentrok");
  assert.match(sales, /\.includes\("invoiceNumber"\)/, "retry hanya untuk bentrok nomor invoice");
});

test("penomoran dokumen yang indeksnya unik global memakai hitungan global", () => {
  const schema = read("prisma/schema.prisma");
  assert.match(modelBlock(schema, "StockTransfer"), /transferNumber\s+String\s+@unique/);
  assert.match(modelBlock(schema, "ProductBatch"), /batchNumber\s+String\s+@unique/);

  // Nomor transfer unik GLOBAL, tetapi urutannya per-hari (startsWith TRF-<tanggal>)
  // dan tahan balapan lewat createTransferWithRetry - bukan count() global tanpa filter.
  assert.match(
    route("inventory/transfers"),
    /transferNumber: \{ startsWith: `TRF-\$\{dateStr\}` \}/
  );
  assert.doesNotMatch(route("inventory/transfers"), /prisma\.stockTransfer\.count\(\)/);
  assert.doesNotMatch(
    route("batches"),
    /todayBatchCount = await tx\.productBatch\.count\(\{\s*where: \{\s*productId/,
    "batchNumber unik global tetapi SKU hanya unik per tenant → hitungan wajib global"
  );
});

test("konfigurasi bot platform hanya untuk SUPER_ADMIN", () => {
  const bot = route("settings/bot");
  assert.match(bot, /SUPER_ADMIN_ROLES/, "bot platform tidak boleh dikelola peran tenant");
  assert.doesNotMatch(bot, /ADMIN_ONLY_ROLES/);
  assert.match(bot, /Pengaturan bot dikelola di level platform/);
});

test("toko, meja, shift, dan laundry selalu ter-scope ke tenant pemanggil", () => {
  const store = route("settings/store");
  assert.match(store, /resolveTenantScope/);
  assert.doesNotMatch(store, /store\.findFirst\(\)/, "toko pertama di DB bukan milik tenant");

  const tables = route("tables");
  assert.match(tables, /outlet: \{ storeId: scope\.storeId \}/);
  assert.match(tables, /"Cabang tidak ditemukan pada tenant Anda"/);

  const shift = route("pos/shift-summary");
  assert.match(shift, /outlet: \{ storeId: scope\.storeId \}/);

  const laundry = route("laundry/jobs");
  assert.match(laundry, /outlet: \{ storeId: scope\.storeId \}/);
  assert.doesNotMatch(
    laundry,
    /laundryJobOrder\.findUnique\(\{\s*where: \{ id \}/,
    "PATCH laundry tidak boleh findUnique({ id }) tanpa guard tenant"
  );
});

test("pelacakan publik butuh token acak atau pasangan resi + nomor HP", () => {
  const track = route("laundry/track");
  assert.match(track, /trackingToken/);
  assert.match(track, /normalizePhone/, "nomor HP dibandingkan setelah normalisasi");
});

test("tanggal navbar dirender setelah mount (hindari hydration error #418)", () => {
  const navbar = read("src/components/layout/navbar.tsx");
  assert.match(navbar, /const \[todayLabel, setTodayLabel\] = useState\(""\)/);
  assert.doesNotMatch(
    navbar,
    /const todayLabel = new Intl\.DateTimeFormat/,
    "tanggal tidak boleh dihitung saat render: nilai SSR memakai jam server"
  );
});

test("pesan kesalahan tidak membocorkan nama kolom database", () => {
  const api = read("src/lib/api-response.ts");
  assert.match(api, /FIELD_LABELS/);
  assert.doesNotMatch(api, /Data dengan \$\{target\} tersebut sudah digunakan/);
});

// ── Regresi UAT round 3: tampilan & zona waktu ─────────────────────────────────

test("dialog sukses kasir memakai nilai dari server, bukan keranjang yang kosong", () => {
  const dialog = read("src/components/pos/checkout-dialog.tsx");
  assert.match(
    dialog,
    /const settledTotal = completedSale \? Number\(completedSale\.totalAmount\) : grandTotal/,
    "keranjang dikosongkan saat sukses -> total harus diambil dari respons server"
  );
  assert.match(dialog, /\{formatCurrency\(settledTotal\)\}/);
  assert.match(dialog, /formatCurrency\(settledChange\)/);
});

test("batas hari, rentang, dan bucket grafik memakai zona waktu toko", () => {
  const dashboard = read("src/lib/dashboard.ts");
  assert.match(dashboard, /resolveBusinessTimezone/);
  assert.doesNotMatch(
    dashboard,
    /startOfDay\(now\)/,
    "hari 'ini' tidak boleh memakai jam server (UTC) untuk toko WIB"
  );
  assert.match(dashboard, /toLocalDate\(sale\.createdAt, timezone\)/, "bucket harian wajib zona bisnis");
  assert.match(
    dashboard,
    /formatInTimeZone\(sale\.createdAt, timezone, "HH"\)/,
    "grafik per jam wajib zona bisnis"
  );

  const reporting = read("src/lib/reporting.ts");
  assert.match(
    reporting,
    /formatInTimeZone\(dateValue, timezone, "yyyy-MM-dd"\)/,
    "kunci hari pada grafik laporan tidak boleh memakai jam server"
  );

  const periods = read("src/lib/dashboard-periods.ts");
  assert.match(periods, /formatInTimeZone\(value, timezone, "yyyy-MM-dd"\)/);
  assert.match(periods, /DEFAULT_BUSINESS_TIMEZONE/);

  const reports = route("reports");
  assert.match(reports, /resolveBusinessTimezone\(\)/);
  assert.match(reports, /timezone,/);
});

test("zona waktu bisnis dibaca dari pengaturan platform", () => {
  const helper = read("src/lib/business-timezone.ts");
  assert.match(helper, /botSettings\.findFirst/);
  assert.match(helper, /DEFAULT_BUSINESS_TIMEZONE/);
});

test("nomor dokumen (invoice/batch) memakai tanggal zona bisnis", () => {
  const utils = read("src/lib/utils.ts");
  assert.match(
    utils,
    /return formatInTimeZone\(date, timezone, "yyyyMMdd"\)/,
    "segmen tanggal nomor dokumen tidak boleh memakai jam server (UTC)"
  );
  assert.match(utils, /timezone = DEFAULT_BUSINESS_TIMEZONE/);

  const sales = route("sales");
  assert.match(sales, /gte: getBusinessDayStart\(new Date\(\), timezone\)/);
  assert.match(sales, /generateInvoiceNumber\(\s*todaySalesCount \+ 1,\s*new Date\(\),\s*timezone\s*\)/);

  const batches = route("batches");
  assert.match(batches, /gte: getBusinessDayStart\(new Date\(\), timezone\)/);
});

test("jendela harian modul kas, shift, dan buku kas memakai zona bisnis", () => {
  const shift = route("pos/shift-summary");
  assert.doesNotMatch(
    shift,
    /setHours\(0, 0, 0, 0\)/,
    "awal hari tidak boleh memakai jam server (UTC)"
  );
  assert.match(shift, /getBusinessDayStart\(new Date\(\), timezone\)/);

  const finance = route("finance");
  assert.match(finance, /getBusinessMonthStart\(now, timezone\)/);
  assert.match(finance, /await parseDateRange\(request\)/);

  const tax = route("finance/tax-summary");
  assert.match(tax, /formatInTimeZone\(sale\.createdAt, timezone, "M"\)/);
  assert.match(tax, /fromZonedTime\(`\$\{year\}-01-01T00:00:00\.000`, timezone\)/);
});

test("transfer stok tidak boleh menciptakan stok atau harga nol di cabang tujuan", () => {
  const transfers = route("inventory/transfers");

  assert.match(
    transfers,
    /INSUFFICIENT_STOCK/,
    "stok sumber kurang harus menggagalkan transaksi, bukan menciptakan stok"
  );
  assert.match(transfers, /if \(remainingToDeduct > 0\) \{/, "wajib ada gerbang stok kurang");
  assert.doesNotMatch(
    transfers,
    /sellingPrice: new Decimal\(0\)/,
    "barang hasil transfer tidak boleh berharga jual 0"
  );
  assert.match(
    transfers,
    /sellingPrice: averagePrice/,
    "harga jual tujuan = rata-rata tertimbang batch sumber"
  );
  assert.match(transfers, /costPrice: averageCost/, "HPP tujuan = rata-rata tertimbang");
  assert.match(transfers, /createTransferWithRetry/, "nomor transfer harus tahan balapan");
  assert.match(
    transfers,
    /formatInTimeZone\(new Date\(\), timezone, "yyyyMMdd"\)/,
    "tanggal nomor transfer = tanggal bisnis"
  );
});

test("pelanggaran aturan bisnis dijawab 4xx, bukan 500", () => {
  const apiResponse = read("src/lib/api-response.ts");
  assert.match(apiResponse, /export class ApiBusinessError extends Error/);
  assert.match(
    apiResponse,
    /if \(error instanceof ApiBusinessError\) \{[\s\S]{0,220}?jsonError\(error\.message, error\.status/,
    "handler wajib memakai status dari error bisnis"
  );
});

test("penjualan tanpa cabang tetap terlihat oleh tenantnya, tanpa membuka tenant lain", () => {
  const list = route("sales");
  const detail = route("sales/[id]");

  for (const [name, src] of [
    ["daftar", list],
    ["detail", detail],
  ] as const) {
    assert.match(
      src,
      /\{ storeId: scope\.storeId \}/,
      `${name}: cakupan lewat storeId langsung`
    );
    assert.match(
      src,
      /\{ storeId: null, outlet: \{ storeId: scope\.storeId \} \}/,
      `${name}: baris lama dikenali lewat outlet`
    );
  }

  // Filter tanggal daftar penjualan = tanggal kalender zona bisnis, bukan UTC
  assert.match(list, /fromZonedTime\(`\$\{startDate\}T00:00:00\.000`, timezone\)/);
  assert.match(list, /fromZonedTime\(`\$\{endDate\}T23:59:59\.999`, timezone\)/);
  assert.doesNotMatch(list, /new Date\(endDate \+ "T23:59:59\.999Z"\)/);
});

test("produksi batch mewarisi harga jual nyata & menolak bahan kurang sebagai 409", () => {
  const produce = route("products/[id]/produce");

  assert.match(
    produce,
    /where: \{ productId: product\.id, sellingPrice: \{ gt: 0 \} \}/,
    "harga jual hasil produksi tidak boleh 0 hanya karena batch terakhir 0"
  );
  assert.match(produce, /INSUFFICIENT_STOCK/, "bahan baku kurang harus 409");
  assert.match(produce, /formatInTimeZone\(new Date\(\), timezone, "yyyyMMdd"\)/);
  assert.doesNotMatch(produce, /new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/);
});

test("tanggal default di UI memakai kalender lokal, bukan UTC", () => {
  const financePage = read("src/app/(dashboard)/finance/page.tsx");
  const salesPage = read("src/app/(dashboard)/sales/page.tsx");
  const businessDay = read("src/lib/business-day.ts");

  assert.match(
    businessDay,
    /export function toLocalIsoDate\(/,
    "helper tanggal kalender lokal harus tersedia"
  );

  for (const [name, page] of [
    ["finance", financePage],
    ["sales", salesPage],
  ] as const) {
    assert.doesNotMatch(
      page,
      /toISOString\(\)\.slice\(0, ?10\)/,
      `${name}: tanggal default tidak boleh memakai UTC`
    );
    assert.match(page, /import \{ toLocalIsoDate \} from "@\/lib\/business-day"/);
  }

  // Default tanggal entri baru & form edit buku kas memakai tanggal lokal
  assert.match(financePage, /entryDate: toLocalIsoDate\(\),/);
  assert.match(financePage, /entryDate: toLocalIsoDate\(new Date\(entry\.entryDate\)\)/);
});

test("pendaftaran mitra referral tidak membocorkan data mitra lain", () => {
  const register = route("referrals/register");

  assert.match(register, /checkRateLimit\(/, "endpoint publik wajib dibatasi per IP");
  assert.match(
    register,
    /const isSamePerson =\s*existing\.phone === validated\.phone &&\s*existing\.email\.toLowerCase\(\) === validated\.email\.toLowerCase\(\)/,
    "detail mitra hanya untuk pemilik data (nomor DAN email cocok)"
  );
  assert.match(register, /isCodeCollision/, "tabrakan kode referral harus diulang, bukan gagal");
  assert.doesNotMatch(
    register,
    /if \(existing\) \{\s*return NextResponse\.json\(\{\s*success: true,\s*isExisting: true,\s*data:/,
    "jangan langsung membalas data lengkap saat duplikat"
  );
});

test("stok kurang dan void ganda menjawab 409 beserta kodenya", () => {
  const sales = route("sales");
  const voidRoute = route("sales/[id]/void");

  // Handler kasir tidak boleh meratakan ApiBusinessError jadi 400 tanpa kode
  assert.match(sales, /if \(error instanceof ApiBusinessError\)/);
  assert.match(sales, /code: error\.code/);
  assert.doesNotMatch(sales, /const status = isStockError\s*\?\s*400/);

  assert.match(voidRoute, /SALE_ALREADY_VOIDED/);
  assert.match(voidRoute, /"Transaksi sudah di-void"[\s\S]{0,120}?\{ status: 409 \}/);
});
