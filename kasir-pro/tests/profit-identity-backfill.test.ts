import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const migrasi = readFileSync(
  path.join(root, "prisma/migrations/20261118020000_backfill_gross_profit/migration.sql"),
  "utf8"
);

test("migrasi menyamakan laba lama ke definisi yang berlaku", () => {
  // Tanpa backfill, laporan Oktober/November memakai definisi laba lama
  // (tanpa service charge / pembulatan) sehingga tren bulanan menyesatkan.
  assert.match(migrasi, /UPDATE "sales"/);
  assert.match(migrasi, /"grossProfit" = "totalAmount" - "taxAmount" - "totalCost"/);
  assert.match(migrasi, /abs\("grossProfit" - \("totalAmount" - "taxAmount" - "totalCost"\)\) > 0\.005/);
});
