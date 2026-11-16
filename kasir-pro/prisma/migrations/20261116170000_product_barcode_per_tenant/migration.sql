-- Barcode produk: unik per tenant (bukan global).
-- Dua tenant sah menjual barang fisik dengan EAN/barcode yang sama; yang tidak boleh
-- adalah barcode kembar DI DALAM satu tenant. Index unik lama (global) dilepas.
-- Catatan: baris dengan storeId NULL (data demo/shared) diperlakukan Postgres sebagai
-- nilai berbeda pada unique index, sehingga tidak memblokir baris tenant.

DROP INDEX IF EXISTS "products_barcode_key";

CREATE UNIQUE INDEX IF NOT EXISTS "products_storeId_barcode_key"
  ON "products" ("storeId", "barcode");
