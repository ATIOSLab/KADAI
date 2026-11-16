# KADAI — Blueprint Isolasi Tenant (Tenant Scoping Remediation)

> **Status:** ✅ **DIEKSEKUSI & LIVE DI PRODUKSI** (16 Nov 2026, commit `c38537d` + `cd7f2b5`) — lihat §6.
> **Status (historis):** AUDIT SELESAI · IMPLEMENTASI MENUNGGU APPROVAL KAPTEN
> Trigger: Kapten menemukan katalog produk klien lain bercampur di akun BOSS DIMSUM (`/products`).
> Audit unit: Keryx Offensive Security (KADAI Ops) — 2026-11-16

---

## 1. Bukti Kebocoran (Live, terverifikasi)

Login sebagai owner BOSS DIMSUM (`bossdimsum@kadai.asia`) ke `https://kadai.asia`:

| Endpoint | Hasil untuk tenant Boss Dimsum |
|---|---|
| `GET /api/products?limit=100` | **80 produk** milik tenant lain: alat kesehatan (Masker, Omron, Betadine), material bangunan (Besi Beton, Pipa PVC, Semen), laundry, barber, cafe, warung — semua `isDemo=true` |
| `GET /api/categories` | **48 kategori** milik tenant lain (semuanya `isDemo=true`) |

Menu Boss Dimsum sendiri **belum pernah di-seed** → 100% yang tampak adalah data tenant lain. Ini bukan sekadar tampilan: `POST /api/products` juga tidak ter-scope, jadi produk tenant A dan B hidup di satu kolam global.

## 2. Akar Masalah (Arsitektur)

Pola scoping yang sudah benar di KADAI: kolom `storeId` (nullable) + `resolveTenantScope(sessionUser)` + `where: { storeId }` pada setiap query/create. Pola ini **baru diterapkan di 4 route**: `/api/outlets`, `/api/users`, `/api/users/[id]`, `/api/activity-log`.

**Hasil audit 34 model (skema) — mana yang punya jalur tenant, mana yang tidak:**

**✔ Sudah ter-scope (punya kunci langsung):**
- `Store` (root), `StoreSubscription` (storeId), `PaymentInvoice` (storeId), `Outlet` (storeId), `User` (storeId/outletId)

**◐ Ter-scope tidak langsung (via `outletId` → Outlet.storeId atau `saleId`/`productId`):**
- `Sale` (outletId), `ProductBatch` (outletId), `RestaurantTable` (outletId), `LaundryJobOrder` (outletId), `KDSOrder` (saleId), `SaleItem`/`SaleItemBatch` (saleId), `StockTransfer`/`StockTransferItem` (source/destination outlet), `RecipeItem` (productId)

**✘ GLOBAL — tidak punya kunci tenant sama sekali (kebocoran):**
| Model | Dampak |
|---|---|
| **`Category`** | Katalog kategori bercampur lintas tenant; `name @unique` **global** |
| **`Product`** | Katalog produk bercampur; `sku @unique` + `barcode @unique` **global** |
| **`Customer`** | **Data pribadi pelanggan lintas tenant** (nama/telepon/alamat/poin); `phone @unique` **global** → telepon pelanggan tenant A memblokir pendaftaran di tenant B |
| **`Supplier`** | Daftar supplier lintas tenant |
| `Unit` | Satuan (`name`/`normalizedName` @unique global) |
| `FinanceCategory` | Kategori keuangan lintas tenant |
| **`FinanceEntry`** | **Seluruh arus kas/keuangan lintas tenant** (transitive path tersedia: sale→outlet, productBatch→outlet, createdByUser→store) |
| `StockAdjustment` | Penyesuaian stok (hanya `userId`) |

**Route tanpa tenant scoping (19 dari 69 file route menyentuh model global):**
`products` (route, [id], [id]/recipe, [id]/produce, generate-sku, import-batch), `categories` (route, [id]), `units`, `customers`, `suppliers`, `finance` (route, [id], categories, categories/[id]), `inventory` (+ adjustment), `batches`, `sales` (route, [id], [id]/void), `order`, `kds`, `reports`, `dashboard` (summary, overview), `uploads/products`.

## 3. Rencana Perbaikan

### 3.1 Perubahan Skema (migrasi Prisma)

Tambah `storeId String?` + FK `Store` (`onDelete: SetNull`) + `@@index([storeId])` pada **8 model**:
`Category`, `Product`, `Unit`, `Supplier`, `Customer`, `FinanceCategory`, `FinanceEntry`, `StockAdjustment`.

Pelunakan unique constraint global → per-tenant:
| Saat ini | Usulan | Alasan |
|---|---|---|
| `Category.name @unique` | `@@unique([storeId, name])` | Nama kategori boleh sama antar tenant |
| `Unit.name`/`normalizedName @unique` | `@@unique([storeId, normalizedName])` | Satuan custom per tenant |
| `Customer.phone @unique` | `@@unique([storeId, phone])` | Telepon pelanggan tidak boleh lintas tenant |
| `Product.sku @unique` | `@@unique([storeId, sku])` | Kode SKU per tenant |
| `Product.barcode @unique` | **tetap global** (rekomendasi) | Barcode fisik unik se-Indonesia; aman dibiarkan |

