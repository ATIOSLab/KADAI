-- Enum FinanceSource dipisah dari perubahan tabel: nilai enum baru tidak boleh
-- dipakai dalam transaksi yang sama dengan pernyataan yang menambahkannya.
ALTER TYPE "FinanceSource" ADD VALUE IF NOT EXISTS 'SHIFT_VARIANCE';