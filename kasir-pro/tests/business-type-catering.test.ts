import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { navigationSections } from "../src/components/layout/navigation";
import { ownerCreateSchema } from "../src/lib/validators/platform";

const ROOT = path.resolve(__dirname, "..");

/**
 * Tipe usaha CATERING (katering & event) harus konsisten di seluruh lapisan:
 * enum Prisma + migration aditif + validator provisioning + gating menu.
 * Bug yang dijaga: tipe diterima API tapi ditolak DB (atau sebaliknya), dan
 * menu F&B tersembunyi untuk store catering.
 */
test("CATERING ada di enum Prisma BusinessType", () => {
  const schema = fs.readFileSync(path.join(ROOT, "prisma/schema.prisma"), "utf8");
  const block = schema.match(/enum BusinessType \{([^}]*)\}/);
  assert.ok(block, "enum BusinessType tidak ditemukan di schema.prisma");
  const values = block[1]
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//"));
  assert.ok(values.includes("CATERING"), `CATERING tidak ada di enum: ${values.join(", ")}`);
});

test("ada migration aditif yang menambahkan CATERING", () => {
  const dir = path.join(ROOT, "prisma/migrations");
  const found = fs
    .readdirSync(dir)
    .filter((d) => fs.existsSync(path.join(dir, d, "migration.sql")))
    .some((d) => {
      const sql = fs.readFileSync(path.join(dir, d, "migration.sql"), "utf8");
      return /ADD VALUE\s+'CATERING'/i.test(sql) && /"BusinessType"/.test(sql);
    });
  assert.ok(found, "migration ALTER TYPE \"BusinessType\" ADD VALUE 'CATERING' tidak ditemukan");
});

test("validator provisioning menerima CATERING dan menolak tipe asing", () => {
  const base = {
    name: "Katering Nusantara",
    email: "owner@katering.test",
    password: "rahasia1234",
    supervisorPin: "999888",
    newStore: { name: "Katering Nusantara", businessType: "CATERING" },
  };
  const ok = ownerCreateSchema.safeParse(base);
  assert.equal(ok.success, true, JSON.stringify(ok.success ? {} : ok.error.issues));
  assert.equal(ok.success && ok.data.newStore?.businessType, "CATERING");
  const bad = ownerCreateSchema.safeParse({
    ...base,
    newStore: { name: "Katering Palsu", businessType: "CATERING_FAKE" },
  });
  assert.equal(bad.success, false, "tipe usaha asing seharusnya ditolak");
});

test("menu F&B membuka diri untuk store CATERING (gating konsisten)", () => {
  const fnbItems = navigationSections
    .flatMap((s) => s.items)
    .filter((i) => (i.businessTypes ?? []).includes("FNB_CAFE"));
  assert.ok(fnbItems.length > 0, "tidak ada menu F&B yang terdeteksi");
  for (const item of fnbItems) {
    assert.ok(
      item.businessTypes!.includes("CATERING"),
      `menu ${item.href} terkunci untuk CATERING padahal sefamily F&B`,
    );
  }
});
