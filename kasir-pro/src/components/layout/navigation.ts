import {
  BarChart3,
  CircleDollarSign,
  LayoutDashboard,
  Package,
  Receipt,
  ScrollText,
  Settings,
  ShoppingCart,
  Warehouse,
  ChefHat,
  QrCode,
  Scale,
  Truck,
  Users,
  Building,
  ArrowLeftRight,
  type LucideIcon,
} from "lucide-react";
import type { AppRole } from "@/lib/rbac";

export interface NavigationItem {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  roles?: AppRole[];
  businessTypes?: string[]; // Filter sesuai vertikal bisnis toko
}

export interface NavigationSection {
  label: string;
  items: NavigationItem[];
}

export interface PageMeta {
  title: string;
  description: string;
  section: string;
  eyebrow: string;
}

export const navigationSections: NavigationSection[] = [
  {
    label: "Operasional & Transaksi",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard Eksekutif",
        shortLabel: "Dashboard",
        description: "Ringkasan KPI bisnis, omzet harian, dan metrik operasional.",
        icon: LayoutDashboard,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        href: "/pos",
        label: "Point of Sale (POS)",
        shortLabel: "Kasir",
        description: "Terminal kasir cepat, kalkulasi pajak, dan cetak struk.",
        icon: ShoppingCart,
        roles: ["ADMIN", "MANAGER", "CASHIER"],
      },
      {
        href: "/tables",
        label: "Meja & QR Self-Order",
        shortLabel: "Meja",
        description: "Manajemen tata letak meja dan tautan menu QR mandiri.",
        icon: QrCode,
        roles: ["ADMIN", "MANAGER"],
        businessTypes: ["FNB_CAFE", "FNB_RESTAURANT", "FNB_WARUNG"],
      },
      {
        href: "/kds",
        label: "Kitchen Display (KDS)",
        shortLabel: "Dapur",
        description: "Layar monitor antrean tiket dapur dan bar real-time.",
        icon: ChefHat,
        roles: ["ADMIN", "MANAGER", "KITCHEN"],
        businessTypes: ["FNB_CAFE", "FNB_RESTAURANT", "FNB_WARUNG"],
      },
    ],
  },
  {
    label: "Katalog & Rantai Pasok",
    items: [
      {
        href: "/products",
        label: "Produk & Resep (BOM)",
        shortLabel: "Produk",
        description: "Katalog produk, SKU, varian, dan Bill of Materials.",
        icon: Package,
        roles: ["ADMIN", "MANAGER", "INVENTORY"],
      },
      {
        href: "/inventory",
        label: "Persediaan & Multi-Batch",
        shortLabel: "Stok",
        description: "Pelacakan stok multi-batch (FIFO, FEFO, Average), kartu mutasi, dan restock.",
        icon: Warehouse,
        roles: ["ADMIN", "MANAGER", "INVENTORY"],
      },
      {
        href: "/inventory/transfers",
        label: "Transfer Stok Antar Cabang",
        shortLabel: "Transfer",
        description: "Distribusi stok dari gudang/dapur pusat ke cabang gerai & booth.",
        icon: ArrowLeftRight,
        roles: ["ADMIN", "MANAGER", "INVENTORY"],
      },
      {
        href: "/suppliers",
        label: "Pemasok & Vendor",
        shortLabel: "Pemasok",
        description: "Direktori vendor, histori pasokan, dan kontak pengadaan.",
        icon: Truck,
        roles: ["ADMIN", "MANAGER", "INVENTORY"],
      },
    ],
  },
  {
    label: "Pelanggan & CRM",
    items: [
      {
        href: "/customers",
        label: "Pelanggan & Loyalitas",
        shortLabel: "Member",
        description: "Database pelanggan, tier keanggotaan, dan poin reward.",
        icon: Users,
        roles: ["ADMIN", "MANAGER", "CASHIER"],
      },
    ],
  },
  {
    label: "Keuangan & Analitik",
    items: [
      {
        href: "/sales",
        label: "Histori Penjualan",
        shortLabel: "Penjualan",
        description: "Audit invoice, rincian pembayaran, dan kontrol void.",
        icon: Receipt,
        roles: ["ADMIN", "MANAGER", "CASHIER", "ACCOUNTANT"],
      },
      {
        href: "/reports",
        label: "Laporan Bisnis",
        shortLabel: "Laporan",
        description: "Analisis pendapatan, margin kotor, dan tren produk terlaris.",
        icon: BarChart3,
        roles: ["ADMIN", "MANAGER", "ACCOUNTANT"],
      },
      {
        href: "/finance",
        label: "Buku Kas & Keuangan",
        shortLabel: "Keuangan",
        description: "Pantau arus kas (cash flow), laba bersih, dan ledger kas.",
        icon: CircleDollarSign,
        roles: ["ADMIN", "MANAGER", "ACCOUNTANT"],
      },
      {
        href: "/finance/tax",
        label: "Pajak & SAK EMKM",
        shortLabel: "Pajak",
        description: "Kepatuhan PPN 11%, PB1/PBJT 10%, dan PPh Final UMKM 0.5%.",
        icon: Scale,
        roles: ["ADMIN", "MANAGER", "ACCOUNTANT"],
      },
    ],
  },
  {
    label: "Sistem & Multi-Cabang",
    items: [
      {
        href: "/outlets",
        label: "Cabang & Outlet",
        shortLabel: "Cabang",
        description: "Pengaturan multi-cabang, kode fiskal, dan service charge.",
        icon: Building,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        href: "/activity-log",
        label: "Audit Trail & Log",
        shortLabel: "Audit",
        description: "Rekam jejak aktivitas sistem dan otorisasi supervisor.",
        icon: ScrollText,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        href: "/demo-requests",
        label: "Permohonan Demo (Leads)",
        shortLabel: "Demo Leads",
        description: "Kelola & setujui permohonan demo dari calon klien.",
        icon: Users,
        roles: ["ADMIN"],
      },
      {
        href: "/referrals",
        label: "Mitra Referral & Afiliasi",
        shortLabel: "Mitra Referral",
        description: "Kelola mitra marketing, kode referral, dan komisi.",
        icon: ArrowLeftRight,
        roles: ["ADMIN"],
      },
      {
        href: "/settings",
        label: "Pengaturan Sistem",
        shortLabel: "Pengaturan",
        description: "Konfigurasi toko, akun staf, dan hak akses RBAC.",
        icon: Settings,
        roles: ["ADMIN"],
      },
    ],
  },
];

