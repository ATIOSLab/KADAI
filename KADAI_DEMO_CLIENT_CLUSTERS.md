# KADAI Demo Client Clusters & Master Test Credentials

**URL Akses Aplikasi**: [https://kadai.asia](https://kadai.asia)  
**Standard Password Default Semua Akun Demo**: `password123`  
**Master Admin VPS**: `admin@kadai.com` / `admin123` (PIN: `123456`)

Dokumen ini memuat daftar lengkap klaster akun demo klien untuk berbagai vertikal usaha Indonesia, mencakup:
1. **Dimsum Imperial Heritage** (Restoran Dimsum Otentik - Multi Cabang 3 Outlet)
2. **Gentlemen & Co. Premium Barbershop** (Jasa Cukur, Grooming & Retail Haircare)
3. **GlowAura Aesthetic & Dermatology Clinic** (Klinik Kecantikan, Treatment Medis & Skincare)
4. **Toko Sembako Berkah Jaya** (Minimarket / Toko Harian Ritel & Grosir)
5. **Bakso & Mie Ayam Mas Sigit Solo** (Warung Tradisional, Kuah KDS & Meja QR)
6. **Ruang Temu Coffee & Eatery** (Third Wave Cafe, Barista Station & Bakery)

---

## Klaster 1: Dimsum Imperial Heritage (F&B Restoran - 3 Cabang Outlet)
*Spesifikasi: Manajemen multi-outlet cabang (Menteng, Senopati, PIK), resep BOM bahan baku udang/kulit pangsit, multi-station KDS Dapur vs Bar.*

### Data Cabang / Outlet:
- **Pusat Menteng (DIM-01)**: Jl. HOS Cokroaminoto No. 12, Menteng, Jakarta Pusat (Main Store)
- **Cabang Senopati (DIM-02)**: Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan
- **Cabang Pantjoran PIK (DIM-03)**: Pantjoran PIK Unit B-08, Jakarta Utara

### Akun Pengguna & Role:
| Role | Nama Pengguna | Email Login | Password | PIN Supervisor | Default Page |
|:---|:---|:---|:---|:---|:---|
| **ADMIN** | Hendro Wijaya (Owner Resto) | `owner.dimsum@kadai.com` | `password123` | `888111` | `/dashboard` |
| **MANAGER** | Linda Tan (Store Manager) | `manager.dimsum@kadai.com` | `password123` | `888222` | `/dashboard` |
| **CASHIER** | Rian Kasir (Kasir Menteng) | `kasir.dimsum@kadai.com` | `password123` | *(None)* | `/pos` |
| **KITCHEN** | Chef A-Kiong (Dapur Kukus) | `dapur.dimsum@kadai.com` | `password123` | *(None)* | `/kds` |
| **INVENTORY** | Bambang (Gudang Central) | `gudang.dimsum@kadai.com` | `password123` | *(None)* | `/inventory` |
| **ACCOUNTANT** | Siti Rahma (Akuntan PB1) | `akuntan.dimsum@kadai.com` | `password123` | *(None)* | `/finance` |

### Sampel Menu & Batch FIFO:
- `DIM-HKU-01` Siomay Hakau Udang (4 pcs) — Rp 38.000 (HPP Rp 14.000)
- `DIM-XLB-02` Xiao Long Bao Sup Daging (3 pcs) — Rp 42.000 (HPP Rp 16.000)
- `DIM-LPK-03` Lumpia Kulit Tahu Udang Goreng — Rp 35.000 (HPP Rp 12.000)
- `DIM-TEA-04` Oolong Tea Imperial Pot (Bar Station) — Rp 28.000 (HPP Rp 6.000)
- `RAW-UDG-02` Udang Kupas Frozen Pilihan (Bahan Baku) — Stok 80 kg @ Rp 72.000

---

## Klaster 2: Gentlemen & Co. Premium Barbershop (Jasa & Grooming)
*Spesifikasi: Layanan sesi jasa (non-stok fisik) digabungkan dengan penjualan ritel pomade dan haircare dengan pelacakan persediaan.*

### Data Cabang / Outlet:
- **Flagship Senopati (BRB-01)**: Jl. Gunawarman No. 22, Kebayoran Baru, Jakarta Selatan

### Akun Pengguna & Role:
| Role | Nama Pengguna | Email Login | Password | PIN Supervisor | Default Page |
|:---|:---|:---|:---|:---|:---|
| **ADMIN** | Bramantyo (Owner Barber) | `owner.barber@kadai.com` | `password123` | `777111` | `/dashboard` |
| **MANAGER** | Fajar (Manager Operasional) | `manager.barber@kadai.com` | `password123` | `777222` | `/dashboard` |
| **CASHIER** | Doni (Kasir Frontdesk) | `kasir.barber@kadai.com` | `password123` | *(None)* | `/pos` |
| **ACCOUNTANT** | Eko (Akuntan Bisnis Jasa) | `akuntan.barber@kadai.com` | `password123` | *(None)* | `/finance` |

### Sampel Layanan Jasa & Ritel:
- `BRB-SRV-01` Signature Haircut & Hot Towel Shave — Rp 120.000 (Jasa / Service)
- `BRB-SRV-02` Beard Trim & Facial Scrub — Rp 85.000 (Jasa / Service)
- `BRB-RTL-03` Oil-Based Heavy Pomade Vanilla 100g — Rp 110.000 (HPP Rp 55.000)
- `BRB-RTL-04` Organic Hair Clay Matte Finish 80g — Rp 135.000 (HPP Rp 68.000)

---

## Klaster 3: GlowAura Aesthetic & Dermatology Clinic (Klinik Kecantikan)
*Spesifikasi: Tindakan medis dokter & terapis, integrasi kasir apotek, penyimpanan stok serum/cream ber-izin BPOM.*

### Data Cabang / Outlet:
- **Dharmawangsa Clinic (KLN-01)**: Jl. Dharmawangsa X No. 8, Jakarta Selatan

### Akun Pengguna & Role:
| Role | Nama Pengguna | Email Login | Password | PIN Supervisor | Default Page |
|:---|:---|:---|:---|:---|:---|
| **ADMIN** | dr. Amanda Sp.KK (Owner) | `owner.klinik@kadai.com` | `password123` | `666111` | `/dashboard` |
| **MANAGER** | dr. Kevin (Manager Medis) | `manager.klinik@kadai.com` | `password123` | `666222` | `/dashboard` |
| **CASHIER** | Nisa (Kasir Apotek & Front) | `kasir.klinik@kadai.com` | `password123` | *(None)* | `/pos` |
| **INVENTORY** | Apoteker Dewi (Farmasi) | `gudang.klinik@kadai.com` | `password123` | *(None)* | `/inventory` |
| **ACCOUNTANT** | Yulia (Finance & Pajak PPh) | `akuntan.klinik@kadai.com` | `password123` | *(None)* | `/finance` |

### Sampel Treatment & Skincare:
- `KLN-LSR-01` Pico Laser Glow Rejuvenation — Rp 1.250.000 (Tindakan Medis)
- `KLN-FCL-02` Deep Cleansing Acne Facial + PDT — Rp 350.000 (Treatment)
- `KLN-SKN-03` Glow Radiance Vitamin C Serum 30ml — Rp 275.000 (HPP Rp 110.000)
- `KLN-SKN-04` UV Barrier Sunscreen SPF 50 PA++++ — Rp 195.000 (HPP Rp 78.000)

---

## Klaster 4: Toko Sembako Berkah Jaya (Toko Harian / Sembako Grosir)
*Spesifikasi: Kasir barcode ritel kilat, perputaran stok FIFO, mutasi persediaan karungan, gula & minyak goreng.*

### Data Cabang / Outlet:
- **Toko Induk Pasar Minggu (SBK-01)**: Jl. Ragunan No. 18, Pasar Minggu, Jakarta Selatan

### Akun Pengguna & Role:
| Role | Nama Pengguna | Email Login | Password | PIN Supervisor | Default Page |
|:---|:---|:---|:---|:---|:---|
| **ADMIN** | Haji Mansur (Owner Toko) | `owner.sembako@kadai.com` | `password123` | `555111` | `/dashboard` |
| **MANAGER** | Zainal (Kepala Toko) | `manager.sembako@kadai.com` | `password123` | `555222` | `/dashboard` |
| **CASHIER** | Asep (Kasir Barcode Cepat) | `kasir.sembako@kadai.com` | `password123` | *(None)* | `/pos` |
| **INVENTORY** | Wahyu (Staf Gudang & Bongkar) | `gudang.sembako@kadai.com` | `password123` | *(None)* | `/inventory` |
| **ACCOUNTANT** | Budi Santoso (Pembukuan) | `akuntan.sembako@kadai.com` | `password123` | *(None)* | `/finance` |

### Sampel Produk Sembako:
- `SBK-BRS-01` Beras Pandan Wangi Premium 5kg — Rp 78.000 (HPP Rp 68.000)
- `SBK-MYK-02` Minyak Goreng Sawit Pouch 2L — Rp 36.500 (HPP Rp 32.000)
- `SBK-GLA-03` Gula Pasir Kristal Putih 1kg — Rp 17.500 (HPP Rp 15.200)
- `SBK-KCP-04` Kecap Manis Botol 600ml — Rp 23.000 (HPP Rp 18.500)

---

## Klaster 5: Bakso & Mie Ayam Mas Sigit Solo (Kuliner Tradisional)
*Spesifikasi: Penjualan warung casual dining, pemesanan meja QR, layar KDS Dapur Kuah & Dapur Pangsit.*

### Data Cabang / Outlet:
- **Warung Tebet (BKS-01)**: Jl. Tebet Raya No. 58, Jakarta Selatan

### Akun Pengguna & Role:
| Role | Nama Pengguna | Email Login | Password | PIN Supervisor | Default Page |
|:---|:---|:---|:---|:---|:---|
| **ADMIN** | Mas Sigit (Owner Warung) | `owner.bakso@kadai.com` | `password123` | `444111` | `/dashboard` |
| **MANAGER** | Suratno (Manager Warung) | `manager.bakso@kadai.com` | `password123` | `444222` | `/dashboard` |
| **CASHIER** | Agus (Kasir Depan) | `kasir.bakso@kadai.com` | `password123` | *(None)* | `/pos` |
| **KITCHEN** | Wawan (Dapur Kuah & Rebus) | `dapur.bakso@kadai.com` | `password123` | *(None)* | `/kds` |

### Sampel Menu Bakso & Mie Ayam:
- `BKS-URT-01` Bakso Urat Jumbo Komplit + Tetelan — Rp 32.000 (HPP Rp 13.500)
- `BKS-TLR-02` Bakso Telur Puyuh Kuah Gurih — Rp 28.000 (HPP Rp 11.000)
- `BKS-MIE-03` Mie Ayam Pangsit Bakso Komplit — Rp 26.000 (HPP Rp 9.500)
- `BKS-MNM-04` Es Jeruk Peras Murni Gula Asli — Rp 10.000 (HPP Rp 3.500)

---

## Klaster 6: Ruang Temu Coffee & Eatery (Cafe & Artisan Bakery)
*Spesifikasi: Kafe modern third-wave, stasiun Barista Bar terpisah dengan Dapur Pastry, BOM roasted beans espresso.*

### Data Cabang / Outlet:
- **Ruang Temu Gandaria (CFE-01)**: Jl. Gandaria Tengah II No. 14, Kebayoran Baru, Jakarta Selatan

### Akun Pengguna & Role:
| Role | Nama Pengguna | Email Login | Password | PIN Supervisor | Default Page |
|:---|:---|:---|:---|:---|:---|
| **ADMIN** | Dimas Aditya (Founder) | `owner.cafe@kadai.com` | `password123` | `333111` | `/dashboard` |
| **MANAGER** | Nadia (Head Store Manager) | `manager.cafe@kadai.com` | `password123` | `333222` | `/dashboard` |
| **CASHIER** | Farhan (Head Barista / Kasir) | `kasir.cafe@kadai.com` | `password123` | *(None)* | `/pos` |
| **KITCHEN** | Kiki (Barista Bar Station) | `barista.cafe@kadai.com` | `password123` | *(None)* | `/kds` |
| **KITCHEN** | Dewi (Dapur Pastry Bakery) | `dapur.cafe@kadai.com` | `password123` | *(None)* | `/kds` |
| **ACCOUNTANT** | Anita (Akuntan F&B) | `akuntan.cafe@kadai.com` | `password123` | *(None)* | `/finance` |

### Sampel Menu Kopi & Pastry:
- `CFE-LAT-01` Iced Creamy Aren Latte (BOM Espresso + Aren) — Rp 28.000 (HPP Rp 8.500)
- `CFE-V60-02` V60 Filter Single Origin Gayo (Bar Station) — Rp 34.000 (HPP Rp 11.000)
- `CFE-PST-03` Butter Croissant Almond Flakes (Dapur Pastry) — Rp 32.000 (HPP Rp 14.000)
- `CFE-MCK-04` Sparkling Yuzu Cold Brew — Rp 36.000 (HPP Rp 12.500)

---

## Ringkasan Petunjuk Uji Coba Lapangan
1. **Buka Aplikasi**: Akses [https://kadai.asia/login](https://kadai.asia/login).
2. **Login dengan Akun Kasir**: Contoh `kasir.dimsum@kadai.com` / `password123`.
   - Coba selesaikan transaksi penjualan pesanan Siomay Hakau & Lumpia.
   - Perhatikan bahwa kasir tidak bisa melihat margin dan modal HPP bahan udang.
3. **Login dengan Akun Dapur (KDS)**: Contoh `dapur.dimsum@kadai.com` / `password123` atau `barista.cafe@kadai.com`.
   - Amati pesanan otomatis masuk ke stasiun Kitchen atau Bar secara real-time.
4. **Login dengan Akun Akuntan**: Contoh `akuntan.cafe@kadai.com` / `password123`.
   - Akses `/finance/tax` dan `/reports` untuk meninjau pembukuan dan perhitungan pajak resmi.
