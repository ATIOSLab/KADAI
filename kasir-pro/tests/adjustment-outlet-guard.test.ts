import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

const route = read("src/app/api/inventory/adjustment/route.ts");
const page = read("src/app/(dashboard)/inventory/adjustments/page.tsx");

test("penyesuaian stok tanpa cabang ditolak pada tenant multi-cabang", () => {
  // Dulu permintaan tanpa outletId otomatis jatuh ke cabang utama: kerugian
  // cabang PIK tercatat menggerus stok Menteng tanpa peringatan.
  assert.match(route, /prisma\.outlet\.count\(\{\s*where: \{ isActive: true, storeId: scope\.storeId \}/);
  assert.match(route, /if \(activeOutlets > 1\) \{/);
  assert.match(route, /"OUTLET_REQUIRED"/);
});

test("dialog penyesuaian mewajibkan pilih cabang saat cabang lebih dari satu", () => {
  assert.match(page, /if \(outlets\.length > 1 && !selectedOutletId\) \{/);
  assert.match(page, /Pilih cabang tempat barang hilang, rusak, atau kedaluwarsa/);
});