# Kredensial Akses & Panduan Uji RBAC KADAI

**Target Instance**: [https://kadai.asia](https://kadai.asia)  
**Status**: Production / Live (Commit `db973b6` via Dokploy)

---

## 1. Akun Administrator Master (Seed Default)

Akun master yang terdaftar di database VPS:
- **URL Login**: `https://kadai.asia/login`
- **Email**: `admin@kadai.com`
- **Password**: `admin123` *(jika belum pernah diganti di pengaturan profil)*
- **Role**: `ADMIN` (Owner)
- **PIN Supervisor**: `123456`

---

## 2. Matriks Uji 6 Role Pengguna

Karena endpoint registrasi publik telah ditutup demi keamanan (mencegah pendaftaran akun sembarangan di database shared), silakan login sebagai **Admin**, buka menu **Pengaturan ➔ Kelola Pengguna** (`https://kadai.asia/settings`), lalu daftarkan akun uji masing-masing role berikut:

| No | Role | Rekomendasi Email Uji | Password Uji | PIN Supervisor | Default Landing Page |
|:---|:---|:---|:---|:---|:---|
| 1 | **ADMIN** | `admin@kadai.com` | `admin123` | `123456` | `/dashboard` |
| 2 | **MANAGER** | `manager@kadai.com` | `manager123` | `123456` | `/dashboard` |
| 3 | **CASHIER** | `kasir@kadai.com` | `kasir123` | *(Kosongkan)* | `/pos` |
| 4 | **KITCHEN** | `dapur@kadai.com` | `dapur123` | *(Kosongkan)* | `/kds` |
| 5 | **INVENTORY** | `gudang@kadai.com` | `gudang123` | *(Kosongkan)* | `/inventory` |
| 6 | **ACCOUNTANT** | `akuntan@kadai.com` | `akuntan123` | *(Kosongkan)* | `/finance` |

---

## 3. Matriks Hak Akses Modul & Navigasi

| Modul / URL | ADMIN | MANAGER | CASHIER | KITCHEN | INVENTORY | ACCOUNTANT |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **POS Kasir Kilat** (`/pos`) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **KDS Layar Dapur** (`/kds`) | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Inventori & Penyesuaian** (`/inventory`, `/adjustments`, `/restock`) | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Katalog Produk** (`/products`) | ✅ *(Bisa Hapus)* | ✅ *(No Delete)* | ❌ | ❌ | ✅ *(No Delete)* | ❌ |
| **Kelola Supplier** (`/suppliers`) | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Pelanggan & CRM** (`/customers`) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Riwayat Penjualan** (`/sales`) | ✅ *(Full)* | ✅ *(Full)* | ✅ *(Milik Sendiri)* | ❌ | ❌ | ✅ *(Full)* |
| **Laporan & Keuangan SAK EMKM** (`/reports`, `/finance`, `/finance/tax`) | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Ringkasan Eksekutif & Log** (`/dashboard`, `/activity-log`, `/tables`) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Pengaturan Sistem & Bot** (`/settings`, `/outlets`) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Profil Akun** (`/profile`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 4. Skenario Uji Batas Keamanan (Security & Boundary Tests)

### Skenario A: Uji Kasir & Masking Finansial (`CASHIER`)
1. Login dengan akun `kasir@kadai.com`.
2. Sistem otomatis mengarahkan browser ke `/pos`.
3. Coba ketik URL terlarang di address bar:
   - Akses `/settings` ➔ **Ditolak & redirect kembali ke `/pos`**.
   - Akses `/finance` ➔ **Ditolak & redirect kembali ke `/pos`**.
   - Akses `/inventory` ➔ **Ditolak & redirect kembali ke `/pos`**.
4. **Anti-Leak HPP / Modal**:
   - Buka struk transaksi di `/sales/[id]`.
   - Pastikan angka **HPP (`costPrice`)**, **Laba Kotor (`grossProfit`)**, dan **Margin** tidak muncul sama sekali. Data tersebut disaring langsung oleh backend API.

---

### Skenario B: Uji Pembatalan Transaksi dengan PIN Supervisor (Void Check)
1. Buka salah satu struk transaksi di `/sales/[id]`.
2. Klik tombol **Void / Batalkan Transaksi**.
3. Sistem akan meminta PIN Supervisor 6–8 digit.
4. **Uji Rate Limiting PIN**:
   - Masukkan PIN sembarang secara salah berturut-turut.
   - Setelah 10 kali percobaan gagal, sistem akan mengunci verifikasi PIN selama 30 menit.
5. Masukkan PIN yang benar (`123456`):
   - Transaksi sukses dibatalkan secara atomik (mencegah double-void race).
   - Stok dikembalikan otomatis ke batch persediaan asalnya.

---

### Skenario C: Uji Layar Dapur (`KITCHEN`)
1. Login dengan akun `dapur@kadai.com`.
2. Sistem otomatis membuka antarmuka KDS (`/kds`).
3. Akses ke `/pos`, `/finance`, atau `/dashboard` langsung ditolak dan dikembalikan ke `/kds`.

---

### Skenario D: Uji Staf Gudang (`INVENTORY`)
1. Login dengan akun `gudang@kadai.com`.
2. Sistem otomatis membuka `/inventory`.
3. Akun dapat menambah stok baru, membuat penyesuaian opname stok, dan mengunggah gambar produk.
4. Akun **tidak dapat** menghapus data master produk (tombol delete hanya muncul untuk Admin) dan tidak memiliki akses ke halaman kasir `/pos`.

---

### Skenario E: Uji Akuntan SAK EMKM (`ACCOUNTANT`)
1. Login dengan akun `akuntan@kadai.com`.
2. Sistem otomatis membuka `/finance`.
3. Akun dapat melihat perhitungan pajak PPN & PBJT/PB1 10%, laporan laba-rugi, dan seluruh riwayat penjualan lengkap beserta rincian modal HPP.
4. Akun tidak dapat melakukan transaksi penjualan baru di `/pos` maupun mengubah konfigurasi toko di `/settings`.

---

## 7. Role SUPER_ADMIN (Operator Platform) — Implementasi 14 Nov 2026

> **Status:** ✅ Implemented (`feature/platform-superadmin`) — commit rilis setelah verifikasi Dokploy.
> Komponen: role enum, tenant scoping (`storeId` pada User/Outlet), API `/api/platform/*`, halaman `/platform/*`, reklasifikasi billing/referral/demo ke SUPER_ADMIN.

### 7.1 Bootstrap Akun Super Admin Pertama

**Opsi A — Script CLI di VPS (disarankan):**
```bash
node scripts/create-superadmin.js --email superadmin@kadai.com --password '<minimal-12-karakter>' --name 'Super Admin Kadai'
```

**Opsi B — Seed env (saat deploy/seed berikutnya):**
```
SUPERADMIN_EMAIL=superadmin@kadai.com
SUPERADMIN_PASSWORD=<minimal-12-karakter>
SUPERADMIN_NAME=Super Admin Kadai
```

Setelah bootstrap, akun super admin login di `https://kadai.asia/login` → otomatis diarahkan ke `/platform`.

### 7.2 Matriks Akses Role (7 Role)

| Modul / URL | SUPER_ADMIN | ADMIN | MANAGER | CASHIER | KITCHEN | INVENTORY | ACCOUNTANT |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Platform Dashboard** (`/platform`) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Akun Owner (Tenant)** (`/platform/owners`) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Langganan & Invoice** (`/platform/subscriptions`) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Permohonan Demo** (`/demo-requests`) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Mitra Referral** (`/referrals`) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Billing Invoice** (`/api/billing/invoices`) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Pengaturan Sistem** (`/settings`) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| POS / KDS / Inventori / Finance | ✅* | ✅ | per matriks existing | | | | |

\* SUPER_ADMIN mewarisi kemampuan ADMIN (dukungan lintas tenant), namun navigasi utama difokuskan ke modul platform.

### 7.3 Skenario Uji Platform (Skenario F)

1. Login dengan akun SUPER_ADMIN → sistem membuka `/platform`.
2. Buka **Akun Owner** → klik **Tambah Owner**:
   - Pilih **Buat tenant baru** → isi nama tenant, jenis usaha, tier awal (`PRO_BUSINESS`), siklus (`MONTHLY`), data owner → Simpan.
   - Verifikasi: tenant baru muncul di **Langganan & Invoice** dengan status `ACTIVE` dan jatuh tempo +1 bulan (MONTHLY) / +3 bulan (QUARTERLY) / +12 bulan (ANNUAL).
3. Pada baris tenant, klik **Kelola** → ubah tier ke `ENTERPRISE` → **Simpan Tier & Siklus** → verifikasi tier tenant berubah di daftar.
4. Klik **Invoice** → **Terbitkan Tagihan** (tier/siklus dipilih, nominal otomatis dari `src/lib/pricing.ts`) → verifikasi nomor `INV-YYYYMM-####` berstatus `PENDING`.
5. Pada tagihan `PENDING`, klik **Lunas** → verifikasi status `SETTLED` dan langganan aktif/perpanjang otomatis.
6. Klik **Kelola** → **Suspend Tenant** (konfirmasi) → verifikasi status `CANCELLED` dan seluruh akun owner tenant dinonaktifkan.
7. Login dengan akun owner tenant → verifikasi tidak bisa login lagi (akun non-aktif).

### 7.4 Guard Keamanan SUPER_ADMIN

- Admin/owner tenant **tidak dapat** mengakses `/platform/*` dan `/api/platform/*` (403 server-side).
- `createUserSchema`/`updateUserSchema` (scope tenant) **menolak** nilai role `SUPER_ADMIN` (anti-eskalasi di layer validator).
- Hanya endpoint platform yang dapat membuat/menonaktifkan SUPER_ADMIN; **last-superadmin protection** mencegah menonaktifkan SUPER_ADMIN aktif terakhir.
- Seluruh aksi platform tercatat di `ActivityLog` (`OWNER_CREATED`, `OWNER_UPDATED`, `OWNER_DEACTIVATED`, `SUBSCRIPTION_UPDATED`, `TENANT_SUSPENDED`).
- Session HMAC menyimpan `storeId`/`storeName`; perubahan role otomatis memutus sesi lama (via `version`).
