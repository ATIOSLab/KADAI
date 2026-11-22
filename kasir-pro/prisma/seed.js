const bcrypt = require("bcryptjs");
const { PrismaClient, FinanceDirection, UserRole, BillingCycle } = require("@prisma/client");

const prisma = new PrismaClient();

const DEFAULT_UNITS = [
  { name: "pcs", normalizedName: "pcs" },
  { name: "kg", normalizedName: "kg" },
  { name: "botol", normalizedName: "botol" },
  { name: "box", normalizedName: "box" },
  { name: "karung", normalizedName: "karung" },
  { name: "kotak", normalizedName: "kotak" },
];

const DEFAULT_FINANCE_CATEGORIES = [
  {
    name: "Penjualan",
    direction: FinanceDirection.IN,
    isSystem: true,
    systemKey: "SALE_INCOME",
  },
  {
    name: "Pembatalan Penjualan",
    direction: FinanceDirection.OUT,
    isSystem: true,
    systemKey: "SALE_VOID_OUTFLOW",
  },
  {
    name: "Pembelian Stok",
    direction: FinanceDirection.OUT,
    isSystem: true,
    systemKey: "RESTOCK_EXPENSE",
  },
  {
    name: "Selisih Kas Kurang",
    direction: FinanceDirection.OUT,
    isSystem: true,
    systemKey: "SHIFT_VARIANCE_SHORT",
  },
  {
    name: "Selisih Kas Lebih",
    direction: FinanceDirection.IN,
    isSystem: true,
    systemKey: "SHIFT_VARIANCE_OVER",
  },
  {
    name: "Modal Masuk",
    direction: FinanceDirection.IN,
    isSystem: false,
    systemKey: null,
  },
  {
    name: "Pendapatan Lain",
    direction: FinanceDirection.IN,
    isSystem: false,
    systemKey: null,
  },
  {
    name: "Biaya Operasional",
    direction: FinanceDirection.OUT,
    isSystem: false,
    systemKey: null,
  },
  {
    name: "Pengeluaran Lain",
    direction: FinanceDirection.OUT,
    isSystem: false,
    systemKey: null,
  },
];

function getAdminSeedConfig() {
  return {
    name: process.env.ADMIN_NAME || "Admin Kadai",
    email: process.env.ADMIN_EMAIL || "admin@kadai.com",
    password: process.env.ADMIN_PASSWORD,
    role: UserRole.ADMIN,
  };
}

function getSuperAdminSeedConfig() {
  return {
    name: process.env.SUPERADMIN_NAME || "Super Admin Kadai",
    email: process.env.SUPERADMIN_EMAIL,
    password: process.env.SUPERADMIN_PASSWORD,
    role: UserRole.SUPER_ADMIN,
  };
}

async function ensureStore() {
  const existingStore = await prisma.store.findFirst({
    select: { id: true },
  });

  if (existingStore) {
    return existingStore.id;
  }

  const store = await prisma.store.create({
    data: {
      name: process.env.STORE_NAME || "KADAI Indonesia",
      businessType: "FNB_CAFE",
      tier: "PRO_BUSINESS",
      address: process.env.STORE_ADDRESS || "Jl. Sudirman No. 45, Jakarta Pusat",
      phone: process.env.STORE_PHONE || "08127634091",
      email: process.env.STORE_EMAIL || "halo@kadai.asia",
      taxType: "PB1_10",
      taxRate: 10,
      taxInclusive: false,
      serviceChargeRate: 5,
      enableRounding: true,
      defaultMarkup: 30,
      currency: "IDR",
    },
    select: { id: true },
  });

  return store.id;
}

async function ensureTables() {
  const defaultTables = [
    { tableNo: "Meja 01", section: "Lantai 1", capacity: 4, qrToken: "table-01" },
    { tableNo: "Meja 02", section: "Lantai 1", capacity: 2, qrToken: "table-02" },
    { tableNo: "Meja 03", section: "Lantai 1", capacity: 4, qrToken: "table-03" },
    { tableNo: "Meja 04", section: "Outdoor", capacity: 6, qrToken: "table-04" },
    { tableNo: "Meja VIP", section: "VIP Room", capacity: 8, qrToken: "table-vip" },
  ];

  for (const t of defaultTables) {
    await prisma.restaurantTable.upsert({
      where: { tableNo: t.tableNo },
      update: { section: t.section, capacity: t.capacity },
      create: t,
    });
  }
}

async function ensureUnits() {
  // Idempoten manual: unique index (storeId, normalizedName) memperlakukan NULL sebagai
  // nilai berbeda, jadi createMany+skipDuplicates bisa menduplikasi satuan bawaan tiap boot.
  for (const unit of DEFAULT_UNITS) {
    const existing = await prisma.unit.findFirst({
      where: { normalizedName: unit.normalizedName, storeId: null },
      select: { id: true, isActive: true },
    });
    if (existing) {
      if (existing.isActive === false) {
        await prisma.unit.update({ where: { id: existing.id }, data: { isActive: true } });
      }
      continue;
    }
    await prisma.unit.create({ data: unit });
  }
}

