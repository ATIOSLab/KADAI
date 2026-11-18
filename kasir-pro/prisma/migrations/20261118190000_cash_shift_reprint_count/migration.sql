-- Kertas Z-Report yang sudah beredar harus bisa dilacak: berapa kali laporan
-- laci ini dibuka/dicetak ulang setelah ditutup. Tanpa ini, tidak ada cara
-- membedakan kertas cetakan pertama dengan cetakan ke-N yang isinya sudah
-- berubah karena koreksi susulan.
ALTER TABLE "cash_shifts"
  ADD COLUMN "reprintCount" INTEGER NOT NULL DEFAULT 0;
