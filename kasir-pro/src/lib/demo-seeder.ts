import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ProductType, StationType, UserRole } from "@prisma/client";

export const CLUSTERS = [
  // 1. TOKO BANGUNAN, MATERIAL & ALAT TEKNIK (HARDWARE & BUILDING SUPPLIES)
  {
    vertical: "BUILDING_SUPPLY",
    name: "TB Surya Abadi Material & Alat Teknik",
    slug: "bangunan",
    description: "Toko Bangunan & Supplier Material: Manajemen Multi-Gudang Semen, Besi, Cat, dan Kontrol HPP FIFO",
    outlets: [
      { name: "TB Surya Abadi - Toko Depan & Kasir", code: "TKB-01", address: "Jl. Raya Industri No. 88, Bekasi", phone: "08128888001", isMain: true },
      { name: "TB Surya Abadi - Gudang Induk Semen & Besi", code: "TKB-GDG", address: "Pergudangan Surya Jaya Blok B-12, Bekasi", phone: "08128888002", isMain: false },
    ],
    categories: [
      "Semen & Material Pasir",
      "Cat Tembok & Pelapis Bocor",
      "Pipa PVC & Sambungan Fitting",
      "Besi Beton & Baja Ringan",
      "Perkakas & Alat Teknik",
    ],
    products: [
      { name: "Semen Tiga Roda 50kg (Sak)", sku: "TKB-SMN-01", barcode: "899800100001", category: "Semen & Material Pasir", price: 72000, cost: 64000, stock: 350, unit: "sak", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
      { name: "Cat Dulux Weathershield 2.5L Brilliant White", sku: "TKB-CAT-02", barcode: "899800100002", category: "Cat Tembok & Pelapis Bocor", price: 245000, cost: 205000, stock: 45, unit: "galon", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
      { name: "Cat Kayu & Besi Avian 1kg Hitam Gloss", sku: "TKB-CAT-03", barcode: "899800100003", category: "Cat Tembok & Pelapis Bocor", price: 68000, cost: 55000, stock: 80, unit: "kaleng", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
      { name: "Pipa PVC Rucika AW 1/2 Inch (4 Meter)", sku: "TKB-PPA-04", barcode: "899800100004", category: "Pipa PVC & Sambungan Fitting", price: 38500, cost: 29000, stock: 160, unit: "batang", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
      { name: "Knee Elbow PVC 1/2 Inch Rucika", sku: "TKB-FTG-05", barcode: "899800100005", category: "Pipa PVC & Sambungan Fitting", price: 5500, cost: 3200, stock: 450, unit: "pcs", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
      { name: "Besi Beton Ulir 10mm SNI (12 Meter)", sku: "TKB-BSI-06", barcode: "899800100006", category: "Besi Beton & Baja Ringan", price: 86000, cost: 74000, stock: 220, unit: "batang", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
      { name: "Baja Ringan Kanal C75 0.75mm SNI (6 Meter)", sku: "TKB-BJR-07", barcode: "899800100007", category: "Besi Beton & Baja Ringan", price: 92000, cost: 78000, stock: 190, unit: "batang", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
      { name: "Mesin Gerinda Tangan Maktec MT90 4 Inch", sku: "TKB-AL-08", barcode: "899800100008", category: "Perkakas & Alat Teknik", price: 385000, cost: 315000, stock: 25, unit: "unit", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
      { name: "Paku Kayu 5cm SNI (Kg)", sku: "TKB-PKU-09", barcode: "899800100009", category: "Perkakas & Alat Teknik", price: 22000, cost: 16500, stock: 140, unit: "kg", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
      { name: "Kran Tembok Onda 1/2 Inch Stainless", sku: "TKB-KRN-10", barcode: "899800100010", category: "Perkakas & Alat Teknik", price: 45000, cost: 32000, stock: 75, unit: "pcs", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
    ],
    users: [
      { name: "Hendra Wijaya (Owner TB Surya Abadi)", email: "owner.bangunan@kadai.asia", role: UserRole.ADMIN, pin: "999111" },
      { name: "Rudi Hartono (Kepala Toko Bangunan)", email: "manager.bangunan@kadai.asia", role: UserRole.MANAGER, pin: "999222" },
      { name: "Eko Prasetyo (Kasir Kas & Barcode Toko)", email: "kasir.bangunan@kadai.asia", role: UserRole.CASHIER, pin: null },
      { name: "Surya Kencana (Staf Gudang Material & Semen)", email: "gudang.bangunan@kadai.asia", role: UserRole.INVENTORY, pin: null },
      { name: "Lestari (Akuntan Piutang Mandor)", email: "akuntan.bangunan@kadai.asia", role: UserRole.ACCOUNTANT, pin: null },
    ],
  },

  // 2. APOTEK & ALAT KESEHATAN (PHARMACY RETAIL)
  {
    vertical: "PHARMACY",
    name: "Apotek Sehat Medika & Alkes",
    slug: "apotek",
    description: "Apotek & Toko Obat: Pelacakan Kedaluwarsa FEFO, Nomor Batch Presisi, dan Kontrol Stok Obat Keras/Bebas",
    outlets: [
      { name: "Apotek Sehat Medika - Pondok Indah", code: "APT-01", address: "Jl. Metro Pondok Indah Blok TC No. 12, Jaksel", phone: "08129999001", isMain: true },
    ],
    categories: [
      "Obat Bebas & Flu Batuk (OTC)",
      "Vitamin & Imunitas Tubuh",
      "Antiseptik & P3K",
      "Alat Kesehatan & Diagnostik",
    ],
    products: [
      { name: "Panadol Extra Merah 10 Kaplet", sku: "APT-OBT-01", barcode: "899900100001", category: "Obat Bebas & Flu Batuk (OTC)", price: 14500, cost: 11200, stock: 260, unit: "strip", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
      { name: "Sanmol Paracetamol 500mg (Strip 4 Tablet)", sku: "APT-OBT-02", barcode: "899900100002", category: "Obat Bebas & Flu Batuk (OTC)", price: 6000, cost: 4200, stock: 320, unit: "strip", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
      { name: "Imboost Force Daya Tahan Tubuh 10 Kaplet", sku: "APT-VIT-03", barcode: "899900100003", category: "Vitamin & Imunitas Tubuh", price: 45000, cost: 36000, stock: 110, unit: "strip", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
      { name: "Tolak Angin Cair Sidomuncul (Box 12 Sachet)", sku: "APT-VIT-04", barcode: "899900100004", category: "Vitamin & Imunitas Tubuh", price: 48000, cost: 39000, stock: 90, unit: "box", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
      { name: "Betadine Antiseptic Solution 60ml", sku: "APT-P3K-05", barcode: "899900100005", category: "Antiseptik & P3K", price: 32000, cost: 24500, stock: 85, unit: "botol", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
      { name: "Tensimeter Digital Otomatis Omron HEM-7120", sku: "APT-ALK-06", barcode: "899900100006", category: "Alat Kesehatan & Diagnostik", price: 480000, cost: 390000, stock: 16, unit: "unit", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
      { name: "Masker Medis 3-Ply Earloop Surgical (Box 50pcs)", sku: "APT-ALK-07", barcode: "899900100007", category: "Alat Kesehatan & Diagnostik", price: 35000, cost: 22000, stock: 140, unit: "box", type: ProductType.FINISHED_GOOD, station: StationType.GENERAL },
    ],
    users: [
      { name: "apt. Fitri Rahmawati, S.Farm (Owner Apotek)", email: "owner.apotek@kadai.asia", role: UserRole.ADMIN, pin: "222111" },
      { name: "apt. Bayu Pratama (Apoteker Pengelola Apotek)", email: "manager.apotek@kadai.asia", role: UserRole.MANAGER, pin: "222222" },
      { name: "Siti Rahayu (Asisten Apoteker / Kasir)", email: "kasir.apotek@kadai.asia", role: UserRole.CASHIER, pin: null },
      { name: "Indra Gunawan (Gudang Farmasi & FEFO Batch)", email: "gudang.apotek@kadai.asia", role: UserRole.INVENTORY, pin: null },
      { name: "Citra Melati (Akuntan Pajak & Faktur Farmasi)", email: "akuntan.apotek@kadai.asia", role: UserRole.ACCOUNTANT, pin: null },
    ],
  },
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
      { name: "Oolong Tea Melati Pot", sku: "RSN-TEA-04", barcode: "899100100004", category: "Minuman Tradisional & Kopi", price: 28000, cost: 6000, stock: 200, unit: "teko", type: ProductType.FINISHED_GOOD, station: StationType.BAR },
      { name: "Daging Iga Sapi Potong Segar", sku: "RAW-IGA-01", barcode: "899100100091", category: "Bahan Mentah Dapur", price: 110000, cost: 95000, stock: 50, unit: "kg", type: ProductType.RAW_MATERIAL, station: StationType.KITCHEN },
      { name: "Udang Kupas Frozen Pilihan", sku: "RAW-UDG-02", barcode: "899100100092", category: "Bahan Mentah Dapur", price: 95000, cost: 72000, stock: 80, unit: "kg", type: ProductType.RAW_MATERIAL, station: StationType.KITCHEN },
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
  }
];

export async function runDemoSeeding() {
  console.log("=== Memulai Eksekusi Langsung Seeding Demo Clusters ===");
  const defaultPassword = "password123";
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  for (const cluster of CLUSTERS) {
    let mainOutletId: string | undefined;
    for (const out of cluster.outlets) {
      const o = await prisma.outlet.upsert({
        where: { code: out.code },
        update: { name: out.name, address: out.address, phone: out.phone, isMain: out.isMain, isDemo: true },
        create: { name: out.name, code: out.code, address: out.address, phone: out.phone, isMain: out.isMain, isDemo: true },
      });
      if (out.isMain || !mainOutletId) {
        mainOutletId = o.id;
      }
    }

    for (const catName of cluster.categories) {
      await prisma.category.upsert({
        where: { name: catName },
        update: { isDemo: true },
        create: { name: catName, description: `Kategori ${catName} untuk ${cluster.name}`, isDemo: true },
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
          isDemo: true,
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
          isDemo: true,
        },
      });

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
    }

    for (const u of cluster.users) {
      const supervisorPinHash = u.pin ? await bcrypt.hash(u.pin, 12) : null;
      const targetEmails = new Set([u.email]);
      if (u.email.endsWith("@kadai.asia")) {
        targetEmails.add(u.email.replace("@kadai.asia", "@kadai.com"));
      } else if (u.email.endsWith("@kadai.com")) {
        targetEmails.add(u.email.replace("@kadai.com", "@kadai.asia"));
      }

      for (const email of targetEmails) {
        await prisma.user.upsert({
          where: { email },
          update: {
            name: u.name,
            role: u.role,
            supervisorPin: supervisorPinHash,
            isActive: true,
            outletId: mainOutletId,
            isDemo: true,
          },
          create: {
            name: u.name,
            email,
            passwordHash,
            role: u.role,
            supervisorPin: supervisorPinHash,
            isActive: true,
            outletId: mainOutletId,
            isDemo: true,
          },
        });
      }
    }
  }

  console.log("=== Seeding Klaster Demo Berhasil 100% Selesai! ===");
  return { success: true, totalClusters: CLUSTERS.length };
}
