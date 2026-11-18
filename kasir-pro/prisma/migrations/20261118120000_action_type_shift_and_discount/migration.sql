-- Aksi audit baru: buka shift (modal awal masuk laci) dan diskon manual yang
-- diberikan pada sebuah transaksi. Tanpa dua nilai ini, riwayat aktivitas tidak
-- bisa membedakan "penjualan" dari "laci dibuka" maupun "harga digeser kasir".
--
-- ALTER TYPE ... ADD VALUE sengaja berdiri di migrasi terpisah: Postgres
-- melarang nilai enum baru dipakai dalam transaksi yang sama dengan
-- penambahannya, dan Prisma membungkus tiap migrasi dalam satu transaksi.

ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'SHIFT_OPENED';

ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'SALE_DISCOUNTED';