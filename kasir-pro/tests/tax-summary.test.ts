import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  describeTaxType,
  describeEffectiveTaxProfile,
} from "../src/lib/tax-labels";

const root = path.resolve(import.meta.dirname, "..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

test("label pajak tidak pernah menampilkan kode mentah (NONE) kepada pemilik", () => {
  assert.equal(describeTaxType("PB1_10", 10), "PB1 10%");
  assert.equal(describeTaxType("PPN_11", 11), "PPN 11%");
  assert.equal(describeTaxType("NONE", 0), "Tanpa pajak");
  // Kode NONE tetapi tarifnya bisa ditagih: sebut tarifnya, jangan "NONE".
  assert.equal(describeTaxType("NONE", 10), "Pajak 10%");
  assert.equal(describeTaxType("PB1_10", 7.5), "PB1 7.5%");
  assert.doesNotMatch(describeTaxType("NONE", 10), /NONE/);
});

test("profil pajak cabang dipakai, bukan tarif toko", () => {
  const uniform = describeEffectiveTaxProfile([
    { taxType: "PB1_10", taxRate: 10 },
    { taxType: "PB1_10", taxRate: 10 },
  ]);
  assert.equal(uniform.label, "PB1 10%");
  assert.equal(uniform.mixed, false);

  const mixed = describeEffectiveTaxProfile([
    { taxType: "PB1_10", taxRate: 10 },
    { taxType: "PPN_11", taxRate: 11 },
  ]);
  assert.equal(mixed.mixed, true);
  assert.match(mixed.label, /Campuran/);
  assert.match(mixed.label, /10%/);
  assert.match(mixed.label, /11%/);

  assert.equal(describeEffectiveTaxProfile([]).label, "Tanpa pajak");
});

test("rekap pajak memakai peredaran bruto subtotal + service charge", () => {
  const route = read("src/app/api/finance/tax-summary/route.ts");
  // PB1 adalah titipan negara: tidak masuk omzet, tetapi service charge masuk.
  assert.match(route, /grossRevenue \+= gross \+ srv/);
  assert.match(route, /describeEffectiveTaxProfile/);
  assert.match(route, /prisma\.outlet\.findMany/);
  assert.match(route, /taxLabel/);
  // Jangan kembali membaca tarif toko untuk label pajak.
  assert.doesNotMatch(route, /taxType: store\?\.taxType \|\| "PB1_10"/);
});

test("halaman rekap pajak menampilkan label tarif cabang", () => {
  const page = read("src/app/(dashboard)/finance/tax/page.tsx");
  assert.match(page, /data\.store\.taxLabel/);
  assert.match(page, /Peredaran Bruto/);
  assert.doesNotMatch(page, /Pajak Terpungut \(\$\{data\.store\.taxType\}\)/);
});