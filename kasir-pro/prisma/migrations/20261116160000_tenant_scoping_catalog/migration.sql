-- Isolasi tenant tingkat katalog & master data.
--
-- Masalah: 8 model berikut tidak punya kunci tenant sehingga data satu tenant bocor
-- ke tenant lain (contoh live: akun BOSS DIMSUM melihat 80 produk & 48 kategori
-- milik tenant demo lain di /api/products dan /api/categories).
--
-- Solusi: tambah kolom "storeId" (nullable) + FK ke stores(id) ON DELETE SET NULL + index.
--   * storeId terisi  = milik tenant tersebut (hanya tenant itu yang melihat)
--   * storeId NULL    = data bersama/demo (tidak muncul di query tenant yang memfilter
--                       storeId = X karena NULL tidak pernah cocok; platform tetap melihat)
--
-- Unique constraint global dilunakkan menjadi per-tenant supaya tenant tidak lagi
-- saling memblokir (mis. telepon pelanggan tenant A memblokir tenant B).
-- "products.barcode" sengaja TETAP global (barcode fisik unik se-Indonesia).

-- ── 1) Kolom storeId + FK + index ─────────────────────────────────────────────
ALTER TABLE "categories"         ADD COLUMN "storeId" TEXT;
ALTER TABLE "products"           ADD COLUMN "storeId" TEXT;
ALTER TABLE "units"              ADD COLUMN "storeId" TEXT;
ALTER TABLE "suppliers"          ADD COLUMN "storeId" TEXT;
ALTER TABLE "customers"          ADD COLUMN "storeId" TEXT;
ALTER TABLE "finance_categories" ADD COLUMN "storeId" TEXT;
ALTER TABLE "finance_entries"    ADD COLUMN "storeId" TEXT;
ALTER TABLE "stock_adjustments"  ADD COLUMN "storeId" TEXT;

ALTER TABLE "categories"         ADD CONSTRAINT "categories_storeId_fkey"         FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "products"           ADD CONSTRAINT "products_storeId_fkey"           FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "units"              ADD CONSTRAINT "units_storeId_fkey"              FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "suppliers"          ADD CONSTRAINT "suppliers_storeId_fkey"          FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customers"          ADD CONSTRAINT "customers_storeId_fkey"          FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "finance_entries"    ADD CONSTRAINT "finance_entries_storeId_fkey"    FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_adjustments"  ADD CONSTRAINT "stock_adjustments_storeId_fkey"  FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "categories_storeId_idx"         ON "categories"("storeId");
CREATE INDEX "products_storeId_idx"           ON "products"("storeId");
CREATE INDEX "units_storeId_idx"              ON "units"("storeId");
CREATE INDEX "suppliers_storeId_idx"          ON "suppliers"("storeId");
CREATE INDEX "customers_storeId_idx"          ON "customers"("storeId");
CREATE INDEX "finance_categories_storeId_idx" ON "finance_categories"("storeId");
CREATE INDEX "finance_entries_storeId_entryDate_idx" ON "finance_entries"("storeId", "entryDate");
CREATE INDEX "stock_adjustments_storeId_idx"  ON "stock_adjustments"("storeId");

-- ── 2) Pelunakan unique global → per-tenant ───────────────────────────────────
DROP INDEX "categories_name_key";
DROP INDEX "products_sku_key";
DROP INDEX "units_name_key";
DROP INDEX "units_normalizedName_key";
DROP INDEX "customers_phone_key";
DROP INDEX "finance_categories_name_direction_key";
-- finance_categories_systemKey_key DIPERTAHANKAN: kategori sistem platform (SALE_INCOME dll)
-- unik global dan dipakai bersama semua tenant (baris storeId NULL).

CREATE UNIQUE INDEX "categories_storeId_name_key" ON "categories"("storeId", "name");
CREATE UNIQUE INDEX "products_storeId_sku_key"    ON "products"("storeId", "sku");
CREATE UNIQUE INDEX "units_storeId_normalizedName_key" ON "units"("storeId", "normalizedName");
CREATE UNIQUE INDEX "customers_storeId_phone_key" ON "customers"("storeId", "phone");
CREATE UNIQUE INDEX "finance_categories_storeId_name_direction_key" ON "finance_categories"("storeId", "name", "direction");