export const bottomTabs = [
  navigationSections[0].items[0], // Dashboard
  navigationSections[0].items[1], // POS
  navigationSections[1].items[0], // Produk
  navigationSections[3].items[0], // Penjualan
  navigationSections[3].items[1], // Laporan
];

export function getBottomTabsForRole(role?: AppRole) {
  switch (role) {
    case "INVENTORY":
      return [
        navigationSections[1].items[0], // Produk
        navigationSections[1].items[1], // Persediaan
        navigationSections[1].items[2], // Transfer
        navigationSections[1].items[3], // Pemasok
      ];
    case "ACCOUNTANT":
      return [
        navigationSections[3].items[0], // Penjualan
        navigationSections[3].items[1], // Laporan
        navigationSections[3].items[2], // Keuangan
        navigationSections[3].items[3], // Pajak
      ];
    case "CASHIER":
    case "KITCHEN":
      return [];
    default:
      return bottomTabs;
  }
}

const pageMetaMap: Record<string, PageMeta> = {
  "/dashboard": {
    title: "Dashboard Eksekutif",
    description: "Ringkasan KPI performa usaha hari ini, omzet, dan indikator penting.",
    section: "Operasional & Transaksi",
    eyebrow: "Ringkasan Bisnis",
  },
  "/pos": {
    title: "Point of Sale (POS)",
    description: "Terminal transaksi kasir berkecepatan tinggi dengan kalkulasi pajak otomatis.",
    section: "Operasional & Transaksi",
    eyebrow: "Terminal Kasir",
  },
  "/products": {
    title: "Katalog Produk & Resep",
    description: "Pusat pengelolaan SKU, penetapan harga jual, dan formula Bill of Materials.",
    section: "Katalog & Rantai Pasok",
    eyebrow: "Katalog & Resep",
  },
  "/inventory": {
    title: "Manajemen Persediaan",
    description: "Pelacakan persediaan berbasis FIFO batch, kartu stok, dan peringatan restock.",
    section: "Katalog & Rantai Pasok",
    eyebrow: "Kontrol Stok",
  },
  "/inventory/transfers": {
    title: "Transfer Stok Antar Cabang",
    description: "Distribusi stok dari Gudang/Dapur Pusat ke gerai cabang & booth kaki lima.",
    section: "Katalog & Rantai Pasok",
    eyebrow: "Distribusi Stok",
  },
  "/suppliers": {
    title: "Pemasok & Vendor",
    description: "Direktori vendor, kontak pengadaan, dan histori penerimaan batch barang.",
    section: "Katalog & Rantai Pasok",
    eyebrow: "Rantai Pasok",
  },
  "/customers": {
    title: "Pelanggan & Loyalitas",
    description: "Database pelanggan, akumulasi pembelanjaan, tiering member, dan poin reward.",
    section: "Pelanggan & CRM",
    eyebrow: "Hubungan Pelanggan",
  },
  "/tables": {
    title: "Manajemen Meja & QR Order",
    description: "Tata letak meja operasional dan generator QR code dining pelanggan.",
    section: "Operasional & Transaksi",
    eyebrow: "Manajemen Meja",
  },
  "/kds": {
    title: "Kitchen Display System (KDS)",
    description: "Antarmuka tiket pesanan real-time untuk stasiun dapur (Kitchen) dan bar.",
    section: "Operasional & Transaksi",
    eyebrow: "Operasional Dapur",
  },
  "/sales": {
    title: "Histori Penjualan",
    description: "Audit menyeluruh transaksi penjualan, invoice digital, dan validasi pembatalan (void).",
    section: "Keuangan & Analitik",
    eyebrow: "Buku Penjualan",
  },
  "/reports": {
    title: "Laporan Performa Bisnis",
    description: "Analisis tren penjualan, estimasi laba kotor, dan komparasi performa kategori.",
    section: "Keuangan & Analitik",
    eyebrow: "Analitik Bisnis",
  },
  "/finance": {
    title: "Buku Kas & Keuangan",
    description: "Rekapitulasi arus kas masuk dan keluar (cash flow) serta posisi likuiditas.",
    section: "Keuangan & Analitik",
    eyebrow: "Akuntansi & Kas",
  },
  "/finance/tax": {
    title: "Kepatuhan Pajak & SAK EMKM",
    description: "Rekapitulasi perpajakan PPN 11%, PB1/PBJT 10%, dan PPh Final 0.5% PP 55/2022.",
    section: "Keuangan & Analitik",
    eyebrow: "Kepatuhan Pajak",
  },
  "/outlets": {
    title: "Multi-Cabang & Outlet",
    description: "Pengelolaan unit usaha multi-cabang, parameter fiskal, dan service charge.",
    section: "Sistem & Multi-Cabang",
    eyebrow: "Jaringan Cabang",
  },
  "/activity-log": {
    title: "Audit Trail & Keamanan",
    description: "Rekam jejak aktivitas operasional, verifikasi PIN supervisor, dan audit sistem.",
    section: "Sistem & Multi-Cabang",
    eyebrow: "Audit Keamanan",
  },
  "/settings": {
    title: "Pengaturan Sistem",
    description: "Konfigurasi entitas bisnis, manajemen hak akses staf (RBAC), dan preferensi POS.",
    section: "Sistem & Multi-Cabang",
    eyebrow: "Pengaturan Sistem",
  },
  "/profile": {
    title: "Profil Pengguna",
    description: "Informasi kredensial pengguna, role wewenang aktif, dan pembaruan keamanan sandi.",
    section: "Akun Pengguna",
    eyebrow: "Akun Saya",
  },
};

const allNavigationItems = navigationSections.flatMap((section) => section.items);

export function isActivePath(pathname: string, href: string) {
  if (href === "/pos") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getPageMeta(pathname: string): PageMeta {
  const matchedPath = Object.keys(pageMetaMap)
    .sort((a, b) => b.length - a.length)
    .find((path) => isActivePath(pathname, path));

  return matchedPath
    ? pageMetaMap[matchedPath]
    : {
        title: "KADAI",
        description: "Workspace operasional untuk toko dan kasir Anda.",
        section: "Ruang Kerja",
        eyebrow: "Ringkasan",
      };
}

export function getCurrentNavigationItem(pathname: string) {
  return allNavigationItems.find((item) => isActivePath(pathname, item.href));
}
