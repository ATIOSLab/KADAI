-- ═══════════════════════════════════════════════════════════════════
-- PURGE DATA DEMO KADAI (OPSIONAL — HANYA atas perintah eksplisit Kapten)
-- Menghapus seluruh artefak demo-seeder dari database produksi (db_kadai).
-- Diverifikasi 14 Nov 2026: 100% users/outlets/products/categories/sales
-- saat ini adalah hasil seeder (kecuali admin@kadai.com & superadmin@kadai.asia).
-- ═══════════════════════════════════════════════════════════════════
-- WAJIB: backup dulu sebelum eksekusi:
--   pg_dump "$DATABASE_URL" | gzip > kadai_backup_$(date +%F).sql.gz
-- Jalankan: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/sql/purge-demo-data.sql
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

\echo == CAKUPAN (harus sesuai audit) ==
SELECT (SELECT count(*) FROM users     WHERE "isDemo" = true) AS users_demo,
       (SELECT count(*) FROM outlets   WHERE "isDemo" = true) AS outlets_demo,
       (SELECT count(*) FROM products  WHERE "isDemo" = true) AS products_demo,
       (SELECT count(*) FROM categories WHERE "isDemo" = true) AS categories_demo;

-- 1) Audit trail oleh akun demo
DELETE FROM "activity_logs" WHERE "userId" IN (SELECT id FROM users WHERE "isDemo" = true);

-- 2) Transfer stok (antar outlet demo / oleh user demo / produk demo)
DELETE FROM "stock_transfer_items" WHERE "stockTransferId" IN (
  SELECT id FROM "stock_transfers" st
  WHERE st."sourceOutletId" IN (SELECT id FROM outlets WHERE "isDemo" = true)
     OR st."destinationOutletId" IN (SELECT id FROM outlets WHERE "isDemo" = true)
     OR st."createdById" IN (SELECT id FROM users WHERE "isDemo" = true)
     OR st."receivedById" IN (SELECT id FROM users WHERE "isDemo" = true)
);
DELETE FROM "stock_transfer_items" WHERE "productId" IN (SELECT id FROM products WHERE "isDemo" = true);
DELETE FROM "stock_transfers" WHERE "sourceOutletId" IN (SELECT id FROM outlets WHERE "isDemo" = true)
   OR "destinationOutletId" IN (SELECT id FROM outlets WHERE "isDemo" = true)
   OR "createdById" IN (SELECT id FROM users WHERE "isDemo" = true)
   OR "receivedById" IN (SELECT id FROM users WHERE "isDemo" = true);

-- 3) Penyesuaian stok (oleh user demo / produk demo)
DELETE FROM "stock_adjustments" WHERE "userId" IN (SELECT id FROM users WHERE "isDemo" = true)
   OR "productId" IN (SELECT id FROM products WHERE "isDemo" = true);

-- 4) Penjualan oleh kasir demo (+ KDS, item, item-batch kaskade)
DELETE FROM "kds_orders" WHERE "saleId" IN (SELECT id FROM sales WHERE "cashierId" IN (SELECT id FROM users WHERE "isDemo" = true));
DELETE FROM "laundry_job_orders" WHERE "saleId" IN (SELECT id FROM sales WHERE "cashierId" IN (SELECT id FROM users WHERE "isDemo" = true));
DELETE FROM "sale_items" WHERE "saleId" IN (SELECT id FROM sales WHERE "cashierId" IN (SELECT id FROM users WHERE "isDemo" = true));
DELETE FROM sales WHERE "cashierId" IN (SELECT id FROM users WHERE "isDemo" = true);

-- 5) Entri keuangan (penjualan demo / batch demo / dibuat user demo)
DELETE FROM "finance_entries" WHERE "saleId" IN (SELECT id FROM sales WHERE "cashierId" IN (SELECT id FROM users WHERE "isDemo" = true))
   OR "productBatchId" IN (SELECT id FROM "product_batches" WHERE "isDemo" = true)
   OR "createdByUserId" IN (SELECT id FROM users WHERE "isDemo" = true);

-- 6) Batch, produk (resep kaskade), kategori demo
DELETE FROM "product_batches" WHERE "isDemo" = true;
DELETE FROM products WHERE "isDemo" = true;
DELETE FROM categories WHERE "isDemo" = true;

-- 7) Meja restoran yang menunjuk outlet demo → lepas referensi
UPDATE "restaurant_tables" SET "outletId" = NULL WHERE "outletId" IN (SELECT id FROM outlets WHERE "isDemo" = true);

-- 8) User demo (setelah seluruh jejak terhapus), lalu outlet demo
DELETE FROM users WHERE "isDemo" = true;
DELETE FROM outlets WHERE "isDemo" = true;

\echo == SISA DATA SETELAH PURGE (harus hanya data asli) ==
SELECT (SELECT count(*) FROM users) AS users, (SELECT count(*) FROM outlets) AS outlets,
       (SELECT count(*) FROM products) AS products, (SELECT count(*) FROM categories) AS categories,
       (SELECT count(*) FROM sales) AS sales;

COMMIT;
