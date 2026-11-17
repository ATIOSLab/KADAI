import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const receipt = readFileSync(path.join(root, "src/components/shared/thermal-receipt.tsx"), "utf8");
const encoder = readFileSync(path.join(root, "src/lib/escpos/encoder.ts"), "utf8");
const detail = readFileSync(
  path.join(root, "src/app/(dashboard)/sales/[id]/page.tsx"),
  "utf8"
);

test("struk transaksi batal wajib bertanda BATAL", () => {
  // Struk cetak ulang transaksi void yang tampak sah bisa dipakai sebagai bukti
  // pembelian. Tandanya harus tercetak, bukan cuma di layar kasir.
  assert.match(receipt, /isVoided\?: boolean;/);
  assert.match(receipt, /\{isVoided && \(/);
  assert.match(receipt, /TRANSAKSI DIBATALKAN/);
  assert.match(receipt, /\{voidReason && /);
});

test("cetak langsung ESC/POS juga mencetak tanda batal", () => {
  assert.match(encoder, /isVoided\?: boolean;/);
  assert.match(encoder, /if \(data\.isVoided\) \{/);
  assert.match(encoder, /TRANSAKSI DIBATALKAN/);
});

test("halaman transaksi meneruskan status batal ke kedua jalur cetak", () => {
  // Dua jalur: pratinjau/print browser dan blob ESC/POS. Kalau salah satu lupa,
  // struk batal tetap bisa tercetak tanpa tanda.
  const terusan = detail.match(/isVoided=\{sale\.isVoided\}/g) ?? [];
  assert.ok(terusan.length >= 2, `hanya ${terusan.length} jalur cetak meneruskan status batal`);
  assert.match(detail, /isVoided: sale\.isVoided,/);
  assert.match(detail, /voidReason: sale\.voidReason,/);
});