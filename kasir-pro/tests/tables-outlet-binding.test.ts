import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

const page = read("src/app/(dashboard)/tables/page.tsx");
const route = read("src/app/api/tables/route.ts");

test("meja baru wajib menyebut cabang", () => {
  // Tanpa cabang, QR meja memakai harga/stok cabang lain (atau hanya batch
  // tanpa cabang), dan meja baru selalu jatuh ke cabang utama.
  assert.match(page, /Label className="font-bold">Cabang \*/);
  assert.match(page, /options=\{outlets\.map\(\(o\) => \(\{\s*value: o\.id,/);
  assert.match(page, /\.\.\.\(outletId \? \{ outletId \} : \{\}\)/);
});

test("kartu meja menampilkan cabangnya", () => {
  assert.match(page, /t\.outlet \? ` · \$\{t\.outlet\.code\}` : " · tanpa cabang"/);
});

test("API tetap memberi default cabang utama bila UI tidak mengirim", () => {
  assert.match(route, /where: \{ isMain: true, storeId: scope\.storeId \}/);
  assert.match(
    route,
    /outlet: \{\s*select: \{ id: true, name: true, code: true \},?\s*\}/
  );
});