Model transaksi (`Sale`, `KDSOrder`, `ProductBatch`, `StockTransfer`, transaksi lain) **tidak perlu kolom baru** — cukup difilter lewat relasi/outlet milik tenant. (Alternatif denormalisasi `storeId` di `Sale` lebih cepat untuk laporan besar, tapi menambah migrasi — rekomendasi: **tidak perlu sekarang**.)

### 3.2 Strategi Backfill Data

- Baris **demo** (`isDemo=true`) → `storeId` dibiarkan **NULL** = "legacy/shared demo". Query tenant memakai `storeId = <tenant>` yang otomatis **mengecualikan NULL** → data demo hilang dari POS tenant tanpa perlu hapus. Platform/superadmin tetap melihat semuanya.
- Baris milik tenant nyata (saat ini tenant KADAI belum punya data katalog nyata) → `storeId` diisi store-nya lewat backfill berbasis relasi (`sale→outlet→store`, `productBatch→outlet→store`, `createdByUser→store`).
- Dua file migrasi (mengikuti konvensi repo): `..._tenant_scoping_catalog` (skema) + `..._backfill_tenant_scoping` (data).

### 3.3 Perubahan Route/API

Semua route tenant: tambah `resolveTenantScope(sessionUser)` → `storeId` di `where` + saat `create`. Untuk model transaksi: filter via `outlet: { storeId }` atau pre-resolve daftar `outletId` tenant.
Khusus `uploads/products`, `products/[id]/produce`, `products/[id]/recipe`: validasi bahwa `productId` yang diakses memang milik tenant (anti-IDOR).
`/api/public/plans` & route referal/demo-request bersifat platform/publik → tidak diubah.

### 3.4 UI & POS

- POS `product-search` memakai `/api/products` → otomatis bersih setelah route di-scope.
- Halaman tenant (products, categories, customers, finance, inventory, reports) otomatis ikut bersih.
- Platform (superadmin) tetap melihat semua data + filter `isDemo`.

### 3.5 Testing & Verifikasi

1. Unit/integration: tambah `tests/tenant-isolation.test.ts` (tenant A tidak bisa GET/PUT/DELETE entitas tenant B; create otomatis terisi storeId A).
2. Verifikasi live (resep skill): mint session cookie per peran di dalam container → assert:
   - owner BOSS DIMSUM: `/api/products` = **0** (sebelum seed menu), `/api/customers` = 0, `/api/finance` = 0, `/api/sales` = 0
   - owner BOSS DIMSUM: `PUT /api/products/<id milik tenant lain>` → **404/403**
   - admin KADAI: data demo tetap tidak muncul; superadmin `/api/platform/*` tetap 200
3. Backup `pg_dump` sebelum deploy (resep skill), deploy via `compose.deploy`, verifikasi container uptime reset.

## 4. Urutan Eksekusi (bertahap, bisa berhenti di tiap fase)

| Fase | Cakupan | Hasil | Estimasi |
|---|---|---|---|
| **1** | `Category` + `Product` (+ resep/produce/upload routes) + filter demo di UI tenant | **Membuka blokir seed menu BOSS DIMSUM** | ~2 jam |
| **2** | `Customer` + `Supplier` + `Unit` | Isolasi data pribadi & master data | ~1,5 jam |
| **3** | `FinanceCategory` + `FinanceEntry` + `StockAdjustment` + `inventory`/`batches` | Isolasi keuangan & stok | ~2 jam |
| **4** | `Sale`, `order`, `KDS`, `reports`, `dashboard`, laundry | Isolasi transaksi & laporan | ~2 jam |

Setelah Fase 1 selesai → langsung seed menu BOSS DIMSUM (Dimsum Kukus/Mentai/Cake + BOM) sesuai blueprint tenant.

## 5. Keputusan yang Dibutuhkan Kapten

1. **Approve pelaksanaan?** (Fase 1 saja dulu — *rekomendasi* — atau 1-4 sekaligus)
2. **Unique constraint:** setujui pelunakan ke per-tenant (poin 3.1)? *Rekomendasi: ya*, kecuali `barcode` tetap global.
3. **Baris demo:** biarkan `storeId = NULL` dan tidak muncul di tenant (*rekomendasi*), atau sekalian dibersihkan dari DB?
4. **Denormalisasi `Sale.storeId`:** tambah sekarang untuk performa laporan, atau cukup filter relasi? *Rekomendasi: cukup filter relasi dulu.*
5. **Deploy:** langsung ke produksi setelah lulus tes + backup, atau tunggu jendela tertentu?

---

## 6. Status Eksekusi — 16 Nov 2026 (Keryx Offensive Security)

**Hasil: Fase 1–4 dieksekusi sekaligus, live di `kadai.asia`.**

