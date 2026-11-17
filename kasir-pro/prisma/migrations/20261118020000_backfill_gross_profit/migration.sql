-- Definisi laba kotor sempat bergeser tiga kali: awalnya subtotal - HPP,
-- lalu subtotal + service charge - HPP, dan sekarang yang dijamin kode serta
-- tes: total - pajak - HPP (termasuk service charge dan pembulatan).
-- Akibatnya laporan bulan-bulan sebelumnya memakai definisi berbeda dan
-- perbandingan bulan ke bulan meleset sampai ribuan rupiah tanpa penjelasan.
-- Baris lama disamakan ke definisi yang berlaku sekarang.
UPDATE "sales"
SET "grossProfit" = "totalAmount" - "taxAmount" - "totalCost",
    "updatedAt" = now()
WHERE abs("grossProfit" - ("totalAmount" - "taxAmount" - "totalCost")) > 0.005;
