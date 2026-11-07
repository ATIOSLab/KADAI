"use client";

import {
  ShoppingCart,
  Warehouse,
  ChefHat,
  Building2,
  Scale,
  Receipt,
  Clock,
  Truck,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function CapabilityBentoGrid() {
  return (
    <section id="kapabilitas" className="py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-12">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
          <Layers className="size-3 text-primary" />
          <span>Fitur Lengkap Bisnis</span>
        </div>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950">
          Semua yang Dibutuhkan Usaha Anda. Rapi dalam Satu Tempat.
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed text-balance">
          Mulai dari melayani antrean pembeli di kasir, memotong stok bahan di gudang, sampai mengecek laporan laba bersih harian dari ponsel Anda.
        </p>
      </div>

      {/* Bento Grid Composition with Liquid Glass & Hover Elevation */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Card 1: POS & Kasir Kilat (Span 7) */}
        <div className="md:col-span-7 rounded-3xl liquid-glass-card p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:shadow-xl transition-all duration-300 group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="size-11 rounded-2xl bg-orange-50 border border-orange-200/90 flex items-center justify-center text-primary shadow-2xs group-hover:scale-105 transition-transform">
                <ShoppingCart className="size-5" />
              </div>
              <Badge variant="outline" className="border-orange-200 bg-orange-50/70 text-primary text-[10px] font-bold">
                Kasir Kilat & Cepat
              </Badge>
            </div>
            <div>
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                Point of Sale
              </span>
              <h3 className="text-xl font-black text-slate-950 mt-0.5">
                POS Kasir Kilat & Cetak Struk
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Transaksi kasir instan tanpa loading lama. Mendukung pembayaran Tunai, QRIS Dinamis otomatis, kartu debit, hingga cetak struk thermal 58mm/80mm dalam hitungan detik.
            </p>
          </div>

          {/* Micro Interactive Replica */}
          <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 space-y-2 text-xs shadow-2xs">
            <div className="flex justify-between items-center text-slate-500 text-[11px] pb-1 border-b border-slate-100 font-medium">
              <span>Struk Penjualan Kasir</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="size-3" /> Lunas Terkonfirmasi
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-800">2x Es Kopi Susu Aren + 1x Nasi Goreng</span>
              <span className="font-mono font-bold text-slate-900">Rp 68.000</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Pajak Restoran PB1 (10%)</span>
              <span className="font-mono font-semibold">Rp 6.800</span>
            </div>
            <div className="flex justify-between items-center text-slate-950 font-black pt-1.5 border-t border-slate-200 text-sm">
              <span>Total Pembayaran (QRIS)</span>
              <span className="font-mono text-primary text-base">Rp 74.800</span>
            </div>
          </div>
        </div>

        {/* Card 2: Inventori & Stok FIFO (Span 5) */}
        <div className="md:col-span-5 rounded-3xl liquid-glass-card p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:shadow-xl transition-all duration-300 group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="size-11 rounded-2xl bg-amber-50 border border-amber-200/90 flex items-center justify-center text-amber-600 shadow-2xs group-hover:scale-105 transition-transform">
                <Warehouse className="size-5" />
              </div>
              <Badge variant="outline" className="border-amber-200 bg-amber-50/70 text-amber-800 text-[10px] font-bold">
                Metode FIFO
              </Badge>
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                Manajemen Persediaan
              </span>
              <h3 className="text-xl font-black text-slate-950 mt-0.5">
                Stok Otomatis & Radar Kedaluwarsa
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Bahan lama otomatis keluar duluan (FIFO), sisa stok dihitung otomatis setiap kasir mencetak struk, dan ada peringatan dini sebelum barang basi atau habis.
            </p>
          </div>

          <div className="space-y-2 p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 text-xs shadow-2xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800">Batch Susu UHT (Exp: 7 Hari)</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
                Habiskan Duluan
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Sisa: 12 Liter di Gudang</span>
              <span className="font-mono font-bold text-slate-900">Rp 216.000</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-emerald-700 font-semibold text-[11px]">
              <span>Status Stok: Akurat</span>
              <span>100% FIFO</span>
            </div>
          </div>
        </div>

        {/* Card 3: Dapur Pusat & Resep BOM (Span 5) */}
        <div className="md:col-span-5 rounded-3xl liquid-glass-card p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:shadow-xl transition-all duration-300 group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="size-11 rounded-2xl bg-orange-50 border border-orange-200/90 flex items-center justify-center text-primary shadow-2xs group-hover:scale-105 transition-transform">
                <ChefHat className="size-5" />
              </div>
              <Badge variant="outline" className="border-orange-200 bg-orange-50/70 text-primary text-[10px] font-bold">
                Layar Dapur & Bar
              </Badge>
            </div>
            <div>
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                Operasional Dapur
              </span>
              <h3 className="text-xl font-black text-slate-950 mt-0.5">
                Resep Otomatis & Monitor Dapur
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Pesanan di kasir otomatis tampil di layar dapur (KDS) tanpa lempar kertas nota. Takaran bumbu dan bahan baku langsung terpotong akurat per porsi.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 text-white space-y-2 text-xs shadow-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-200">Layar Monitor Dapur</span>
              <span className="text-amber-400 font-mono font-bold text-[11px] flex items-center gap-1">
                <Clock className="size-3" /> 04:18 Sedang Dimasak
              </span>
            </div>
            <p className="text-[11px] text-slate-300">2x Ayam Bakar Madu Pedas • Meja 07 (Sambal Terpisah)</p>
          </div>
        </div>

        {/* Card 4: Multi-Outlet Management (Span 7) */}
        <div className="md:col-span-7 rounded-3xl liquid-glass-card p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:shadow-xl transition-all duration-300 group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="size-11 rounded-2xl bg-slate-100 border border-slate-200/90 flex items-center justify-center text-slate-800 shadow-2xs group-hover:scale-105 transition-transform">
                <Building2 className="size-5" />
              </div>
              <Badge variant="outline" className="border-slate-200 bg-slate-100/80 text-slate-700 text-[10px] font-bold">
                Multi-Cabang
              </Badge>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Jaringan Gerai
              </span>
              <h3 className="text-xl font-black text-slate-950 mt-0.5">
                Kelola Banyak Toko & Kirim Stok
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Pantau seluruh cabang toko dari satu akun. Kirim barang antar-gerai dengan surat jalan digital rapi tanpa risiko barang tercecer atau data selisih.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2">
              <Truck className="size-4 text-primary shrink-0" />
              <div>
                <span className="font-bold text-slate-900 block">Surat Jalan Digital #0014</span>
                <span className="text-slate-500 text-[11px]">Gudang Pusat → Cabang Thamrin</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-bold text-[10px] w-fit">
              Dalam Pengiriman (In Transit)
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
