-- Jejak audit untuk menonaktifkan data induk (pemasok, pelanggan, cabang,
-- satuan). Sebelumnya keempat entitas ini bisa dibuat dan diubah tetapi tidak
-- pernah bisa dihapus/nonaktif, dan tidak ada satu pun aksi yang tercatat saat
-- data induk berhenti dipakai.
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'SUPPLIER_ACTIVATED';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'SUPPLIER_DEACTIVATED';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'CUSTOMER_ACTIVATED';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'CUSTOMER_DEACTIVATED';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'OUTLET_ACTIVATED';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'OUTLET_DEACTIVATED';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'UNIT_UPDATED';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'UNIT_DELETED';
