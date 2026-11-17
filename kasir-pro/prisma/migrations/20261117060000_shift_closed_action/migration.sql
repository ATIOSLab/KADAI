-- Aksi audit untuk penutupan shift kasir (Z-Report).
-- Sebelumnya POST /api/pos/shift-summary mencatat penutupan shift sebagai
-- SALE_CREATED ("Transaksi Dibuat"), sehingga riwayat aktivitas melaporkan
-- penjualan yang tidak pernah terjadi sementara penutupan kas tidak terlacak.
--
-- ALTER TYPE ... ADD VALUE sengaja berdiri sendiri: Postgres melarang nilai enum
-- baru dipakai dalam transaksi yang sama dengan penambahannya.

ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'SHIFT_CLOSED';
