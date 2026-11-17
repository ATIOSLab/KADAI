-- Penyesuaian stok kini terikat cabang.
--
-- Sebelumnya potongan penyesuaian negatif memindai batch SELURUH cabang dalam
-- urutan FIFO, sehingga barang rusak/hilang di satu cabang menggerus stok
-- cabang lain, dan catatan opname tidak bisa menyebut cabang mana yang
-- kehilangan barang. Baris lama dibiarkan NULL (tidak dapat direkonstruksi
-- dengan andal) dan diperlakukan sebagai "tanpa cabang" oleh kode.

ALTER TABLE "stock_adjustments" ADD COLUMN IF NOT EXISTS "outletId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stock_adjustments_outletId_fkey'
  ) THEN
    ALTER TABLE "stock_adjustments"
      ADD CONSTRAINT "stock_adjustments_outletId_fkey"
      FOREIGN KEY ("outletId") REFERENCES "outlets"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "stock_adjustments_outletId_idx"
  ON "stock_adjustments"("outletId");
