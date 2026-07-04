# 📦 KASIR PRO — POS Application Concept Document

> **Version:** 1.0 · **Date:** 3 Juli 2026 · **Status:** Draft  
> **Stack:** Next.js 16 (App Router) · PostgreSQL · Prisma · Neobrutalism UI  
> **Author:** System Analyst

---

## 1. Executive Summary

**KASIR PRO** adalah aplikasi Point of Sale (POS) fullstack yang dirancang untuk UMKM dan retail kecil-menengah. Aplikasi ini tidak hanya menangani transaksi penjualan, tetapi juga mengelola **inventory berbasis batch (FIFO)** sehingga mampu:

- Melacak harga modal (cost price) dan harga jual (selling price) **per batch pembelian**
- Menghitung HPP (Harga Pokok Penjualan) secara akurat berdasarkan metode FIFO
- Otomatis menyesuaikan harga jual ketika harga modal naik, **tanpa mengubah harga stok lama**
- Menyediakan audit trail lengkap untuk setiap transaksi

---

## 2. Problem Statement

| Masalah | Dampak |
|---------|--------|
| Harga modal naik, tapi penjual tidak tau HPP sebenarnya | Margin profit tidak akurat, bisa rugi tanpa sadar |
| Stok lama dan baru dicampur dengan satu harga | Perhitungan untung/rugi menyesatkan |
| Tidak ada log siapa yang melakukan transaksi | Sulit audit, rawan penyalahgunaan |
| Laporan penjualan manual / spreadsheet | Lambat, error-prone, tidak real-time |

---

## 3. Core Concept: Batch-Based FIFO Inventory

### Bagaimana Cara Kerjanya?

```
Pembelian Batch 1: 100 unit @ Rp 10.000 (modal) → Harga Jual: Rp 15.000
Pembelian Batch 2:  50 unit @ Rp 12.000 (modal) → Harga Jual: Rp 17.000  ← harga naik!

Stok Total: 150 unit
├── 100 unit masih dijual @ Rp 15.000 (dari Batch 1)
└──  50 unit dijual @ Rp 17.000 (dari Batch 2)

Saat penjualan 120 unit:
├── 100 unit dari Batch 1 → HPP = 100 × Rp 10.000 = Rp 1.000.000
└──  20 unit dari Batch 2 → HPP =  20 × Rp 12.000 = Rp   240.000
    Total HPP = Rp 1.240.000
    Revenue   = (100 × 15.000) + (20 × 17.000) = Rp 1.840.000
    Laba Kotor = Rp 600.000
```

### Prinsip Utama

1. **Setiap pembelian/restock = 1 Batch baru** dengan cost_price dan selling_price sendiri
2. **FIFO (First In, First Out)**: Stok terlama dijual lebih dulu
3. **Harga baru TIDAK retroaktif**: Stok lama tetap dijual dengan harga lama
4. **HPP dihitung per-item per-batch** saat transaksi terjadi
5. **Margin otomatis**: Sistem bisa suggest harga jual berdasarkan markup % dari harga modal baru

---

## 4. User Roles & Permissions

| Role | Kode | Hak Akses |
|------|------|-----------|
| **Owner/Admin** | `ADMIN` | Full access: dashboard, CRUD produk, manage user, laporan, settings |
| **Kasir** | `CASHIER` | Transaksi penjualan, lihat stok (read-only), lihat riwayat transaksi sendiri |
| **Manajer** | `MANAGER` | Dashboard, laporan, CRUD produk, restock, lihat semua log |

---

## 5. Feature Breakdown

### 5.1 Manajemen Produk (Product Management)

- **CRUD Produk**: nama, SKU, barcode, kategori, satuan, gambar, deskripsi
- **Kategori Produk**: hierarki 1 level (misal: Makanan, Minuman, Alat Tulis)
- **Input Batch Pembelian**:
  - Jumlah unit
  - Harga modal per unit (cost_price)
  - Harga jual per unit (selling_price) — bisa manual atau auto-calculate dari markup %
  - Tanggal pembelian
  - Supplier (opsional)
- **Riwayat Harga**: Lihat semua perubahan harga modal & jual dari waktu ke waktu
- **Auto Markup Suggestion**: Saat input batch baru, sistem suggest harga jual = cost_price × (1 + markup%)

### 5.2 Manajemen Stok (Inventory Management)

