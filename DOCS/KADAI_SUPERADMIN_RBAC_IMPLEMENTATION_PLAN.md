# KADAI — Rencana Implementasi Role SUPER_ADMIN (v2)
## Platform Operator: Manajemen Akun OWNER & Manajemen Langganan Tenant

> **Status Dokumen:** DRAFT v2 — menunggu approval Kapten sebelum eksekusi
> **Target:** `ATIOSLab/KADAI` — branch `main` (commit `7521bb9`) → produksi `https://kadai.asia`
> **Working copy:** `C:\Users\K8Plus\Projects\kadai` (sudah ter-clone, sync `origin/main`, siap edit)
> **Disusun:** Keryx Offensive Security · 13 Nov 2026
> **Perubahan v2:** Fokus dipertajam ke 2 tanggung jawab inti — (1) mengelola **akun OWNER** (pemilik tenant) dan (2) mengelola **langganan** (subscription & invoice). Manajemen staf outlet tetap didelegasikan ke role ADMIN masing-masing tenant.

---

## 1. Definisi Peran SUPER_ADMIN (yang akan dibangun)

SUPER_ADMIN = **operator platform KADAI**. Dua kewenangan inti:

**A. Mengelola Akun OWNER (pemilik tenant)**
- Melihat daftar **semua akun owner** (`role = ADMIN`) lintas tenant/store.
- Membuat akun owner baru + tenant (store) barunya sekaligus (onboarding klien).
- Reset password, ubah nama/email, aktif/nonaktifkan akun owner.
- Menautkan akun owner ke tenant (store) tertentu.

**B. Mengelola Langganan (Subscription & Billing)**
- Melihat status langganan semua tenant: tier, cycle, status, tanggal mulai, **jatuh tempo (expiresAt)**, sisa hari.
- Ubah tier/cycle (upgrade/downgrade manual), perpanjang/perpendek masa aktif, ubah status (`ACTIVE/PAST_DUE/EXPIRED/CANCELLED`).
- Terbitkan invoice manual, tandai invoice **lunas** (aktifkan/perpanjang langganan otomatis), batalkan/refund invoice.
- Suspend/banned tenant (langganan dihentikan).

> Staf outlet (MANAGER/CASHIER/KITCHEN/INVENTORY/ACCOUNTANT) **tetap dikelola oleh ADMIN tenant** di `/settings` — superadmin tidak perlu menyentuh level ini kecuali audit.

---

## 2. Status Saat Ini (Hasil Audit Kode)

| Area | Fakta (dari kode aktual) |
|---|---|
| `enum UserRole` (`prisma/schema.prisma`) | `ADMIN, MANAGER, CASHIER, KITCHEN, INVENTORY, ACCOUNTANT` — **tidak ada SUPER_ADMIN** |
| `APP_ROLES` (`src/lib/rbac.ts`) | 6 role sama; `ADMIN_ONLY_ROLES = ["ADMIN"]` |
| Manajemen user | `/settings` → `GET/POST /api/users`, `PUT/DELETE /api/users/[id]` — semua gate `ADMIN_ONLY_ROLES` (flat, **tanpa** scoping tenant) |
| Scoping tenant | **TIDAK ADA**: `User.outletId → Outlet`; `Outlet` tidak punya `storeId`; `Store` = tenant tunggal global |
| **Modul langganan (SUDAH ADA, backend)** | `src/lib/billing-service.ts`: `createInvoice()` (nomor `INV-YYYYMM-####`), `settleInvoice()` (lunas → aktifkan/perpanjang `StoreSubscription` + atribusi komisi referral), `renewDueSubscriptions()` (auto tagihan jatuh tempo ≤3 hari) |
| API billing | `GET/POST /api/billing/invoices`, `/api/billing/invoices/[id]` — gate `ADMIN_ONLY_ROLES`, pesan "Hanya Super Admin" (teks saja) |
| Cron | `/api/cron/billing-referral` (renewals + payouts), proteksi `CRON_SECRET` |
| Model langganan | `StoreSubscription{storeId,tier,cycle,status,startedAt,expiresAt}`, `PaymentInvoice{storeId,subscriptionId,invoiceNumber,tier,cycle,amount,provider,status,paidAt,paidBy,...}`; enum: `SubscriptionTier{FREE,STARTER,PRO_BUSINESS,ENTERPRISE}`, `BillingCycle{MONTHLY,QUARTERLY,ANNUAL}`, `SubscriptionStatus{ACTIVE,PAST_DUE,CANCELLED,EXPIRED}`, `PaymentStatus{PENDING,SETTLED,FAILED,REFUNDED}` |
| **UI langganan** | **BELUM ADA halaman** — hanya API; `Store.tier` & `StoreSubscription.tier` (dua sumber, disinkronkan `settleInvoice`) |
| Harga | `src/lib/pricing.ts` → `cyclePrice()`, `TIER_LABELS`, `CYCLE_MONTHS` |
| Session | Cookie `session` HMAC-signed; payload `role` + `version`(updatedAt) → ubah role otomatis invalidasi sesi lama |
| Seed admin | `prisma/seed.js` → `admin@kadai.com` / `UserRole.ADMIN` (env `ADMIN_EMAIL`/`ADMIN_PASSWORD`) |

