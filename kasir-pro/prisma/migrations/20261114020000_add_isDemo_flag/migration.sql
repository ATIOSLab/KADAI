-- Penanda data demonstrasi (isDemo) pada model yang tercemar demo-seeder.
-- Data demo disembunyikan dari modul platform (super admin) agar hanya data asli yang tampil.

ALTER TABLE "users"      ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "stores"     ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "categories" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "outlets"    ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products"   ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;
