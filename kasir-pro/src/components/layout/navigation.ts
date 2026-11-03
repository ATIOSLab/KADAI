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
    label: "Operasional",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        shortLabel: "Home",
        description: "Pantau ringkasan bisnis dan performa toko.",
        icon: LayoutDashboard,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        href: "/pos",
        label: "POS / Kasir",
        shortLabel: "Kasir",
        description: "Mulai transaksi baru dan kelola keranjang.",
        icon: ShoppingCart,
        roles: ["ADMIN", "CASHIER"],
      },
      {
        href: "/products",
        label: "Produk",
        shortLabel: "Produk",
        description: "Kelola katalog, harga jual, dan SKU.",
        icon: Package,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        href: "/inventory",
        label: "Inventori",
        shortLabel: "Stok",
        description: "Cek stok masuk, batch, dan restock.",
        icon: Warehouse,
        roles: ["ADMIN", "MANAGER", "CASHIER"],
      },
      {
        href: "/tables",
        label: "Meja & QR Order",
        shortLabel: "Meja",
        description: "Kelola meja kafe/resto dan QR Code self-order.",
        icon: QrCode,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        href: "/kds",
        label: "Layar Dapur (KDS)",
        shortLabel: "Dapur",
        description: "Kitchen & Bar Display pesanan aktif real-time.",
        icon: ChefHat,
        roles: ["ADMIN", "MANAGER", "CASHIER"],
      },
    ],
  },
  {
    label: "Analitik",
    items: [
      {
        href: "/sales",
        label: "Penjualan",
        shortLabel: "Sales",
        description: "Lihat histori transaksi dan detail invoice.",
        icon: Receipt,
        roles: ["ADMIN", "MANAGER", "CASHIER"],
      },
      {
        href: "/reports",
        label: "Laporan",
        shortLabel: "Laporan",
        description: "Analisis revenue, profit, dan tren kategori.",
        icon: BarChart3,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        href: "/finance",
        label: "Laporan Keuangan",
        shortLabel: "Keuangan",
        description: "Pantau arus kas, modal, pengeluaran, dan saldo bisnis.",
        icon: CircleDollarSign,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        href: "/finance/tax",
        label: "Pajak & SAK EMKM",
        shortLabel: "Pajak",
        description: "Rekapitulasi perpajakan PPN, PB1, dan PPh Final 0.5% PP 55/2022.",
        icon: Scale,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
  {
    label: "Sistem",
    items: [
      {
        href: "/activity-log",
        label: "Activity Log",
        shortLabel: "Log",
        description: "Audit aktivitas penting di aplikasi.",
        icon: ScrollText,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        href: "/settings",
        label: "Pengaturan",
        shortLabel: "Setelan",
        description: "Atur profil toko dan preferensi aplikasi.",
        icon: Settings,
        roles: ["ADMIN"],
      },
    ],
  },
];

export const bottomTabs = [
  navigationSections[0].items[0],
  navigationSections[0].items[2],
  navigationSections[0].items[1],
  navigationSections[1].items[0],
  navigationSections[2].items[1],
];

const pageMetaMap: Record<string, PageMeta> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Ringkasan performa toko hari ini dan insight yang perlu dipantau.",
    section: "Operasional",
    eyebrow: "Overview",
  },
  "/pos": {
    title: "Point of Sale",
    description: "Proses transaksi lebih cepat dengan tampilan kasir yang fokus.",
    section: "Operasional",
    eyebrow: "Checkout",
  },
  "/products": {
    title: "Produk",
    description: "Kelola produk, SKU, harga jual, dan status stok dalam satu tempat.",
    section: "Operasional",
    eyebrow: "Catalog",
  },
  "/inventory": {
    title: "Inventori",
    description: "Pantau stok per batch, nilai persediaan, dan kebutuhan restock.",
    section: "Operasional",
    eyebrow: "Warehouse",
  },
  "/tables": {
    title: "Meja & QR Code",
    description: "Atur meja kafe/restoran dan cetak QR Code self-order pelanggan.",
    section: "Operasional",
    eyebrow: "Dining",
  },
  "/kds": {
    title: "Kitchen Display System",
    description: "Layar monitor pesanan aktif untuk dapur dan bar secara real-time.",
    section: "Operasional",
    eyebrow: "Kitchen",
  },
  "/sales": {
    title: "Penjualan",
    description: "Review transaksi, invoice, metode pembayaran, dan performa kasir.",
    section: "Analitik",
    eyebrow: "Revenue",
  },
  "/reports": {
    title: "Laporan",
    description: "Baca tren penjualan, gross profit, dan kategori terlaris dengan cepat.",
    section: "Analitik",
    eyebrow: "Insights",
  },
  "/finance": {
    title: "Laporan Keuangan",
    description: "Lihat arus kas bisnis, saldo, pemasukan, dan pengeluaran dalam satu ledger.",
    section: "Analitik",
    eyebrow: "Cashflow",
  },
  "/finance/tax": {
    title: "Pajak & SAK EMKM",
    description: "Rekapitulasi perpajakan PPN, PB1, dan PPh Final 0.5% PP 55/2022.",
    section: "Analitik",
    eyebrow: "Tax Compliance",
  },
  "/activity-log": {
    title: "Activity Log",
    description: "Lacak perubahan penting untuk audit dan histori operasional.",
    section: "Sistem",
    eyebrow: "Audit Trail",
  },
  "/settings": {
    title: "Pengaturan",
    description: "Sesuaikan informasi toko, akun admin, dan perilaku aplikasi.",
    section: "Sistem",
    eyebrow: "Preferences",
  },
  "/profile": {
    title: "Profil",
    description: "Lihat informasi akun Anda dan ubah password dengan aman.",
    section: "Akun",
    eyebrow: "My Account",
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
        section: "Workspace",
        eyebrow: "Overview",
      };
}

export function getCurrentNavigationItem(pathname: string) {
  return allNavigationItems.find((item) => isActivePath(pathname, item.href));
}