- **Real-time Stock Level**: Total stok per produk (sum dari semua batch yang remaining > 0)
- **Stock per Batch**: Detail stok yang tersisa per batch (FIFO order)
- **Low Stock Alert**: Notifikasi ketika stok di bawah threshold
- **Stock Opname**: Fitur adjustment stok manual dengan alasan (rusak, hilang, expired)
- **Stock Movement Log**: Masuk (restock), keluar (penjualan), adjustment

### 5.3 Transaksi Penjualan (Sales / POS)

- **POS Interface**: Tampilan kasir yang intuitif dan cepat
  - Cari produk via nama, SKU, atau barcode
  - Tambah ke keranjang
  - Lihat harga jual (otomatis dari batch FIFO terlama)
  - Quantity adjustment
  - Diskon per item atau per transaksi
- **FIFO Auto-Deduction**: Sistem otomatis memotong stok dari batch terlama
- **Multi-Batch dalam 1 Item**: Jika quantity melebihi batch pertama, lanjut ke batch berikutnya
- **Metode Pembayaran**: Tunai, Transfer Bank, QRIS, E-Wallet
- **Struk Digital**: Generate receipt (bisa print thermal atau download PDF)
- **Hold & Resume**: Tahan transaksi, lanjutkan nanti

### 5.4 HPP & Kalkulasi Profit

- **HPP per Transaksi**: Dihitung real-time saat checkout
- **HPP per Produk**: Weighted average dari batch yang terjual
- **Gross Profit per Transaksi**: Revenue - HPP
- **Gross Profit per Produk**: Agregasi dari semua penjualan
- **Margin Analysis**: Persentase margin per produk, per kategori, per periode

### 5.5 Activity Log (Audit Trail)

- **Log Otomatis** untuk setiap aksi:
  - Penjualan: siapa kasir, kapan, item apa, total berapa
  - Restock: siapa yang input, batch details
  - Produk: siapa yang create/update/delete
  - Stok Adjustment: siapa, alasan, quantity berubah
  - Login/Logout: timestamp, IP address
- **Filter & Search Log**: by user, by action type, by date range
- **Export Log**: CSV / Excel

### 5.6 Dashboard & Analytics

#### Summary Cards
- Total Penjualan Hari Ini (Rp)
- Total Transaksi Hari Ini (#)
- Rata-rata Nilai Transaksi
- Gross Profit Hari Ini
- Stok Produk Low Stock Count
- Total Produk Aktif

#### Charts & Grafik
| Chart | Tipe | Data |
|-------|------|------|
| Revenue Trend | Line/Area Chart | Penjualan harian/mingguan/bulanan |
| Profit Trend | Line Chart | Gross profit over time |
| Top Selling Products | Horizontal Bar Chart | 10 produk terlaris (by qty atau revenue) |
| Sales by Category | Pie/Donut Chart | Distribusi penjualan per kategori |
| HPP vs Revenue | Stacked Bar Chart | Perbandingan cost vs revenue per periode |
| Hourly Sales Pattern | Bar Chart | Jam-jam sibuk penjualan |
| Payment Method Distribution | Pie Chart | Proporsi metode pembayaran |
| Margin per Produk | Bar Chart | Top/bottom margin products |
| Stock Turnover | Bar Chart | Produk dengan perputaran stok tercepat/terlambat |
| Cashier Performance | Bar Chart | Jumlah transaksi per kasir |

#### Filters
- Date Range Picker (hari ini, 7 hari, 30 hari, custom)
- Filter by Kategori
- Filter by Kasir

### 5.7 Laporan (Reports)

- **Laporan Penjualan Harian/Bulanan**: Detail per transaksi
- **Laporan HPP**: Cost analysis per produk dan per periode
- **Laporan Stok**: Current stock, stock movement, stock valuation
- **Laporan Profit/Loss**: Revenue vs HPP vs Gross Profit
- **Export**: PDF dan Excel

### 5.8 Settings & Konfigurasi

- **Store Profile**: Nama toko, alamat, logo, info kontak (untuk struk)
- **Default Markup %**: Persentase markup default untuk auto-calculate harga jual
- **Low Stock Threshold**: Default jumlah minimum sebelum alert
- **Mata Uang & Format**: IDR, format angka Indonesia
- **Tax/PPN Settings**: Apakah harga include PPN atau exclude

---

## 6. Database Design (ERD)

### 6.1 Entity List

| # | Entity | Deskripsi |
|---|--------|-----------|
| 1 | User | Pengguna sistem (admin, kasir, manajer) |
| 2 | Store | Informasi toko |
| 3 | Category | Kategori produk |
| 4 | Product | Master data produk |
| 5 | ProductBatch | Batch pembelian dengan harga modal & jual |
| 6 | Supplier | Data supplier (opsional) |
| 7 | Sale | Header transaksi penjualan |
| 8 | SaleItem | Detail item dalam transaksi |
| 9 | SaleItemBatch | Mapping item ke batch (FIFO deduction) |
| 10 | StockAdjustment | Adjustment stok manual |
| 11 | ActivityLog | Audit trail semua aksi |
| 12 | PaymentMethod | Master metode pembayaran |

### 6.2 Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// ENUM DEFINITIONS
// ============================================================

enum UserRole {
  ADMIN
  MANAGER
  CASHIER
}

enum PaymentType {
  CASH
  BANK_TRANSFER
  QRIS
  E_WALLET
}

enum AdjustmentReason {
  DAMAGED
  LOST
  EXPIRED
  STOCK_OPNAME
  OTHER
}

enum ActionType {
  // Sale actions
  SALE_CREATED
  SALE_VOIDED
  // Product actions
  PRODUCT_CREATED
  PRODUCT_UPDATED
  PRODUCT_DELETED
  // Batch/Restock actions
  BATCH_CREATED
  // Stock actions
  STOCK_ADJUSTED
  // User actions
  USER_LOGIN
  USER_LOGOUT
  USER_CREATED
  USER_UPDATED
}

// ============================================================
// CORE ENTITIES
// ============================================================

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  passwordHash  String
  role          UserRole  @default(CASHIER)
  avatar        String?
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  sales         Sale[]
  activityLogs  ActivityLog[]
  stockAdjustments StockAdjustment[]

  @@map("users")
}

