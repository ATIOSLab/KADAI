"use client";

import {
  ShoppingCart,
  Warehouse,
  ChefHat,
  Building2,
  Wallet,
  Sparkles,
  Check,
} from "lucide-react";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "./fade-in";

export function CapabilityBentoGrid() {
  const capabilities = [
    {
      eyebrow: "Point of Sale",
      title: "Kasir Berkecepatan Tinggi & Pembayaran Terpadu",
      desc: "Transaksi instan dengan respon sub-detik tanpa jeda loading. Mendukung kasir cepat, cetak struk thermal 58mm/80mm, serta pembayaran tunai, transfer, dan QRIS dinamis otomatis.",
      icon: ShoppingCart,
      highlights: [
        "Cetak struk thermal 58mm & 80mm langsung dari kasir",
        "Kalkulasi otomatis Pajak Restoran (PB1 10%) dan Service Charge",
        "Otorisasi Supervisor PIN untuk pembatalan transaksi (void)",
      ],
    },
    {
      eyebrow: "Manajemen Persediaan",
      title: "Pelacakan Multi-Batch (FIFO, FEFO, Average)",
      desc: "Stok bahan baku dan barang dagangan berkurang otomatis setiap kasir mencetak struk. Fleksibel memilih metode FIFO, FEFO untuk produk berkadaluwarsa, atau metode Rata-rata.",
      icon: Warehouse,
      highlights: [
        "Kartu mutasi stok digital per batch masuk dan keluar",
        "Radar peringatan dini stok menipis dan mendekati expired",
        "Valuasi persediaan real-time untuk audit pembukuan",
      ],
    },
    {
      eyebrow: "Operasional Dapur & Bar",
      title: "Layar Kitchen Display (KDS) & Resep BOM Otomatis",
      desc: "Hilangkan nota kertas yang rawan basah atau hilang di dapur. Pesanan kasir seketika muncul di layar stasiun koki dan barista sesuai takaran resep Bill of Materials (BOM).",
      icon: ChefHat,
      highlights: [
        "Tiket antrean pesanan real-time dengan timer durasi masak",
        "Bahan baku terpotong otomatis per porsi menu yang terjual",
        "Status pesanan terkoordinasi langsung ke terminal kasir",
      ],
    },
    {
      eyebrow: "Tata Kelola Arus Kas",
      title: "Kas Modal Kasir & Kas Belanja Operasional Dapur",
      desc: "Pisahkan uang modal kerja belanja harian (es batu, bumbu, gas) dari uang laci kasir pembeli. Pantau suntikan modal owner dan rekonsiliasi kas harian tanpa campur aduk.",
      icon: Wallet,
      highlights: [
        "Multi-Kantong: Kas Laci Kasir vs Kas Belanja Tim Dapur",
        "Pencatatan kas masuk & kas keluar instan dari terminal POS",
        "Rekonsiliasi otomatis saat tutup shift kasir (Z-Report)",
      ],
    },
    {
      eyebrow: "Migrasi Kasir Tanpa Ribet",
      title: "AI Smart Import: Pindah dari Kasir Lain dalam 1 Detik",
      desc: "Sudah pakai kasir lain? Cukup unggah file Excel/CSV dari Moka, Majoo, Pawoon, atau spreadsheet lama. AI kami otomatis mengenali kolom nama, harga, HPP, dan stok awal secara gratis.",
      icon: Sparkles,
      highlights: [
        "Deteksi kolom otomatis tanpa format template kaku",
        "Preview tabel dan verifikasi integritas data sebelum impor",
        "100% Gratis di seluruh paket langganan KADAI",
      ],
    },
    {
      eyebrow: "Jaringan Gerai Terpusat",
      title: "Distribusi Antar-Cabang & Surat Jalan Digital",
      desc: "Kelola pasokan dari gudang pusat ke gerai cabang dengan surat jalan digital terenkripsi. Pantau performa omzet seluruh toko secara terpusat dari satu akun pemilik usaha.",
      icon: Building2,
      highlights: [
        "Surat jalan digital tercatat dengan status kirim dan terima",
        "Pemisahan hak akses staf kasir, manajer cabang, dan akuntan",
        "Konsolidasi laporan keuangan multi-outlet tanpa rekap manual",
      ],
    },
  ];

  return (
    <section id="kapabilitas" className="py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
      {/* Section Header: Pure Editorial Typography */}
      <FadeIn className="max-w-3xl mb-16 sm:mb-20 space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Kemampuan Sistem KADAI
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-[1.15]">
          Satu Sistem untuk Seluruh Alur Operasional Bisnis Anda
        </h2>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          Dirancang untuk menghilangkan pencatatan ganda. Mulai dari kasir di depan, dapur dan persediaan di belakang, hingga laporan keuangan konsolidasi.
        </p>
      </FadeIn>

      {/* Editorial Grid: Open, Spacious with Subtle Stagger Motion */}
      <FadeInStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12 sm:gap-y-14 border-t border-slate-200/80 pt-12 sm:pt-16">
        {capabilities.map((item, idx) => {
          const Icon = item.icon;
          return (
            <FadeInStaggerItem key={idx} className="flex flex-col space-y-4 group">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-2xs">
                  <Icon className="size-5 transition-transform duration-300 group-hover:scale-110" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {item.eyebrow}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 leading-snug group-hover:text-slate-900 transition-colors">
                {item.title}
              </h3>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {item.desc}
              </p>

              <ul className="space-y-2 pt-2 border-t border-slate-100 text-xs sm:text-sm text-slate-700">
                {item.highlights.map((h, hIdx) => (
                  <li key={hIdx} className="flex items-start gap-2.5">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span className="leading-snug">{h}</span>
                  </li>
                ))}
              </ul>
            </FadeInStaggerItem>
          );
        })}
      </FadeInStagger>
    </section>
  );
}
