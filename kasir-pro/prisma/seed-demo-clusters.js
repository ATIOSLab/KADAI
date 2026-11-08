const bcrypt = require("bcryptjs");
const { PrismaClient, FinanceDirection, UserRole, BusinessType, ProductType, StationType, TaxType } = require("@prisma/client");

const prisma = new PrismaClient();

const CLUSTERS = [
  {
    vertical: "FNB_RESTAURANT",
    name: "Resto Rasa Nusantara Multi-Cabang",
    slug: "fnb-resto",
    description: "Restoran Kuliner Nusantara dengan 3 Cabang Outlet & Multi-Station KDS (Kitchen & Bar)",
    outlets: [
      { name: "Resto Nusantara - Pusat Menteng", code: "RSN-01", address: "Jl. HOS Cokroaminoto No. 12, Menteng, Jakpus", phone: "08121111001", isMain: true },
      { name: "Resto Nusantara - Cabang Senopati", code: "RSN-02", address: "Jl. Senopati No. 45, Kebayoran Baru, Jaksel", phone: "08121111002", isMain: false },
      { name: "Resto Nusantara - Cabang PIK Pantjoran", code: "RSN-03", address: "Pantjoran PIK Unit B-08, Jakarta Utara", phone: "08121111003", isMain: false },
    ],
    categories: ["Aneka Nasi & Sup", "Lauk Utama Nusantara", "Sayuran & Pelengkap", "Minuman Tradisional & Kopi", "Bahan Mentah Dapur"],
    products: [
      { name: "Nasi Goreng Kampung Spesial", sku: "RSN-NGK-01", barcode: "899100100001", category: "Aneka Nasi & Sup", price: 38000, cost: 14000, stock: 120, unit: "porsi", type: ProductType.MANUFACTURED, station: StationType.KITCHEN },
      { name: "Sop Iga Bakar Rempah Wangi", sku: "RSN-SIB-02", barcode: "899100100002", category: "Lauk Utama Nusantara", price: 65000, cost: 26000, stock: 85, unit: "porsi", type: ProductType.MANUFACTURED, station: StationType.KITCHEN },
      { name: "Ayam Goreng Lengkuas Gurih", sku: "RSN-AGL-03", barcode: "899100100003", category: "Lauk Utama Nusantara", price: 35000, cost: 12000, stock: 95, unit: "porsi", type: ProductType.MANUFACTURED, station: StationType.KITCHEN },
      { name: "Es Teh Manis Melati Nusantara", sku: "RSN-ETM-04", barcode: "899100100004", category: "Minuman Tradisional & Kopi", price: 12000, cost: 2000, stock: 300, unit: "gelas", type: ProductType.FINISHED_GOOD, station: StationType.BAR },
      { name: "Daging Iga Sapi Potong Segar", sku: "RAW-IGA-01", barcode: "899100100091", category: "Bahan Mentah Dapur", price: 110000, cost: 95000, stock: 50, unit: "kg", type: ProductType.RAW_MATERIAL, station: StationType.KITCHEN },
      { name: "Ayam Broiler Utuh Bersih", sku: "RAW-AYM-02", barcode: "899100100092", category: "Bahan Mentah Dapur", price: 42000, cost: 34000, stock: 80, unit: "ekor", type: ProductType.RAW_MATERIAL, station: StationType.KITCHEN },
    ],
    users: [
      { name: "Hendro Wijaya (Owner Resto)", email: "owner.resto@kadai.com", role: UserRole.ADMIN, pin: "888111" },
      { name: "Linda Tan (Manager Resto Menteng)", email: "manager.resto@kadai.com", role: UserRole.MANAGER, pin: "888222" },
      { name: "Rian Kasir (Kasir Menteng)", email: "kasir.resto@kadai.com", role: UserRole.CASHIER, pin: null },
      { name: "Chef A-Kiong (Kepala Dapur)", email: "dapur.resto@kadai.com", role: UserRole.KITCHEN, pin: null },
      { name: "Bambang Gudang (Inventory Resto)", email: "gudang.resto@kadai.com", role: UserRole.INVENTORY, pin: null },
      { name: "Siti Rahma (Akuntan Keuangan)", email: "akuntan.resto@kadai.com", role: UserRole.ACCOUNTANT, pin: null },
    ]
  },
  {
    vertical: "SERVICE",
    name: "Gentlemen & Co. Premium Barbershop",
    slug: "barber",
    description: "Jasa Barbershop & Grooming Pria Modern dengan Reservasi Kursi & Retail Haircare",
    outlets: [
      { name: "Gentlemen & Co. - Flagship Senopati", code: "BRB-01", address: "Jl. Gunawarman No. 22, Jaksel", phone: "08122222001", isMain: true },
    ],
    categories: ["Layanan Cukur & Shaving", "Treatment Rambut & Wajah", "Retail Pomade & Perawatan"],
    products: [
      { name: "Signature Haircut & Hot Towel Shave", sku: "BRB-SRV-01", barcode: "899200100001", category: "Layanan Cukur & Shaving", price: 120000, cost: 25000, stock: 999, unit: "sesi", type: ProductType.SERVICE, station: StationType.GENERAL },
      { name: "Beard Trim & Facial Scrub", sku: "BRB-SRV-02", barcode: "899200100002", category: "Treatment Rambut & Wajah", price: 85000, cost: 18000, stock: 999, unit: "sesi", type: ProductType.SERVICE, station: StationType.GENERAL },
      { name: "Oil-Based Heavy Pomade Vanilla 100g", sku: "BRB-RTL-03", barcode: "899200100003", category: "Retail Pomade & Perawatan", price: 110000, cost: 55000, stock: 45, unit: "pot", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
      { name: "Organic Hair Clay Matte Finish 80g", sku: "BRB-RTL-04", barcode: "899200100004", category: "Retail Pomade & Perawatan", price: 135000, cost: 68000, stock: 30, unit: "tube", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
    ],
    users: [
      { name: "Bramantyo (Owner Barber)", email: "owner.barber@kadai.com", role: UserRole.ADMIN, pin: "777111" },
      { name: "Fajar (Manager Operasional Barber)", email: "manager.barber@kadai.com", role: UserRole.MANAGER, pin: "777222" },
      { name: "Doni (Kasir Frontdesk Barber)", email: "kasir.barber@kadai.com", role: UserRole.CASHIER, pin: null },
      { name: "Eko (Akuntan Keuangan Barber)", email: "akuntan.barber@kadai.com", role: UserRole.ACCOUNTANT, pin: null },
    ]
  },
  {
    vertical: "SERVICE",
    name: "GlowAura Aesthetic & Dermatology Clinic",
    slug: "klinik",
    description: "Klinik Kecantikan Medis: Treatment Dokter/Terapis & Skincare Resep Dermatologi",
    outlets: [
      { name: "GlowAura Clinic - Dharmawangsa", code: "KLN-01", address: "Jl. Dharmawangsa X No. 8, Kebayoran Baru, Jaksel", phone: "08123333001", isMain: true },
    ],
    categories: ["Tindakan Medis & Laser", "Facial & Peeling", "Skincare Resep & Serum"],
    products: [
      { name: "Pico Laser Glow Rejuvenation", sku: "KLN-LSR-01", barcode: "899300100001", category: "Tindakan Medis & Laser", price: 1250000, cost: 280000, stock: 999, unit: "treatment", type: ProductType.SERVICE, station: StationType.GENERAL },
      { name: "Deep Cleansing Acne Facial + PDT", sku: "KLN-FCL-02", barcode: "899300100002", category: "Facial & Peeling", price: 350000, cost: 75000, stock: 999, unit: "treatment", type: ProductType.SERVICE, station: StationType.GENERAL },
      { name: "Glow Radiance Vitamin C Serum 30ml", sku: "KLN-SKN-03", barcode: "899300100003", category: "Skincare Resep & Serum", price: 275000, cost: 110000, stock: 60, unit: "botol", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
      { name: "UV Barrier Sunscreen SPF 50 PA++++", sku: "KLN-SKN-04", barcode: "899300100004", category: "Skincare Resep & Serum", price: 195000, cost: 78000, stock: 80, unit: "tube", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
    ],
    users: [
      { name: "dr. Amanda Sp.KK (Owner Klinik)", email: "owner.klinik@kadai.com", role: UserRole.ADMIN, pin: "666111" },
      { name: "dr. Kevin (Manager Medis Klinik)", email: "manager.klinik@kadai.com", role: UserRole.MANAGER, pin: "666222" },
      { name: "Nisa (Kasir Apotek & Frontdesk)", email: "kasir.klinik@kadai.com", role: UserRole.CASHIER, pin: null },
      { name: "Apoteker Dewi (Gudang Farmasi & Serum)", email: "gudang.klinik@kadai.com", role: UserRole.INVENTORY, pin: null },
      { name: "Yulia (Finance & Pajak PPh Klinik)", email: "akuntan.klinik@kadai.com", role: UserRole.ACCOUNTANT, pin: null },
    ]
  },
  {
    vertical: "RETAIL",
    name: "Toko Sembako Berkah Jaya (Toko Harian)",
    slug: "tokoharian",
    description: "Minimarket Ritel & Grosir Sembako: Scan Barcode Cepat & FIFO Expired Tracking",
    outlets: [
      { name: "Berkah Jaya - Toko Induk Pasar Minggu", code: "SBK-01", address: "Jl. Ragunan No. 18, Pasar Minggu, Jaksel", phone: "08124444001", isMain: true },
    ],
    categories: ["Beras & Gula Pokok", "Minyak Goreng & Bumbu", "Susu & Minuman Kemasan", "Sabun & Kebutuhan Rumah"],
    products: [
      { name: "Beras Pandan Wangi Premium 5kg", sku: "SBK-BRS-01", barcode: "899400100001", category: "Beras & Gula Pokok", price: 78000, cost: 68000, stock: 150, unit: "karung", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
      { name: "Minyak Goreng Sawit Pouch 2 Liter", sku: "SBK-MYK-02", barcode: "899400100002", category: "Minyak Goreng & Bumbu", price: 36500, cost: 32000, stock: 220, unit: "pouch", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
      { name: "Gula Pasir Kristal Putih 1kg", sku: "SBK-GLA-03", barcode: "899400100003", category: "Beras & Gula Pokok", price: 17500, cost: 15200, stock: 300, unit: "kg", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
      { name: "Kecap Manis Botol 600ml", sku: "SBK-KCP-04", barcode: "899400100004", category: "Minyak Goreng & Bumbu", price: 23000, cost: 18500, stock: 95, unit: "botol", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
    ],
    users: [
      { name: "Haji Mansur (Owner Sembako)", email: "owner.sembako@kadai.com", role: UserRole.ADMIN, pin: "555111" },
      { name: "Zainal (Kepala Toko Sembako)", email: "manager.sembako@kadai.com", role: UserRole.MANAGER, pin: "555222" },
      { name: "Asep (Kasir Barcode Sembako)", email: "kasir.sembako@kadai.com", role: UserRole.CASHIER, pin: null },
      { name: "Wahyu (Staf Gudang & Bongkar Muat)", email: "gudang.sembako@kadai.com", role: UserRole.INVENTORY, pin: null },
      { name: "Budi Santoso (Pembukuan Toko)", email: "akuntan.sembako@kadai.com", role: UserRole.ACCOUNTANT, pin: null },
    ]
  },
  {
    vertical: "FNB_WARUNG",
    name: "Bakso & Mie Ayam Mas Sigit Solo",
    slug: "bakso",
    description: "Warung Kuliner Legendaris: Kasir Cepat, Dapur Kuah & Self-Order Meja QR",
    outlets: [
      { name: "Bakso Mas Sigit Solo - Tebet", code: "BKS-01", address: "Jl. Tebet Raya No. 58, Jakarta Selatan", phone: "08125555001", isMain: true },
    ],
    categories: ["Bakso Spesial Daging Sapi", "Mie Ayam Pangsit", "Es & Minuman Tradisional"],
    products: [
      { name: "Bakso Urat Jumbo Komplit + Tetelan", sku: "BKS-URT-01", barcode: "899500100001", category: "Bakso Spesial Daging Sapi", price: 32000, cost: 13500, stock: 150, unit: "porsi", type: ProductType.MANUFACTURED, station: StationType.KITCHEN },
      { name: "Bakso Telur Puyuh Kuah Gurih", sku: "BKS-TLR-02", barcode: "899500100002", category: "Bakso Spesial Daging Sapi", price: 28000, cost: 11000, stock: 110, unit: "porsi", type: ProductType.MANUFACTURED, station: StationType.KITCHEN },
      { name: "Mie Ayam Pangsit Bakso Komplit", sku: "BKS-MIE-03", barcode: "899500100003", category: "Mie Ayam Pangsit", price: 26000, cost: 9500, stock: 180, unit: "mangkuk", type: ProductType.MANUFACTURED, station: StationType.KITCHEN },
      { name: "Es Jeruk Peras Murni Gula Asli", sku: "BKS-MNM-04", barcode: "899500100004", category: "Es & Minuman Tradisional", price: 10000, cost: 3500, stock: 250, unit: "gelas", type: ProductType.FINISHED_GOOD, station: StationType.BAR },
    ],
    users: [
      { name: "Mas Sigit (Owner Bakso Solo)", email: "owner.bakso@kadai.com", role: UserRole.ADMIN, pin: "444111" },
      { name: "Suratno (Manager Warung Bakso)", email: "manager.bakso@kadai.com", role: UserRole.MANAGER, pin: "444222" },
      { name: "Agus (Kasir Depan Bakso)", email: "kasir.bakso@kadai.com", role: UserRole.CASHIER, pin: null },
      { name: "Wawan (Dapur Rebus & Racik Bakso)", email: "dapur.bakso@kadai.com", role: UserRole.KITCHEN, pin: null },
    ]
  },
  {
    vertical: "FNB_CAFE",
    name: "Ruang Temu Coffee & Eatery",
    slug: "cafe",
    description: "Kafe Modern Third Wave: Barista Display, BOM Roasted Beans & Kitchen Pastry",
    outlets: [
      { name: "Ruang Temu - Gandaria Creative Hub", code: "CFE-01", address: "Jl. Gandaria Tengah II No. 14, Jaksel", phone: "08126666001", isMain: true },
    ],
    categories: ["Espresso & Milk Based", "Filter Coffee Manual Brew", "Artisan Bakery & Pastry", "Mocktail Segar"],
    products: [
      { name: "Iced Creamy Aren Latte", sku: "CFE-LAT-01", barcode: "899600100001", category: "Espresso & Milk Based", price: 28000, cost: 8500, stock: 350, unit: "cup", type: ProductType.MANUFACTURED, station: StationType.BAR },
      { name: "V60 Filter Coffee Single Origin Gayo", sku: "CFE-V60-02", barcode: "899600100002", category: "Filter Coffee Manual Brew", price: 34000, cost: 11000, stock: 120, unit: "server", type: ProductType.MANUFACTURED, station: StationType.BAR },
      { name: "Butter Croissant Almond Flakes", sku: "CFE-PST-03", barcode: "899600100003", category: "Artisan Bakery & Pastry", price: 32000, cost: 14000, stock: 45, unit: "pcs", type: ProductType.FINISHED_GOOD, station: StationType.KITCHEN },
      { name: "Sparkling Yuzu Cold Brew", sku: "CFE-MCK-04", barcode: "899600100004", category: "Mocktail Segar", price: 36000, cost: 12500, stock: 80, unit: "glass", type: ProductType.MANUFACTURED, station: StationType.BAR },
    ],
    users: [
      { name: "Dimas Aditya (Founder Ruang Temu)", email: "owner.cafe@kadai.com", role: UserRole.ADMIN, pin: "333111" },
      { name: "Nadia (Head Store Manager Cafe)", email: "manager.cafe@kadai.com", role: UserRole.MANAGER, pin: "333222" },
      { name: "Farhan (Head Barista / Kasir)", email: "kasir.cafe@kadai.com", role: UserRole.CASHIER, pin: null },
      { name: "Kiki (Station Barista Bar)", email: "barista.cafe@kadai.com", role: UserRole.KITCHEN, pin: null },
      { name: "Dewi (Pastry Chef Dapur)", email: "dapur.cafe@kadai.com", role: UserRole.KITCHEN, pin: null },
      { name: "Anita (Akuntan Kafe & FnB)", email: "akuntan.cafe@kadai.com", role: UserRole.ACCOUNTANT, pin: null },
    ]
  },
  {
    vertical: "RETAIL",
    name: "Toko Grosir & Distribusi Sembako KADAI",
    slug: "grosir",
    description: "Pusat Distribusi Bahan Pokok, Sembako & Ritel Grosir dengan Multi-Satuan (Dus, Bal, Sak, Pcs)",
    outlets: [
      { name: "KADAI Grosir - Gudang Distribusi Kramat Jati", code: "GSR-01", address: "Kawasan Pasar Induk Kramat Jati, Jakarta Timur", phone: "08127777001", isMain: true },
    ],
    categories: ["Beras & Biji-Bijian Karungan", "Minyak Goreng & Gula Pasir", "Tepung Terigu & Bumbu Masak", "Minuman Kemasan Karton"],
    products: [
      { name: "Beras Pandan Wangi Premium 25 kg", sku: "GSR-BRS-01", barcode: "899700100001", category: "Beras & Biji-Bijian Karungan", price: 340000, cost: 305000, stock: 120, unit: "karung", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
      { name: "Minyak Goreng Sawit 2 Liter (Karton 6 Pouch)", sku: "GSR-MYK-02", barcode: "899700100002", category: "Minyak Goreng & Gula Pasir", price: 198000, cost: 182000, stock: 85, unit: "karton", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
      { name: "Gula Pasir Kristal Putih 50 kg (Sak)", sku: "GSR-GLA-03", barcode: "899700100003", category: "Minyak Goreng & Gula Pasir", price: 710000, cost: 660000, stock: 40, unit: "sak", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
      { name: "Tepung Terigu Segitiga Cakra 25 kg", sku: "GSR-TPG-04", barcode: "899700100004", category: "Tepung Terigu & Bumbu Masak", price: 235000, cost: 212000, stock: 65, unit: "karung", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
    ],
    users: [
      { name: "Haji Usman (Owner Grosir)", email: "owner.grosir@kadai.com", role: UserRole.ADMIN, pin: "333111" },
      { name: "Mulyadi (Kepala Gudang Grosir)", email: "manager.grosir@kadai.com", role: UserRole.MANAGER, pin: "333222" },
      { name: "Nanda (Kasir Transaksi Grosir)", email: "kasir.grosir@kadai.com", role: UserRole.CASHIER, pin: null },
      { name: "Bambang (Staf Checker Muat Barang)", email: "gudang.grosir@kadai.com", role: UserRole.INVENTORY, pin: null },
      { name: "Suryani (Akuntan Piutang Toko)", email: "akuntan.grosir@kadai.com", role: UserRole.ACCOUNTANT, pin: null },
    ]
  }
];

async function seedDemoClusters() {
  console.log("=== Memulai Seeding Klaster Akun Demo KADAI Multi-Vertikal ===");
  const defaultPassword = "password123";
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  // 1. Seed Outlets
  for (const cluster of CLUSTERS) {
    console.log(`\nProcessing Klaster: ${cluster.name} (${cluster.vertical})`);
    for (const out of cluster.outlets) {
      await prisma.outlet.upsert({
        where: { code: out.code },
        update: { name: out.name, address: out.address, phone: out.phone, isMain: out.isMain },
        create: { name: out.name, code: out.code, address: out.address, phone: out.phone, isMain: out.isMain },
      });
      console.log(`  [Outlet] ${out.name} (${out.code})`);
    }

    // 2. Seed Categories & Products
    for (const catName of cluster.categories) {
      await prisma.category.upsert({
        where: { name: catName },
        update: {},
        create: { name: catName, description: `Kategori ${catName} untuk ${cluster.name}` },
      });
    }

    for (const prod of cluster.products) {
      const category = await prisma.category.findUnique({ where: { name: prod.category } });
      if (!category) continue;

      const p = await prisma.product.upsert({
        where: { sku: prod.sku },
        update: {
          name: prod.name,
          barcode: prod.barcode,
          productType: prod.type,
          station: prod.station,
          unit: prod.unit,
        },
        create: {
          name: prod.name,
          sku: prod.sku,
          barcode: prod.barcode,
          description: `Katalog demo untuk ${cluster.name}`,
          productType: prod.type,
          station: prod.station,
          unit: prod.unit,
          categoryId: category.id,
        },
      });

      // Seed Product Batch (FIFO tracking)
      const batchNo = `BATCH-${prod.sku}-202611`;
      await prisma.productBatch.upsert({
        where: { batchNumber: batchNo },
        update: {
          quantity: prod.stock,
          remainingQty: prod.stock,
          costPrice: prod.cost,
          sellingPrice: prod.price,
        },
        create: {
          productId: p.id,
          batchNumber: batchNo,
          quantity: prod.stock,
          remainingQty: prod.stock,
          costPrice: prod.cost,
          sellingPrice: prod.price,
          purchaseDate: new Date(),
        },
      });
      console.log(`  [Product] ${prod.name} (Rp ${prod.price.toLocaleString("id-ID")})`);
    }

    // 3. Seed Users & RBAC
    for (const u of cluster.users) {
      const supervisorPinHash = u.pin ? await bcrypt.hash(u.pin, 12) : null;
      await prisma.user.upsert({
        where: { email: u.email },
        update: {
          name: u.name,
          role: u.role,
          supervisorPin: supervisorPinHash,
          isActive: true,
        },
        create: {
          name: u.name,
          email: u.email,
          passwordHash,
          role: u.role,
          supervisorPin: supervisorPinHash,
          isActive: true,
        },
      });
      console.log(`  [User ${u.role}] ${u.email} (PIN: ${u.pin || "-"})`);
    }
  }

  console.log("\n=== Semua Klaster Demo Klien Berhasil Dibuat! ===");
}

module.exports = seedDemoClusters;

if (require.main === module) {
  seedDemoClusters()
    .catch((e) => {
      console.error("Error seeding demo clusters:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
