import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

/**
 * Kelengkapan CRUD data induk.
 *
 * Sebelum putaran ini empat entitas hanya punya sebagian operasi:
 *  - pemasok, pelanggan, cabang: bisa dibuat & diubah, tetapi tidak pernah bisa
 *    dinonaktifkan/dihapus lewat API;
 *  - satuan: hanya bisa ditambah, tanpa ganti nama dan tanpa hapus, dan tidak
 *    punya layar pengelolaan sama sekali.
 * Tombol "Nonaktifkan" di halaman Pemasok bahkan mengirim `isActive` yang
 * dibuang diam-diam oleh validator zod - pesan sukses muncul, data tidak berubah.
 *
 * Uji ini menjaga agar lubang itu tidak kembali terbuka.
 */

const repoRoot = path.join(import.meta.dirname, "..");
const baca = (rel: string) => readFileSync(path.join(repoRoot, rel), "utf8");

const suppliers = baca("src/app/api/suppliers/route.ts");
const customers = baca("src/app/api/customers/route.ts");
const outlets = baca("src/app/api/outlets/route.ts");
const units = baca("src/app/api/units/route.ts");
const outletLifecycle = baca("src/lib/outlet-lifecycle.ts");
const supplierValidator = baca("src/lib/validators/supplier.ts");
const customerValidator = baca("src/lib/validators/customer.ts");
const outletValidator = baca("src/lib/validators/outlet.ts");
const unitValidator = baca("src/lib/validators/unit.ts");

test("pemasok bisa dinonaktifkan lewat DELETE dan lewat formulir (isActive)", () => {
  assert.match(suppliers, /export async function DELETE/);
  assert.match(suppliers, /data: \{ isActive: false \}/);
  // Validator WAJIB menerima isActive; kalau tidak, tombol di UI jadi bohong.
  assert.match(supplierValidator, /isActive: z\.boolean\(\)\.optional\(\)/);
  assert.match(suppliers, /\.\.\.\(validated\.isActive !== undefined && \{ isActive: validated\.isActive \}\)/);
  assert.match(suppliers, /SUPPLIER_DEACTIVATED/);
  assert.match(suppliers, /SUPPLIER_ACTIVATED/);
});

test("pelanggan bisa dinonaktifkan, hanya oleh manager/admin, dan tercatat", () => {
  assert.match(customers, /export async function DELETE/);
  assert.match(customers, /ADMIN_MANAGER_ROLES/);
  assert.match(customers, /action: "CUSTOMER_DEACTIVATED"/);
  assert.match(customerValidator, /isActive: z\.boolean\(\)\.optional\(\)/);
  // Nama pelanggan pada nota tempo lama tidak boleh ikut hilang.
  assert.match(customers, /isActive: false/);
});

test("pemasok & pelanggan nonaktif tidak muncul lagi di daftar default", () => {
  assert.match(suppliers, /includeInactive/);
  assert.match(suppliers, /\.\.\.\(includeInactive \? \{\} : \{ isActive: true \}\)/);
  assert.match(customers, /includeInactive/);
});

test("cabang: penjagaan nonaktif dipakai bersama oleh DELETE dan PUT", () => {
  assert.match(outlets, /export async function DELETE/);
  assert.match(outletLifecycle, /export async function outletDeactivationBlocker/);
  assert.match(outletLifecycle, /MAIN_OUTLET_PROTECTED/);
  assert.match(outletLifecycle, /LAST_OUTLET_PROTECTED/);
  assert.match(outletLifecycle, /OUTLET_HAS_OPEN_SHIFT/);
  // Dua jalur, satu aturan: helper dipanggil di DELETE maupun PUT.
  const pemakaian = outlets.match(/outletDeactivationBlocker\(/g) ?? [];
  assert.equal(pemakaian.length, 2, "helper harus dipanggil di DELETE dan PUT");
  assert.match(outletValidator, /isActive: z\.boolean\(\)\.optional\(\)/);
  assert.match(outlets, /OUTLET_DEACTIVATED/);
});

test("satuan: ganti nama ikut memperbarui produk yang memakainya", () => {
  assert.match(units, /export async function PUT/);
  assert.match(units, /export async function DELETE/);
  assert.match(unitValidator, /updateUnitSchema/);
  // Nama satuan tersimpan sebagai teks di Product.unit; rename harus menyebar.
  assert.match(units, /tx\.product\.updateMany\(\{/);
  assert.match(units, /where: \{ storeId: scope\.storeId, unit: unit\.name \}/);
  assert.match(units, /action: "UNIT_UPDATED"/);
});

test("satuan yang masih dipakai produk tidak boleh dihapus", () => {
  assert.match(units, /UNIT_IN_USE/);
  assert.match(units, /prisma\.product\.count\(\{/);
  assert.match(units, /action: "UNIT_DELETED"/);
});

test("satuan bawaan platform (storeId NULL) tidak bisa diubah atau dihapus tenant", () => {
  assert.match(units, /where: \{ id: data\.id, storeId: scope\.storeId \}/);
  assert.match(units, /where: \{ id, storeId: scope\.storeId \}/);
  assert.match(units, /bisaDiubah: unit\.storeId === scope\.storeId/);
});

test("UI benar-benar memakai endpoint baru", () => {
  const pelangganUi = baca("src/app/(dashboard)/customers/page.tsx");
  const cabangUi = baca("src/app/(dashboard)/outlets/page.tsx");
  const satuanUi = "src/app/(dashboard)/units/page.tsx";

  assert.match(pelangganUi, /\/api\/customers\?id=/);
  assert.match(pelangganUi, /method: "DELETE"/);
  assert.match(cabangUi, /\/api\/outlets\?id=/);
  assert.match(cabangUi, /method: "DELETE"/);
  assert.ok(existsSync(path.join(repoRoot, satuanUi)), "halaman Satuan harus ada");
  const satuanSrc = baca(satuanUi);
  assert.match(satuanSrc, /method: "PUT"/);
  assert.match(satuanSrc, /method: "DELETE"/);
});

test("navigasi memuat halaman Satuan untuk peran yang mengelola produk", () => {
  const nav = baca("src/components/layout/navigation.ts");
  assert.match(nav, /href: "\/units"/);
  assert.match(nav, /label: "Satuan & Kemasan"/);
});

test("migrasi menambahkan aksi audit untuk data induk", () => {
  const migrasi = baca(
    "prisma/migrations/20261118200000_master_data_deactivation/migration.sql"
  );
  for (const aksi of [
    "SUPPLIER_ACTIVATED",
    "SUPPLIER_DEACTIVATED",
    "CUSTOMER_ACTIVATED",
    "CUSTOMER_DEACTIVATED",
    "OUTLET_ACTIVATED",
    "OUTLET_DEACTIVATED",
    "UNIT_UPDATED",
    "UNIT_DELETED",
  ]) {
    assert.match(migrasi, new RegExp(aksi));
  }
});

test("cabang utama tidak bisa dilepas tanpa pengganti", () => {
  // Melepas isMain dari cabang utama lewat PUT akan meninggalkan toko tanpa
  // acuan laci; penolakannya harus bernama, bukan 500.
  assert.match(outlets, /MAIN_OUTLET_REQUIRED/);
  assert.match(outlets, /validated\.isMain === false && owned\.isMain/);
});
