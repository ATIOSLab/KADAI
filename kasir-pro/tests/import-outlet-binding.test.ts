import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

const dialog = read("src/components/pos/product-import-dialog.tsx");
const route = read("src/app/api/products/import-batch/route.ts");

test("impor produk mengirim cabang penerima stok", () => {
  // Tanpa outletId, seluruh stok hasil impor jatuh ke cabang pengguna
  // (praktisnya cabang utama) sehingga stok cabang lain tidak pernah terisi.
  assert.match(dialog, /Cabang Penerima Stok/);
  assert.match(dialog, /\.\.\.\(outletId \? \{ outletId \} : \{\}\)/);
});

test("API impor tetap memvalidasi cabang milik tenant", () => {
  assert.match(route, /outletId: z\.string\(\)\.min\(1\)\.optional\(\)\.nullable\(\)/);
  assert.match(route, /where: \{ id: validated\.outletId, storeId: scope\.storeId \}/);
  assert.match(route, /outletId: targetOutletId/);
});