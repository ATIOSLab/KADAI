-- Laporan Z yang sudah dicetak tidak boleh berubah diam-diam. Bila transaksi di
-- laci yang sudah ditutup dibatalkan (koreksi susulan), laci itu ditandai agar
-- selisih antara kertas Z-Report dan buku terlihat saat audit.
ALTER TABLE "cash_shifts"
  ADD COLUMN "lateVoidCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastLateVoidAt" TIMESTAMP(3);