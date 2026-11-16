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
  assert.match(sales, /if \(!product\) throw new Error\("Produk tidak ditemukan pada tenant Anda"\)/);
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