**Kesimpulan audit:** backend langganan (invoice/settle/renew) **sudah matang** dan bisa langsung di-reuse superadmin. Yang belum ada: role SUPER_ADMIN, scoping tenant, dan **UI/gerbang platform** untuk mengelola owner + langganan.

---

## 3. Tujuan & Ruang Lingkup

**Deliverable:**
1. Role `SUPER_ADMIN` masuk enum Prisma + `APP_ROLES` + session + guard.
2. `storeId` pada `User` & `Outlet` (tenant scoping) + backfill store tunggal existing.
3. **Manajemen Akun Owner**: API + UI `/platform/owners` (CRUD akun `role=ADMIN` lintas tenant + onboarding owner+tenant baru).
4. **Manajemen Langganan**: API + UI `/platform/subscriptions` (list tenant+langganan, ubah tier/cycle/status/expiry, terbitkan & lunasi invoice — reuse `billing-service`).
5. Dashboard platform `/platform` (KPI: tenant aktif, jatuh tempo, invoice pending, MRR).
6. Gerbang `billing`/`referrals`/`demo-requests` direklasifikasi ke SUPER_ADMIN.
7. Bootstrap akun superadmin pertama (seed env + script CLI).
8. Test, RBAC guide, dan blueprint di-update.

**Di luar lingkup (fase lanjutan):**
- Multi-tenant penuh (isolasi data transaksi/penjualan per tenant).
- Payment gateway otomatis (Midtrans/Xendit live) — settle tetap manual oleh superadmin.
- 2FA/device-binding superadmin.

---

## 4. Keputusan Desain

### Opsi A — Tambah SUPER_ADMIN di atas ADMIN (DIREKOMENDASIKAN)
7 role: `SUPER_ADMIN, ADMIN, MANAGER, CASHIER, KITCHEN, INVENTORY, ACCOUNTANT`. `ADMIN` tetap = owner tenant (tidak rename → zero breaking). SUPER_ADMIN mewarisi seluruh fitur ADMIN + akses platform.

### Opsi B — Rename penuh ke blueprint (`TENANT_OWNER`/`STORE_MANAGER`/…) — TIDAK direkomendasikan sekarang
Breaking di ~30+ file + remap data; tanpa nilai langsung untuk kebutuhan ini.

---

## 5. Target Arsitektur & Matriks Akses

```
LEVEL 1 — PLATFORM · SUPER_ADMIN
  ├─ Akun OWNER (role ADMIN) lintas tenant: create / list / edit / reset / (de)activate
  └─ LANGGANAN: tier, cycle, status, expiry, invoice, settle, suspend tenant
        │
LEVEL 2 — TENANT (STORE) · ADMIN (owner)
  ├─ Kelola staf outlet sendiri (MANAGER/CASHIER/KITCHEN/INVENTORY/ACCOUNTANT) via /settings
  └─ Operasional tenant (produk, keuangan, outlet, dll)
        │
LEVEL 3 — OUTLET · CASHIER / KITCHEN / INVENTORY
```

| Fitur / Aksi | SUPER_ADMIN | ADMIN (owner) | staf |
|---|---|---|---|
| Kelola **akun owner** lintas tenant (`/platform/owners`) ★ | ✅ | ❌ | ❌ |
| Onboarding **owner + tenant baru** ★ | ✅ | ❌ | ❌ |
| Kelola **langganan** tenant (`/platform/subscriptions`) ★ | ✅ | ❌ | ❌ |
| Terbitkan / lunasi / batalkan **invoice** ★ | ✅ | ❌ | ❌ |
| Suspend / banned tenant ★ | ✅ | ❌ | ❌ |
| Kelola staf dalam tenant sendiri (`/settings`) | ✅ | ✅ | ❌ |
| Operasional (POS/KDS/inventori/finance) | ✅ | ✅ | per matriks existing |
| Billing/referrals/demo-requests (reklasifikasi) | ✅ | ❌ (atau dual-access transisi) | ❌ |

