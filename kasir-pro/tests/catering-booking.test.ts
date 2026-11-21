import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  canTransitionCateringStatus,
  cateringRemaining,
  isCateringPaidInFull,
} from "../src/lib/catering";
import {
  checkoutSchema,
  saleFilterSchema,
  cateringPaymentSchema,
  cateringStatusSchema,
} from "../src/lib/validators/sale";
import { navigationSections } from "../src/components/layout/navigation";

const ROOT = path.resolve(__dirname, "..");

function readMigrationSqls(): string[] {
  const dir = path.join(ROOT, "prisma/migrations");
  return fs
    .readdirSync(dir)
    .filter((d) => fs.existsSync(path.join(dir, d, "migration.sql")))
    .map((d) => fs.readFileSync(path.join(dir, d, "migration.sql"), "utf8"));
}

/**
 * Modul booking catering: schema + migration + validator + matriks status +
 * route guard. Bug yang dijaga: (1) booking diterima tanpa nama pemesan atau
 * dengan DP melebihi total, (2) sisa tagihan dihitung sembarangan, (3) status
 * melompat tidak sesuai alur, (4) modul bocor ke tipe usaha non-CATERING.
 */
test("CateringStatus punya 6 nilai lengkap di schema Prisma", () => {
  const schema = fs.readFileSync(path.join(ROOT, "prisma/schema.prisma"), "utf8");
  const block = schema.match(/enum CateringStatus \{([^}]*)\}/);
  assert.ok(block, "enum CateringStatus tidak ditemukan di schema.prisma");
  const values = block[1]
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//"));
  assert.deepEqual(values, [
    "BOOKED",
    "CONFIRMED",
    "IN_PRODUCTION",
    "DELIVERED",
    "COMPLETED",
    "CANCELLED",
  ]);
});

test("ada migration aditif untuk kolom catering + tabel buku kas", () => {
  const allSql = readMigrationSqls().join("\n");
  assert.match(allSql, /ALTER TABLE "sales" ADD COLUMN "cateringEventDate"/);
  assert.match(allSql, /ALTER TABLE "sales" ADD COLUMN "cateringDeposit"/);
  assert.match(allSql, /ALTER TABLE "sales" ADD COLUMN "cateringPaidAmount"/);
  assert.match(allSql, /ALTER TABLE "sales" ADD COLUMN "cateringStatus"/);
  assert.match(allSql, /CREATE TABLE "catering_payments"/);
  assert.match(allSql, /"method" "PaymentType" NOT NULL/);
});

