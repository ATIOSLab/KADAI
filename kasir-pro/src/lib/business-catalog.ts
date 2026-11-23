import {
  Coffee,
  Hammer,
  PartyPopper,
  Pill,
  Shirt,
  Scissors,
  ShoppingBag,
  Soup,
  Utensils,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { APP_ROLES, type AppRole } from "@/lib/rbac";

/**
 * KATALOG VERTIKAL USAHA KADAI — satu sumber kebenaran (single source of truth)
 * untuk: kategori usaha, tipe usaha, modul yang aktif per tipe, peran staf yang
 * relevan, dan konfigurasi pajak khas vertikal.
 *
 * Aturan turunan (dipakai oleh UI & test):
 *  - navigation.ts memakai `typesWithModule(key)` sebagai filter `businessTypes`
 *    (tidak boleh ada array tipe yang di-hardcode di menu).
 *  - Form pendaftaran & provisioning memakai BUSINESS_CATEGORIES + getBusinessProfile.
 *  - Validator Zod memakai BUSINESS_TYPE_KEYS (paritas dengan enum schema).
 */

// ── TIPE USAHA (harus paritas dengan `enum BusinessType` di prisma/schema.prisma)
export const BUSINESS_TYPE_KEYS = [
  "RETAIL",
  "FNB_CAFE",
  "FNB_RESTAURANT",
  "FNB_WARUNG",
  "CATERING",
  "SERVICE",
  "LAUNDRY",
  "BUILDING_SUPPLY",
  "PHARMACY",
] as const;

export type BusinessTypeKey = (typeof BUSINESS_TYPE_KEYS)[number];

/** Vertikal default saat pendaftaran/provisioning (dipakai UI & validator). */
export const DEFAULT_BUSINESS_TYPE: BusinessTypeKey = "FNB_CAFE";

// ── MODUL (halaman fitur yang bisa aktif/tidak aktif per vertikal)
export const MODULE_KEYS = [
  "dashboard",
  "pos",
  "tables",
  "kds",
  "catering",
  "laundry",
  "products",
  "units",
  "inventory",
  "suppliers",
  "customers",
  "sales",
  "shifts",
  "reports",
  "finance",
  "outlets",
  "activityLog",
  "settings",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export type BusinessModule = {
  key: ModuleKey;
  label: string;
  path: string;
  section: string;
  description: string;
  /** universal = tersedia untuk SEMUA vertikal (tanpa filter businessTypes di menu) */
  universal: boolean;
  /** Rute API milik modul ini (untuk gating vertikal di middleware). */
  apiPaths?: readonly string[];
  /** Pola rute tambahan (mis. rute dinamis /api/sales/[id]/catering-payment). */
  routePattern?: RegExp;
};

export const MODULES: Record<ModuleKey, BusinessModule> = {
  dashboard: {
    key: "dashboard",
    label: "Dashboard KPI",
    path: "/dashboard",
    section: "Operasional & Transaksi",
    description: "Ringkasan omzet, KPI, dan metrik operasional.",
    universal: true,
  },
  pos: {
    key: "pos",
    label: "Point of Sale (Kasir)",
    path: "/pos",
    section: "Operasional & Transaksi",
    description: "Terminal kasir cepat, pajak, dan cetak struk.",
    universal: true,
  },
  tables: {
    key: "tables",
    label: "Meja & QR Self-Order",
    path: "/tables",
    section: "Operasional & Transaksi",
    description: "Tata letak meja dan menu QR mandiri untuk dine-in.",
    universal: false,
    apiPaths: ["/api/tables"],
  },
  kds: {
    key: "kds",
    label: "Kitchen Display (Dapur)",
    path: "/kds",
    section: "Operasional & Transaksi",
    description: "Antrean tiket dapur & bar real-time.",
    universal: false,
    apiPaths: ["/api/kds"],
  },
  catering: {
    key: "catering",
    label: "Booking Catering & DP",
    path: "/catering",
    section: "Operasional & Transaksi",
    description: "Booking acara, uang muka, sisa tagihan, tahap produksi.",
    universal: false,
    routePattern: /^\/api\/sales\/[^/]+\/catering-(payment|status)(\/|$)/,
  },
  laundry: {
    key: "laundry",
    label: "Work Order Laundry",
    path: "/laundry",
    section: "Operasional & Transaksi",
    description: "Order pencucian satuan & kiloan dengan pelacakan proses.",
    universal: false,
    apiPaths: ["/api/laundry", "/api/laundry/jobs"],
  },
  products: {
    key: "products",
    label: "Produk & Resep (BOM)",
    path: "/products",
    section: "Katalog & Rantai Pasok",
    description: "Katalog produk, SKU, varian, dan Bill of Materials.",
    universal: true,
  },
  units: {
    key: "units",
    label: "Satuan & Konversi",
    path: "/units",
    section: "Katalog & Rantai Pasok",
    description: "Master satuan dan konversi takaran.",
    universal: true,
  },
  inventory: {
    key: "inventory",
    label: "Inventori & Stok",
    path: "/inventory",
    section: "Katalog & Rantai Pasok",
    description: "Stok gudang, restock, penyesuaian, dan transfer.",
    universal: true,
  },
  suppliers: {
    key: "suppliers",
    label: "Supplier & PO",
    path: "/suppliers",
    section: "Katalog & Rantai Pasok",
    description: "Master supplier dan pembelian.",
    universal: true,
  },
  customers: {
    key: "customers",
    label: "Pelanggan & Piutang",
    path: "/customers",
    section: "Katalog & Rantai Pasok",
    description: "Profil pelanggan, utang-piutang, dan riwayat.",
    universal: true,
  },
  sales: {
    key: "sales",
    label: "Transaksi & Riwayat",
    path: "/sales",
    section: "Keuangan & Laporan",
    description: "Riwayat penjualan, pembatalan, dan cetak ulang struk.",
    universal: true,
  },
  shifts: {
    key: "shifts",
    label: "Shift & Laci Kas",
    path: "/shifts",
    section: "Keuangan & Laporan",
    description: "Buka-tutup shift dan saldo laci kas.",
    universal: true,
  },
  reports: {
    key: "reports",
    label: "Laporan & Z-Report",
    path: "/reports",
    section: "Keuangan & Laporan",
    description: "Laporan penjualan, Z-Report, dan rekap harian.",
    universal: true,
  },
  finance: {
    key: "finance",
    label: "Keuangan & Pajak",
    path: "/finance",
    section: "Keuangan & Laporan",
    description: "Pembukuan, pajak, dan rekonsiliasi.",
    universal: true,
  },
  outlets: {
    key: "outlets",
    label: "Outlet & Cabang",
    path: "/outlets",
    section: "Pengaturan & Platform",
    description: "Kelola outlet dan cabang operasional.",
    universal: true,
  },
  activityLog: {
    key: "activityLog",
    label: "Jejak Aktivitas",
    path: "/activity-log",
    section: "Pengaturan & Platform",
    description: "Audit trail aktivitas staf di tenant.",
    universal: true,
  },
  settings: {
    key: "settings",
    label: "Pengaturan Toko",
    path: "/settings",
    section: "Pengaturan & Platform",
    description: "Profil toko, legalitas, dan preferensi.",
    universal: true,
  },
};

// ── PROFIL PER TIPE USAHA
export type TaxMode = "PPN" | "PB1";

export type BusinessProfile = {
  key: BusinessTypeKey;
  label: string;
  category: CategoryKey;
  tagline: string;
  description: string;
  examples: string[];
  icon: LucideIcon;
  accent: {
    chip: string; // kelas chip ikon aktif
    ring: string; // kelas ring kartu aktif
    text: string; // warna teks/ikon
    border: string; // border kartu aktif
  };
  taxMode: TaxMode;
  /** modul yang LANGSUNG AKTIF untuk vertikal ini */
  modules: ModuleKey[];
  /** peran staf yang relevan untuk vertikal ini (subset APP_ROLES) */
  roles: AppRole[];
  /** fitur khas vertikal (ditampilkan di preview pendaftaran) */
  features: string[];
};

export type CategoryKey = "FNB" | "RETAIL" | "SERVICE" | "HEALTH";

export type BusinessCategory = {
  key: CategoryKey;
  label: string;
  tagline: string;
  description: string;
  types: BusinessTypeKey[];
};

// ── KATEGORI & PROFIL
const FNB_MODULES: ModuleKey[] = [
  "dashboard",
  "pos",
  "tables",
  "kds",
  "products",
  "units",
  "inventory",
  "suppliers",
  "customers",
  "sales",
  "shifts",
  "reports",
  "finance",
  "outlets",
  "activityLog",
  "settings",
];

const RETAIL_MODULES: ModuleKey[] = [
  "dashboard",
  "pos",
  "products",
  "units",
  "inventory",
  "suppliers",
  "customers",
  "sales",
  "shifts",
  "reports",
  "finance",
  "outlets",
  "activityLog",
  "settings",
];

const SERVICE_MODULES: ModuleKey[] = [
  "dashboard",
  "pos",
  "products",
  "units",
  "inventory",
  "suppliers",
  "customers",
  "sales",
  "shifts",
  "reports",
  "finance",
  "outlets",
  "activityLog",
  "settings",
];

/** Laundry = SERVICE + modul laundry (work order cuci berproses). */
const LAUNDRY_MODULES: ModuleKey[] = [
  ...SERVICE_MODULES.slice(0, 2),
  "laundry",
  ...SERVICE_MODULES.slice(2),
];

const HEALTH_MODULES: ModuleKey[] = [
  "dashboard",
  "pos",
  "products",
  "units",
  "inventory",
  "suppliers",
  "customers",
  "sales",
  "shifts",
  "reports",
  "finance",
  "outlets",
  "activityLog",
  "settings",
];

const CATERING_MODULES: ModuleKey[] = [
  "dashboard",
  "pos",
  "kds",
  "catering",
  "products",
  "units",
  "inventory",
  "suppliers",
  "customers",
  "sales",
  "shifts",
  "reports",
  "finance",
  "outlets",
  "activityLog",
  "settings",
];

export const BUSINESS_PROFILES: Record<BusinessTypeKey, BusinessProfile> = {
  RETAIL: {
    key: "RETAIL",
    label: "Ritel & Sembako",
    category: "RETAIL",
    tagline: "Barcode Scan & Expired",
    description:
      "Toko kelontong, minimarket, butik, dan sembako dengan katalog padat, pelacakan batch/expired, dan POS barcode.",
    examples: ["Toko kelontong", "Minimarket", "Butik & fashion", "Toko sembako"],
    icon: ShoppingBag,
    accent: {
      chip: "bg-accent-secondary/10",
      ring: "ring-accent-secondary",
      text: "text-accent-secondary",
      border: "border-accent-secondary",
    },
    taxMode: "PPN",
    modules: RETAIL_MODULES,
    roles: ["ADMIN", "MANAGER", "CASHIER", "INVENTORY", "ACCOUNTANT"],
    features: ["POS barcode cepat", "Pelacakan batch & expired", "Stok multi-gudang"],
  },
  FNB_CAFE: {
    key: "FNB_CAFE",
    label: "Kafe & Coffee Shop",
    category: "FNB",
    tagline: "BOM & KDS Dapur",
    description:
      "Kafe, coffee shop, dan cloud kitchen: meja QR, dapur digital (KDS), resep BOM, dan pajak PB1 otomatis.",
    examples: ["Coffee shop", "Cloud kitchen", "Bakery & pastry", "Kafe makan"],
    icon: Coffee,
    accent: {
      chip: "bg-primary/10",
      ring: "ring-primary",
      text: "text-primary",
      border: "border-primary",
    },
    taxMode: "PB1",
    modules: FNB_MODULES,
    roles: ["ADMIN", "MANAGER", "CASHIER", "KITCHEN"],
    features: ["Meja & QR self-order", "Kitchen Display (KDS)", "Resep BOM & costing", "Pajak PB1 otomatis"],
  },
  FNB_RESTAURANT: {
    key: "FNB_RESTAURANT",
    label: "Restoran & Dine-in",
    category: "FNB",
    tagline: "Meja, KDS & BOM",
    description:
      "Restoran layanan penuh: manajemen meja, antrean dapur real-time, resep porsi, dan kontrol porsi bahan baku.",
    examples: ["Restoran keluarga", "RM & padang", "Restoran cepat saji", "Steak house"],
    icon: Utensils,
    accent: {
      chip: "bg-primary/10",
      ring: "ring-primary",
      text: "text-primary",
      border: "border-primary",
    },
    taxMode: "PB1",
    modules: FNB_MODULES,
    roles: ["ADMIN", "MANAGER", "CASHIER", "KITCHEN"],
    features: ["Meja & QR self-order", "Kitchen Display (KDS)", "Resep BOM & costing", "Pajak PB1 otomatis"],
  },
  FNB_WARUNG: {
    key: "FNB_WARUNG",
    label: "Warung & Kedai",
    category: "FNB",
    tagline: "Ringan & Cepat",
    description:
      "Warung makan, kedai kopi, dan gerobak: POS ringan, menu sederhana, tanpa ribet meja — fokus transaksi cepat.",
    examples: ["Warung makan", "Kedai kopi pinggir jalan", "Kantin", "Gerobak dagang"],
    icon: Soup,
    accent: {
      chip: "bg-primary/10",
      ring: "ring-primary",
      text: "text-primary",
      border: "border-primary",
    },
    taxMode: "PB1",
    modules: FNB_MODULES.filter((m) => m !== "tables"),
    roles: ["ADMIN", "MANAGER", "CASHIER", "KITCHEN"],
    features: ["POS ringan & cepat", "Kitchen Display (KDS)", "Laporan harian sederhana"],
  },
  CATERING: {
    key: "CATERING",
    label: "Katering & Event",
    category: "FNB",
    tagline: "Resep Porsi, KDS & DP",
    description:
      "Katering dan event: booking acara berjadwal, uang muka & cicilan, sisa tagihan otomatis, dan produksi lewat KDS.",
    examples: ["Katering harian", "Katering pernikahan", "Event organizer", "Bento & box lunch"],
    icon: PartyPopper,
    accent: {
      chip: "bg-orange-500/10",
      ring: "ring-orange-600",
      text: "text-orange-600",
      border: "border-orange-600",
    },
    taxMode: "PPN",
    modules: CATERING_MODULES,
    roles: ["ADMIN", "MANAGER", "CASHIER", "KITCHEN", "INVENTORY"],
    features: [
      "Booking acara + jadwal kirim",
      "Uang muka & cicilan (buku kas)",
      "Produksi lewat Kitchen Display",
      "Stok bahan baku porsi besar",
    ],
  },
  SERVICE: {
    key: "SERVICE",
    label: "Jasa & Salon",
    category: "SERVICE",
    tagline: "Work Order & Komisi",
    description:
      "Barbershop, salon, bengkel, dan jasa lainnya: work order berproses, layanan satuan & paket, dan komisi staf.",
    examples: ["Barbershop & salon", "Bengkel & cuci motor", "Studio & jasa kreatif"],
    icon: Scissors,
    accent: {
      chip: "bg-purple-500/10",
      ring: "ring-purple-600",
      text: "text-purple-600",
      border: "border-purple-600",
    },
    taxMode: "PPN",
    modules: SERVICE_MODULES,
    roles: ["ADMIN", "MANAGER", "CASHIER", "INVENTORY"],
    features: ["Work order berproses", "Layanan satuan & paket", "Komisi staf"],
  },
  LAUNDRY: {
    key: "LAUNDRY",
    label: "Laundry & Cuci",
    category: "SERVICE",
    tagline: "Order Berproses",
    description:
      "Laundry kiloan & satuan: order berproses, pelacakan status per item, dan tarif per satuan atau kilo.",
    examples: ["Laundry kiloan", "Laundry satuan (kemeja, jas)", "Dry cleaning", "Layanan setrika"],
    icon: Shirt,
    accent: {
      chip: "bg-violet-500/10",
      ring: "ring-violet-600",
      text: "text-violet-600",
      border: "border-violet-600",
    },
    taxMode: "PPN",
    modules: LAUNDRY_MODULES,
    roles: ["ADMIN", "MANAGER", "CASHIER", "INVENTORY"],
    features: ["Order kiloan & satuan", "Pelacakan status per order", "Komisi staf"],
  },
  BUILDING_SUPPLY: {
    key: "BUILDING_SUPPLY",
    label: "Toko Bangunan",
    category: "RETAIL",
    tagline: "Multi-Gudang & Material",
    description:
      "Toko bangunan dan material: stok material besar, konversi satuan, transfer antar-gudang, dan pembelian supplier.",
    examples: ["Toko material", "Toko cat & finishing", "Supplier besi & kayu", "Depo bangunan"],
    icon: Hammer,
    accent: {
      chip: "bg-amber-500/10",
      ring: "ring-amber-500",
      text: "text-amber-600",
      border: "border-amber-600",
    },
    taxMode: "PPN",
    modules: RETAIL_MODULES,
    roles: ["ADMIN", "MANAGER", "CASHIER", "INVENTORY", "ACCOUNTANT"],
    features: ["Konversi satuan material", "Transfer antar-gudang", "Pembelian supplier berskala"],
  },
  PHARMACY: {
    key: "PHARMACY",
    label: "Apotek & Alkes",
    category: "HEALTH",
    tagline: "FEFO Batch & Resep",
    description:
      "Apotek dan alat kesehatan: pelacakan batch FEFO, tanggal kedaluwarsa, dan kontrol stok obat yang ketat.",
    examples: ["Apotek", "Toko alkes", "Distributor obat skala kecil", "Klinik swasta"],
    icon: Pill,
    accent: {
      chip: "bg-emerald-500/10",
      ring: "ring-emerald-600",
      text: "text-emerald-600",
      border: "border-emerald-600",
    },
    taxMode: "PPN",
    modules: HEALTH_MODULES,
    roles: ["ADMIN", "MANAGER", "CASHIER", "INVENTORY", "ACCOUNTANT"],
    features: ["Pelacakan batch FEFO", "Peringatan kedaluwarsa", "Stok obat ketat"],
  },
};

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  {
    key: "FNB",
    label: "Kuliner & F&B",
    tagline: "Kafe, restoran, warung, katering",
    description: "POS + meja QR + dapur digital + booking katering, dengan pajak PB1 otomatis.",
    types: ["FNB_CAFE", "FNB_RESTAURANT", "FNB_WARUNG", "CATERING"],
  },
  {
    key: "RETAIL",
    label: "Ritel & Perdagangan",
    tagline: "Toko, sembako, material",
    description: "POS barcode, inventori batch/expired, multi-gudang, dan pembelian supplier.",
    types: ["RETAIL", "BUILDING_SUPPLY"],
  },
  {
    key: "SERVICE",
    label: "Jasa & Layanan",
    tagline: "Salon, bengkel, laundry",
    description: "Work order berproses, layanan satuan & paket, komisi staf.",
    types: ["SERVICE", "LAUNDRY"],
  },
  {
    key: "HEALTH",
    label: "Kesehatan & Farmasi",
    tagline: "Apotek & alkes",
    description: "Batch FEFO, kedaluwarsa, dan kontrol stok ketat.",
    types: ["PHARMACY"],
  },
];

// ── HELPER
export function isBusinessType(value: unknown): value is BusinessTypeKey {
  return (
    typeof value === "string" &&
    (BUSINESS_TYPE_KEYS as readonly string[]).includes(value)
  );
}

export function getBusinessProfile(key: BusinessTypeKey): BusinessProfile {
  const profile = BUSINESS_PROFILES[key];
  if (!profile) {
    throw new Error(`Katalog vertikal tidak mengenal tipe usaha "${key}"`);
  }
  return profile;
}

export function getCategoryForType(key: BusinessTypeKey): BusinessCategory {
  const profile = getBusinessProfile(key);
  const category = BUSINESS_CATEGORIES.find((c) => c.key === profile.category);
  if (!category) {
    throw new Error(`Kategori "${profile.category}" tidak terdaftar`);
  }
  return category;
}

/** Tipe usaha yang mengaktifkan sebuah modul (urutan mengikuti enum schema). */
export function typesWithModule(moduleKey: ModuleKey): BusinessTypeKey[] {
  return BUSINESS_TYPE_KEYS.filter((key) =>
    BUSINESS_PROFILES[key].modules.includes(moduleKey)
  );
}

export function getModulesForType(key: BusinessTypeKey): BusinessModule[] {
  const profile = getBusinessProfile(key);
  return profile.modules.map((moduleKey) => MODULES[moduleKey]);
}

export function getRolesForType(key: BusinessTypeKey): AppRole[] {
  return getBusinessProfile(key).roles;
}

/** Label manusiawi; fallback ke kunci mentah bila tipe tak dikenal (data lama). */
export function getBusinessTypeLabel(key: string): string {
  return isBusinessType(key) ? BUSINESS_PROFILES[key].label : key;
}

const routeMatches = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

/**
 * Modul yang MENGKLAIM rute ini dan bersifat spesifik-vertikal.
 * Modul universal (dashboard, pos, produk, ...) tidak pernah menjadi gerbang.
 */
export function getGatingModulesForRoute(pathname: string): BusinessModule[] {
  return MODULE_KEYS.map((key) => MODULES[key]).filter((module) => {
    if (module.universal) return false;
    if (routeMatches(pathname, module.path)) return true;
    if (module.apiPaths?.some((apiPath) => routeMatches(pathname, apiPath))) return true;
    return module.routePattern?.test(pathname) ?? false;
  });
}

/**
 * Apakah rute ini boleh diakses oleh toko dengan jenis usaha tsb?
 *  - Rute tanpa modul spesifik-vertikal → selalu boleh (peran tetap dijaga RBAC).
 *  - Tanpa info vertikal (mis. SUPER_ADMIN / cookie lama) → boleh; gerbang peran
 *    dan pemeriksaan di route handler tetap berlaku (anti lock-out).
 *  - Info vertikal diketahui tapi modul tidak dimiliki → DITOLAK (fail-closed),
 *    supaya menu yang disembunyikan juga tidak bisa dibuka lewat URL langsung.
 */
export function isRouteAvailableForBusinessType(
  pathname: string,
  businessType: string | null | undefined
): boolean {
  const gating = getGatingModulesForRoute(pathname);
  if (gating.length === 0) return true;
  if (!businessType || !isBusinessType(businessType)) return true;
  return gating.every((module) => typesWithModule(module.key).includes(businessType));
}

export const ALL_APP_ROLES = APP_ROLES;
