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
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function CapabilityBentoGrid() {
  return (
    <section id="kapabilitas" className="py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-12">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass-nav text-slate-800 text-xs font-semibold shadow-2xs">
          <Sparkles className="size-3 text-primary" />
          <span>Kapabilitas Platform Terpadu</span>
        </div>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950">
          Semua yang Dibutuhkan Bisnis Anda. Dalam Satu Platform.
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed text-balance">
          Dari transaksi harian hingga pengelolaan operasional dan keuangan, KADAI membantu menyatukan proses bisnis dalam satu ekosistem.
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
              <Badge variant="outline" className="border-orange-200 bg-orange-50/60 text-primary text-[10px] font-bold">
                Sub-Detik Latensi
              </Badge>
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold text-primary uppercase tracking-wider block">
                Point of Sale
              </span>
              <h3 className="text-xl font-black text-slate-950 mt-0.5">
                POS Kasir Kilat & Struk Thermal
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Transaksi kasir instan dengan hotkeys (<code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs font-bold">F2</code> Cari Produk, <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs font-bold">F4</code> Checkout), multi-pembayaran Tunai, QRIS Dinamis, dan Transfer Bank, serta cetak struk thermal 58mm/80mm instan.
            </p>
          </div>

          {/* Micro Interactive Replica */}
          <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 space-y-2 text-xs shadow-2xs">
            <div className="flex justify-between items-center text-slate-500 font-mono text-[11px] pb-1 border-b border-slate-100">
              <span>Checkout Kasir // Hotkey F4</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="size-3" /> Lunas Terkonfirmasi
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-800">2x Es Kopi Susu Aren + 1x Nasi Goreng</span>
              <span className="font-mono font-bold text-slate-900">Rp 68.000</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Pajak Daerah Resto PB1 (10%)</span>
              <span className="font-mono font-semibold">Rp 6.800</span>
            </div>
            <div className="flex justify-between items-center text-slate-950 font-black pt-1.5 border-t border-slate-200 text-sm">
              <span>TOTAL DITERIMA (QRIS DINAMIS)</span>
              <span className="font-mono text-primary text-base">Rp 74.800</span>
            </div>
          </div>
        </div>

        {/* Card 2: Inventori & Stok FIFO (Span 5) */}
        <div className="md:col-span-5 rounded-3xl liquid-glass-card p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:shadow-xl transition-all duration-300 group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="size-11 rounded-2xl bg-blue-50 border border-blue-200/90 flex items-center justify-center text-blue-600 shadow-2xs group-hover:scale-105 transition-transform">
                <Warehouse className="size-5" />
              </div>
              <Badge variant="outline" className="border-blue-200 bg-blue-50/60 text-blue-700 text-[10px] font-bold">
                PSAK 14 Compliant
              </Badge>
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold text-blue-600 uppercase tracking-wider block">
                Manajemen Persediaan
              </span>
              <h3 className="text-xl font-black text-slate-950 mt-0.5">
                Multi-Batch FIFO & Radar Expired
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Pelacakan alur First-In First-Out per nomor batch pembelian, kartu stok mutasi otomatis, dan radar peringatan bahan mendekati tanggal kadaluwarsa (&lt; 7 dan &lt; 30 hari).
            </p>
          </div>

          <div className="space-y-2 p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 text-xs shadow-2xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800">Batch #01 (Exp: 7 Hari)</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
                Prioritas Keluar
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Sisa: 12 kg @ Rp 140.000</span>
              <span className="font-mono font-bold text-slate-900">Rp 1.680.000</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-emerald-700 font-semibold text-[11px]">
              <span>Kepatuhan SAK EMKM: Terverifikasi</span>
              <span>100% FIFO</span>
            </div>
          </div>
        </div>

        {/* Card 3: Dapur Pusat & Resep BOM (Span 5) */}
        <div className="md:col-span-5 rounded-3xl liquid-glass-card p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:shadow-xl transition-all duration-300 group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="size-11 rounded-2xl bg-amber-50 border border-amber-200/90 flex items-center justify-center text-amber-600 shadow-2xs group-hover:scale-105 transition-transform">
                <ChefHat className="size-5" />
              </div>
              <Badge variant="outline" className="border-amber-200 bg-amber-50/60 text-amber-800 text-[10px] font-bold">
                Dapur & Bar KDS
              </Badge>
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold text-amber-600 uppercase tracking-wider block">
                Central Kitchen
              </span>
              <h3 className="text-xl font-black text-slate-950 mt-0.5">
                Resep BOM & Produksi Batch
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Penyusunan komponen Bill of Materials (BOM) per menu, eksekusi produksi batch setengah jadi, dan routing pesanan ke Kitchen Display System (KDS) stasiun dapur & bar.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 text-white space-y-2 text-xs shadow-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-200">KDS Stasiun Dapur</span>
              <span className="text-amber-400 font-mono font-bold text-[11px] flex items-center gap-1">
                <Clock className="size-3" /> 04:18 Cooking
              </span>
            </div>
            <p className="text-[11px] text-slate-300">2x Ayam Bakar Madu Pedas • Meja 07 (Sambal Terpisah)</p>
          </div>
        </div>

        {/* Card 4: Multi-Outlet Management (Span 7) */}
        <div className="md:col-span-7 rounded-3xl liquid-glass-card p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:shadow-xl transition-all duration-300 group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="size-11 rounded-2xl bg-purple-50 border border-purple-200/90 flex items-center justify-center text-purple-600 shadow-2xs group-hover:scale-105 transition-transform">
                <Building2 className="size-5" />
              </div>
              <Badge variant="outline" className="border-purple-200 bg-purple-50/60 text-purple-700 text-[10px] font-bold">
                Hub & Spoke Network
              </Badge>
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold text-purple-600 uppercase tracking-wider block">
                Distribusi & Jaringan
              </span>
              <h3 className="text-xl font-black text-slate-950 mt-0.5">
                Multi-Outlet & Transfer Stok Cabang
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Pengiriman bahan baku dari Gudang/Dapur Pusat ke gerai cabang dan booth satelit. Otomatis memotong stok asal dan menerbitkan surat jalan digital terenkripsi dengan status In-Transit.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2">
              <Truck className="size-4 text-primary shrink-0" />
              <div>
                <span className="font-bold text-slate-900 block">Surat Jalan TRF-20261105-0014</span>
                <span className="text-slate-500 text-[11px]">Gudang Pusat (HQ) → Booth Thamrin</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-bold text-[10px] w-fit">
              Dalam Pengiriman (In Transit)
            </span>
          </div>
        </div>

        {/* Card 5: Pembukuan SAK EMKM (Span 6) */}
        <div className="md:col-span-6 rounded-3xl liquid-glass-card p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:shadow-xl transition-all duration-300 group">
          <div className="space-y-3">
            <div className="size-11 rounded-2xl bg-emerald-50 border border-emerald-200/90 flex items-center justify-center text-emerald-600 shadow-2xs group-hover:scale-105 transition-transform">
              <Scale className="size-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold text-emerald-600 uppercase tracking-wider block">
                Standar Akuntansi SAK EMKM
              </span>
              <h3 className="text-xl font-black text-slate-950 mt-0.5">
                Laporan Keuangan & Laba Rugi Otomatis
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Penyusunan laporan laba rugi periodik berdasarkan penjualan riil dan beban pokok HPP FIFO. Format laporan rapi dan sah untuk pengajuan pembiayaan bank atau audit internal.
            </p>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white/90 border border-slate-200/80 text-xs text-slate-700 shadow-2xs">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>Rekonsiliasi omzet harian & margin laba kotor per SKU produk.</span>
          </div>
        </div>

        {/* Card 6: Fiskal RI Terintegrasi (Span 6) */}
        <div className="md:col-span-6 rounded-3xl liquid-glass-card p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:shadow-xl transition-all duration-300 group">
          <div className="space-y-3">
            <div className="size-11 rounded-2xl bg-rose-50 border border-rose-200/90 flex items-center justify-center text-rose-600 shadow-2xs group-hover:scale-105 transition-transform">
              <Receipt className="size-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold text-rose-600 uppercase tracking-wider block">
                Fiskal RI Terintegrasi
              </span>
              <h3 className="text-xl font-black text-slate-950 mt-0.5">
                Pajak Daerah PB1 10%, PPN 11% & PP 55/2022
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Pemisahan pajak restoran (PB1) dan PPN komersial per outlet. Buku peredaran bruto otomatis untuk perhitungan PPh Final UMKM 0.5% dengan simulasi ambang batas bebas pajak WP Orang Pribadi.
            </p>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white/90 border border-slate-200/80 text-xs text-slate-700 shadow-2xs">
            <CheckCircle2 className="size-4 text-rose-600 shrink-0" />
            <span>Pemisahan dana pajak terhimpun agar tidak tercampur kas operasional toko.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