model Store {
  id          String   @id @default(cuid())
  name        String
  address     String?
  phone       String?
  email       String?
  logo        String?
  taxRate     Decimal  @default(0) @db.Decimal(5, 2)  // PPN percentage
  taxInclusive Boolean @default(true)                  // harga sudah include PPN?
  defaultMarkup Decimal @default(30) @db.Decimal(5, 2) // default markup %
  currency    String   @default("IDR")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("stores")
}

model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  description String?
  color       String?   // warna tag untuk UI
  icon        String?   // icon identifier dari Flaticon
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  products    Product[]

  @@map("categories")
}

model Supplier {
  id          String    @id @default(cuid())
  name        String
  phone       String?
  email       String?
  address     String?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  batches     ProductBatch[]

  @@map("suppliers")
}

model Product {
  id              String    @id @default(cuid())
  name            String
  sku             String    @unique
  barcode         String?   @unique
  description     String?
  unit            String    @default("pcs")  // pcs, kg, liter, box, dll
  image           String?
  lowStockThreshold Int     @default(10)
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  categoryId      String
  category        Category  @relation(fields: [categoryId], references: [id])
  batches         ProductBatch[]
  saleItems       SaleItem[]
  stockAdjustments StockAdjustment[]

  @@index([categoryId])
  @@index([name])
  @@map("products")
}

// ============================================================
// BATCH-BASED INVENTORY (FIFO CORE)
// ============================================================

model ProductBatch {
  id              String    @id @default(cuid())
  batchNumber     String    @unique  // auto-generated: BATCH-{productSKU}-{YYYYMMDD}-{seq}
  quantity         Int       // jumlah unit yang dibeli
  remainingQty     Int       // sisa stok dari batch ini
  costPrice       Decimal   @db.Decimal(15, 2)  // harga modal per unit
  sellingPrice    Decimal   @db.Decimal(15, 2)  // harga jual per unit
  purchaseDate    DateTime  @default(now())
  expiryDate      DateTime?
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  productId       String
  product         Product   @relation(fields: [productId], references: [id])
  supplierId      String?
  supplier        Supplier? @relation(fields: [supplierId], references: [id])
  saleItemBatches SaleItemBatch[]

  @@index([productId, remainingQty])  // untuk FIFO query
  @@index([productId, purchaseDate])  // untuk FIFO ordering
  @@map("product_batches")
}

