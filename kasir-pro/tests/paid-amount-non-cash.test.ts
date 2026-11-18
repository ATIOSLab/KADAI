import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.join(import.meta.dirname, "..");
const sales = readFileSync(path.join(repoRoot, "src/app/api/sales/route.ts"), "utf8");

test("uang diterima 0 tidak lagi dianggap pelanggaran untuk non-tunai", () => {
  // Klien yang selalu mengirim kolom paidAmount dengan nilai 0 (tempo/QRIS)
  // sebelumnya ditolak "uang diterima hanya untuk tunai".
  assert.match(sales, /const uangDiterima =/);
  assert.match(sales, /uangDiterima !== null && uangDiterima\.greaterThan\(0\)/);
  assert.doesNotMatch(
    sales,
    /if \(data\.paidAmount !== undefined && data\.paidAmount !== null\) \{\n\s+if \(data\.paymentType !== "CASH"\)/
  );
});

test("tunai untuk tagihan bernilai tetap wajib mencatat uang yang diterima", () => {
  assert.match(
    sales,
    /uangDiterima !== null && data\.paymentType === "CASH" && totalAmount\.greaterThan\(0\)/
  );
  assert.match(sales, /PAID_LESS_THAN_TOTAL/);
});

test("uang diterima melebihi total hanya dicatat untuk tunai", () => {
  assert.match(sales, /uangDiterima\.lessThan\(totalAmount\)/);
  assert.match(sales, /PAID_AMOUNT_NOT_CASH/);
});

test("kebijakan bukti bayar berjalan setelah validasi uang diterima", () => {
  const idxUang = sales.indexOf("uangDiterima !== null && uangDiterima.greaterThan(0)");
  const idxKebijakan = sales.indexOf("evaluatePaymentPolicy(");
  assert.ok(idxUang > 0 && idxKebijakan > 0, "kedua pemeriksaan harus ada");
  assert.ok(idxUang < idxKebijakan, "kebijakan bukti bayar dievaluasi setelah uang diterima divalidasi");
});
