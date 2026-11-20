import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const seed = readFileSync(
  path.join(root, "prisma/seed-demo-clusters.js"),
  "utf8"
);
const startSh = readFileSync(path.join(root, "docker/start.sh"), "utf8");
const simulate = readFileSync(path.join(root, "prisma/simulate-transactions.js"), "utf8");

test("seed batch demo hanya membuat batch baru, tidak menimpa stok", () => {
  // Dulu upsert dengan update.remainingQty = stok seed: setiap restart
  // container mengisi ulang stok demo yang sudah terjual, sementara alokasi
  // saleItemBatch tetap ada -> FIFO memotong stok yang sudah laku.
  assert.doesNotMatch(seed, /productBatch\.upsert/);
  assert.match(seed, /const existingBatch = await prisma\.productBatch\.findUnique/);
  assert.match(seed, /if \(!existingBatch\) \{/);
});

test("batch demo baru terikat cabang utama, bukan stok global", () => {
  assert.match(seed, /outletId: mainOutlet\?\.id \?\? null/);
});

test("seed demo dijalankan saat boot tanpa menggagalkan start", () => {
  assert.match(startSh, /node prisma\/seed-demo-clusters\.js \|\| echo/);
});

test("simulasi transaksi idempoten: invoice yang ada dilewati, bukan di-upsert", () => {
  // Dulu script pakai sale.upsert({ where: { invoiceNumber } }) yang stale
  // terhadap @@unique([storeId, invoiceNumber]) — perbaikan memakai skip
  // eksplisit supaya stok batch tidak dipotong dua kali saat dijalankan ulang.
  assert.doesNotMatch(simulate, /sale\.upsert/);
  assert.match(simulate, /storeId_invoiceNumber/);
  assert.match(simulate, /sudah ada — dilewati/);
});

test("simulasi transaksi membaca harga & stok dari ProductBatch (bukan Product)", () => {
  // Harga jual/HPP kini tinggal di batch; Product tidak punya field price/cost.
  assert.match(simulate, /batch\.sellingPrice/);
  assert.match(simulate, /productBatch\.updateMany/);
  assert.match(simulate, /rencanakanAlokasi/);
});