# 🛡️ KADAI SAAS RBAC & COMMERCIAL ACCESS CONTROL BLUEPRINT
## Arsitektur Autentikasi, Otorisasi Hirarkis Multi-Tenant, & Entitlement SaaS Komersial

> **Dokumen Spesifikasi Keamanan & Sistem Akses Produksi**  
> **Status:** Master Security Specification (Commercial Tier) — **SUPER_ADMIN implemented 14 Nov 2026** (lihat DOCS/KADAI_SUPERADMIN_RBAC_IMPLEMENTATION_PLAN.md & KADAI_RBAC_TEST_GUIDE.md §7)  
> **Version:** 2.2.0 (SUPER_ADMIN Platform Operator — Implemented)  
> **Author & Architect:** Netkrida (@netkridabot) for Irvan  
> **Product Target:** KADAI SaaS POS Platform (`https://kadai.asia`)  
> **Repository:** `ATIOSLab/KADAI` (`main` branch)

---

## DAFTAR ISI (TABLE OF CONTENTS)
1. [Latar Belakang & Filosofi RBAC Komersial](#1-latar-belakang--filosofi-rbac-komersial)
2. [Hirarki Akses 3-Lapisan (Three-Tier Multi-Tenant Isolation)](#2-hirarki-akses-3-lapisan-three-tier-multi-tenant-isolation)
3. [Daftar Role Standar & Tanggung Jawab Operasional](#3-daftar-role-standar--tanggung-jawab-operasional)
4. [Matriks Perizinan Granular (Fine-Grained Permission Matrix)](#4-matriks-perizinan-granular-fine-grained-permission-matrix)
5. [Aksi Sensitif, Otorisasi Supervisor, & Anti-Fraud Kasir](#5-aksi-sensitif-otorisasi-supervisor--anti-fraud-kasir)
6. [Multi-Outlet Scoping (Akses Lintas Cabang yang Fleksibel)](#6-multi-outlet-scoping-akses-lintas-cabang-yang-fleksibel)
7. [Entitlement Engine & SaaS Subscription Gating](#7-entitlement-engine--saas-subscription-gating)
8. [Implementasi Enkapsulasi Keamanan (Anti-IDOR & Server Authority)](#8-implementasi-enkapsulasi-keamanan-anti-idor--server-authority)
9. [Skema Database Lengkap Prisma (RBAC & Multi-Tenant Scoping)](#9-skema-database-lengkap-prisma-rbac--multi-tenant-scoping)
10. [Strategi Monetisasi B2B SaaS (Packaging, Per-Seat, & Enterprise Add-ons)](#10-strategi-monetisasi-b2b-saas-packaging-per-seat--enterprise-add-ons)

---

## 1. LATAR BELAKANG & FILOSOFI RBAC KOMERSIAL

Dalam perangkat lunak B2B SaaS POS (*Point of Sale*) dan Operasi Bisnis ritel/kuliner, sistem hak akses bukan sekadar fitur teknis pembagian akun, melainkan **fondasi bisnis dan proteksi finansial utama bagi merchant**. 

Pelaku usaha UMKM dan jaringan retail/restoran menghadapi risiko kebocoran kas dan manipulasi stok nyata setiap hari:
1. **Kasir curang membatalkan transaksi (*void scam*)**: Kasir menerima uang tunai dari pelanggan, lalu membatalkan transaksi di sistem dan mengantongi uangnya.
2. **Diskon sepihak (*unauthorized markdown*)**: Kasir memberikan diskon kepada teman tanpa izin pemilik toko.
3. **Pencurian stok bahan (*inventory shrinkage*)**: Staf gudang mengubah angka stok opname tanpa jejak audit.
4. **Kebocoran data rahasia (*tenant isolation breach*)**: Satu penyewa SaaS tidak boleh melihat data transaksi, supplier, laba, atau resep rahasia penyewa lainnya.

### Filosofi Inti:
- **Zero Trust, Server-Authoritative**: Tampilan UI yang disembunyikan (*hidden button*) bukan pengamanan. Setiap Server Action dan Route Handler memvalidasi `tenantId`, `outletId`, dan `permission` di layer server terdalam.
- **Dual-Layer RBAC + PBAC**: Pengguna memiliki Role (misal: `CASHIER`), tetapi otorisasi dijalankan berdasarkan izin atomik (misal: `sale:void`, `stock:adjust`).
- **Supervisor PIN Approval**: Aksi berbahaya tidak diblokir mutlak, tetapi membutuhkan otorisasi instan melalui kode PIN Supervisor/Manager di layar POS tanpa perlu logout.

---

## 2. HIRARKI AKSES 3-LAPISAN (THREE-TIER MULTI-TENANT ISOLATION)

Sistem KADAI membagi kedaulatan akses ke dalam 3 lingkaran kewenangan terisolasi:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LEVEL 1: PLATFORM LEVEL                         │
│                     (Superadmin / Operator KADAI)                      │
│ - Mengelola langganan penyewa, billing gateway, global system metrics   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         LEVEL 2: TENANT LEVEL                          │
│               (Pemilik Usaha / Owner PT / Franchisee Master)           │
│ - Mengontrol seluruh cabang, rekening bank, rekap pajak SAK EMKM, staf │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         LEVEL 3: OUTLET LEVEL                          │
│                 (Unit Kerja / Cabang Toko / Kafe / Resto)              │
│ - Dibatasi hanya pada operasional kasir, meja, KDS, & stok cabang lokal│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. DAFTAR ROLE STANDAR & TANGGUNG JAWAB OPERASIONAL

KADAI menyediakan 7 Role bawaan yang mencakup seluruh spektrum operasi ritel dan kuliner:

| Role Identitas | Lingkup (Scope) | Tanggung Jawab & Batas Akses |
| :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Platform-Wide | Operator internal platform KADAI. Mengelola status langganan tenant, pemeliharaan sistem, dan billing master. Dilarang melihat data transaksi spesifik penyewa kecuali izin audit hukum. |
| **`TENANT_OWNER`** | Seluruh Tenant | Pemilik sah bisnis UMKM / Resto. Memiliki kuasa mutlak atas laporan laba rugi, konfigurasi pajak PPN/PB1, penambahan outlet cabang, penentuan harga jual, dan manajemen staf. |
| **`STORE_MANAGER`** | Per-Outlet / Multi-Outlet | Manajer operasional cabang. Berhak memberikan persetujuan void kasir, mengatur shift laci kasir (cash drawer), menerima transfer barang gudang, dan melihat laporan penjualan cabang. |
| **`CASHIER` (Kasir)** | Khusus Outlet Terdaftar | Mengoperasikan POS kasir, memilih meja, menerima pembayaran (Cash/QRIS/Transfer), dan mencetak struk. Dibatasi dari melihat HPP modal produk, total laba bersih toko, dan dilarang void tanpa PIN Manager. |
| **`KITCHEN_STAFF`** | Khusus Stasiun KDS | Koki dapur, barista bar, atau staf persiapan. Hanya dapat mengakses layar KDS (`/kds`) untuk memperbarui status masakan (*Queued -> Cooking -> Ready -> Served*). Nol akses ke kasir dan keuangan. |
| **`INVENTORY_STAFF`**| Gudang / Outlet | Mengelola penerimaan barang dari supplier, mencatat batch pembelian (harga modal & expired), mutasi stok, dan stok opname. |
| **`ACCOUNTANT`** | Read-Only Tenant | Auditor pembukuan atau akuntan eksternal. Akses read-only ke Laporan Keuangan SAK EMKM, Buku Peredaran Bruto PPh Final 0.5%, dan histori faktur pajak tanpa izin modifikasi kasir. |

---

## 4. MATRIKS PERIZINAN GRANULAR (FINE-GRAINED PERMISSION MATRIX)

Izin atomik (*granular permissions*) didefinisikan dengan notasi `<domain>:<action>`:

```
[ Domain ]          [ Aksi ]
pos                 read, checkout, custom_discount, open_drawer, hold_cart
sale                read, export, void, refund, re_print
table               read, create, update, delete, view_qr
kds                 read, update_status
product             read, create, update, delete, view_cost_price
recipe_bom          read, create, update, delete
inventory           read, restock, adjust_opname, transfer
finance             read_ledger, create_entry, edit_entry, view_profit
tax_report          view_tax, export_spt
store_settings      view, update_profile, configure_tax, manage_roles
staff               view, create, update, deactivate
```

### Tabel Matriks Akses Baku KADAI:

| Fitur / Aksi Atomik | OWNER | MANAGER | CASHIER | KITCHEN | INVENTORY | ACCOUNTANT |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Akses POS Kasir** (`pos:checkout`) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Diskon Bebas Kasir** (`pos:custom_discount`) | ✅ | ✅ (Max 50%) | ⚠️ (Max 10%) | ❌ | ❌ | ❌ |
| **Buka Laci Kasir Manual** (`pos:open_drawer`) | ✅ | ✅ | ⚠️ (Audit Log) | ❌ | ❌ | ❌ |
| **Batalkan Transaksi / Void** (`sale:void`) | ✅ | ✅ | 🔒 (Perlu PIN) | ❌ | ❌ | ❌ |
| **Lihat Harga Pokok (HPP) / Modal** (`product:view_cost`) | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Atur Resep BOM F&B** (`recipe_bom:update`) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Layar Dapur Real-time** (`kds:read`, `kds:update`) | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Stok Opname / Penyesuaian** (`inventory:adjust`) | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Penerimaan Restock Supplier** (`inventory:restock`) | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Laporan Laba Rugi & Neraca** (`finance:view_profit`) | ✅ | ⚠️ (Omzet saja) | ❌ | ❌ | ❌ | ✅ |
| **Rekap Pajak PPN/PB1 & PPh 0.5%** (`tax:view`) | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Ubah Konfigurasi Pajak & Profil Toko** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Tambah & Hapus Akun Staf** (`staff:manage`) | ✅ | ⚠️ (Kasir saja) | ❌ | ❌ | ❌ | ❌ |

---

## 5. AKSI SENSITIF, OTORISASI SUPERVISOR, & ANTI-FRAUD KASIR

### 5.1 Mekanisme "Supervisor PIN Authorization"
Ketika kasir perlu melakukan aksi yang berada di luar batas wewenangnya (misalnya: membatalkan transaksi yang sudah dibayar, memberikan diskon di atas 10%, atau menghapus pesanan yang sudah terkirim ke dapur):

```
       [ Kasir Menekan Tombol "Void Transaksi" ]
                          │
                          ▼
            Apakah Kasir Memiliki Izin?
                   ├── Ya ──► [ Transaksi Langsung Dibatalkan ]
                   └── Tidak
                          │
                          ▼
         [ Modal Popup: "Masukkan PIN Supervisor" ]
                          │
                          ▼ (Manager Memasukkan 6-Digit PIN)
            Verifikasi Hash PIN via API
                   ├── Valid ──► 1. Transaksi Dibatalkan
                   │             2. Rekam di Activity Log:
                   │                - Kasir Peminta: Budi
                   │                - Supervisor Penyetujui: Pak Slamet (Manager)
                   │                - Alasan: "Salah input menu oleh pelanggan"
                   └── Gagal ──► Tolak Aksi & Catat Peringatan Fraud
```

### 5.2 Pencatatan Audit Trail Mutlak (Inviolable Audit Logs)
Setiap mutasi laci uang, perubahan harga, dan penghapusan data secara hukum wajib mencatat:
- `timestamp` (Waktu presisi UTC).
- `tenantId` & `outletId`.
- `userId` (Eksekutor) & `approvedByUserId` (Supervisor jika ada).
- `action` (`SALE_VOIDED`, `CASH_DRAWER_MANUAL_OPEN`, `STOCK_ADJUSTMENT`).
- `metadata` berisi delta snapshot data sebelum vs sesudah kejadian.
- `ipAddress` dan `userAgent` perangkat kasir.

---

## 6. MULTI-OUTLET SCOPING (AKSES LINTAS CABANG YANG FLEKSIBEL)

Pada bisnis yang berkembang menjadi jaringan cabang (franchise / multi-outlet):
1. **User Bisa Memiliki Relasi di Banyak Outlet**:
   - Contoh: Rina adalah `STORE_MANAGER` di Cabang Menteng, tetapi hanya berstatus `CASHIER` bantuan jika ditugaskan piket di Cabang Kemang.
2. **Context Switching di Layar POS**:
   - Jika pengguna memiliki akses ke lebih dari satu outlet, sistem menampilkan dropdown pemilihan cabang aktif pada header.
   - Sesi kasir mengunci transaksi ke `currentActiveOutletId`.

---

## 7. ENTITLEMENT ENGINE & SAAS SUBSCRIPTION GATING

Sebagai produk SaaS yang dijual ke publik, RBAC bekerja berdampingan dengan **Entitlement Engine** (Mesin Hak Paket Langganan). Izin staf tidak dapat melampaui batasan paket langganan penyewa:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        EVALUASI OTORISASI GANDA                        │
│                                                                        │
│                [ User Meminta Aksi: "Buka Layar KDS" ]                 │
│                                   │                                    │
│       1. Cek Subscription Tier: Apakah Tenant Berlangganan PRO?        │
│                    ├── TIDAK ──► ⛔ Tolak: "Fitur butuh Paket Pro"     │
│                    └── YA                                              │
│                         │                                              │
│       2. Cek Role Staf: Apakah User Memiliki Hak `kds:read`?           │
│                    ├── TIDAK ──► ⛔ Tolak: "Akses Ditolak (403)"       │
│                    └── YA    ──► ✅ Izinkan Buka Layar KDS             │
└────────────────────────────────────────────────────────────────────────┘
```

### Matriks Entitlement Berdasarkan Tier:

| Kapabilitas / Limit | FREE (Rp 0) | STARTER (Rp 99rb) | PRO (Rp 249rb) | ENTERPRISE (Rp 599rb) |
| :--- | :---: | :---: | :---: | :---: |
| **Maksimal Cabang (Outlet)** | 1 Cabang | 1 Cabang | 3 Cabang | Unlimited Cabang |
| **Maksimal Akun Kasir** | 1 Akun | 3 Akun | Unlimited Akun | Unlimited Akun |
| **Bahan Baku & Resep BOM** | ❌ | ❌ | ✅ | ✅ |
| **Meja & Self-Order QR HP** | ❌ | ❌ | ✅ | ✅ |
| **Kitchen Display System (KDS)** | ❌ | ❌ | ✅ | ✅ |
| **Pajak & SAK EMKM Lengkap** | Dasar | ✅ | ✅ | ✅ |
| **Custom Role & Custom Permission** | ❌ | ❌ | ❌ | ✅ (Enterprise Saja) |
| **Audit Trail Retention** | 7 Hari | 30 Hari | 1 Tahun | Permanen (Unlimited) |

---

## 8. IMPLEMENTASI ENKAPSULASI KEAMANAN (ANTI-IDOR & SERVER AUTHORITY)

### 8.1 Standar Server Action / API Boundary Guard
Setiap request ke backend diverifikasi menggunakan helper deterministik:

```typescript
// src/lib/rbac/guard.ts
export async function assertAuthorized(
  req: NextRequest,
  requiredPermission: PermissionKey,
  targetOutletId?: string
) {
  const session = await getServerSessionUser(req);
  if (!session) {
    throw new AuthorizationError("UNAUTHORIZED", 401, "Sesi login tidak valid");
  }

  // 1. Verifikasi Status Langganan Tenant
  const tenant = await getTenantSubscription(session.tenantId);
  if (tenant.status !== "ACTIVE" && tenant.status !== "TRIAL") {
    throw new AuthorizationError("SUBSCRIPTION_EXPIRED", 402, "Masa langganan telah berakhir");
  }

  // 2. Verifikasi Batasan Paket (Entitlement)
  if (!isFeatureEnabledForTier(tenant.tier, requiredPermission)) {
    throw new AuthorizationError("FEATURE_LOCKED", 403, "Fitur ini memerlukan upgrade paket");
  }

  // 3. Verifikasi Role & Hak Akses Atomik Pengguna
  const userPermissions = await resolveUserPermissions(session.userId, targetOutletId);
  if (!userPermissions.includes(requiredPermission)) {
    throw new AuthorizationError("FORBIDDEN", 403, "Role Anda tidak memiliki izin untuk aksi ini");
  }

  return { session, tenant };
}
```

### 8.2 Proteksi Anti-IDOR pada Layer Data (Tenant Isolation Invariant)
Dilarang keras melakukan query data hanya berdasarkan `id` primer saja:

```typescript
// ❌ RENTAN IDOR / BOLA (JANGAN PERNAH DITULIS):
await prisma.sale.update({
  where: { id: saleId },
  data: { isVoided: true }
});

// ✅ SERVER-AUTHORITATIVE ANTI-IDOR (STANDAR KADAI):
await prisma.sale.update({
  where: { 
    id: saleId,
    tenantId: session.tenantId, // Pastikan data mutlak milik tenant login
    outletId: session.activeOutletId // Pastikan di outlet yang sedang berwenang
  },
  data: { isVoided: true }
});
```

---

## 9. SKEMA DATABASE LENGKAP PRISMA (RBAC & MULTI-TENANT SCOPING)

Model Prisma terstandarisasi untuk mendukung fleksibilitas RBAC SaaS komersial:

```prisma
// ============================================================
// COMMERCIAL SAAS RBAC & USER MANAGEMENT SCHEMA
// ============================================================

model Tenant {
  id           String             @id @default(cuid())
  slug         String             @unique
  name         String
  businessType String             @default("FNB_CAFE")
  tier         SubscriptionTier   @default(PRO_BUSINESS)
  status       SubscriptionStatus @default(ACTIVE)
  maxOutlets   Int                @default(1)
  maxUsers     Int                @default(5)
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt

  users        TenantUser[]
  outlets      Outlet[]
  customRoles  Role[]

  @@map("tenants")
}

model User {
  id            String       @id @default(cuid())
  email         String       @unique
  name          String
  passwordHash  String
  supervisorPin String?      // Hash 6-digit PIN untuk otorisasi instan di POS
  avatar        String?
  isActive      Boolean      @default(true)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  tenants       TenantUser[]
  outletAccess  UserOutletRole[]
  activityLogs  ActivityLog[]

  @@map("users")
}

// Hubungan Pengguna dengan Tenant (Bisa Multi-Tenant jika 1 user punya banyak bisnis)
model TenantUser {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  isOwner   Boolean  @default(false)
  createdAt DateTime @default(now())

  @@unique([tenantId, userId])
  @@map("tenant_users")
}

// Definisi Role (Bisa System-Default atau Custom Role milik Enterprise Tenant)
model Role {
  id          String           @id @default(cuid())
  tenantId    String?          // Null = Role Standar Global, Not Null = Custom Role Tenant
  tenant      Tenant?          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  code        String           // OWNER, MANAGER, CASHIER, KITCHEN, CUSTOM_SPV
  name        String           // Kasir Utama, Supervisor Shift Pagi
  description String?
  isSystem    Boolean          @default(false)

  permissions RolePermission[]
  userOutlets UserOutletRole[]

  @@unique([tenantId, code])
  @@map("roles")
}

model Permission {
  id          String           @id @default(cuid())
  key         String           @unique // pos:checkout, sale:void, recipe:update
  module      String           // POS, SALES, INVENTORY, FINANCE, KDS
  name        String
  description String?

  roles       RolePermission[]

  @@map("permissions")
}

model RolePermission {
  id           String     @id @default(cuid())
  roleId       String
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permissionId String
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@map("role_permissions")
}

// Penugasan Role Staf per Cabang Toko
model UserOutletRole {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  outletId  String
  outlet    Outlet   @relation(fields: [outletId], references: [id], onDelete: Cascade)
  roleId    String
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, outletId, roleId])
  @@map("user_outlet_roles")
}
```

---

## 10. STRATEGI MONETISASI B2B SAAS (PACKAGING, PER-SEAT, & ENTERPRISE ADD-ONS)

Model RBAC ini dirancang untuk mendongkrak **Average Revenue Per User (ARPU)** dan konversi langganan:

### 10.1 Pemicu Upgrade Organik (*Upgrade Triggers*)
1. **Pemicu Tambah Kasir / Karyawan**:
   - Pemilik toko di paket Free/Starter yang omzetnya bertambah pasti akan merekrut kasir tambahan. Ketika kasir ke-4 ditambahkan, sistem memicu upgrade ke **Paket Pro**.
2. **Pemicu Pemisahan Dapur (KDS)**:
   - Kedai kopi atau dimsum yang mulai ramai membutuhkan koki dapur melihat tiket order tanpa melihat kasir. Fitur login stasiun dapur (*Kitchen Role*) otomatis menjadi pemicu upgrade ke **Paket Pro**.
3. **Pemicu Kemitraan / Franchise (Multi-Outlet Role Scoping)**:
   - Pemilik membuka cabang ke-2 atau ke-3. Pembagian akses per cabang (*Store Manager Cabang A vs Cabang B*) memicu monetisasi multi-outlet.

### 10.2 Add-ons Komersial Mandiri (*A La Carte Monetization*)
- **Seat Kasir Ekstra**: Rp 25.000 / akun kasir tambahan / bulan (di luar jatah paket).
- **Custom Role & Permission Builder**: Add-on khusus Rp 99.000 / bulan untuk bisnis yang ingin meracik hak akses sendiri secara custom tanpa upgrade ke full Enterprise.
- **Enterprise Dedicated Audit Retention**: Rp 150.000 / bulan untuk penyimpanan log audit hingga 5 tahun bagi korporasi yang wajib diaudit pajak/investor.

---
*Dokumen ini merupakan cetak biru resmi arsitektur keamanan dan RBAC komersial KADAI.*
