import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const route = readFileSync(path.join(root, "src/app/api/sales/route.ts"), "utf8");
const schema = readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");
const migration = readFileSync(
  path.join(root, "prisma/migrations/20261117183000_sale_idempotency_key/migration.sql"),
  "utf8"
);

test("kunci idempotensi tersimpan permanen pada baris penjualan", () => {
  // Dulu kuncinya hanya ada di memori proses dengan TTL 60 detik. Kasir yang
  // mengirim ulang pembayaran sesudah proses server hidup ulang - justru keadaan
  // yang paling mungkin terjadi saat jawaban hilang di jalan - akan membuat
  // transaksi kedua atas pembayaran yang sama.
  assert.match(schema, /idempotencyKey\s+String\?\s+@unique/);
  assert.doesNotMatch(route, /salesIdempotencyMap/);
  assert.match(migration, /ALTER TABLE "sales" ADD COLUMN "idempotencyKey" TEXT;/);
  assert.match(
    migration,
    /CREATE UNIQUE INDEX "sales_idempotencyKey_key" ON "sales"\("idempotencyKey"\);/
  );
});

test("pengiriman ulang mengembalikan transaksi yang sama, bukan transaksi baru", () => {
  assert.match(route, /const sudahTersimpan = await prisma\.sale\.findFirst\(\{/);
  assert.match(route, /where: \{ idempotencyKey, storeId: scope\.storeId \}/);
  assert.match(route, /"X-Idempotent-Replay": "true"/);
  assert.match(route, /idempotencyKey: idempotencyKey \?\? null,/);
});

test("balapan dua permintaan identik dijawab transaksi kembarnya, bukan kegagalan", () => {
  // Dua permintaan dengan kunci sama yang masuk hampir bersamaan: yang kalah
  // menabrak indeks unik. Kalau ini diulang seperti tabrakan nomor invoice,
  // kasir menunggu 14 percobaan lalu menerima 409 padahal transaksinya ada.
  assert.match(route, /function isIdempotencyKeyCollision\(error: unknown\)/);
  assert.match(route, /!isIdempotencyKeyCollision\(error\) &&/);
  assert.match(route, /if \(!idempotencyKey \|\| !isIdempotencyKeyCollision\(error\)\)/);
  assert.match(route, /const kembar = await prisma\.sale\.findFirst\(\{/);
});

test("replay dibatasi tenant pemanggil", () => {
  // Kunci milik tenant lain tidak boleh membocorkan transaksinya.
  const scoped = route.match(/idempotencyKey, storeId: scope\.storeId/g) ?? [];
  assert.ok(scoped.length >= 2, `pencarian kunci hanya dibatasi tenant ${scoped.length}x`);
});
