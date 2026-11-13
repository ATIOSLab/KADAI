-- Backfill isDemo=true untuk seluruh data hasil demo-seeder (audit 14 Nov 2026):
--  - users: pola email <peran>.<klaster>@kadai.(com|asia) ATAU nama ber-" (Peran) ",
--    kecuali akun asli admin@kadai.com & superadmin@kadai.asia.
--  - outlets/categories/products: 100% hasil seeding (diverifikasi via timestamp &
--    marker deskripsi "Kategori ... untuk ..." / "Katalog demo untuk ...").
--  - stores: tenant asli "KADAI" DIKECUALIKAN (isDemo tetap false).

UPDATE "users" SET "isDemo" = true
WHERE "email" NOT IN ('admin@kadai.com', 'superadmin@kadai.asia')
  AND (
    "email" ~* '^[a-z]+\.[a-z]+@kadai\.(com|asia)$'
    OR "name" ~ '\([^)]+\)'
  );

UPDATE "outlets" SET "isDemo" = true;
UPDATE "categories" SET "isDemo" = true;
UPDATE "products" SET "isDemo" = true;
