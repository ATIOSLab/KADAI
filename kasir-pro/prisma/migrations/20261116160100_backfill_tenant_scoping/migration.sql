-- Backfill storeId untuk entitas yang sudah ada, berdasarkan relasi yang tersedia.
--
-- Aturan:
--   1. Baris demo (isDemo = true) → dibiarkan storeId NULL ("legacy/shared demo"):
--      otomatis hilang dari POS/katalog tenant tanpa perlu menghapus data,
--      sementara modul platform (super admin) tetap melihatnya.
--   2. Baris milik tenant nyata → storeId diambil dari relasi:
--      FinanceEntry : sale → outlet → store | productBatch → outlet → store | createdByUser → store
--      StockAdjustment : userId → store
--   3. Baris yang tidak punya jalur relasi (mis. kategori/produk non-demo tanpa pemilik)
--      dibiarkan NULL dan dilaporkan lewat NOTICE — TIDAK ditebak, supaya tidak salah tenant.

-- FinanceEntry ─────────────────────────────────────────────────────────────────
UPDATE "finance_entries" fe
SET    "storeId" = o."storeId"
FROM   "sales" s
JOIN   "outlets" o ON o."id" = s."outletId"
WHERE  fe."saleId" = s."id"
  AND  fe."storeId" IS NULL
  AND  o."storeId" IS NOT NULL;

UPDATE "finance_entries" fe
SET    "storeId" = o."storeId"
FROM   "product_batches" pb
JOIN   "outlets" o ON o."id" = pb."outletId"
WHERE  fe."productBatchId" = pb."id"
  AND  fe."storeId" IS NULL
  AND  o."storeId" IS NOT NULL;

UPDATE "finance_entries" fe
SET    "storeId" = u."storeId"
FROM   "users" u
WHERE  fe."createdByUserId" = u."id"
  AND  fe."storeId" IS NULL
  AND  u."storeId" IS NOT NULL;

-- StockAdjustment ──────────────────────────────────────────────────────────────
UPDATE "stock_adjustments" sa
SET    "storeId" = u."storeId"
FROM   "users" u
WHERE  sa."userId" = u."id"
  AND  sa."storeId" IS NULL
  AND  u."storeId" IS NOT NULL;

-- Laporan baris non-demo yang masih tanpa pemilik (tidak diubah) ───────────────
DO $$
DECLARE
  v_cat   bigint;
  v_prod  bigint;
  v_cust  bigint;
  v_supp  bigint;
  v_fin   bigint;
BEGIN
  SELECT count(*) INTO v_cat  FROM "categories"        WHERE "storeId" IS NULL AND "isDemo" = false;
  SELECT count(*) INTO v_prod FROM "products"          WHERE "storeId" IS NULL AND "isDemo" = false;
  SELECT count(*) INTO v_cust FROM "customers"         WHERE "storeId" IS NULL;
  SELECT count(*) INTO v_supp FROM "suppliers"         WHERE "storeId" IS NULL;
  SELECT count(*) INTO v_fin  FROM "finance_entries"   WHERE "storeId" IS NULL;
  RAISE NOTICE 'tenant scoping backfill: kategori_non_demo_tanpa_store=%, produk_non_demo_tanpa_store=%, customers_tanpa_store=%, suppliers_tanpa_store=%, finance_entries_tanpa_store=%',
    v_cat, v_prod, v_cust, v_supp, v_fin;
END $$;