test("nilai ActionType baru ditambahkan di migration terpisah (tidak dipakai di file yang sama)", () => {
  const files = readMigrationSqls();
  const added = files.filter((sql) => /ADD VALUE IF NOT EXISTS 'CATERING_/.test(sql));
  assert.equal(added.length, 1, "harus ada tepat satu migration yang menambah nilai ActionType");
  const sql = added[0];
  assert.match(sql, /'CATERING_PAYMENT_RECORDED'/);
  assert.match(sql, /'CATERING_STATUS_CHANGED'/);
  // Nilai enum baru tidak boleh dipakai di tabel apa pun pada migration yang sama
  // (larangan PostgreSQL). Nilai itu hanya bisa muncul di pernyataan ADD VALUE.
  const uses = sql
    .split("\n")
    .filter((l) => l && !l.trimStart().startsWith("--") && !l.trimStart().startsWith("ALTER TYPE"));
  assert.equal(uses.length, 0, "migration ActionType tidak boleh memakai nilai baru di DDL lain");
});

test("checkoutSchema menerima booking catering yang sah", () => {
  const parsed = checkoutSchema.safeParse({
    items: [
      { productId: "p1", productName: "Nasi Kotak", quantity: 50, unitPrice: 25000 },
    ],
    paymentType: "TEMPO",
    customerName: "PT Maju Bersama",
    cateringEventDate: "2026-12-15T10:00:00+07:00",
    cateringDeposit: 500000,
    cateringDepositMethod: "BANK_TRANSFER",
  });
  assert.equal(parsed.success, true, JSON.stringify(parsed.success ? {} : parsed.error.issues));
  assert.equal(parsed.success && parsed.data.cateringDeposit, 500000);
});

test("checkoutSchema menolak uang muka negatif dan tanggal acara rusak", () => {
  const base = {
    items: [{ productId: "p1", productName: "Nasi Kotak", quantity: 1, unitPrice: 25000 }],
    paymentType: "TEMPO",
    cateringEventDate: "2026-12-15T10:00:00+07:00",
  };
  assert.equal(
    checkoutSchema.safeParse({ ...base, cateringDeposit: -5 }).success,
    false,
    "DP negatif harus ditolak"
  );
  assert.equal(
    checkoutSchema.safeParse({ ...base, cateringEventDate: "bukan-tanggal" }).success,
    false,
    "tanggal acara rusak harus ditolak"
  );
  assert.equal(
    checkoutSchema.safeParse({ ...base, cateringDepositMethod: "TEMPO" }).success,
    false,
    "metode uang muka TEMPO (piutang) tidak pernah sah"
  );
});

test("saleFilterSchema mendukung filter catering", () => {
  const ok = saleFilterSchema.safeParse({ catering: "true", cateringStatus: "BOOKED" });
  assert.equal(ok.success, true, JSON.stringify(ok.success ? {} : ok.error.issues));
  const bad = saleFilterSchema.safeParse({ cateringStatus: "PESANAN" });
  assert.equal(bad.success, false, "status catering asing harus ditolak");
});

test("cateringPaymentSchema menolak nominal nol/negatif dan metode TEMPO", () => {
  assert.equal(cateringPaymentSchema.safeParse({ amount: 0, method: "CASH" }).success, false);
  assert.equal(cateringPaymentSchema.safeParse({ amount: -1000, method: "CASH" }).success, false);
  assert.equal(cateringPaymentSchema.safeParse({ amount: 1000, method: "TEMPO" }).success, false);
  assert.equal(
    cateringPaymentSchema.safeParse({ amount: 1000, method: "QRIS" }).success,
    true
  );
});

test("matriks transisi status: maju normal, batal hanya di tahap awal, terminal tertutup", () => {
  assert.equal(canTransitionCateringStatus("BOOKED", "CONFIRMED"), true);
  assert.equal(canTransitionCateringStatus("BOOKED", "IN_PRODUCTION"), true);
  assert.equal(canTransitionCateringStatus("BOOKED", "CANCELLED"), true);
  assert.equal(canTransitionCateringStatus("BOOKED", "DELIVERED"), false);
  assert.equal(canTransitionCateringStatus("BOOKED", "COMPLETED"), false);
  assert.equal(canTransitionCateringStatus("CONFIRMED", "IN_PRODUCTION"), true);
  assert.equal(canTransitionCateringStatus("CONFIRMED", "CANCELLED"), true);
  assert.equal(canTransitionCateringStatus("IN_PRODUCTION", "DELIVERED"), true);
  assert.equal(canTransitionCateringStatus("IN_PRODUCTION", "CANCELLED"), true);
  assert.equal(canTransitionCateringStatus("DELIVERED", "COMPLETED"), true);
  assert.equal(canTransitionCateringStatus("DELIVERED", "CANCELLED"), false);
  assert.equal(canTransitionCateringStatus("COMPLETED", "CANCELLED"), false);
  assert.equal(canTransitionCateringStatus("CANCELLED", "BOOKED"), false);
});

test("sisa tagihan = total - akumulasi, dan lunas hanya saat sisa ≤ 0", () => {
  assert.equal(cateringRemaining("1000000", "400000"), 600000);
  assert.equal(cateringRemaining(1000000, null), 1000000);
  assert.equal(cateringRemaining("1000000", "1500000"), 0, "lebih bayar tidak menjadi negatif");
  assert.equal(isCateringPaidInFull("1000000", "1000000"), true);
  assert.equal(isCateringPaidInFull("1000000", "999999"), false);
  assert.equal(isCateringPaidInFull("1000000", null), false);
});

test("menu navigasi memuat Pesanan Catering untuk peran kasir-manajer", () => {
  const items = navigationSections.flatMap((s) => s.items);
  const cateringItem = items.find((i) => i.href === "/catering");
  assert.ok(cateringItem, "menu /catering tidak ditemukan di navigasi");
  assert.ok(cateringItem!.roles!.includes("CASHIER"), "kasir harus bisa membuka /catering");
  assert.ok(cateringItem!.businessTypes!.includes("CATERING"), "menu /catering harus untuk CATERING");
});

test("route guard /catering ada di rbac (ADMIN/MANAGER/CASHIER)", () => {
  const rbac = fs.readFileSync(path.join(ROOT, "src/lib/rbac.ts"), "utf8");
  assert.match(rbac, /path: "\/catering", roles: ADMIN_CASHIER_ROLES/);
});

test("POST /api/sales memaksa aturan booking: TEMPO, nama pemesan, DP ≤ total, vertikal CATERING", () => {
  const route = fs.readFileSync(path.join(ROOT, "src/app/api/sales/route.ts"), "utf8");
  assert.match(route, /CATERING_MUST_BE_TEMPO/);
  assert.match(route, /CATERING_CUSTOMER_REQUIRED/);
  assert.match(route, /CATERING_DEPOSIT_EXCEEDS_TOTAL/);
  assert.match(route, /CATERING_DEPOSIT_METHOD_REQUIRED/);
  assert.match(route, /CATERING_BUSINESS_TYPE_REQUIRED/);
  // DP pertama harus masuk buku kas catering saat booking dibuat.
  assert.match(route, /tx\.cateringPayment\.create/);
  // Respon penjualan membawa buku kas pembayaran.
  assert.match(route, /cateringPayments:/);
});

test("endpoint pembayaran memakai guard optimistik (dua kasir tidak bisa menagih dua kali)", () => {
  const route = fs.readFileSync(
    path.join(ROOT, "src/app/api/sales/[id]/catering-payment/route.ts"),
    "utf8"
  );
  assert.match(route, /cateringPaidAmount: paid/);
  assert.match(route, /CATERING_PAYMENT_CONFLICT/);
  assert.match(route, /CATERING_PAYMENT_RECORDED/);
  // Transaksi yang sudah di-void tidak boleh menerima pembayaran susulan.
  assert.match(route, /sale\.isVoided/);
  assert.match(route, /void\), pembayaran ditolak/);
});