Keputusan yang dipakai (default, karena Kapten memberi lampu hijau eksekusi):
unique dilunakkan per-tenant · baris demo tetap ada dengan `storeId` diisi ke store demo
per klaster · `Sale.storeId` tidak didenormalisasi · deploy langsung setelah tes + backup.

### 6.1 Yang berubah
- `prisma/schema.prisma`: 8 model (`Category`, `Product`, `Customer`, `Supplier`, `Unit`,
  `FinanceCategory`, `FinanceEntry`, `StockAdjustment`) menerima `storeId` (nullable, FK
  `ON DELETE SET NULL`) + reverse relation di `Store`; unique global → per-tenant.
- Migrasi: `20261116160000_tenant_scoping_catalog` (DDL), `20261116160100_backfill_tenant_scoping`
  (isi `storeId` dari relasi `sale → outlet`, `product_batch → outlet`, `createdByUser → store`),
  `20261116170000_product_barcode_per_tenant` (barcode per-tenant).
- 29 route API di-scope via `resolveTenantScope` + validasi kepemilikan (produk, kategori,
  outlet, meja); endpoint publik `/api/order` mengambil store dari meja QR.
- `src/lib/dashboard.ts`, `reporting.ts`, `plan-limits.ts` menerima `storeId` (dashboard,
  laporan, kuota plan kini per tenant).
- Seeder (`seed-demo-clusters.js`, `seed.js`, `simulate-transactions.js`, `demo-seeder.ts`):
  satu store demo per klaster, klaim baris legacy per tenant, `ensureUnits()` idempoten.

### 6.2 Deviasi dari keputusan awal (beserta alasan)
1. **`Product.barcode` jadi unik PER TENANT** (bukan global). Deploy pertama gagal
   (`P2002 barcode`) karena baris demo lama memegang barcode yang sama dengan katalog
   klaster baru; secara bisnis dua tenant memang sah menjual barang fisik ber-EAN sama.
   Barcode tidak dipakai sebagai kunci lookup server (hanya kolom pencarian teks).
2. **Klaim SKU di seeder dibatasi tenant** (`sku` + `storeId` tenant / baris legacy NULL).
   `findFirst({ sku })` tanpa scope bisa "mencuri" produk tenant lain.
3. `finance_categories.systemKey` **tetap unique GLOBAL** (kategori sistem platform:
   SALE_INCOME dll dipakai semua tenant).
4. Assertion tes `tests/api-hardening.test.ts` untuk endpoint void diperketat
   (guard atomik `isVoided: false` **plus** `outlet: { storeId: scope.storeId }`).

### 6.3 Bukti verifikasi (produksi, pasca-deploy)
| Uji | Hasil |
|---|---|
| `GET /api/products` owner BOSS DIMSUM | **200 · 0 baris** (sebelumnya 80 produk tenant lain) |
| `GET /api/categories` owner BOSS DIMSUM | **200 · 0 baris** (sebelumnya 48 kategori) |
| `GET /api/products` tenant demo Apotek | **200 · 7 baris** (katalog miliknya sendiri) |
| Cross-tenant: Boss Dimsum → produk Apotek / TB Surya | **404** "Produk tidak ditemukan" |
| Cross-tenant: Apotek → produk TB Surya | **404**; → produknya sendiri **200** |
| Superadmin → `GET /api/products` | **403** "Super Admin tidak mengoperasikan tenant" |
| Superadmin → `GET /api/platform/owners` | **200 · 11 owner** |
| SQL: katalog per tenant | 9 store demo masing-masing 3–10 produk; **BOSS DIMSUM 0/0**, 5 outlet |
| SQL: index unik | `products_storeId_barcode_key`, `products_storeId_sku_key`,
  `categories_storeId_name_key`, `units_storeId_normalizedName_key`,
  `customers_storeId_phone_key`, `finance_categories_storeId_name_direction_key`,
  `finance_categories_systemKey_key` (global) |
| `npm run test:security` | **44/44 lolos** — termasuk `tests/tenant-isolation.test.ts` (7 kasus isolasi, §3.5); `tsc --noEmit` bersih |

Migrasi diuji lebih dulu sebagai **dry-run transaksional pada DB produksi**
(`BEGIN … ROLLBACK` via `postgres:16-alpine` di `dokploy-network`) sebelum deploy.

### 6.4 Sisa pekerjaan
- **Seed menu BOSS DIMSUM** (Dimsum Kukus/Mentai/Cake + BOM dapur pusat) — blokir sudah
  terbuka, menunggu daftar/harga final Kapten.
- 46 produk / 13 kategori baris **demo legacy** ber-`storeId NULL` (sisa seeder versi lama,
  mis. `DIM-*`, `RAW-*`) dibiarkan dan tidak tampil di tenant mana pun (scope STRICT).
  Bisa dibersihkan jika Kapten memutuskan.
- Backup pra-deploy: `$HOME/kadai_backup_20261116_152848.sql.gz` (prod).

