-- Kunci idempotensi checkout disimpan pada baris penjualannya.
-- Nullable: transaksi lama (dan pemanggil lama tanpa kunci) tetap sah;
-- PostgreSQL mengizinkan banyak NULL pada indeks unik.
ALTER TABLE "sales" ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "sales_idempotencyKey_key" ON "sales"("idempotencyKey");
