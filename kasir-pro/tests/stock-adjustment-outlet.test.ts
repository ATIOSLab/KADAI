import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

const adjustmentRoute = read("src/app/api/inventory/adjustment/route.ts");
const transfersRoute = read("src/app/api/inventory/transfers/route.ts");
const produceRoute = read("src/app/api/products/[id]/produce/route.ts");
const schema = read("prisma/schema.prisma");

test("penyesuaian stok mencatat cabangnya", () => {
  assert.match(schema, /model StockAdjustment \{[\s\S]*?outletId String\?/);
  assert.match(adjustmentRoute, /outletId: effectiveOutletId/);
});

test("potongan penyesuaian hanya menyentuh batch cabang terkait", () => {
  // Tanpa OR ini, barang rusak di satu cabang menggerus stok cabang lain
  // karena pemindaian FIFO berjalan lintas cabang.
  assert.match(
    adjustmentRoute,
    /OR: \[\{ outletId: effectiveOutletId \}, \{ outletId: null \}\]/
  );
  assert.match(adjustmentRoute, /remainingQty: \{ gt: 0 \}/);
});

test("cabang penyesuaian diresolusi dan divalidasi ke tenant", () => {
  assert.match(adjustmentRoute, /where: \{ id: effectiveOutletId, storeId: scope\.storeId \}/);
  assert.match(adjustmentRoute, /isMain: true, isActive: true, storeId: scope\.storeId/);
  assert.match(adjustmentRoute, /OUTLET_REQUIRED/);
  // Nomor cabang pada tenant lain tidak boleh diterima.
  assert.match(adjustmentRoute, /Cabang tidak ditemukan pada tenant ini/);
});

test("kaki penyesuaian dari transfer dan produksi juga menyebut cabang", () => {
  assert.match(transfersRoute, /outletId: transfer\.sourceOutletId/);
  assert.match(transfersRoute, /outletId: transfer\.destinationOutletId/);
  assert.match(produceRoute, /outletId: effectiveOutletId/);
  const produceOutletWrites = produceRoute.match(/outletId: effectiveOutletId/g) ?? [];
  // Batch hasil produksi + dua catatan penyesuaian (bahan baku & hasil).
  assert.ok(produceOutletWrites.length >= 3, `ditemukan ${produceOutletWrites.length}`);
});

test("riwayat penyesuaian menampilkan cabang dan bisa disaring", () => {
  assert.match(adjustmentRoute, /outlet: \{ select: \{ id: true, name: true, code: true \} \}/);
  assert.match(adjustmentRoute, /outletFilter !== "ALL" \? \{ outletId: outletFilter \}/);
  const page = read("src/app/(dashboard)/inventory/adjustments/page.tsx");
  assert.match(page, /Cabang \*/);
  assert.match(page, /outletId: selectedOutletId \|\| undefined/);
});