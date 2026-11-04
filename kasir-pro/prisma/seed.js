const bcrypt = require("bcryptjs");
const { PrismaClient, FinanceDirection, UserRole } = require("@prisma/client");

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
      email: process.env.STORE_EMAIL || "halo@kadai.netkrida.cloud",
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
  await prisma.unit.createMany({
    data: DEFAULT_UNITS,
    skipDuplicates: true,
  });
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

async function ensureAdminUser() {
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
    },
  });

  return {
    created: true,
    email: admin.email,
    password: admin.password,
  };
}

async function main() {
  console.log("Menjalankan seed minimal untuk deployment...");

  await ensureStore();
  await ensureUnits();
  await ensureFinanceCategories();
  await ensureTables();
  const admin = await ensureAdminUser();

  console.log("Seed selesai.");
  console.log(`Admin: ${admin.email}`);
  if (admin.created) {
    console.log("Admin dibuat. Gunakan kredensial provisioning yang telah ditetapkan.");
  } else {
    console.log("User admin sudah ada. Password lama dipertahankan.");
  }

  // Auto seed multi-vertical client demo clusters
  try {
    console.log("Memulai integrasi demo clusters...");
    const demoModule = require("./seed-demo-clusters.js");
    if (typeof demoModule === "function") {
      await demoModule();
    }
  } catch (err) {
    console.warn("Demo clusters auto-seed notice:", err.message);
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