---

## 6. Rencana Teknis per Fase (fokus owner + langganan)

### Fase 0 — Persiapan
- Working copy `C:\Users\K8Plus\Projects\kadai` (sudah clone/sync) → branch `feature/platform-superadmin`.
- Backup DB produksi sebelum migration; cek entrypoint Dokploy (`prisma migrate deploy` sebelum app start).

### Fase 1 — Schema Prisma & Migration
**File:** `prisma/schema.prisma`
```prisma
enum UserRole { SUPER_ADMIN  ADMIN  MANAGER  CASHIER  KITCHEN  INVENTORY  ACCOUNTANT }

model Store   { ... outlets Outlet[]  users User[] }
model Outlet  { ... storeId String?  store Store? @relation(...)  @@index([storeId]) }
model User    { ... storeId String?  store Store? @relation(...)  @@index([storeId]) }
```
**Migration (2 file terpisah):**
```sql
-- 01_enum.sql
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
-- 02_tenant_scoping.sql
ALTER TABLE "outlets" ADD COLUMN "storeId" TEXT;
ALTER TABLE "users"   ADD COLUMN "storeId" TEXT;
UPDATE "outlets" SET "storeId" = (SELECT id FROM "stores" ORDER BY "createdAt" LIMIT 1) WHERE "storeId" IS NULL;
UPDATE "users"   SET "storeId" = (SELECT id FROM "stores" ORDER BY "createdAt" LIMIT 1) WHERE "storeId" IS NULL;
ALTER TABLE "outlets" ADD CONSTRAINT "outlets_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "users"   ADD CONSTRAINT "users_storeId_fkey"   FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "outlets_storeId_idx" ON "outlets"("storeId");
CREATE INDEX "users_storeId_idx"   ON "users"("storeId");
```

### Fase 2 — Lapisan RBAC
**File:** `src/lib/rbac.ts`
```ts
export const APP_ROLES = ["SUPER_ADMIN","ADMIN","MANAGER","CASHIER","KITCHEN","INVENTORY","ACCOUNTANT"] as const;
export const SUPER_ADMIN_ROLES = ["SUPER_ADMIN"] as const;
export const ADMIN_ONLY_ROLES = ["SUPER_ADMIN","ADMIN"] as const;      // superadmin mewarisi fitur admin
export const PLATFORM_OR_OWNER_ROLES = ["SUPER_ADMIN","ADMIN"] as const;

// dashboardRouteRules — tambah:
{ path: "/platform",               roles: SUPER_ADMIN_ROLES },
{ path: "/platform/owners",        roles: SUPER_ADMIN_ROLES },
{ path: "/platform/subscriptions", roles: SUPER_ADMIN_ROLES },
{ path: "/platform/tenants",       roles: SUPER_ADMIN_ROLES },

// getDefaultPathForRole: case "SUPER_ADMIN": return "/platform";
```

### Fase 3 — Manajemen Akun OWNER (API + guard)
**File baru:** `src/app/api/platform/owners/route.ts` (GET list, POST create), `src/app/api/platform/owners/[id]/route.ts` (GET/PUT/DELETE)
- Gate: `SUPER_ADMIN_ROLES` (403 selain superadmin).
- `GET /api/platform/owners?storeId=` → daftar user `role=ADMIN` (join store: nama tenant, tier, status langganan, expiry). Select: `id,name,email,isActive,lastLoginAt,storeId,storeName,subscription{...}`.
- `POST` → **onboarding**: buat `Store` baru (opsional bila `storeId` kosong) + akun owner (`role=ADMIN`, bcrypt 12, `storeId`) + (opsional) `StoreSubscription` awal tier/cycle.
- `PUT` → ubah nama/email, **reset password**, aktif/nonaktif, pindah `storeId`.
- `DELETE` → soft delete (`isActive=false`).
- **Guard:** endpoint ini tidak boleh membuat/mengubah user `role=SUPER_ADMIN`; `last-superadmin protection` (SUPER_ADMIN aktif terakhir tak bisa dinonaktifkan/diturunkan); superadmin tak bisa menonaktifkan dirinya sendiri.
- `logActivity` (`OWNER_CREATED`, `OWNER_UPDATED`, `OWNER_DEACTIVATED`) + `storeId` di details.