async function ensureFinanceCategories() {
  for (const category of DEFAULT_FINANCE_CATEGORIES) {
    if (category.systemKey) {
      await prisma.financeCategory.upsert({
        where: { systemKey: category.systemKey },
        update: {
          name: category.name,
          direction: category.direction,
          isSystem: true,
          isActive: true,
        },
        create: {
          name: category.name,
          direction: category.direction,
          isSystem: true,
          systemKey: category.systemKey,
          isActive: true,
        },
      });
      continue;
    }

    const existing = await prisma.financeCategory.findFirst({
      where: {
        name: category.name,
        direction: category.direction,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      await prisma.financeCategory.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
      continue;
    }

    await prisma.financeCategory.create({
      data: {
        name: category.name,
        direction: category.direction,
        isSystem: false,
        isActive: true,
      },
    });
  }
}

async function ensureAdminUser(storeId) {
  const admin = getAdminSeedConfig();
  const existingUser = await prisma.user.findUnique({
    where: { email: admin.email },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: admin.name,
        role: admin.role,
        isActive: true,
        ...(storeId ? { storeId } : {}),
      },
    });

    return {
      created: false,
      email: admin.email,
      password: admin.password,
    };
  }

  if (!admin.password || admin.password.length < 12) {
    throw new Error("Set ADMIN_PASSWORD with at least 12 characters before initial seeding");
  }
  const passwordHash = await bcrypt.hash(admin.password, 12);
  const pin = process.env.ADMIN_SUPERVISOR_PIN;
  if (pin && !/^\d{6,8}$/.test(pin)) throw new Error("ADMIN_SUPERVISOR_PIN must be 6-8 digits");
  const supervisorPinHash = pin ? await bcrypt.hash(pin, 12) : null;

  await prisma.user.create({
    data: {
      name: admin.name,
      email: admin.email,
      passwordHash,
      supervisorPin: supervisorPinHash,
      role: admin.role,
      isActive: true,
      ...(storeId ? { storeId } : {}),
    },
  });

  return {
    created: true,
    email: admin.email,
    password: admin.password,
  };
}

/**
 * Bootstrap akun SUPER_ADMIN (operator platform) — hanya bila env diset.
 * SUPERADMIN_EMAIL wajib; SUPERADMIN_PASSWORD wajib saat akun belum ada.
 */
