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
