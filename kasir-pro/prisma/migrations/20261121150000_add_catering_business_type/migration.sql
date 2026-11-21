-- Tipe usaha baru: CATERING (katering & event).
-- Aditif; tidak mengubah nilai existing. Berlaku bersama prisma migrate deploy.
ALTER TYPE "BusinessType" ADD VALUE 'CATERING';
