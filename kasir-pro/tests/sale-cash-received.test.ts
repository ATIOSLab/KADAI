import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const route = readFileSync(path.join(root, "src/app/api/sales/route.ts"), "utf8");
const schema = readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");
const migration = readFileSync(
  path.join(root, "prisma/migrations/20261117203000_sale_cash_received/migration.sql"),
  "utf8"
);
const validator = readFileSync(path.join(root, "src/lib/validators/sale.ts"), "utf8");
const checkout = readFileSync(path.join(root, "src/components/pos/checkout-dialog.tsx"), "utf8");
const detail = readFileSync(
  path.join(root, "src/app/(dashboard)/sales/[id]/page.tsx"),
  "utf8"
);

test("uang diterima dan kembalian tersimpan pada transaksinya", () => {
  // Dulu angka ini hanya hidup di layar kasir: struk cetak ulang kehilangan
  // "Uang Diterima"/"Kembalian" dan rekonsiliasi kas tidak bisa membuktikan
  // berapa uang yang benar-benar dipegang kasir.
  assert.match(schema, /paidAmount\s+Decimal\?\s+@db\.Decimal\(15, 2\)/);
  assert.match(schema, /changeAmount\s+Decimal\?\s+@db\.Decimal\(15, 2\)/);
  assert.match(migration, /ALTER TABLE "sales" ADD COLUMN "paidAmount" DECIMAL\(15, 2\);/);
  assert.match(migration, /ALTER TABLE "sales" ADD COLUMN "changeAmount" DECIMAL\(15, 2\);/);
  assert.match(route, /^\s+paidAmount,$/m);
  assert.match(route, /^\s+changeAmount,$/m);
});

test("kembalian dihitung dari total server, bukan dari angka kiriman klien", () => {
  // Kalau kembalian dihitung dari total yang dikirim klien, kasir bisa mengaku
  // menerima Rp 100.000 untuk tagihan Rp 500.000 dan "kembalian" negatifnya
  // lolos. Total tagihan dipakai dari hasil calculateSaleTotals di transaksi.
  assert.match(route, /paidAmount = new Decimal\(data\.paidAmount\)\.toDecimalPlaces\(2\);/);
  assert.match(route, /if \(paidAmount\.lessThan\(totalAmount\)\)/);
  assert.match(route, /"PAID_LESS_THAN_TOTAL"/);
  assert.match(route, /changeAmount = paidAmount\.sub\(totalAmount\)\.toDecimalPlaces\(2\);/);
  assert.match(route, /"PAID_AMOUNT_NOT_CASH"/);
});

test("uang diterima divalidasi sebagai angka tak negatif", () => {
  assert.match(validator, /paidAmount: z/);
  assert.match(validator, /\.min\(0, "Uang diterima tidak boleh negatif"\)/);
});

test("kasir mengirim uang diterima dan struk memakai angka dari server", () => {
  // Struk konfirmasi dan struk cetak ulang harus sama; sesudah checkout keranjang
  // dikosongkan sehingga `cashAmount` di layar tidak lagi bisa dipercaya.
  assert.match(
    checkout,
    /paidAmount: paymentType === "CASH" && cashAmount \? Number\(cashAmount\) : null/
  );
  assert.match(checkout, /completedSale\.paidAmount/);
  assert.match(checkout, /completedSale\.changeAmount/);
  assert.match(detail, /cashReceived=\{sale\.paidAmount \? Number\(sale\.paidAmount\) : null\}/);
  assert.match(detail, /changeAmount=\{sale\.changeAmount \? Number\(sale\.changeAmount\) : null\}/);
});