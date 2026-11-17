import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dialog = readFileSync(
  path.join(root, "src/components/pos/checkout-dialog.tsx"),
  "utf8"
);
const page = readFileSync(
  path.join(root, "src/app/(dashboard)/inventory/adjustments/page.tsx"),
  "utf8"
);

test("kasir mengulang otomatis saat kalah balapan simpan", () => {
  // Dua kasir menyimpan pada detik yang sama: yang kalah menerima 409
  // TRANSACTION_CONFLICT. Dulu kasir harus menekan Bayar lagi dan sempat
  // mengira transaksi gagal padahal belum tercatat.
  assert.match(dialog, /const submitSale = \(\) =>/);
  assert.match(dialog, /error\.status === 409/);
  assert.match(dialog, /error\.code === "TRANSACTION_CONFLICT"/);
});

test("hasil yang tidak diketahui (5xx atau koneksi putus) juga diulang", () => {
  // 502/504 bisa muncul sesudah transaksi tersimpan di database: kalau kasir
  // disuruh mengulang dari nol, transaksi bisa tercatat dua kali. Karena
  // kuncinya sama, mengulang justru menanyakan "yang tadi jadi atau tidak".
  assert.match(dialog, /error\.status >= 500/);
  assert.match(dialog, /!\(error instanceof ApiError\)/);
  assert.match(dialog, /percobaanUlang >= 2/);
  assert.match(dialog, /setTimeout\(resolve, 900 \* \(percobaanUlang \+ 1\)\)/);
});

test("percobaan ulang memakai kunci idempotensi yang sama", () => {
  // Kalau kuncinya dibuat ulang, transaksi yang sebenarnya sudah tersimpan bisa
  // tercatat dua kali saat percobaan ulang diterima server.
  const keyUses = dialog.match(/clientAttemptKey/g) ?? [];
  assert.ok(keyUses.length >= 3, `kunci idempotensi hanya dipakai ${keyUses.length}x`);
  assert.doesNotMatch(dialog, /crypto\.randomUUID\(\)[\s\S]{0,200}setTimeout/);
});

test("penyesuaian stok tidak menyatakan gagal saat jawaban server tidak sampai", () => {
  // Sebelumnya 502 dijawab "Gagal mencatat penyesuaian stok" padahal barisnya
  // mungkin sudah tersimpan. Sekarang riwayat dimuat ulang supaya kebenarannya
  // terlihat, dan hanya 4xx yang benar-benar disebut gagal.
  assert.match(page, /const hasilTakDiketahui = !\(err instanceof ApiError\) \|\| err\.status >= 500;/);
  assert.match(page, /Riwayat dimuat ulang/);
  assert.match(page, /loadAdjustments\(\);/);
});
