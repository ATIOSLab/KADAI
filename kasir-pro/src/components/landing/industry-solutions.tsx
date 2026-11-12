"use client";

import { ShoppingCart, UtensilsCrossed, Building2, Hammer, Pill, Scissors, Check } from "lucide-react";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "./fade-in";

export function IndustrySolutions() {
  const industries = [
    {
      title: "Toko Bangunan & Alat Teknik",
      icon: Hammer,
      badge: "Heavy Material",
      subtitle: "Toko material, depo bangunan, supplier cat & thinner, pipa PVC, perkakas & besi beton.",
      features: [
        "Pemisahan Toko Display depan vs Gudang Material (Semen/Besi) via transfer stok antar cabang.",
        "Kalkulasi HPP sistem FIFO otomatis mengamankan margin saat harga komoditas material naik-turun.",
        "Scan barcode cepat untuk ribuan SKU fitting pipa, kran, kunci, saklar, dan perkakas teknik.",
        "Mendukung opsi pembayaran Tunai, QRIS, Transfer Bank, hingga nota Tempo / Bon Mandor Proyek.",
      ],
    },
    {
      title: "Toko Ritel, Sembako & Minimarket",
      icon: ShoppingCart,
      badge: "FMCG Grocery",
      subtitle: "Minimarket, grosir sembako, toko kelontong harian, butik fashion, dan toko oleh-oleh.",
      features: [
        "Terminal kasir kilat dengan input scanner barcode USB/Bluetooth dan navigasi keyboard F2/F4.",
        "Metode persediaan FIFO & FEFO (First Expired First Out) mendeteksi stok lama sebelum rusak.",
        "Radar peringatan otomatis saat stok barang mencapai batas minimum (low stock alert).",
        "Cetak struk kasir thermal 58mm/80mm instan dan kartu mutasi stok real-time.",
      ],
    },
    {
      title: "Kuliner, Kafe & Roastery (F&B)",
      icon: UtensilsCrossed,
      badge: "Modern F&B",
      subtitle: "Coffee shop modern, artisan bakery, kedai cepat saji, cloud kitchen, dan gerai minuman.",
      features: [
        "Resep Bill of Materials (BOM) otomatis memotong gramatur beans, fresh milk & cup per porsi.",
        "Layar monitor dapur & bar (KDS) memisahkan tiket pesanan koki dan barista tanpa kertas.",
        "Pemesanan mandiri QR Meja (Self-Order) terhubung langsung ke kasir dan pembayaran digital.",
        "Hitung otomatis Pajak Restoran (PB1 10%) dan biaya layanan (Service Charge).",
      ],
    },
    {
      title: "Apotek & Toko Alat Kesehatan",
      icon: Pill,
      badge: "Pharmacy Retail",
      subtitle: "Apotek mandiri, toko obat berizin, klinik pengobatan, dan gerai alat kesehatan diagnostik.",
      features: [
        "Pelacakan ketat nomor batch & tanggal kadaluwarsa obat dengan metode pengeluaran FEFO presisi.",
        "Pengelompokan jenis obat bebas (OTC), obat bebas terbatas, hingga racikan resep dokter.",
        "Rekapitulasi faktur pajak pembelian & penjualan farmasi sesuai standar pembukuan perpajakan.",
        "Cetak nota rincian obat lengkap untuk arsip pasien maupun klaim penggantian biaya.",
      ],
    },
    {
      title: "Jasa, Barbershop & Laundry Engine",
      icon: Scissors,
      badge: "Lifestyle & Service",
      subtitle: "Barbershop, salon kecantikan, klinik estetika, dan laundry kiloan/satuan work order.",
      features: [
        "Kalkulasi komisi kapster, tukang cukur, atau terapis secara otomatis dari transaksi kasir.",
        "Modul Work Order laundry digital: pencatatan timbangan kiloan, rak simpan, dan tahap cuci.",
        "Penjualan silang layanan jasa + produk ritel (pomade, serum rambut, parfum) dalam 1 faktur.",
        "Notifikasi status pengerjaan siap ambil langsung ke nomor WhatsApp pelanggan.",
      ],
    },
    {
      title: "Grosir & Jaringan Multi-Cabang",
      icon: Building2,
      badge: "Multi-Outlet HQ",
      subtitle: "Pusat distribusi logistik, gudang induk antar kota, jaringan franchise, dan multi-outlet.",
      features: [
        "Surat jalan transfer mutasi persediaan dari gudang induk/dapur pusat ke seluruh gerai cabang.",
        "Pantau performa penjualan, omzet harian, dan profitabilitas seluruh cabang secara konsolidasi.",
        "Pencatatan nota retur pasokan supplier, opname stok periodik, dan kartu stok FIFO terintegrasi.",
        "Kontrol hak akses bertingkat: Kasir, Staf Gudang, Manajer Gerai, dan Akuntan dengan PIN aman.",
      ],
    },
  ];

  return (
    <section id="solusi-industri" className="py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 w-full border-t border-slate-200/80">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Section Header: Pure Typography */}
        <FadeIn className="max-w-3xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Solusi Lintas Sektor
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-[1.15]">
            Dibuat Khusus untuk Karakter Usaha Anda
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Setiap model bisnis punya tantangan berbeda. KADAI menyediakan alur operasional yang langsung pas sejak hari pertama tanpa perlu kustomisasi rumit.
          </p>
        </FadeIn>

        {/* 6-Column Clean Editorial Flow (2x3 Grid) */}
        <FadeInStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 border-t border-slate-200/80 pt-10 sm:pt-12">
          {industries.map((ind, idx) => {
            const Icon = ind.icon;
            return (
              <FadeInStaggerItem key={idx} className="flex flex-col space-y-4 group p-5 rounded-2xl bg-white border border-slate-200/70 hover:border-primary/40 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-2xs">
                    <Icon className="size-5 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  {ind.badge && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 group-hover:bg-primary/10 group-hover:text-primary text-slate-600 transition-colors">
                      {ind.badge}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-950 group-hover:text-primary transition-colors">
                    {ind.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {ind.subtitle}
                  </p>
                </div>
                <ul className="space-y-2.5 pt-3 border-t border-slate-100 text-xs text-slate-700">
                  {ind.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2">
                      <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </FadeInStaggerItem>
            );
          })}
        </FadeInStagger>
      </div>
    </section>
  );
}