async function ensureSuperAdmin() {
  const superAdmin = getSuperAdminSeedConfig();

  if (!superAdmin.email) {
    return { configured: false };
  }

  const existing = await prisma.user.findUnique({
    where: { email: superAdmin.email },
    select: { id: true },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: UserRole.SUPER_ADMIN, isActive: true, name: superAdmin.name },
    });
    return { configured: true, created: false, email: superAdmin.email };
  }

  if (!superAdmin.password || superAdmin.password.length < 12) {
    throw new Error(
      "Set SUPERADMIN_PASSWORD with at least 12 characters before seeding the platform super admin"
    );
  }

  const passwordHash = await bcrypt.hash(superAdmin.password, 12);
  await prisma.user.create({
    data: {
      name: superAdmin.name,
      email: superAdmin.email,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  return { configured: true, created: true, email: superAdmin.email };
}

const PLAN_SEEDS = [
  {
    code: "FREE",
    name: "Starter",
    description: "Untuk warung mikro dan perintis usaha yang baru memulai.",
    badge: null,
    sortOrder: 10,
    features: [
      "1 Gerai & 1 Akun Kasir",
      "Maksimal 50 Produk SKU",
      "Kasir POS Cepat & Cetak Struk Thermal",
      "Laporan Penjualan Harian",
    ],
    limits: {
      maxOutlets: 1,
      maxUsers: 1,
      maxProducts: 50,
      maxSku: 50,
      kds: false,
      transferStock: false,
      centralKitchen: false,
    },
    prices: { MONTHLY: 0, QUARTERLY: 0, ANNUAL: 0 },
  },
  {
    code: "STARTER",
    name: "Professional",
    description: "Operasional tuntas 1 gerai untuk kedai kafe atau toko ritel aktif.",
    badge: null,
    sortOrder: 20,
    features: [
      "1 Gerai & Hingga 3 Akun Kasir",
      "Produk & Transaksi Tanpa Batas",
      "F&B: QR Meja & Pemesanan Mandiri",
      "Ritel: Barcode Scanner & Peringatan Kadaluwarsa",
      "Pembukuan Kas & Pajak SAK EMKM",
      "Ekspor Laporan Excel / CSV",
    ],
    limits: {
      maxOutlets: 1,
      maxUsers: 3,
      maxProducts: null,
      maxSku: null,
      kds: false,
      transferStock: false,
      centralKitchen: false,
    },
    prices: { MONTHLY: 99_000, QUARTERLY: 267_300, ANNUAL: 950_400 },
  },
  {
    code: "PRO_BUSINESS",
    name: "Business Pro",
    description: "Kafe, resto & ritel modern dengan manajemen resep, dapur & multi-cabang.",
    badge: "Paling Populer",
    sortOrder: 30,
    features: [
      "Hingga 3 Gerai / Cabang Usaha",
      "F&B: Resep BOM Bahan Baku & Layar Dapur KDS",
      "Ritel: Inventori Multi-Batch (FIFO & FEFO Asli)",
      "Transfer Stok Antar-Cabang (Surat Jalan)",
      "Rekap PB1/PPN & PPh Final 0.5% PP 55/2022",
      "Dukungan WhatsApp Prioritas",
    ],
    limits: {
      maxOutlets: 3,
      maxUsers: null,
      maxProducts: null,
      maxSku: null,
      kds: true,
      transferStock: true,
      centralKitchen: false,
    },
    prices: { MONTHLY: 249_000, QUARTERLY: 672_300, ANNUAL: 2_390_400 },
  },
  {
    code: "ENTERPRISE",
    name: "Enterprise",
    description: "Waralaba berjejaring, sentra dapur pusat, dan multi-gudang.",
    badge: null,
    sortOrder: 40,
    features: [
      "Gerai & Gudang Tak Terbatas",
      "Sentra Dapur Pusat (Central Kitchen)",
      "Routing Pesanan Antar-Sentra Produksi",
      "Laporan Konsolidasi Multi-Entitas",
      "Rekonsiliasi Pajak Konsolidasi Grup",
      "Akses API Integrasi Kustom",
      "Dedicated Account Manager & SLA 99.9%",
    ],
    limits: {
      maxOutlets: null,
      maxUsers: null,
      maxProducts: null,
      maxSku: null,
      kds: true,
      transferStock: true,
      centralKitchen: true,
    },
    prices: { MONTHLY: 599_000, QUARTERLY: 1_617_300, ANNUAL: 5_750_400 },
  },
];

/**
 * Seed idempotent katalog paket langganan (SubscriptionPlan + PlanPrice).
 * Sumber nilai mengikuti TIER_PRICES (engine billing). FREE selalu Rp 0.
 */
async function ensurePlans() {
  let created = 0;
  let skipped = 0;

  for (const seed of PLAN_SEEDS) {
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { code: seed.code },
      select: { id: true },
    });

    // PENTING: seed berjalan SETIAP boot container (docker/start.sh).
    // Jadi paket yang SUDAH ADA tidak boleh diperbarui/ditimpa — kalau ditimpa,
    // semua perubahan harga/fitur dari /platform/plans akan hilang tiap deploy.
    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.subscriptionPlan.create({
      data: {
        code: seed.code,
        name: seed.name,
        description: seed.description,
        badge: seed.badge,
        features: seed.features,
        limits: seed.limits,
        sortOrder: seed.sortOrder,
        isActive: true,
        prices: {
          create: Object.entries(seed.prices).map(([cycle, amount]) => ({
            cycle,
            amount,
          })),
        },
      },
    });
    created += 1;
  }

  console.log(`Katalog plan: ${created} dibuat, ${skipped} dipertahankan (edit superadmin tidak ditimpa).`);
  return { created, skipped };
}

async function main() {
  console.log("Menjalankan seed minimal untuk deployment...");

  await ensurePlans();
  const storeId = await ensureStore();
  await ensureUnits();
  await ensureFinanceCategories();
  await ensureTables();
  const admin = await ensureAdminUser(storeId);
  const superAdmin = await ensureSuperAdmin();

  console.log("Seed selesai.");
  console.log(`Admin: ${admin.email}`);
  if (admin.created) {
    console.log("Admin dibuat. Gunakan kredensial provisioning yang telah ditetapkan.");
  } else {
    console.log("User admin sudah ada. Password lama dipertahankan.");
  }

  if (superAdmin.configured) {
    console.log(
      `Super Admin platform: ${superAdmin.email} (${superAdmin.created ? "dibuat" : "sudah ada, role dipastikan SUPER_ADMIN"})`
    );
  } else {
    console.log("Super Admin platform: tidak dikonfigurasi (atur SUPERADMIN_EMAIL/SUPERADMIN_PASSWORD untuk bootstrap).");
  }

  // Auto seed multi-vertical client demo clusters — HANYA bila diminta eksplisit.
  // `db:seed` juga dipakai untuk bootstrap PRODUKSI (admin, plan, store): tanpa
  // guard ini, menyalakan RUN_SEED_ON_START akan menyuntik tenant/produk/user
  // demo (beserta PIN) ke database produksi pada setiap start container.
  if (process.env.SEED_DEMO_ON_START === "true") {
    try {
      console.log("Memulai integrasi demo clusters...");
      const demoModule = require("./seed-demo-clusters.js");
      if (typeof demoModule === "function") {
        await demoModule();
      }
    } catch (err) {
      console.warn("Demo clusters auto-seed notice:", err.message);
    }
  } else {
    console.log("Seed klaster demo dilewati (SEED_DEMO_ON_START != true).");
  }
}

main()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
