export interface FAQItem {
  q: string;
  a: string;
}

export const LANDING_FAQS: FAQItem[] = [
  {
    q: "Apa itu KADAI dan apa bedanya dengan kasir biasa?",
    a: "Aplikasi kasir biasa umumnya hanya mencatat transaksi bayar. KADAI menghubungkan meja kasir, dapur, dan stok gudang: saat pesanan dibuat, layar dapur langsung membunyikan lonceng pesanan, stok bahan baku terpotong otomatis, dan rekap laba kotor hari itu langsung dihitung tanpa perlu rekap nota manual.",
  },
  {
    q: "Model bisnis apa saja yang dapat menggunakan KADAI?",
    a: "KADAI dirancang fleksibel untuk tiga vertikal utama: (1) Kuliner & F&B (kafe, restoran dine-in, cloud kitchen, bakery), (2) Ritel & Perdagangan (minimarket, apotek, butik, toko kelontong), dan (3) Layanan Jasa (barbershop, salon, bengkel, laundry).",
  },
  {
    q: "Apakah KADAI mendukung pengelolaan banyak cabang dan transfer stok?",
    a: "Ya. KADAI mendukung topologi Hub-and-Spoke, di mana Gudang atau Dapur Pusat (HQ) dapat mendistribusikan bahan baku ke cabang-cabang satelit menggunakan Surat Jalan Digital otomatis. Mutasi stok asal terpotong seketika dan cabang tujuan menerima stok melalui konfirmasi 1-klik.",
  },
  {
    q: "Bagaimana cara kerja hitungan resep makanan atau minuman?",
    a: "Anda tinggal masukkan takaran bahan per menu (misalnya: 18 gram kopi bubuk + 120 ml susu cair). Setiap kali menu itu terjual di kasir, stok kopi dan susu di gudang otomatis berkurang sesuai takaran, dan modal harga pokok per porsi langsung terhitung otomatis.",
  },
  {
    q: "Apakah KADAI bisa untuk usaha Non-PKP (tanpa pungutan pajak) maupun PKP?",
    a: "Sangat bisa. Jika usaha Anda berstatus Non-PKP (warung, toko kelontong, atau UMKM mikro), sistem otomatis menonaktifkan pungutan pajak (0%) sehingga nota kasir bersih tanpa potongan pajak. Jika usaha Anda berstatus PKP atau restoran yang memungut Pajak Restoran (PB1 10%), Anda tinggal memilih statusnya di menu pengaturan.",
  },
  {
    q: "Apakah KADAI mendukung legalitas badan usaha Indonesia seperti NIB OSS, PT Perorangan, atau CV?",
    a: "Ya, 100% mendukung regulasi perizinan Indonesia. KADAI menyediakan profil usaha yang dapat mencantumkan NIB OSS-RBA (13 digit), NIK KTP untuk Usaha Perorangan, serta NPWP untuk PT Perorangan (sesuai PP No. 8/2021), CV, PT, Koperasi, dan UD sehingga database legalitas UMKM Anda rapi dan sah.",
  },
  {
    q: "Apakah tersedia masa uji coba sebelum berlangganan berbayar?",
    a: "Ya, Anda dapat memulai dengan paket Starter gratis tanpa biaya bulanan, atau mencoba fitur lengkap KADAI untuk merasakan kemudahan operasional multi-cabang secara langsung.",
  },
  {
    q: "Alat apa saja yang bisa dipakai untuk menjalankan KADAI?",
    a: "KADAI bisa dibuka di laptop, komputer Windows, Mac, iPad, tablet, maupun HP Android biasa tanpa perlu beli alat baru. Printer struk kasir yang sudah Anda punya (tipe 58mm atau 80mm USB, Bluetooth, LAN) dan scanner barcode bisa langsung dicolok atau dihubungkan.",
  },
];