// ============================================================
// SALES & TRANSACTIONS
// ============================================================

model Sale {
  id              String      @id @default(cuid())
  invoiceNumber   String      @unique  // auto: INV-{YYYYMMDD}-{seq}
  subtotal        Decimal     @db.Decimal(15, 2)
  discountAmount  Decimal     @default(0) @db.Decimal(15, 2)
  taxAmount       Decimal     @default(0) @db.Decimal(15, 2)
  totalAmount     Decimal     @db.Decimal(15, 2)
  totalCost       Decimal     @db.Decimal(15, 2)  // total HPP
  grossProfit     Decimal     @db.Decimal(15, 2)  // totalAmount - totalCost
  paymentType     PaymentType
  paymentRef      String?     // referensi pembayaran (no. transfer, dll)
  customerName    String?
  notes           String?
  isVoided        Boolean     @default(false)
  voidedAt        DateTime?
  voidReason      String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Relations
  cashierId       String
  cashier         User        @relation(fields: [cashierId], references: [id])
  items           SaleItem[]

  @@index([cashierId])
  @@index([createdAt])
  @@index([invoiceNumber])
  @@map("sales")
}

model SaleItem {
  id              String    @id @default(cuid())
  quantity        Int
  unitPrice       Decimal   @db.Decimal(15, 2)  // harga jual saat transaksi
  totalPrice      Decimal   @db.Decimal(15, 2)  // quantity × unitPrice
  totalCost       Decimal   @db.Decimal(15, 2)  // total HPP item ini
  discountAmount  Decimal   @default(0) @db.Decimal(15, 2)
  createdAt       DateTime  @default(now())

  // Relations
  saleId          String
  sale            Sale      @relation(fields: [saleId], references: [id], onDelete: Cascade)
  productId       String
  product         Product   @relation(fields: [productId], references: [id])
  batchAllocations SaleItemBatch[]

  @@index([saleId])
  @@index([productId])
  @@map("sale_items")
}

// Tabel pivot: mencatat dari batch mana unit-unit diambil (FIFO)
model SaleItemBatch {
  id              String    @id @default(cuid())
  quantity        Int       // jumlah yang diambil dari batch ini
  costPrice       Decimal   @db.Decimal(15, 2)  // snapshot harga modal saat jual
  sellingPrice    Decimal   @db.Decimal(15, 2)  // snapshot harga jual saat jual
  createdAt       DateTime  @default(now())

  // Relations
  saleItemId      String
  saleItem        SaleItem  @relation(fields: [saleItemId], references: [id], onDelete: Cascade)
  productBatchId  String
  productBatch    ProductBatch @relation(fields: [productBatchId], references: [id])

  @@index([saleItemId])
  @@index([productBatchId])
  @@map("sale_item_batches")
}

// ============================================================
// STOCK ADJUSTMENT
// ============================================================

model StockAdjustment {
  id              String           @id @default(cuid())
  quantityChange  Int              // positif = tambah, negatif = kurang
  reason          AdjustmentReason
  notes           String?
  createdAt       DateTime         @default(now())

  // Relations
  productId       String
  product         Product          @relation(fields: [productId], references: [id])
  userId          String
  user            User             @relation(fields: [userId], references: [id])

  @@index([productId])
  @@index([userId])
  @@map("stock_adjustments")
}

// ============================================================
// AUDIT TRAIL
// ============================================================

model ActivityLog {
  id          String     @id @default(cuid())
  action      ActionType
  entity      String     // nama entity: "Sale", "Product", "Batch", dll
  entityId    String?    // ID dari entity yang terkena aksi
  details     Json?      // detail perubahan dalam format JSON
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime   @default(now())

  // Relations
  userId      String
  user        User       @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([action])
  @@index([createdAt])
  @@index([entity, entityId])
  @@map("activity_logs")
}
```

### 6.3 Relasi Antar Tabel

```
User ──1:N── Sale (cashier)
User ──1:N── ActivityLog
User ──1:N── StockAdjustment

Category ──1:N── Product

Supplier ──1:N── ProductBatch

Product ──1:N── ProductBatch
Product ──1:N── SaleItem
Product ──1:N── StockAdjustment

ProductBatch ──1:N── SaleItemBatch

Sale ──1:N── SaleItem

SaleItem ──1:N── SaleItemBatch
SaleItem ──N:1── Product

