import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

const createRoute = read("src/app/api/products/route.ts");
const updateRoute = read("src/app/api/products/[id]/route.ts");
const unitsRoute = read("src/app/api/units/route.ts");
const detailRoute = read("src/app/api/products/[id]/route.ts");
const schema = read("prisma/schema.prisma");

test("keunikan barcode mengikuti skema: per tenant, bukan global", () => {
  // @@unique([storeId, barcode]) hanya melarang duplikat dalam satu toko.
  // Pengecekan global membuat SEMUA penyuntingan produk gagal 409 karena
  // katalog template platform (storeId null) memakai barcode yang sama.
  assert.match(schema, /@@unique\(\[storeId, barcode\]\)/);
  const globalBarcodeCheck = /\{ barcode: data\.barcode \}/;
  assert.doesNotMatch(createRoute, globalBarcodeCheck);
  assert.doesNotMatch(updateRoute, globalBarcodeCheck);
  assert.match(createRoute, /\{ barcode: data\.barcode, storeId: scope\.storeId \}/);
  assert.match(updateRoute, /\{ barcode: data\.barcode, storeId: scope\.storeId \}/);
});

test("penyuntingan tetap mengecualikan produk itu sendiri", () => {
  assert.match(updateRoute, /id: \{ not: id \}/);
});

test("daftar satuan memuat satuan yang sudah dipakai produk", () => {
  // Tanpa ini, produk ber-satuan "gelas" selalu terbuka dalam mode "satuan
  // baru" karena tabel Unit hanya berisi satuan bawaan platform.
  assert.match(unitsRoute, /prisma\.product\.groupBy\(\{[\s\S]{0,120}by: \["unit"\]/);
  assert.match(unitsRoute, /id: `used:\$\{normalizeUnitName\(name\)\}`/);
});

test("detail produk mengirim cabang tiap batch", () => {
  assert.match(
    detailRoute,
    /outlet: \{ select: \{ id: true, code: true, name: true \} \}/
  );
});