**File:** `src/lib/validators/user.ts` → tambah `ownerCreateSchema` (name/email/password + store opsional: namaStore/businessType/tier/cycle) & izinkan `SUPER_ADMIN` pada enum (khusus API platform).

### Fase 4 — Manajemen LANGGANAN (API)
**File baru:** `src/app/api/platform/subscriptions/route.ts` (GET), `src/app/api/platform/subscriptions/[id]/route.ts` (GET/PUT)
- Gate: `SUPER_ADMIN_ROLES`.
- `GET` → semua tenant + `StoreSubscription` (tier, cycle, status, startedAt, expiresAt, hari tersisa) + ringkasan invoice (pending/settled) + `Store.tier`.
- `PUT` → aksi: `SET_TIER_CYCLE` (ubah tier/cycle → sinkron `Store.tier`), `SET_STATUS` (`ACTIVE/PAST_DUE/EXPIRED/CANCELLED`), `SET_EXPIRY` (perpanjang/perpendek/set tanggal), `SUSPEND_TENANT` (status CANCELLED + opsi nonaktifkan owner).
**File baru:** `src/app/api/platform/invoices/route.ts` (GET list + POST issue via `createInvoice()`), `src/app/api/platform/invoices/[id]/route.ts` (POST settle via `settleInvoice()`; PATCH cancel/refund)
- **Reuse `src/lib/billing-service.ts`** — `createInvoice`, `settleInvoice` (auto aktif/perpanjang langganan + atribusi komisi). Tidak menduplikasi logika uang.
- Semua aksi tercatat `ActivityLog` (+ `paidBy = superadmin email`).
- **Reklasifikasi:** `src/app/api/billing/invoices/**`, `referrals/**`, `demo-requests/**` → gate `SUPER_ADMIN_ROLES` (atau `PLATFORM_OR_OWNER_ROLES` transisi).

### Fase 5 — UI Platform + Navigasi
**File:** `src/components/layout/navigation.ts` — section **"Platform KADAI"** (`roles:["SUPER_ADMIN"]`):
- `/platform` → Dashboard Platform
- `/platform/owners` → Akun Owner (Tenant)
- `/platform/subscriptions` → Langganan & Invoice

**File baru:**
- `src/app/(dashboard)/platform/page.tsx` — KPI: tenant aktif, langganan **jatuh tempo ≤30 hari**, invoice pending, MRR (Σ harga langganan aktif, pakai `pricing.ts`).
- `src/app/(dashboard)/platform/owners/page.tsx` — tabel akun owner lintas tenant (filter store, status), tombol **Tambah Owner** (wizard: data owner + tenant + langganan awal), edit/reset password/aktif-nonaktif.
- `src/app/(dashboard)/platform/subscriptions/page.tsx` — tabel tenant + kolom tier/status/expiry/hari tersisa + invoice; aksi ubah tier/cycle/status/expiry, **Terbitkan Invoice**, **Tandai Lunas**, Suspend.
- Komponen bersama: `src/components/platform/owner-dialog.tsx`, `subscription-dialog.tsx`, `invoice-dialog.tsx`.

### Fase 6 — Session & Route Guard
- `src/app/api/auth/login/route.ts` (+ `/api/auth/session/route.ts`): tambah `storeId`/`storeName` ke `sessionData`.
- `src/lib/session.ts`: tambah `storeId`/`storeName` optional pada `sessionUserSchema`.
- `src/proxy.ts`: `/platform/*` otomatis ter-proteksi via `dashboardRouteRules` (bukan `publicPages`).

### Fase 7 — Bootstrap Akun Superadmin Pertama
- `prisma/seed.js`: `ensureSuperAdmin()` dari env `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD` / `SUPERADMIN_NAME` (default `superadmin@kadai.com`).
- **File baru:** `scripts/create-superadmin.ts` — CLI produksi (tanpa full seed):
  ```bash
  npx tsx scripts/create-superadmin.ts --email superadmin@kadai.com --password '<rahasiakan>'
  ```
- Env Dokploy: `SUPERADMIN_EMAIL`/`SUPERADMIN_PASSWORD` (nonaktifkan setelah bootstrap) atau jalankan script di VPS.

### Fase 8 — Test & Dokumentasi
- `tests/security.test.ts`: anti-eskalasi (admin/owner tak bisa promote ke SUPER_ADMIN), superadmin CRUD owner lintas tenant, last-superadmin protection, superadmin ubah langganan & settle invoice.
- `tests/referral-billing.test.ts`: verifikasi alur invoice→settle tetap utuh.
- `KADAI_RBAC_TEST_GUIDE.md` → matriks 7 role + skenario uji platform.
- `DOCS/KADAI_SAAS_RBAC_BLUEPRINT.md` → status SUPER_ADMIN **implemented**.

