-- Add LAUNDRY as its own business vertical (laundry & dry-cleaning).
-- SERVICE now covers barbershop/salon/bengkel/jasa lain without the laundry module.
-- ALTER TYPE ... ADD VALUE is non-transactional on older PostgreSQL; keep the
-- DDL pragma so Prisma migrate deploy applies it outside a transaction block.
-- disable_ddl_transaction

ALTER TYPE "BusinessType" ADD VALUE 'LAUNDRY';