SaleItemBatch ──N:1── SaleItem
SaleItemBatch ──N:1── ProductBatch
```

---

## 7. FIFO Deduction Algorithm

### Pseudocode saat Checkout

```
function processSale(cartItems):
  for each item in cartItems:
    remainingQty = item.quantity
    itemCost = 0
    
    // Ambil batch berurutan dari yang terlama (FIFO)
    batches = getBatches(item.productId)
                .where(remainingQty > 0)
                .orderBy(purchaseDate ASC)
    
    for each batch in batches:
      if remainingQty <= 0: break
      
      deductQty = min(remainingQty, batch.remainingQty)
      
      // Catat alokasi
      createSaleItemBatch({
        quantity: deductQty,
        costPrice: batch.costPrice,      // snapshot
        sellingPrice: batch.sellingPrice  // snapshot
      })
      
      // Update batch
      batch.remainingQty -= deductQty
      
      // Hitung HPP
      itemCost += deductQty * batch.costPrice
      remainingQty -= deductQty
    
    if remainingQty > 0:
      throw Error("Stok tidak cukup!")
    
    saleItem.totalCost = itemCost
  
  // Hitung total sale
  sale.totalCost = sum(saleItems.totalCost)
  sale.grossProfit = sale.totalAmount - sale.totalCost
```

### Penentuan Harga Jual di POS

Saat kasir menambahkan produk ke keranjang, harga yang ditampilkan diambil dari **batch FIFO terlama yang masih ada stok**:

```
function getSellingPrice(productId):
  batch = ProductBatch
    .where(productId, remainingQty > 0)
    .orderBy(purchaseDate ASC)
    .first()
  
  return batch.sellingPrice
```

Jika quantity yang dibeli melebihi stok batch pertama, sistem otomatis split ke batch berikutnya dengan harga masing-masing. Di receipt, customer melihat harga rata-rata tertimbang atau detail per-batch (konfigurasi toko).

---

## 8. Page Structure & Navigation

### 8.1 Sitemap

```
/                         → Redirect ke /dashboard
/login                    → Login page
/dashboard                → Dashboard utama dengan charts
/pos                      → POS / Kasir interface (fullscreen)
/products                 → List produk
/products/new             → Tambah produk baru
/products/[id]            → Detail & edit produk
/products/[id]/batches    → Riwayat batch pembelian
/inventory                → Overview stok semua produk
/inventory/restock        → Form input batch pembelian baru
/inventory/adjustments    → Stock adjustment history
/sales                    → List semua transaksi
/sales/[id]               → Detail transaksi + receipt
/reports                  → Reports hub
/reports/daily            → Laporan harian
/reports/hpp              → Laporan HPP
/reports/profit           → Laporan profit/loss
/reports/stock            → Laporan stok
/activity-log             → Activity log browser
/settings                 → Settings halaman utama
/settings/store           → Konfigurasi toko
/settings/users           → Manage users
/settings/payment         → Payment methods
```

### 8.2 Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  Top Navbar (logo, search, notifications, user)      │
├──────────┬──────────────────────────────────────────┤
│          │                                           │
│ Sidebar  │              Main Content                 │
│ (nav     │                                           │
│  links)  │  ┌─────────────────────────────────┐     │
│          │  │  Page Header + Breadcrumb         │     │
│  - Dash  │  ├─────────────────────────────────┤     │
│  - POS   │  │                                   │     │
│  - Prod  │  │  Page Content                     │     │
│  - Inv   │  │                                   │     │
│  - Sales │  │                                   │     │
│  - Rpt   │  │                                   │     │
│  - Log   │  │                                   │     │
│  - Set   │  │                                   │     │
│          │  └─────────────────────────────────┘     │
│          │                                           │
├──────────┴──────────────────────────────────────────┤
│  Footer (optional, minimal)                          │
└─────────────────────────────────────────────────────┘

Mobile: Sidebar → Bottom Tab Bar (5 primary tabs)
POS Page: Fullscreen, no sidebar (dedicated kasir mode)
```

---

## 9. Dashboard Specification

### 9.1 Summary Cards Row (4-6 cards)

