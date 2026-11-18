import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  evaluatePaymentPolicy,
  NON_CASH_REFERENCE_THRESHOLD,
} from "../src/lib/payment-policy";

const repoRoot = path.join(import.meta.dirname, "..");

test("penjualan tempo wajib punya pelanggan", () => {
  const d = evaluatePaymentPolicy({ paymentType: "TEMPO", totalAmount: 50000 });
  assert.equal(d.ok, false);
  assert.equal(d.code, "TEMPO_REQUIRES_CUSTOMER");
  assert.match(d.message ?? "", /piutangnya bisa ditagih/);
});

test("nama pelanggan yang terlalu pendek belum dianggap penanggung utang", () => {
  const d = evaluatePaymentPolicy({
    paymentType: "TEMPO",
    totalAmount: 50000,
    customerName: "a",
  });
  assert.equal(d.ok, false);
  assert.equal(d.code, "TEMPO_REQUIRES_CUSTOMER");
});

test("tempo dengan pelanggan terdaftar atau nama jelas diterima", () => {
  assert.equal(
    evaluatePaymentPolicy({ paymentType: "TEMPO", totalAmount: 50000, customerId: "cust-1" }).ok,
    true
  );
  assert.equal(
    evaluatePaymentPolicy({ paymentType: "TEMPO", totalAmount: 50000, customerName: "Bu Sari" }).ok,
    true
  );
});

test("pembayaran non-tunai besar wajib bernomor referensi", () => {
  for (const tipe of ["BANK_TRANSFER", "QRIS", "E_WALLET"]) {
    const d = evaluatePaymentPolicy({ paymentType: tipe, totalAmount: NON_CASH_REFERENCE_THRESHOLD });
    assert.equal(d.ok, false, `${tipe} harus wajib referensi`);
    assert.equal(d.code, "NON_CASH_REFERENCE_REQUIRED");
  }
});

test("nilai kecil tetap dilonggarkan supaya antrean kasir tidak macet", () => {
  assert.equal(
    evaluatePaymentPolicy({ paymentType: "QRIS", totalAmount: NON_CASH_REFERENCE_THRESHOLD - 1 }).ok,
    true
  );
  assert.equal(
    evaluatePaymentPolicy({
      paymentType: "QRIS",
      totalAmount: NON_CASH_REFERENCE_THRESHOLD,
      paymentRef: "  QRS-12345 ",
    }).ok,
    true
  );
});

test("tunai tidak pernah butuh nomor referensi", () => {
  assert.equal(
    evaluatePaymentPolicy({ paymentType: "CASH", totalAmount: 5_000_000 }).ok,
    true
  );
});

test("rute penjualan menegakkan kelengkapan bukti bayar", () => {
  const route = readFileSync(path.join(repoRoot, "src/app/api/sales/route.ts"), "utf8");
  const policy = readFileSync(path.join(repoRoot, "src/lib/payment-policy.ts"), "utf8");

  assert.match(route, /evaluatePaymentPolicy\(\{/);
  // Total diambil dari hasil hitungan server, bukan angka kiriman klien.
  assert.match(route, /totalAmount: Number\(totalAmount\)/);
  assert.match(policy, /NON_CASH_REFERENCE_THRESHOLD = 250_000/);
});
