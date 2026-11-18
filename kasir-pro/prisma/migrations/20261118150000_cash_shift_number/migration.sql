-- Nomor Z-Report: tanpa nomor, laporan shift tidak bisa dirujuk saat audit
-- ("selisih kas yang mana?"). Nomor diberikan saat laci ditutup, berurutan per
-- tenant per hari bisnis, dan unik per toko.
ALTER TABLE "cash_shifts" ADD COLUMN "shiftNumber" TEXT;

CREATE UNIQUE INDEX "cash_shifts_storeId_shiftNumber_key"
  ON "cash_shifts"("storeId", "shiftNumber");