| # | Card | Value | Icon | Warna |
|---|------|-------|------|-------|
| 1 | Penjualan Hari Ini | Rp X.XXX.XXX | 💰 | Hijau |
| 2 | Jumlah Transaksi | XX transaksi | 🛒 | Biru |
| 3 | Gross Profit | Rp X.XXX.XXX | 📈 | Kuning |
| 4 | Rata-rata Transaksi | Rp X.XXX | 📊 | Ungu |
| 5 | Low Stock Alert | XX produk | ⚠️ | Merah |
| 6 | Total Produk Aktif | XX produk | 📦 | Orange |

### 9.2 Chart Layout

```
Row 1: [Revenue Trend - Area Chart (span 8)] [Payment Pie Chart (span 4)]
Row 2: [Top 10 Products - Bar Chart (span 6)] [Sales by Category - Donut (span 6)]
Row 3: [HPP vs Revenue - Stacked Bar (span 8)] [Margin Leaders - Horizontal Bar (span 4)]
Row 4: [Hourly Pattern - Bar (span 6)] [Cashier Performance - Bar (span 6)]
```

### 9.3 Chart Library

Menggunakan **Recharts** yang sudah di-style oleh neobrutalism-components. Semua chart mendapat treatment neobrutalism: bold borders, high-contrast colors, thick strokes.

---

## 10. Tech Stack Details

### 10.1 Frontend

| Layer | Technology | Keterangan |
|-------|-----------|------------|
| Framework | Next.js 16 (App Router) | Server Components + Client Components |
| Styling | Tailwind CSS v4 | Dengan CSS variables dari neobrutalism |
| Component Library | shadcn/ui + Neobrutalism styling | Bold borders, high contrast |
| Charts | Recharts (via neobrutalism charts) | Area, Bar, Line, Pie, Donut |
| Icons | Flaticon (SVG/PNG) | Import sebagai React components |
| Forms | React Hook Form + Zod | Validation client & server side |
| State | Zustand / React Context | Cart state di POS |
| Date Handling | date-fns | Locale ID support |
| Data Table | TanStack Table | Sorting, filtering, pagination |

### 10.2 Backend (Next.js API / Server Actions)

| Layer | Technology | Keterangan |
|-------|-----------|------------|
| API | Route Handlers + Server Actions | RESTful untuk CRUD, Server Actions untuk mutations |
| ORM | Prisma | Type-safe queries, migrations |
| Database | PostgreSQL | Via Neon / Supabase / self-hosted |
| Auth | Better Auth | Session-based, role-based access |
| Validation | Zod | Shared schemas client ↔ server |
| File Upload | UploadThing / S3 | Gambar produk, logo toko |
| PDF Generation | @react-pdf/renderer | Struk & laporan |

### 10.3 Development Tools

| Tool | Keterangan |
|------|------------|
| TypeScript | Strict mode |
| ESLint + Prettier | Code consistency |
| Prisma Studio | Database GUI |
| Docker Compose | PostgreSQL local |

---

## 11. Responsive Design Strategy

### 11.1 Breakpoints

```css
/* Mobile First */
@media (min-width: 320px)  { /* Mobile        */ }
@media (min-width: 768px)  { /* Tablet        */ }
@media (min-width: 1024px) { /* Desktop       */ }
@media (min-width: 1440px) { /* Large Desktop */ }
```

### 11.2 Adaptive Behavior per Breakpoint

| Component | Mobile (320-767) | Tablet (768-1023) | Desktop (1024-1439) | Large (1440+) |
|-----------|------------------|-------------------|---------------------|---------------|
| Navigation | Bottom tab bar (5 items) | Collapsed sidebar (icons) | Full sidebar | Full sidebar + wider |
| Dashboard Cards | 1 kolom, scroll | 2 kolom grid | 3 kolom grid | 4-6 kolom grid |
| Charts | Full width, stacked | 2 per row | Layout sesuai spec | Layout sesuai spec |
| Data Tables | Card view (stacked) | Horizontal scroll | Full table | Full table + extra cols |
| POS Interface | Fullscreen, simple | Split: produk + cart | Split: produk + cart | Split + keyboard shortcuts |
| Forms | Single column | Single column | 2 column | 2 column |
| Modals | Fullscreen sheet | Center modal | Center modal | Center modal |

### 11.3 POS Mobile Experience

Di mobile, POS interface menjadi mode kasir khusus:
- Tab 1: Scan/cari produk
- Tab 2: Keranjang (floating badge count)
- Tab 3: Checkout
- Swipe gestures untuk navigasi cepat

