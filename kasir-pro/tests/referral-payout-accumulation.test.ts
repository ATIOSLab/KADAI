import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { akumulasiPayout } from "../src/lib/referral-engine";

const repoRoot = path.join(import.meta.dirname, "..");
const sumber = readFileSync(path.join(repoRoot, "src/lib/referral-engine.ts"), "utf8");

test("komisi baru menambah nilai payout yang masih menunggu, bukan menggantinya", () => {
  // Skenario nyata: 100.000 menunggu dibayar, lalu komisi 50.000 masuk di bulan
  // yang sama. Yang benar adalah 150.000 — bukan 50.000.
  assert.equal(akumulasiPayout(100_000, 50_000), 150_000);
  assert.equal(akumulasiPayout(0, 50_000), 50_000);
  assert.equal(akumulasiPayout(null, 50_000), 50_000);
  assert.equal(akumulasiPayout(undefined, 25_500), 25_500);
});

test("nilai payout dibulatkan ke sen supaya tidak ada selisih aneh", () => {
  assert.equal(akumulasiPayout(100_000.005, 0.005), 100_000.01);
  assert.equal(akumulasiPayout(0.1, 0.2), 0.3);
});

test("masukan negatif tidak pernah mengurangi hak mitra", () => {
  assert.equal(akumulasiPayout(-5_000, 50_000), 50_000);
  assert.equal(akumulasiPayout(50_000, -5_000), 50_000);
});

test("payout periode berjalan memakai nilai akumulasi", () => {
  assert.match(sumber, /const nilaiPeriode = akumulasiPayout\(/);
  assert.match(sumber, /create: \{ partnerId, amount: nilaiPeriode/);
  assert.match(sumber, /update: \{ amount: nilaiPeriode, status: "PENDING" \}/);
  // Nilai lama tidak boleh dijadikan pengganti nilai periode.
  assert.doesNotMatch(sumber, /create: \{ partnerId, amount: group\.pending/);
  assert.doesNotMatch(sumber, /update: \{ amount: group\.pending, status: "PENDING" \}/);
  // Payout yang sudah final (PAID/REJECTED) tidak boleh diubah lagi.
  assert.match(sumber, /if \(existing && existing\.status !== "PENDING"\) continue/);
});
