import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import {
  resolveShiftVarianceLedgerEntry,
  shiftVarianceLedgerTitle,
  SHIFT_VARIANCE_SYSTEM_KEYS,
} from "../src/lib/shift-ledger";

const repoRoot = path.join(import.meta.dirname, "..");

test("kas kurang dicatat sebagai uang keluar sebesar selisihnya", () => {
  const entry = resolveShiftVarianceLedgerEntry(-9_000);

  assert.ok(entry);
  assert.equal(entry.direction, "OUT");
  assert.equal(entry.systemKey, SHIFT_VARIANCE_SYSTEM_KEYS.SHORT);
  assert.equal(entry.amount, 9_000);
});

test("kas lebih dicatat sebagai uang masuk", () => {
  const entry = resolveShiftVarianceLedgerEntry(5_000);

  assert.ok(entry);
  assert.equal(entry.direction, "IN");
  assert.equal(entry.systemKey, SHIFT_VARIANCE_SYSTEM_KEYS.OVER);
  assert.equal(entry.amount, 5_000);
});

test("laci yang pas tidak menghasilkan entri Buku Kas", () => {
  assert.equal(resolveShiftVarianceLedgerEntry(0), null);
  assert.equal(resolveShiftVarianceLedgerEntry(null), null);
  assert.equal(resolveShiftVarianceLedgerEntry(undefined), null);
  // Selisih di bawah setengah sen dianggap pembulatan, bukan uang hilang.
  assert.equal(resolveShiftVarianceLedgerEntry(-0.004), null);
});

test("judul entri menyebut nomor Z-Report dan arah selisih", () => {
  const kurang = shiftVarianceLedgerTitle({
    shiftNumber: "Z-20261118-003",
    cashierName: "Kasir Uji",
    variance: -9_000,
  });
  assert.match(kurang, /Z-20261118-003/);
  assert.match(kurang, /Kas Kurang/);
  assert.match(kurang, /Kasir Uji/);

  const lebih = shiftVarianceLedgerTitle({
    shiftNumber: null,
    cashierName: null,
    variance: 1_000,
  });
  assert.match(lebih, /Kas Lebih/);
  assert.match(lebih, /Z-Report/);
});

test("penutupan shift menulis entri kas dan entri hukumnya atomik", () => {
  const source = readFileSync(path.join(repoRoot, "src/lib/shift-service.ts"), "utf8");

  assert.match(source, /source: "SHIFT_VARIANCE"/);
  assert.match(source, /recordShiftVarianceEntry\(tx,/);
  // Klaim laci + entri Buku Kas harus satu transaksi.
  assert.match(source, /prisma\.\$transaction\(async \(tx\) => \{[\s\S]*recordShiftVarianceEntry\(tx,/);
  // Kategori sistem disiapkan sebelum transaksi penutupan.
  assert.match(source, /await ensureFinanceCategories\(prisma\)/);
});

test("entri selisih kas terikat satu-satu ke shift di skema", () => {
  const schema = readFileSync(path.join(repoRoot, "prisma/schema.prisma"), "utf8");

  assert.match(schema, /SHIFT_VARIANCE/);
  assert.match(schema, /cashShiftId\s+String\?\s+@unique/);
  assert.match(
    schema,
    /enum FinanceSource \{[\s\S]*SHIFT_VARIANCE[\s\S]*\}/,
    "nilai enum FinanceSource.SHIFT_VARIANCE wajib ada"
  );
});

test("migrasi selisih kas tersedia sebagai migrasi terpisah dari enum", () => {
  const enumMigration = path.join(
    repoRoot,
    "prisma/migrations/20261118160000_finance_source_shift_variance/migration.sql"
  );
  const tableMigration = path.join(
    repoRoot,
    "prisma/migrations/20261118160100_finance_entry_cash_shift/migration.sql"
  );

  assert.ok(existsSync(enumMigration), "migrasi nilai enum wajib ada");
  assert.ok(existsSync(tableMigration), "migrasi kolom cashShiftId wajib ada");

  const enumSql = readFileSync(enumMigration, "utf8");
  const tableSql = readFileSync(tableMigration, "utf8");

  assert.match(enumSql, /ALTER TYPE "FinanceSource" ADD VALUE IF NOT EXISTS 'SHIFT_VARIANCE'/);
  // Nilai enum baru tidak boleh dipakai di transaksi yang sama.
  assert.doesNotMatch(enumSql, /CREATE TABLE|ALTER TABLE/);
  assert.match(tableSql, /ADD COLUMN "cashShiftId" TEXT/);
  assert.match(tableSql, /UNIQUE INDEX "finance_entries_cashShiftId_key"/);
});