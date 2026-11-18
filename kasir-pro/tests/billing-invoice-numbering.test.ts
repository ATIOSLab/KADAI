import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.join(import.meta.dirname, "..");
const billing = readFileSync(path.join(repoRoot, "src/lib/billing-service.ts"), "utf8");

test("penomoran tagihan dicoba ulang saat nomor bentrok", () => {
  // Dua penerbitan berbarengan tidak boleh menggagalkan seluruh proses billing.
  assert.match(billing, /for \(let attempt = 0; attempt < 5; attempt \+= 1\)/);
  assert.match(billing, /issued \+ 1 \+ attempt/);
  assert.match(billing, /kode !== "P2002"/);
  assert.match(billing, /throw upayaTerakhir/);
});

test("nomor tagihan tetap tidak bisa dipakai ganda", () => {
  const schema = readFileSync(path.join(repoRoot, "prisma/schema.prisma"), "utf8");
  assert.match(schema, /invoiceNumber\s+String\s+@unique/);
});