---

## 12. Neobrutalism Design Tokens

### 12.1 Core Style Properties

```css
:root {
  /* Neobrutalism signature: bold borders, offset shadows */
  --border: 2px solid #000;           /* thick black borders */
  --shadow: 4px 4px 0px #000;         /* hard offset shadow */
  --radius: 0.5rem;                    /* moderate radius */
  
  /* Color Palette (bold, high-contrast) */
  --bg-main: #FEFCE8;                 /* warm yellow-ish white */
  --bg-card: #FFFFFF;
  --accent-primary: #FF6B35;          /* bold orange */
  --accent-secondary: #004E89;        /* deep blue */
  --accent-success: #2D6A4F;          /* rich green */
  --accent-warning: #FFB703;          /* bright yellow */
  --accent-danger: #D62828;           /* strong red */
  --accent-purple: #7209B7;           /* vibrant purple */
  
  /* Text */
  --text-primary: #1A1A1A;
  --text-secondary: #4A4A4A;
  --text-muted: #8A8A8A;
}
```

### 12.2 Component Style Rules

- Semua card dan container: **2px solid black border + 4px offset shadow**
- Buttons: **bold, thick border, hover = shadow offset berubah**
- Inputs: **thick border, no subtle gradients**
- Tables: **visible grid lines, alternating row colors (bold)**
- Charts: **thick strokes, bold colors, no subtle gradients**
- Tags/badges: **pill shape, thick border, contrasting bg**

---

## 13. Security & Non-Functional Requirements

| ID | Requirement | Detail |
|----|-------------|--------|
| NFR-001 | Authentication | Session-based via Better Auth, httpOnly cookies |
| NFR-002 | Authorization | Role-based middleware per route group |
| NFR-003 | Audit Trail | Setiap mutasi tercatat di ActivityLog |
| NFR-004 | Data Integrity | Database transactions untuk operasi FIFO |
| NFR-005 | Performance | Dashboard load < 2 detik, POS search < 500ms |
| NFR-006 | Responsive | Optimal di 320px sampai 1440px+ |
| NFR-007 | Data Backup | Daily automated backup (PostgreSQL pg_dump) |
| NFR-008 | Input Sanitization | Zod validation di semua endpoints |
| NFR-009 | Rate Limiting | Max 100 req/min per user untuk API |
| NFR-010 | Error Handling | Global error boundary + toast notifications |

---

## 14. Suggested Development Phases

### Phase 1 — Foundation (Week 1-2)
- Project setup: Next.js + Prisma + PostgreSQL + Better Auth
- Neobrutalism styling setup
- Auth flow (login, register, session)
- Role-based layout & middleware

### Phase 2 — Product & Inventory Core (Week 3-4)
- CRUD Produk + Kategori
- Batch input system (restock)
- FIFO stock calculation engine
- Stock overview page

### Phase 3 — POS & Transactions (Week 5-6)
- POS interface (product search, cart, checkout)
- FIFO deduction implementation
- HPP calculation per transaction
- Receipt generation
- Payment method handling

### Phase 4 — Dashboard & Analytics (Week 7-8)
- Dashboard with all summary cards
- All charts (Recharts + neobrutalism styling)
- Date range filtering
- Activity log page

### Phase 5 — Reports & Polish (Week 9-10)
- Report generation (PDF + Excel export)
- Settings pages
- Stock adjustment & opname
- Low stock notifications
- Responsive fine-tuning
- Testing & bug fixing

---

