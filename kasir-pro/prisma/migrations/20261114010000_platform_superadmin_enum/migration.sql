-- AlterEnum: tambah role SUPER_ADMIN (operator platform).
-- Dijalankan terpisah dari DML apa pun yang memakai nilai baru (syarat Postgres).
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

-- AlterEnum: tambah action type khusus aksi platform (audit trail Super Admin).
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'OWNER_CREATED';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'OWNER_UPDATED';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'OWNER_DEACTIVATED';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_UPDATED';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'TENANT_SUSPENDED';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'INVOICE_ISSUED';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'INVOICE_SETTLED';
