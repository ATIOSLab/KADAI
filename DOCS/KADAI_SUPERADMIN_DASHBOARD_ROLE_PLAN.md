# KADAI — Plan: Pemisahan Role Platform vs Tenant, Dashboard Super Admin, & Standarisasi Komponen

**Versi:** 2.0.0 (revisi sesuai arahan Kapten)
**Tanggal:** 14 November 2026
**Penyusun:** Keryx Offensive Security (audit kode, bukan asumsi)
**Ruang lingkup kode:** `ATIOSLab/KADAI` → `kasir-pro/`
**Status:** DIIMPLEMENTASIKAN

> **Revisi 2.0.0 — arahan Kapten (menggantikan rencana billing di v1.0.0):**
> SUPER_ADMIN **tidak lagi mengurusi tenant/langganan/invoice**. Fokusnya mengelola
> **akun OWNER (role ADMIN)**. Detail owner menampilkan **jumlah tenant** yang dikelolanya.
> Modul Langganan & Invoice dihapus dari navigasi superadmin (halaman & API tetap ada,
> dormant, bisa diaktifkan kembali bila billing platform diperlukan).

---

## 1. Prinsip Model Peran (sesuai arahan Kapten)

```
SUPER_ADMIN  → operator platform: mengelola AKUN ADMIN (owner tenant) & langganan
ADMIN        → owner tenant: mengelola seluruh operasional tokonya (MANAGER ke bawah)
MANAGER/CASHIER/KITCHEN/INVENTORY/ACCOUNTANT → staf tenant, di bawah ADMIN
```

Konsekuensi desain: **SUPER_ADMIN berdiri DI ATAS tenant, bukan bagian dari tenant.**
Ia tidak mengoperasikan POS/kasir/stok; tugasnya mengelola admin & langganan.

---

## 2. Hasil Audit Kode (14 Nov 2026)

### 2.1 Yang SUDAH benar

| # | Temuan | Bukti |
|---|--------|-------|
| 1 | Dashboard platform beda konten dari dashboard admin | `platform/page.tsx` (KPI SaaS: tenant, langganan, invoice, MRR) vs `dashboard/page.tsx` (revenue, HPP, kategori, jam) |
| 2 | Sidebar superadmin tidak menampilkan menu tenant | `navigation.ts`: item `/dashboard` roles `["ADMIN","MANAGER"]`; POS/Produk/Stok/dll tanpa SUPER_ADMIN |
| 3 | Bottom tab superadmin khusus platform | `getBottomTabsForRole("SUPER_ADMIN")` → 3 item section Platform |
| 4 | Meta halaman platform lengkap | `pageMetaMap["/platform*"]` terisi (title/description/section/eyebrow) |
| 5 | Komponen dasar tersedia seragam | `components/ui/*` (card, badge, button, skeleton, select, dialog, table) + `components/shared/*` (PageHeader, StatCard, EmptyState, CurrencyDisplay) |

### 2.2 Cacat LOGIKA peran (perlu diperbaiki)

| # | Temuan | Dampak |
|---|--------|--------|
| L1 | **SUPER_ADMIN masih mewarisi seluruh gerbang tenant.** `ADMIN_ONLY_ROLES`, `ADMIN_MANAGER_ROLES`, `POS_ROLES`, `KDS_ROLES`, `INVENTORY_ROLES`, `FINANCE_ROLES` semuanya memuat `SUPER_ADMIN` | Sidebar menyembunyikan menu tenant, tapi URL langsung (`/dashboard`, `/settings`, `/pos`, `/finance`) tetap TEMBUS. Dua kebijakan berbeda untuk satu role |
| L2 | **Tidak ada isolasi tenant di API.** `/api/users`, `/api/users/[id]`, `/api/outlets`, `/api/products`, `/api/dashboard/summary` hanya cek role, TANPA filter `storeId` | Saat tenant ke-2 onboard, ADMIN tenant A melihat & dapat mengubah data tenant B (kebocoran lintas tenant) |
| L3 | **SUPER_ADMIN punya `storeId = NULL`** tetapi tetap boleh memanggil API tenant (tanpa filter → membaca seluruh data semua tenant) | Akses tanpa lingkup & tanpa jejak; bertentangan dengan "superadmin mengelola admin" |
| L4 | **`/settings` untuk SUPER_ADMIN tidak bermakna** (form konfigurasi toko + daftar staf), sementara `storeId` NULL membuat target update ambigu | Superadmin bisa mengubah data tenant tanpa niat/jejak yang jelas |
| L5 | **Navbar ≠ rbac.** `navbar.tsx`: `canAccessSettings = role === "ADMIN"` (superadmin dikecualikan) sedangkan `rbac.ts` mengizinkan SUPER_ADMIN | Dua sumber kebenaran; perilaku UI vs API bisa berbeda |

### 2.3 Catatan arsitektur multi-tenant (risiko lanjutan)

Kolom `storeId` baru ada di `users` & `outlets`. Model **`products`, `categories`, `sales`, `sale_items`, `product_batches`, `customers`, `suppliers` belum punya `storeId`** → saat ini satu katalog & satu buku penjualan untuk SEMUA tenant. Isolasi penuh menuntut migrasi kolom + scoping menyeluruh (Fase 2).

### 2.4 Konsistensi komponen (temuan visual)

