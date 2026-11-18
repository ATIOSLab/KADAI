import test from "node:test";
import assert from "node:assert/strict";
import { generateShiftNumber } from "../src/lib/utils";

test("nomor Z-Report memakai tanggal bisnis, bukan tanggal UTC server", () => {
  // 17:30 UTC tanggal 18 = 00:30 WIB tanggal 19: shift larut malam harus
  // bernomor tanggal 19, bukan 18.
  const lateNight = new Date("2026-11-18T17:30:00.000Z");
  assert.equal(generateShiftNumber(1, lateNight, "Asia/Jakarta"), "Z-20261119-001");
});

test("nomor Z-Report berurutan tiga digit", () => {
  const morning = new Date("2026-11-18T02:00:00.000Z"); // 09:00 WIB
  assert.equal(generateShiftNumber(7, morning, "Asia/Jakarta"), "Z-20261118-007");
  assert.equal(generateShiftNumber(12, morning, "Asia/Jakarta"), "Z-20261118-012");
});