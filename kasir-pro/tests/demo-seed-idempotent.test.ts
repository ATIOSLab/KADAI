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