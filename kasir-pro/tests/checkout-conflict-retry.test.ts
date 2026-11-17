import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dialog = readFileSync(
  path.join(root, "src/components/pos/checkout-dialog.tsx"),
  "utf8"
);

test("kasir mengulang otomatis satu kali saat kalah balapan simpan", () => {
  // Dua kasir menyimpan pada detik yang sama: yang kalah menerima 409
  // TRANSACTION_CONFLICT. Dulu kasir harus menekan Bayar lagi dan sempat
  // mengira transaksi gagal padahal belum tercatat.
  assert.match(dialog, /const submitSale = \(\) =>/);
  assert.match(dialog, /error\.status === 409 \|\| error\.code === "TRANSACTION_CONFLICT"/);
  assert.match(dialog, /await new Promise\(\(resolve\) => setTimeout\(resolve, 900\)\)/);
});

test("percobaan ulang memakai kunci idempotensi yang sama", () => {
  // Kalau kuncinya dibuat ulang, transaksi yang sebenarnya sudah tersimpan bisa
  // tercatat dua kali saat percobaan kedua diterima server.
  const keyUses = dialog.match(/clientAttemptKey/g) ?? [];
  assert.ok(keyUses.length >= 3, `kunci idempotensi hanya dipakai ${keyUses.length}x`);
  assert.match(dialog, /response = await submitSale\(\);\s*\}\s*\n?/);
  assert.doesNotMatch(dialog, /crypto\.randomUUID\(\)[\s\S]{0,200}setTimeout/);
});