| # | Temuan | Bukti |
|---|--------|-------|
| K1 | `PageHeader` dipakai **14 halaman tenant**, tetapi **0 halaman platform** → halaman platform tanpa kepala halaman, terasa "beda aplikasi" | `rg PageHeader src/app/(dashboard)/` |
| K2 | `STATUS_STYLE` **duplikat** di `platform/page.tsx` dan `platform/subscriptions/page.tsx` (peta warna status) | dua definisi map terpisah |
| K3 | Header `/dashboard` admin ditulis **inline manual** (h1 + badge "Sistem Aktif" + tombol aksi), bukan `PageHeader` | `dashboard/page.tsx` baris 184–222 |
| K4 | KPI dashboard platform dihitung di sisi klien (`reduce` di komponen) | sulit diuji, tak bisa dipakai ulang |

---

## 3. Usulan Perubahan (Fase 1 — inti)

### 3.1 Pemisahan tegas: SUPER_ADMIN = platform-only
- `src/lib/rbac.ts`: keluarkan `SUPER_ADMIN` dari SEMUA konstanta tenant (`ADMIN_ONLY_ROLES`, `ADMIN_MANAGER_ROLES`, `ADMIN_CASHIER_ROLES`, `POS_ROLES`, `KDS_ROLES`, `INVENTORY_ROLES`, `FINANCE_ROLES`) dan dari `dashboardRouteRules`.
- Tambah: `PLATFORM_ROLES = ["SUPER_ADMIN"]` (dipakai `/platform*`, `/demo-requests`, `/referrals`).
- `navbar.tsx`: hapus hardcode `role === "ADMIN"`, ambil dari rbac (`hasRequiredRole`).
- `getDefaultPathForRole("SUPER_ADMIN")` tetap `/platform`. Bila SUPER_ADMIN membuka rute tenant → diarahkan ke `/platform`.

### 3.2 Isolasi tenant pada API berbasis User/Outlet
- Helper baru `src/lib/tenant-scope.ts`:
  - `resolveTenantScope(sessionUser)` → untuk ADMIN ke bawah: `{ storeId: sessionUser.storeId }` (wajib, null → 403);
  - untuk SUPER_ADMIN: **ditolak** (403) pada API tenant — hanya `/api/platform/*`.
- Terapkan pada: `/api/users` (+`/[id]`), `/api/outlets` (+`/[id]`), `/api/dashboard/summary`, `/api/dashboard/overview`, `/api/activity-log`.
- Setiap query `users`/`outlets` menambahkan `storeId` dari scope.

### 3.3 Dashboard Super Admin fokus "mengelola admin"
Tambah blok KPI & tabel yang mencerminkan objek kelolaan superadmin:
- KPI: **Total Owner**, **Owner Aktif**, **Owner Nonaktif**, **Tenant Tanpa Langganan**.
- Tabel "Owner Terakhir Login" (email, tenant, status, `lastLoginAt`).
- Agregat disediakan API (bukan hitung di klien): perluas `/api/platform/subscriptions` (`adminCount`) atau endpoint ringkas `/api/platform/overview`.
- Pertahankan KPI SaaS yang sudah ada (tenant, MRR, jatuh tempo, invoice pending).

### 3.4 Standarisasi komponen
- **Baru:** `src/components/shared/status-badge.tsx` — `StatusBadge` untuk status langganan & invoice (menggantikan `STATUS_STYLE` duplikat).
- Pakai **`PageHeader`** di `/platform`, `/platform/owners`, `/platform/subscriptions` (title/eyebrow dari `pageMetaMap`).
- Refactor header `/dashboard` admin → `PageHeader` + slot tombol aksi (seragam dengan 14 halaman lain).
- (Opsional) pindahkan agregasi KPI platform ke API agar komponen hanya merender.

### 3.5 Test & verifikasi
- Perbarui `tests/platform-rbac.test.ts`: SUPER_ADMIN **tidak** lolos gerbang tenant; hanya lolos `PLATFORM_ROLES`; ADMIN tetap lolos gerbangnya sendiri.
- Tambah kasus scoping (unit helper `tenant-scope`).
- Gate: `npx tsc --noEmit` = 0 error, `npm run test:security` hijau, `npm run build` hijau, lalu deploy Dokploy + verifikasi live (superadmin → `/platform` 200, rute tenant → redirect; admin → kebalikannya).

---

## 4. Fase 2 (usulan terpisah, perlu persetujuan sendiri)

1. Migrasi `storeId` ke `products`, `categories`, `sales`, `sale_items`, `product_batches`, `customers`, `suppliers` + backfill ke tenant tunggal + scoping seluruh API tenant.
2. Fitur **"Masuk sebagai tenant" (impersonasi)** untuk dukungan superadmin — read-only, berbatas waktu, terekam audit log — sebagai jalur resmi bila superadmin perlu melihat data tenant.
3. Opsi pertahanan berlapis: PostgreSQL Row Level Security per `storeId`.

---

## 5. Dampak & Risiko

- **Perubahan perilaku:** superadmin tidak lagi bisa membuka dashboard operasional tenant (sesuai arahan Kapten). Saat ini hanya 1 tenant, dampak kecil.
- **Tanpa Fase 2**, isolasi data lintas tenant untuk produk/penjualan tetap belum tertutup — dicatat sebagai risiko arsitektur, bukan diabaikan.
- Semua perubahan aditif & dapat dibalik lewat git; migrasi tidak menghapus data.

---

## 6. Keputusan yang Dibutuhkan Kapten

1. **Pemisahan tegas** (rekomendasi) — SUPER_ADMIN diblokir dari seluruh rute/API tenant dan fokus `/platform*`? Atau tetap boleh masuk mode "lihat saja"?
2. **Fase 2** (migrasi `storeId` menyeluruh + impersonasi) — dikerjakan sekarang, dikerjakan setelah Fase 1 diverifikasi, atau ditunda?
3. **Dashboard superadmin** — cukup KPI owner (Total/Aktif/Nonaktif + tenant tanpa langganan), atau tambah grafik tren tenant & MRR bulanan?
