# 🏛️ KADAI ENTERPRISE BLUEPRINT
## Sistem Operasi Bisnis, Multi-Tenant SaaS, & POS Terintegrasi Berstandar Keuangan Indonesia

> **Dokumen Arsitektur & Spesifikasi Rekayasa Sistem**  
> **Status:** Active Master Reference  
> **Version:** 2.0.0 (Enterprise Evolution)  
> **Author & Architect:** Netkrida (@netkridabot) for Irvan  
> **Target Deployment:** Dokploy VPS (`https://command.ntchost.net`)  
> **Repository:** `ATIOSLab/KADAI` (`main` branch)

---

## DAFTAR ISI (TABLE OF CONTENTS)
1. [Eksekutif & Visi Produk](#1-eksekutif--visi-produk)
2. [Riset Komparatif POS Indonesia (Benchmark Top-Tier)](#2-riset-komparatif-pos-indonesia-benchmark-top-tier)
3. [Arsitektur Multi-Tenant SaaS & Paket Langganan](#3-arsitektur-multi-tenant-saas--paket-langganan)
4. [Dinamika Multi-Vertikal (Ritel vs F&B / Kuliner vs Jasa)](#4-dinamika-multi-vertikal-ritel-vs-fb--kuliner-vs-jasa)
5. [Mesin Resep (Bill of Materials / BOM) & HPP Otomatis](#5-mesin-resep-bill-of-materials--bom--hpp-otomatis)
6. [Standar Keuangan SAK EMKM & Perpajakan Indonesia](#6-standar-keuangan-sak-emkm--perpajakan-indonesia)
7. [Meja, Self-Order QR Code, & Kitchen Display System (KDS)](#7-meja-self-order-qr-code--kitchen-display-system-kds)
8. [Manajemen Multi-Outlet & Multi-Gudang](#8-manajemen-multi-outlet--multi-gudang)
9. [Audit Codebase Eksisting & Delta Rekayasa](#9-audit-codebase-eksisting--delta-rekayasa)
10. [Skema Database Lengkap (Expanded Prisma Schema)](#10-skema-database-lengkap-expanded-prisma-schema)
11. [Roadmap Implementasi & Tracking Milestone](#11-roadmap-implementasi--tracking-milestone)

---

## 1. EKSEKUTIF & VISI PRODUK

### 1.1 Latar Belakang & Identitas
**KADAI** adalah platform *Software-as-a-Service* (SaaS) operasi bisnis terintegrasi yang dirancang khusus untuk ekosistem UMKM dan korporasi rantai ritel/kuliner di Indonesia. Berbeda dari aplikasi kasir sederhana yang sekadar mencatat penjualan, KADAI memadukan:
1. **Multi-Vertical POS**: Fleksibel untuk Ritel Toko (barang langsung jual), F&B Kuliner (bahan mentah, resep BOM, pesanan dapur), dan Jasa.
2. **Batch-Based FIFO Inventory**: Akurasi pergerakan stok dan Harga Pokok Penjualan (HPP) per batch tanpa manipulasi nilai buku.
3. **Standar Keuangan & Pajak Indonesia**: Menghitung PPN 11%/12%, PB1 (Pajak Restoran 10%), Service Charge, dan pembukuan berbasis **SAK EMKM** (Laba Rugi, Arus Kas, Neraca, serta rekap omzet PPh Final UMKM 0.5% PP 55/2022).
4. **Modern Omnichannel Order Flow**: Integrasi self-order QR meja kafe/resto hingga tampilan layar koki dapur (Kitchen Display System / KDS) secara real-time.
5. **Multi-Tenant SaaS Self-Serve**: Pelaku usaha mendaftar mandiri, memilih paket langganan (Free/Starter/Pro/Enterprise), mengelola staf, dan mengatur multi-outlet.

---

## 2. RISET KOMPARATIF POS INDONESIA (BENCHMARK TOP-TIER)

Berdasarkan riset mendalam terhadap lanskap industri POS di Indonesia, terdapat 5 pemain utama dengan segmentasi dan kelebihan masing-masing:

| Platform | Segmen Utama | Model Harga / Paket | Keunggulan Utama | Titik Lemah / Gap Pasar |
| :--- | :--- | :--- | :--- | :--- |
| **Model POS Waralaba Tertutup** | Kafe, Resto, Ritel Menengah | • Paket Dasar: ~Rp 249rb/bln<br>• Pro: ~Rp 499rb/bln<br>• Add-ons berbayar | • Ekosistem pembayaran tertentu<br>• UI kasir ramah pengguna<br>• Pemasaran luas | • Add-on mahal (Modul Order & Bahan Baku kena biaya tambahan per bulan)<br>• Terkunci di hardware tertentu |
| **Model ERP Korporasi Warisan** | F&B Skala Besar | • Biaya Lisensi Tahunan + Biaya Implementasi Konsultan | • Manajemen resep (BOM) & gramatur presisi<br>• KDS & Station Routing tangguh<br>• Multi-cabang & Central Kitchen skala besar | • Biaya sangat mahal untuk pengusaha berkembang<br>• Setup rumit dan kurva pembelajaran curam<br>• Tidak fleksibel untuk ritel non-F&B |
| **Model Kasir Generik Paket Terbatas** | Rintisan & Mikro | • Paket Dasar: ~Rp 149rb/bln<br>• Menengah: ~Rp 299rb/bln<br>• Lanjutan: ~Rp 499rb/bln | • Fitur serba ada (kasir, absensi, toko online)<br>• Mudah untuk pengguna baru | • Arsitektur modul berat/lambat di perangkat spesifikasi rendah<br>• Pelacakan HPP multi-batch dan audit persediaan kurang mendalam |
| **Model Kasir Barcode Konvensional** | Ritel, Toko Kelontong | • Paket Dasar: ~Rp 128rb/bln<br>• Premium: ~Rp 248rb/bln | • Dukungan hardware barcode scanner & timbangan digital | • Tampilan antarmuka terasa lawas (*dated*)<br>• Alur F&B modern (KDS interaktif & QR dining) kurang mulus |
| **Model Kasir Transaksi Kas Sederhana** | Ritel & Kuliner Menengah | • Paket Dasar: ~Rp 199rb/bln<br>• Pro: ~Rp 299rb/bln | • Pengelolaan kas laci kasir (shift cash drawer) rapi<br>• Stabil untuk transaksi kasir | • Fitur resep bahan baku terbatas<br>• Laporan kepatuhan pajak daerah & akuntansi kurang komprehensif |

### Unfair Advantage KADAI:
- **Unified Engine**: Menggabungkan ketangguhan inventory multi-batch (FIFO, FEFO, Average standar ritel/pergudangan) dengan fleksibilitas Bill of Materials / Resep instan (standar produksi F&B dan perakitan) dalam satu platform yang terjangkau.
- **Native Indonesian Tax & SAK EMKM**: Pajak PPN 11%/12%, PB1 10%, Service Charge, serta rekap omzet PPh Final 0.5% terintegrasi otomatis sejak transaksi kasir pertama.
- **Self-Serve SaaS & Zero-Lockin**: UMKM dapat langsung daftar mandiri, menggunakan browser biasa, tablet, HP, atau PC tanpa kewajiban membeli paket hardware mahal.

---

## 3. ARSITEKTUR MULTI-TENANT SAAS & PAKET LANGGANAN

### 3.1 Model Multi-Tenancy (Row-Level Multi-Tenant Isolation)
KADAI menerapkan arsitektur **Shared Database, Shared Schema with Tenant Discriminator** yang diperkuat oleh:
1. `tenantId` pada setiap entitas data (User, Store, Outlet, Product, Batch, Sale, FinanceEntry, ActivityLog).
2. **Tenant Context Middleware**: Validasi tenant dilakukan di server boundary (Server Actions / API Route Handlers) menggunakan session token terenkripsi. Tidak mengizinkan query tanpa tenant scope (`tenantId: session.tenantId`).
3. **Subdomain / Slug Routing**: Setiap bisnis memiliki identitas unik: `kadai.id/<slug>` atau `https://<slug>.kadai.id` untuk menu publik & QR order.

### 3.2 Struktur Paket Langganan (Pricing Tiers)

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           TIER LANGGANAN KADAI                            │
├───────────────┬───────────────┬───────────────────┬───────────────────────┤
│    GRATIS     │    STARTER    │     PRO BISNIS    │       ENTERPRISE      │
│  (FREE TIER)  │  (Rp 99.000)  │   (Rp 249.000)    │     (Rp 599.000)      │
├───────────────┼───────────────┼───────────────────┼───────────────────────┤
│ • 1 Outlet    │ • 1 Outlet    │ • Hingga 3 Outlet │ • Unlimited Outlet    │
│ • 1 Akun Kasir│ • 3 Akun Kasir│ • Unlimited Staf  │ • Unlimited Staf      │
│ • Max 50 Item │ • Item Bebas  │ • Resep / BOM F&B │ • Central Kitchen (CK)│
│ • FIFO Retail │ • FIFO Retail │ • Meja & QR Order │ • Multi-Gudang Penuh  │
│ • Struk Standar│ • Pajak PPN/PB1│ • KDS Real-time   │ • Laporan Konsolidasi │
│               │ • Laporan SAK │ • Akuntansi Penuh │ • Dedicated Support   │
└───────────────┴───────────────┴───────────────────┴───────────────────────┘
```

### 3.3 Siklus Tagihan (Billing Lifecycle & Pro-Rata)
- **Integrasi Payment Gateway**: Midtrans (Snap/Core API) / Xendit / Tripay dengan dukungan QRIS, Virtual Account (BCA, Mandiri, BRI, BNI), dan E-Wallet.
- **Sistem Pro-Rata**: Penambahan outlet di tengah periode langganan dihitung secara proporsional sisa hari masa aktif.
- **Grace Period & Data Retention**: 7 hari masa tenggang (read-only mode) jika pembayaran jatuh tempo sebelum akun dinonaktifkan sementara (data aman 100%).

---

## 4. DINAMIKA MULTI-VERTIKAL (RITEL VS F&B / KULINER VS JASA)

Sistem KADAI dirancang untuk beradaptasi dengan tipe bisnis UMKM saat proses onboarding:

```
                      ┌────────────────────────────┐
                      │    TIPE USAHA ONBOARDING   │
                      └─────────────┬──────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
 ┌───────────────┐          ┌───────────────┐          ┌───────────────┐
 │  RITEL / TOKO │          │ F&B / KULINER │          │     JASA      │
 ├───────────────┤          ├───────────────┤          ├───────────────┤
 │• Barang Jadi  │          │• Bahan Baku   │          │• Layanan / Jam│
 │• Barcode Scan │          │• Resep (BOM)  │          │• Komisi Staff │
 │• Batch & Exp  │          │• Meja & QR    │          │• Konsumsi Alat│
 │• Kartu Stok   │          │• Dapur (KDS)  │          │• Booking Jadwal│
 └───────────────┘          └───────────────┘          └───────────────┘
```

### 4.1 Vertikal Ritel / Toko
- **Alur Bisnis**: Pembelian Barang Jadi dari Supplier -> Masuk Batch FIFO (Cost Price & Expire Date) -> Penjualan Kasir (Scan Barcode / Cari Nama) -> Stok Batch terpotong -> HPP & Laba Kotor langsung tercatat.
- **Fitur Khusus**: Cetak label barcode (Code-128 / EAN-13), multi-satuan konversi (dus -> pack -> pcs), peringatan barang kedaluwarsa (*expiry tracking*).

### 4.2 Vertikal F&B / Kuliner (Resto, Kafe, Kedai Kopi, Dimsum)
- **Alur Bisnis**: Pembelian Bahan Pokok Mentah (Daging, Tepung, Minyak, Susu) -> Racik Resep / BOM (Bill of Materials) -> Penjualan Produk Jadi (Dine-in / Takeaway / Online) -> Stok bahan mentah terpotong proporsional -> Tiket order terkirim ke KDS Dapur/Bar.
- **Fitur Khusus**: Layout Denah Meja, Self-order QR Menu, Catatan Pesanan (misal: "tanpa cabai", "es sedikit"), Split Bill / Merge Bill.

### 4.3 Vertikal Jasa & Layanan
- **Alur Bisnis**: Penjualan Waktu/Tenaga (Laundry, Barbershop, Servis HP) -> Konsumsi bahan pembantu (misal: sabun laundry, sparepart) -> Penghitungan bagi hasil/komisi terapis/teknisi.

---

## 5. MESIN RESEP (BILL OF MATERIALS / BOM) & HPP OTOMATIS

### 5.1 Konsep Matematis Resep F&B (Contoh Kasus Dimsum & Kopi)

Misalkan sebuah usaha kuliner menjual **Dimsum Ayam Mentai (Porsi Isi 4)**:
- **Resep BOM Dimsum**:
  - Daging Ayam Cincang: 80 gram (Satuan beli: Kg)
  - Kulit Pangsit: 4 lembar (Satuan beli: Pack isi 50)
  - Saus Mentai: 25 ml (Satuan beli: Botol 500 ml)
  - Minyak Wijen: 5 ml (Satuan beli: Botol 250 ml)

#### Mekanisme Alokasi FIFO & HPP:
1. Saat kasir menjual 1 porsi Dimsum:
   - Sistem mengambil harga modal bahan dari batch FIFO bahan aktif:
     - 80g Daging Ayam dari Batch #AYAM-01 @ Rp 45.000/kg = Rp 3.600
     - 4 lbr Kulit Pangsit dari Batch #PANGSIT-02 @ Rp 15.000/pack = Rp 1.200
     - 25ml Saus Mentai dari Batch #MENTAI-01 @ Rp 40.000/botol = Rp 2.000
     - 5ml Minyak Wijen dari Batch #WIJEN-03 @ Rp 50.000/botol = Rp 1.000
   - **Total HPP Produk Jadi**: Rp 3.600 + Rp 1.200 + Rp 2.000 + Rp 1.000 = **Rp 7.800**.
2. Jika Harga Jual = **Rp 22.000**, maka:
   - **Gross Profit**: Rp 22.000 - Rp 7.800 = **Rp 14.200** (Margin 64.5%).
3. Stok bahan mentah pada tabel `ProductBatch` masing-masing bahan otomatis berkurang secara atomik dalam satu database transaction `$transaction`.

---

## 6. STANDAR KEUANGAN SAK EMKM & PERPAJAKAN INDONESIA

### 6.1 Mesin Perpajakan Indonesia (Tax Calculation Engine)

KADAI mendukung 3 instrumen pungutan resmi Indonesia yang dapat dikonfigurasi fleksibel:

1. **PPN (Pajak Pertambahan Nilai 11% / 12%)**:
   - Untuk Pengusaha Kena Pajak (PKP) atau ritel umum.
   - **Model Eksklusif**: `Pajak = Subtotal × 11%`, `Total Bayar = Subtotal + Pajak`.
   - **Model Inklusif**: `DPP (Dasar Pengenaan Pajak) = Total / (1 + 0.11)`, `Pajak = Total - DPP`.
2. **PB1 (Pajak Restoran / PBJT 10%)**:
   - Pajak Daerah resmi untuk F&B (UU HKPD No. 1 Tahun 2022). Tidak boleh digabung/ganda dengan PPN pusat.
3. **Biaya Layanan (Service Charge 5% - 10%)**:
   - Dikenakan di kafe/resto modern sebelum pengenaan PB1:
     $$\text{Subtotal} = \sum (\text{Qty} \times \text{Harga})$$
     $$\text{Service Charge} = \text{Subtotal} \times 5\%$$
     $$\text{PB1} = (\text{Subtotal} + \text{Service Charge}) \times 10\%$$
     $$\text{Grand Total} = \text{Subtotal} + \text{Service Charge} + \text{PB1}$$

### 6.2 Kepatuhan PPh Final UMKM 0.5% (PP 55/2022)
- Pelaku UMKM dengan omzet di bawah Rp 4,8 Milyar setahun berhak memanfaatkan skema PPh Final 0.5%.
- KADAI menyediakan rekapitulasi **Buku Peredaran Bruto Bulanan** secara otomatis.
- Khusus Wajib Pajak Orang Pribadi (WP OP), sistem memfasilitasi pelacakan akumulasi batas bebas pajak tahunan (PTKP Omzet Rp 500 Juta pertama bebas pajak).

### 6.3 Laporan Keuangan Berstandar SAK EMKM
KADAI menghasilkan 3 instrumen laporan pembukuan formal:
1. **Laporan Laba Rugi (Income Statement)**:
   - Pendapatan Usaha (Revenue Bersih Penjualan)
   - Beban Pokok Penjualan (HPP FIFO Bahan & Barang)
   - Laba Kotor (Gross Profit)
   - Beban Operasional (Gaji, Listrik, Sewa, Penyusutan, Operasional)
   - Laba Bersih Operasional
2. **Laporan Posisi Keuangan (Neraca)**:
   - Aset Lancar: Kas di Laci (Cash Drawer), Kas di Bank, Piutang, Nilai Persediaan Stok (FIFO Valuation)
   - Kewajiban: Utang Usaha (Supplier Pending Payment), Titipan Pajak (PPN/PB1 Belum Disetor)
   - Ekuitas: Modal Pemilik, Laba Ditahan
3. **Laporan Arus Kas (Cash Flow Statement)**:
   - Arus kas dari aktivitas operasi (penerimaan kasir kas/transfer dikurangi pengeluaran operasional dan restock).

---

## 7. MEJA, SELF-ORDER QR CODE, & KITCHEN DISPLAY SYSTEM (KDS)

### 7.1 Alur Pemesanan Self-Order QR Meja
```
   [ Pelanggan di Meja 05 ]
              │
              ▼ (Scan QR Code dengan Kamera HP)
   [ URL: https://kadai.id/order/table-05?token=signed_jwt ]
              │
              ▼ (Buka Web Katalog Interaktif)
   [ Pilih Menu + Opsi Varian: Pedas, Dingin, Catatan ]
              │
              ▼ (Submit Order)
     ┌────────┴────────┐
     ▼                 ▼
[ POS KASIR ]     [ KDS DAPUR & BAR ]
- Status: Unpaid  - Tiket Masuk: Meja 05
- Billing Aktif   - Timer Pesanan Berjalan (00:00)
```

### 7.2 Kitchen Display System (KDS) Real-Time
- **Station Routing**:
  - Item Kategori "Makanan / Dapur" -> Muncul di layar KDS Dapur.
  - Item Kategori "Minuman / Kopi" -> Muncul di layar BDS (Bar Display System).
- **Status State Machine**:
  - `QUEUED` (Pesanan baru masuk, warna Kuning).
  - `COOKING` (Koki mulai menyiapkan, warna Biru).
  - `READY` (Makanan siap saji, panggil pelayan / buzzer, warna Hijau).
  - `SERVED` (Pesanan telah diantar ke meja, arsip).
- **Transport Real-Time**: Menggunakan Server-Sent Events (SSE) atau WebSocket via Node/Next handler yang efisien dan tanpa ketergantungan library berat.

---

## 8. MANAJEMEN MULTI-OUTLET & MULTI-GUDANG

Untuk UMKM yang berkembang membuka cabang atau titik penjualan baru:
1. **Pemisahan Outlet**: Setiap outlet memiliki konfigurasi pajak, laci kasir, daftar meja, dan KDS independen.
2. **Katalog Terpusat vs Parsial**: Produk master dibuat oleh Owner, outlet dapat mengaktifkan produk yang dijual di cabangnya.
3. **Transfer Stok Antar-Cabang (Stock Transfer)**:
   - Outlet A membuat permintaan kirim (Requisition).
   - Gudang Utama mengirim stok (Status: `IN_TRANSIT`, stok Gudang Utama berkurang).
   - Outlet A menerima barang dan verifikasi jumlah fisik (Status: `RECEIVED`, stok Outlet A bertambah di batch baru).

---

## 9. AUDIT CODEBASE EKSISTING & DELTA REKAYASA

Hasil audit teknis terhadap folder `kasir-pro` yang ada saat ini:

| Komponen / Fitur | Status di Codebase Saat Ini | Kebutuhan KADAI Enterprise (Target) |
| :--- | :--- | :--- |
| **Arsitektur Multi-Tenant** | ❌ Single-Tenant (hanya ada tabel `Store` tunggal tanpa pemisahan akun/tenant) | ✅ Multi-Tenant sejati: Tabel `Tenant`, `Subscription`, `TenantUser`, isolasi data ketat via middleware. |
| **Onboarding & Registrasi** | ❌ Hanya login user lokal | ✅ Flow Registrasi UMKM Publik, Wizard Pemilihan Tipe Usaha (Ritel / F&B / Jasa), & Pemilihan Paket Langganan. |
| **Model Persediaan** | ⚠️ Batch FIFO untuk produk jadi langsung saja | ✅ Dual Mode: Produk Jadi Langsung (Ritel) DAN Resep / Bahan Mentah (BOM F&B) dengan auto-deduct FIFO. |
| **Kalkulasi Pajak** | ❌ Hardcoded `taxAmount: 0` pada endpoint sales | ✅ Tax Engine Indonesia: PPN 11%/12%, PB1 Restoran 10%, Service Charge, konfigurasi inklusif/eksklusif. |
| **F&B Meja & QR Order** | ❌ Belum ada | ✅ Manajemen Denah Meja, Generator QR Tokenized Meja, & Halaman Self-Order Mobile Web. |
| **Kitchen Display System** | ❌ Belum ada | ✅ Layar KDS Dapur & Bar Real-time (SSE/WS) dengan pemisahan stasiun & indikator SLA durasi masak. |
| **Standar Akuntansi** | ⚠️ Kas Masuk & Kas Keluar dasar | ✅ Buku Besar, Jurnal Penyesuaian, Laba Rugi SAK EMKM, dan Laporan Rekap Omzet PPh Final 0.5%. |
| **Deployment VPS Dokploy** | ⚠️ Docker Compose lokal | ✅ `dokploy.compose.yml` tersinkronisasi untuk live hosting di VPS `command.ntchost.net`. |

---

## 10. SKEMA DATABASE LENGKAP (EXPANDED PRISMA SCHEMA)

Berikut adalah cetak biru skema database Prisma (`schema.prisma`) hasil refactor untuk mendukung KADAI Multi-Tenant Enterprise:

```prisma
// ============================================================
// KADAI SAAS ENTERPRISE SCHEMA (MULTI-TENANT & MULTI-VERTICAL)
// ============================================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ------------------------------------------------------------
// ENUMS
// ------------------------------------------------------------

enum BusinessType {
  RETAIL
  FNB_CAFE
  FNB_RESTAURANT
  FNB_WARUNG
  SERVICE
  HYBRID
}

enum SubscriptionTier {
  FREE
  STARTER
  PRO_BUSINESS
  ENTERPRISE
}

enum SubscriptionStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  CANCELED
  EXPIRED
}

enum UserRole {
  SUPER_ADMIN // Platform owner
  TENANT_OWNER // Pemilik UMKM
  OUTLET_MANAGER // Manajer Cabang
  CASHIER // Kasir
  KITCHEN_STAFF // Koki / Barista
  INVENTORY_STAFF // Bagian Gudang
}

enum ProductType {
  FINISHED_GOOD // Barang langsung jual (Ritel)
  RAW_MATERIAL // Bahan pokok mentah (Bahan resep F&B)
  MANUFACTURED // Produk olahan jadi ber-resep (Dimsum, Kopi)
  SERVICE // Jasa / Layanan non-fisik
}

enum TaxType {
  NONE
  PPN_11 // Pajak Pertambahan Nilai 11%
  PPN_12 // Pajak Pertambahan Nilai 12%
  PB1_10 // Pajak Restoran / Daerah 10%
  CUSTOM
}

enum OrderType {
  DINE_IN
  TAKEAWAY
  DELIVERY
  ONLINE
}

enum KDSStatus {
  QUEUED
  COOKING
  READY
  SERVED
  CANCELED
}

enum StationType {
  KITCHEN
  BAR
  DESSERT
  GENERAL
}

// ------------------------------------------------------------
// MULTI-TENANCY & SAAS SUBSCRIPTION CORE
// ------------------------------------------------------------

model Tenant {
  id           String             @id @default(cuid())
  slug         String             @unique // misal: kadai.id/kopi-kenangan
  name         String
  legalName    String?
  businessType BusinessType       @default(FNB_CAFE)
  logoUrl      String?
  phone        String?
  email        String?
  address      String?
  status       SubscriptionStatus @default(TRIAL)
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt

  // Subscription Details
  tier               SubscriptionTier @default(FREE)
  currentPeriodStart DateTime         @default(now())
  currentPeriodEnd   DateTime
  maxOutlets         Int              @default(1)
  maxUsers           Int              @default(2)

  // Relations
  users           User[]
  outlets         Outlet[]
  products        Product[]
  categories      Category[]
  suppliers       Supplier[]
  invoices        SubscriptionInvoice[]
  sales           Sale[]
  tables          RestaurantTable[]
  financeAccounts FinanceAccount[]
  activityLogs    ActivityLog[]

  @@map("tenants")
}

model SubscriptionInvoice {
  id             String        @id @default(cuid())
  tenantId       String
  tenant         Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  invoiceNumber  String        @unique
  amount         Decimal       @db.Decimal(15, 2)
  tier           SubscriptionTier
  billingCycle   String        @default("MONTHLY") // MONTHLY, YEARLY
  status         String        @default("PENDING") // PENDING, PAID, EXPIRED
  paymentGateway String?       // MIDTRANS, XENDIT, MANUAL
  paymentRef     String?
  paidAt         DateTime?
  createdAt      DateTime      @default(now())

  @@index([tenantId])
  @@map("subscription_invoices")
}

// ------------------------------------------------------------
// OUTLETS & USERS
// ------------------------------------------------------------

model Outlet {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String
  code        String   // Cabang-01, Cabang-02
  address     String?
  phone       String?
  isMain      Boolean  @default(false)
  isActive    Boolean  @default(true)

  // Pajak & Biaya Layanan per Cabang
  taxType        TaxType  @default(PB1_10)
  taxRate        Decimal  @default(10.00) @db.Decimal(5, 2)
  taxInclusive   Boolean  @default(false)
  serviceChargeRate Decimal @default(0.00) @db.Decimal(5, 2)
  enableRounding Boolean  @default(true) // Pembulatan kasir Rp 100/500

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  users        UserOutlet[]
  tables       RestaurantTable[]
  batches      ProductBatch[]
  sales        Sale[]
  kdsOrders    KDSOrder[]

  @@unique([tenantId, code])
  @@index([tenantId])
  @@map("outlets")
}

model User {
  id           String       @id @default(cuid())
  tenantId     String?
  tenant       Tenant?      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name         String
  email        String       @unique
  passwordHash String
  role         UserRole     @default(CASHIER)
  avatar       String?
  isActive     Boolean      @default(true)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  outlets      UserOutlet[]
  sales        Sale[]
  activityLogs ActivityLog[]

  @@index([tenantId])
  @@map("users")
}

model UserOutlet {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  outletId  String
  outlet    Outlet   @relation(fields: [outletId], references: [id], onDelete: Cascade)

  @@unique([userId, outletId])
  @@map("user_outlets")
}

// ------------------------------------------------------------
// PRODUK, BAHAN BAKU & RESEP (BILL OF MATERIALS / BOM)
// ------------------------------------------------------------

model Product {
  id                String       @id @default(cuid())
  tenantId          String
  tenant            Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name              String
  sku               String
  barcode           String?
  description       String?
  productType       ProductType  @default(FINISHED_GOOD)
  station           StationType  @default(GENERAL) // KITCHEN, BAR untuk KDS
  unit              String       @default("pcs") // pcs, kg, gram, liter, ml
  image             String?
  basePrice         Decimal      @default(0) @db.Decimal(15, 2) // Harga Jual Standar
  lowStockThreshold Int          @default(10)
  isActive          Boolean      @default(true)
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  categoryId        String
  category          Category     @relation(fields: [categoryId], references: [id])
  
  // Relations
  batches           ProductBatch[] // Stok batch jika produk jadi atau bahan pokok
  recipesAsParent   RecipeItem[] @relation("ParentProduct") // Resep yang membentuk produk ini
  recipesAsIngredient RecipeItem[] @relation("IngredientProduct") // Produk ini digunakan sebagai bahan di produk lain
  saleItems         SaleItem[]

  @@unique([tenantId, sku])
  @@index([tenantId, categoryId])
  @@map("products")
}

model RecipeItem {
  id             String   @id @default(cuid())
  parentProductId String  // Produk jadi (misal: Dimsum Ayam Mentai)
  parentProduct  Product  @relation("ParentProduct", fields: [parentProductId], references: [id], onDelete: Cascade)
  ingredientId   String   // Bahan mentah (misal: Daging Ayam Cincang)
  ingredient     Product  @relation("IngredientProduct", fields: [ingredientId], references: [id], onDelete: Cascade)
  quantityNeeded Decimal  @db.Decimal(12, 4) // Jumlah bahan yang dibutuhkan (misal: 0.080 kg)
  unit           String   // gram, ml, lembar
  wastagePercent Decimal  @default(0.00) @db.Decimal(5, 2) // Persentase susut/buang

  @@unique([parentProductId, ingredientId])
  @@map("recipe_items")
}

model ProductBatch {
  id           String    @id @default(cuid())
  outletId     String
  outlet       Outlet    @relation(fields: [outletId], references: [id], onDelete: Cascade)
  productId    String
  product      Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  batchNumber  String
  initialQty   Decimal   @db.Decimal(12, 4)
  remainingQty Decimal   @db.Decimal(12, 4)
  costPrice    Decimal   @db.Decimal(15, 2) // Harga Modal Pembelian
  sellingPrice Decimal   @db.Decimal(15, 2) // Harga Jual (untuk Finished Goods)
  purchaseDate DateTime  @default(now())
  expiryDate   DateTime?
  supplierId   String?
  supplier     Supplier? @relation(fields: [supplierId], references: [id])

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  saleItemBatches SaleItemBatch[]

  @@unique([outletId, batchNumber])
  @@index([outletId, productId, remainingQty])
  @@map("product_batches")
}

// ------------------------------------------------------------
// MEJA & RESTORAN / KAFE ORDERING
// ------------------------------------------------------------

model RestaurantTable {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  outletId  String
  outlet    Outlet   @relation(fields: [outletId], references: [id], onDelete: Cascade)
  tableNo   String   // Meja 01, Meja 02, VIP-1
  section   String   @default("Utama") // Lantai 1, Outdoor, VIP
  capacity  Int      @default(4)
  qrToken   String   @unique @default(cuid()) // Token unik untuk URL QR Code
  isOccupied Boolean @default(false)
  currentSaleId String?

  sales     Sale[]

  @@unique([outletId, tableNo])
  @@map("restaurant_tables")
}

// ------------------------------------------------------------
// TRANSAKSI PENJUALAN & FISKAL
// ------------------------------------------------------------

model Sale {
  id             String      @id @default(cuid())
  tenantId       String
  tenant         Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  outletId       String
  outlet         Outlet      @relation(fields: [outletId], references: [id])
  invoiceNumber  String      @unique
  orderType      OrderType   @default(DINE_IN)
  tableId        String?
  table          RestaurantTable? @relation(fields: [tableId], references: [id])
  
  // Perhitungan Nilai Transaksi
  subtotal       Decimal     @db.Decimal(15, 2)
  discountAmount Decimal     @default(0) @db.Decimal(15, 2)
  serviceCharge  Decimal     @default(0) @db.Decimal(15, 2)
  taxAmount      Decimal     @default(0) @db.Decimal(15, 2) // PPN atau PB1
  roundingAmount Decimal     @default(0) @db.Decimal(8, 2)
  totalAmount    Decimal     @db.Decimal(15, 2)
  totalHPP       Decimal     @db.Decimal(15, 2) // Total Harga Pokok Penjualan FIFO
  grossProfit    Decimal     @db.Decimal(15, 2) // totalAmount - tax - totalHPP

  // Pembayaran
  paymentMethod  String      // CASH, QRIS, BANK_TRANSFER, EDC_CARD
  paymentStatus  String      @default("PAID") // PAID, UNPAID, PARTIAL
  cashierId      String
  cashier        User        @relation(fields: [cashierId], references: [id])
  customerName   String?
  customerPhone  String?
  notes          String?

  isVoided       Boolean     @default(false)
  voidReason     String?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  items          SaleItem[]
  kdsOrders      KDSOrder[]

  @@index([tenantId, outletId, createdAt])
  @@map("sales")
}

model SaleItem {
  id             String          @id @default(cuid())
  saleId         String
  sale           Sale            @relation(fields: [saleId], references: [id], onDelete: Cascade)
  productId      String
  product        Product         @relation(fields: [productId], references: [id])
  quantity       Decimal         @db.Decimal(12, 4)
  unitPrice      Decimal         @db.Decimal(15, 2)
  subtotal       Decimal         @db.Decimal(15, 2)
  totalHPP       Decimal         @db.Decimal(15, 2)
  notes          String?         // misal: "tanpa saus mentai"

  batchAllocations SaleItemBatch[]

  @@map("sale_items")
}

model SaleItemBatch {
  id             String       @id @default(cuid())
  saleItemId     String
  saleItem       SaleItem     @relation(fields: [saleItemId], references: [id], onDelete: Cascade)
  productBatchId String
  productBatch   ProductBatch @relation(fields: [productBatchId], references: [id])
  quantity       Decimal      @db.Decimal(12, 4)
  costPrice      Decimal      @db.Decimal(15, 2)

  @@map("sale_item_batches")
}

// ------------------------------------------------------------
// KITCHEN DISPLAY SYSTEM (KDS)
// ------------------------------------------------------------

model KDSOrder {
  id          String      @id @default(cuid())
  outletId    String
  outlet      Outlet      @relation(fields: [outletId], references: [id], onDelete: Cascade)
  saleId      String
  sale        Sale        @relation(fields: [saleId], references: [id], onDelete: Cascade)
  station     StationType @default(KITCHEN)
  status      KDSStatus   @default(QUEUED)
  itemsJson   Json        // Snapshot detail item untuk tampilan koki
  queuedAt    DateTime    @default(now())
  startedAt   DateTime?
  readyAt     DateTime?
  servedAt    DateTime?

  @@index([outletId, station, status])
  @@map("kds_orders")
}

// ------------------------------------------------------------
// AKUNTANSI & STANDAR KEUANGAN SAK EMKM
// ------------------------------------------------------------

model FinanceAccount {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  accountCode String   // 1101 (Kas), 1102 (Bank), 4101 (Pendapatan), 5101 (HPP)
  accountName String
  category    String   // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
  balance     Decimal  @default(0) @db.Decimal(15, 2)
  createdAt   DateTime @default(now())

  @@unique([tenantId, accountCode])
  @@map("finance_accounts")
}

model Category {
  id          String    @id @default(cuid())
  tenantId    String
  tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String
  description String?
  color       String?
  products    Product[]

  @@unique([tenantId, name])
  @@map("categories")
}

model Supplier {
  id        String         @id @default(cuid())
  tenantId  String
  tenant    Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name      String
  phone     String?
  email     String?
  address   String?
  batches   ProductBatch[]

  @@map("suppliers")
}

model ActivityLog {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  action    String
  entity    String
  entityId  String?
  details   Json?
  ipAddress String?
  createdAt DateTime @default(now())

  @@index([tenantId, createdAt])
  @@map("activity_logs")
}
```

---

## 11. ROADMAP IMPLEMENTASI & TRACKING MILESTONE

Rencana eksekusi terstruktur dibagi menjadi 6 tahap rekayasa bertahap:

### Phase 1: Pondasi SaaS Multi-Tenant & Onboarding Mandiri
- [ ] Refactor Prisma Schema ke model multi-tenant (`Tenant`, `Outlet`, `SubscriptionTier`).
- [ ] Buat Landing Page SaaS KADAI (Fitur, Showcase, Pricing Calculator, FAQ).
- [ ] Implementasi Registration & Onboarding Wizard (Pilih tipe: Toko Ritel vs Dimsum/F&B vs Kafe).
- [ ] Tenant Middleware Context Isolation & Row-Level Protection.

### Phase 2: Tax Calculation Engine & Pembukuan Standar SAK EMKM
- [ ] Implementasi Tax Engine: PPN (11%/12%), PB1 Restoran (10%), Service Charge (5-10%), Toggle inklusif/eksklusif.
- [ ] Laporan Pembukuan SAK EMKM: Laba Rugi Realtime, Posisi Keuangan (Neraca), Arus Kas.
- [ ] Laporan Rekapitulasi Peredaran Bruto untuk Pajak PPh Final UMKM 0.5% (PP 55/2022).

### Phase 3: F&B Recipe Engine (Bill of Materials) & Multi-Batch Auto-Deduction
- [ ] Modul Manajemen Bahan Mentah (Raw Materials) & Konversi Satuan (Kg -> gram, Liter -> ml).
- [ ] Form Pembuatan Resep Produk Jadi (BOM Form) dengan indikator susut (wastage %).
- [ ] Algoritma Transaksional: Penjualan produk F&B memotong stok batch FIFO bahan mentah secara otomatis dan menghitung HPP komposit.

### Phase 4: Meja, Self-Order QR Mobile, & Kitchen Display System (KDS)
- [ ] Manajemen Denah Meja & Generator QR Code ber-token aman per meja.
- [ ] Antarmuka Web Mobile Pelanggan (Responsive PWA) untuk scan QR & order langsung.
- [ ] Layar Kitchen Display System (KDS) & Bar Display System (BDS) dengan Server-Sent Events (SSE).

### Phase 5: Multi-Outlet & Transfer Stok Antar Gudang
- [ ] Manajemen Multi-Cabang & Hak Akses Staff per-Outlet.
- [ ] Modul Transfer Stok: Permintaan kirim, Barang dalam perjalanan (In-Transit), dan Penerimaan fisik.

### Phase 6: Validasi Produksi, Hardening, & Deployment Dokploy VPS
- [ ] Audit menyeluruh via `verify_project.py` (Zero stubs, TypeScript compiling clean, test suite passing).
- [ ] Konfigurasi `dokploy.compose.yml` untuk deployment production ke `command.ntchost.net`.
- [ ] Git commit & push ke `main` remote `ATIOSLab/KADAI`.

---
*Dokumen ini adalah Single Source of Truth arsitektur KADAI dan wajib dijadikan acuan setiap iterasi pengembangan.*