## 15. Folder Structure (Next.js App Router)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── products/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── batches/page.tsx
│   │   ├── inventory/
│   │   │   ├── page.tsx
│   │   │   ├── restock/page.tsx
│   │   │   └── adjustments/page.tsx
│   │   ├── sales/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── reports/
│   │   │   ├── page.tsx
│   │   │   ├── daily/page.tsx
│   │   │   ├── hpp/page.tsx
│   │   │   ├── profit/page.tsx
│   │   │   └── stock/page.tsx
│   │   ├── activity-log/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   ├── store/page.tsx
│   │   │   ├── users/page.tsx
│   │   │   └── payment/page.tsx
│   │   └── layout.tsx
│   ├── (pos)/
│   │   ├── pos/
│   │   │   └── page.tsx
│   │   └── layout.tsx          ← fullscreen layout, no sidebar
│   ├── api/
│   │   ├── auth/[...all]/route.ts
│   │   ├── products/route.ts
│   │   ├── batches/route.ts
│   │   ├── sales/route.ts
│   │   ├── inventory/route.ts
│   │   ├── reports/route.ts
│   │   └── activity-log/route.ts
│   ├── layout.tsx
│   └── globals.css             ← neobrutalism CSS variables
├── components/
│   ├── ui/                     ← shadcn + neobrutalism components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── chart.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── navbar.tsx
│   │   ├── bottom-tab.tsx      ← mobile navigation
│   │   └── breadcrumb.tsx
│   ├── pos/
│   │   ├── product-search.tsx
│   │   ├── cart.tsx
│   │   ├── cart-item.tsx
│   │   ├── checkout-dialog.tsx
│   │   └── receipt.tsx
│   ├── dashboard/
│   │   ├── summary-cards.tsx
│   │   ├── revenue-chart.tsx
│   │   ├── top-products-chart.tsx
│   │   ├── category-chart.tsx
│   │   └── ...
│   └── shared/
│       ├── data-table.tsx
│       ├── date-range-picker.tsx
│       ├── currency-display.tsx
│       └── empty-state.tsx
├── lib/
│   ├── prisma.ts               ← Prisma client singleton
│   ├── auth.ts                 ← Better Auth config
│   ├── utils.ts                ← cn() helper, formatters
│   ├── fifo.ts                 ← FIFO deduction logic
│   ├── hpp.ts                  ← HPP calculation
│   └── validators/
│       ├── product.ts          ← Zod schemas
│       ├── sale.ts
│       ├── batch.ts
│       └── user.ts
├── hooks/
│   ├── use-cart.ts             ← POS cart state
│   ├── use-products.ts
│   └── use-dashboard.ts
├── types/
│   └── index.ts                ← shared TypeScript types
└── prisma/
    ├── schema.prisma
    ├── seed.ts
    └── migrations/
```

---

## 16. Key API Endpoints

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| POST | /api/auth/login | Login | Public |
| POST | /api/auth/logout | Logout | All |
| GET | /api/products | List produk (search, filter, paginate) | All |
| POST | /api/products | Tambah produk baru | Admin, Manager |
| PUT | /api/products/:id | Update produk | Admin, Manager |
| DELETE | /api/products/:id | Soft delete produk | Admin |
| GET | /api/products/:id/batches | List batch per produk | All |
| POST | /api/batches | Input batch baru (restock) | Admin, Manager |
| GET | /api/inventory | Overview stok semua produk | All |
| POST | /api/inventory/adjustment | Stock adjustment | Admin, Manager |
| GET | /api/sales | List transaksi | Manager, Admin |
| POST | /api/sales | Buat transaksi baru (checkout) | Cashier, Admin |
| GET | /api/sales/:id | Detail transaksi | All |
| POST | /api/sales/:id/void | Void transaksi | Admin |
| GET | /api/dashboard/summary | Summary cards data | Manager, Admin |
| GET | /api/dashboard/charts/:type | Chart data by type | Manager, Admin |
| GET | /api/reports/:type | Generate report | Manager, Admin |
| GET | /api/activity-log | Cari activity log | Admin |
| GET | /api/settings/store | Get store config | Admin |
| PUT | /api/settings/store | Update store config | Admin |
| GET | /api/users | List users | Admin |
| POST | /api/users | Create user | Admin |
| PUT | /api/users/:id | Update user | Admin |

---

## Appendix A: Glossary

| Term | Definisi |
|------|----------|
| **HPP** | Harga Pokok Penjualan — total biaya untuk membeli/memproduksi barang yang terjual |
| **FIFO** | First In, First Out — metode valuasi inventory: stok terlama dijual duluan |
| **Batch** | Sekumpulan unit produk yang dibeli sekaligus dengan harga modal yang sama |
| **Gross Profit** | Pendapatan penjualan dikurangi HPP |
| **Margin** | Persentase keuntungan terhadap harga jual: (selling - cost) / selling × 100 |
| **SKU** | Stock Keeping Unit — kode unik identifikasi produk |
| **POS** | Point of Sale — sistem untuk memproses transaksi penjualan |
| **Stock Opname** | Proses penghitungan fisik stok dan penyesuaian dengan data sistem |
| **Void** | Membatalkan transaksi yang sudah diproses |