---

## 7. Keamanan & Anti-Eskalasi
1. Hanya SUPER_ADMIN dapat menetapkan/mengubah role SUPER_ADMIN.
2. Non-superadmin dilarang mengedit/menonaktifkan user SUPER_ADMIN (403/404 server-side).
3. **Last-superadmin guard**: SUPER_ADMIN aktif terakhir tidak bisa diturunkan/dinonaktifkan.
4. Session invalidation otomatis saat role berubah (via `version`=updatedAt pada HMAC cookie).
5. Semua aksi platform (owner, langganan, invoice, suspend) masuk `ActivityLog` dengan identitas superadmin.
6. Scoping server-authoritative: filter `storeId` di query Prisma, bukan sekadar sembunyikan UI.

---

## 8. Test Plan (ringkas)
T1 owner login → tidak lihat Platform · T2 ADMIN akses `/platform/owners` → 403 · T3 superadmin CRUD akun owner lintas tenant ✅ · T4 ADMIN promote role SUPER_ADMIN → ditolak · T5 SUPER_ADMIN terakhir dinonaktifkan → ditolak · T6 superadmin ubah tier langganan → `StoreSubscription` + `Store.tier` sinkron · T7 terbitkan invoice → PENDING, nomor `INV-YYYYMM-####` · T8 tandai lunas → subscription aktif/perpanjang + komisi referral teratribusi · T9 suspend tenant → status CANCELLED · T10 `npm run test:security` & `npm run build` hijau · T11 deploy Dokploy + migrate sukses.

---

## 9. Risiko & Mitigasi
| Risiko | Mitigasi |
|---|---|
| `ALTER TYPE ADD VALUE` + DML nilai baru dalam 1 transaksi → error Postgres | Split 2 migration; backfill tak menyentuh `SUPER_ADMIN` |
| `Store.tier` vs `StoreSubscription.tier` tidak sinkron | Semua perubahan tier lewat `billing-service`/satu helper yang update keduanya |
| Owner kehilangan akses billing bila dipindah total | Opsi dual-access `PLATFORM_OR_OWNER_ROLES` transisi |
| Enum value tak bisa di-drop (rollback parsial) | Migrasi maju-only; kode lama tetap kompatibel |
| Prisma client tidak regenerate | `postinstall: prisma generate`; jalankan eksplisit sebelum build |
| Deploy tanpa migration → runtime error kolom hilang | Verifikasi entrypoint `prisma migrate deploy` sebelum `next start` |

## 10. Rollback
Revert commit → deploy versi lama (kompatibel). Enum `SUPER_ADMIN` tak bisa dihapus (harmless). Kolom `storeId` dapat di-drop bila perlu. Akun superadmin dinonaktifkan via DB.

## 11. Urutan & Estimasi
| Fase | Estimasi |
|---|---|
| F0 branch + backup DB | 30 mnt |
| F1 schema + migration | 1 jam |
| F2 rbac.ts | 30 mnt |
| F3 API owners | 1.5 jam |
| F4 API subscriptions/invoices | 1.5 jam |
| F5 UI /platform (3 halaman + dialog) | 2.5 jam |
| F6 session/proxy | 45 mnt |
| F7 seed + script bootstrap | 45 mnt |
| F8 test + docs | 1 jam |
| F9 deploy + verifikasi | 30 mnt |

**Total ±10 jam kerja agent, 1 siklus deploy.**

## 12. Keputusan yang Dibutuhkan dari Kapten
1. **Model role:** Opsi A (tambah SUPER_ADMIN, ADMIN tetap owner — **rekomendasi**) atau Opsi B (rename penuh)?
2. **Buat owner + tenant sekaligus?** Ketika superadmin menambah akun owner, sistem sekaligus membuat `Store` + langganan awal (**rekomendasi ya**) atau hanya akun owner saja?
3. **Kelola staf outlet:** superadmin **hanya** kelola akun owner (**rekomendasi**), atau sekalian bisa kelola semua staf lintas tenant?
4. **Fitur platform** (billing/referrals/demo): pindah total ke SUPER_ADMIN, atau dual-access transisi?
5. **Bootstrap akun pertama:** env seed Dokploy atau script CLI di VPS?
6. **Eksekusi:** langsung semua fase, atau bertahap per-fase dengan checkpoint?
