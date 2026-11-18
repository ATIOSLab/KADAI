-- Laporan laci yang dibuka/dicetak ulang setelah ditutup harus meninggalkan
-- jejak siapa dan kapan: kertas Z-Report bisa berpindah tangan.
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'SHIFT_REPORT_REPRINTED';
