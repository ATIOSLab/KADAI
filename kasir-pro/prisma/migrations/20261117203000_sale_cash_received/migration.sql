-- Uang tunai yang diserahkan tamu & kembaliannya ikut disimpan pada transaksi.
-- Nullable: transaksi lama (dan pembayaran non-tunai) memang tidak punya angka ini.
ALTER TABLE "sales" ADD COLUMN "paidAmount" DECIMAL(15, 2);
ALTER TABLE "sales" ADD COLUMN "changeAmount" DECIMAL(15, 2);
