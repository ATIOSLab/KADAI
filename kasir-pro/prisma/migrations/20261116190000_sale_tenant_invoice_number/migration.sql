-- Nomor invoice: unik PER TENANT, bukan global.
-- Sebelumnya penghitung nomor dibatasi per tenant sementara indeks uniknya global,
-- sehingga tenant kedua yang menjual pada hari yang sama selalu gagal (P2002).

ALTER TABLE "sales" ADD COLUMN "storeId" TEXT;

-- Backfill tenant pemilik dari outlet penjualan (baris lama tanpa outlet dibiarkan NULL).
UPDATE "sales" s
SET "storeId" = o."storeId"
FROM "outlets" o
WHERE s."outletId" = o."id" AND s."storeId" IS NULL;

DROP INDEX IF EXISTS "sales_invoiceNumber_key";

CREATE INDEX "sales_storeId_idx" ON "sales"("storeId");

ALTER TABLE "sales"
  ADD CONSTRAINT "sales_storeId_fkey" FOREIGN KEY ("storeId")
  REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "sales_storeId_invoiceNumber_key" ON "sales"("storeId", "invoiceNumber");
