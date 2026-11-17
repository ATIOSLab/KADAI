import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

const menuRoute = read("src/app/api/order/route.ts");
const orderPage = read("src/app/order/[token]/page.tsx");

test("menu QR memakai harga batch FIFO milik cabang meja", () => {
  // Tanpa orderBy, batches[0] bisa batch mana saja: menu menampilkan Rp 7.000
  // sementara kasir menagih Rp 12.000 untuk produk yang sama.
  assert.match(menuRoute, /orderBy: \[\{ purchaseDate: "asc" \}, \{ createdAt: "asc" \}\]/);
  assert.match(menuRoute, /OR: \[\{ outletId: table\.outletId \}, \{ outletId: null \}\]/);
});

test("produk tanpa harga tidak tampil sebagai Rp 0", () => {
  assert.match(menuRoute, /\.filter\(\(row: any\) => row\.price > 0\)/);
});

test("pemesanan mandiri tetap ditutup dan UI diberi tahu", () => {
  assert.match(menuRoute, /selfOrderEnabled: false/);
  assert.match(menuRoute, /status: 403/);
  assert.match(orderPage, /data\.selfOrderEnabled === true/);
  assert.match(orderPage, /disabled=\{!selfOrderEnabled\}/);
});

test("item tanpa stok ditandai habis, bukan bisa ditambahkan", () => {
  assert.match(orderPage, /p\.isAvailable === false \?/);
  assert.match(orderPage, /Habis/);
});