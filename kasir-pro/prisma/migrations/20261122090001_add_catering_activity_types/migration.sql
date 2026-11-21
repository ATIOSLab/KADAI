-- Nilai enum ActionType baru untuk jejak aktivitas booking catering.
-- File ini sengaja TIDAK memakai nilai baru itu pada tabel apa pun: PostgreSQL
-- melarang pemakaian nilai enum yang baru ditambahkan di transaksi yang sama
-- dengan ADD VALUE, jadi penambahan dipisah dari pemakaiannya.
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'CATERING_PAYMENT_RECORDED';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'CATERING_STATUS_CHANGED';
