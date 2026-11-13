-- Tenant scoping: relasi Store -> Outlet & Store -> User.
-- Memungkinkan SUPER_ADMIN mengelola akun OWNER (role ADMIN) lintas tenant
-- dan memisahkan data per-tenant. Kolom nullable + backfill ke store tunggal
-- yang sudah ada (model saat ini single-tenant) — tidak destruktif.

ALTER TABLE "outlets" ADD COLUMN "storeId" TEXT;
ALTER TABLE "users"   ADD COLUMN "storeId" TEXT;

-- Backfill: tautkan seluruh outlet & user existing ke store pertama (tenant tunggal saat ini).
UPDATE "outlets"
   SET "storeId" = (SELECT id FROM "stores" ORDER BY "createdAt" ASC LIMIT 1)
 WHERE "storeId" IS NULL;

UPDATE "users"
   SET "storeId" = (SELECT id FROM "stores" ORDER BY "createdAt" ASC LIMIT 1)
 WHERE "storeId" IS NULL;

-- Foreign keys (SetNull agar menghapus tenant tidak menghapus user secara destruktif).
ALTER TABLE "outlets"
  ADD CONSTRAINT "outlets_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "users"
  ADD CONSTRAINT "users_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "outlets_storeId_idx" ON "outlets"("storeId");
CREATE INDEX "users_storeId_idx"   ON "users"("storeId");