test("endpoint status menolak lompatan ilegal dan Selesai tanpa lunas", () => {
  const route = fs.readFileSync(
    path.join(ROOT, "src/app/api/sales/[id]/catering-status/route.ts"),
    "utf8"
  );
  assert.match(route, /canTransitionCateringStatus/);
  assert.match(route, /cateringStatus: from/);
  assert.match(route, /CATERING_STATUS_CONFLICT/);
  assert.match(route, /Booking belum lunas/);
  assert.match(route, /CATERING_STATUS_CHANGED/);
  // Transaksi yang sudah di-void tidak bisa lanjut/batal lewat API.
  assert.match(route, /sale\.isVoided/);
  assert.match(route, /void\), status tidak bisa diubah/);
});

test("tidak ada stub/TODO tertinggal di modul catering", () => {
  const files = [
    "src/lib/catering.ts",
    "src/app/(dashboard)/catering/page.tsx",
    "src/app/api/sales/[id]/catering-payment/route.ts",
    "src/app/api/sales/[id]/catering-status/route.ts",
  ];
  for (const rel of files) {
    const content = fs.readFileSync(path.join(ROOT, rel), "utf8");
    assert.doesNotMatch(content, /\bTODO\b|\bFIXME\b|throw new Error\("not implemented/i);
  }
});
