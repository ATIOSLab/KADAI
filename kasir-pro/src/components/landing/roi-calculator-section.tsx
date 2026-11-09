"use client";

import { useState } from "react";
import Link from "next/link";
import { Calculator, ArrowRight, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "./fade-in";

export function RoiCalculatorSection() {
  const [businessType, setBusinessType] = useState<"fnb" | "retail">("fnb");
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(35000000); // 35 Juta
  const [outletCount, setOutletCount] = useState<number>(1);

  // Estimasi Kebocoran & Efisiensi Berdasarkan Data Nyata Industri
  // F&B: Kebocoran bahan mentah tanpa BOM rata-rata 4-7%, kesalahan nota kasir 1.5%
  // Ritel: Barang kadaluwarsa tersembunyi & stok mati rata-rata 3-5%
  const wasteRate = businessType === "fnb" ? 0.055 : 0.04;
  const estimatedLeakagePerMonth = Math.round(monthlyRevenue * wasteRate * outletCount);
  
  // Waktu rekap nota manual yang dihemat: ~2 jam/hari x 30 hari = 60 jam/outlet
  const hoursSavedPerMonth = 45 * outletCount;

  // Biaya KADAI (misal paket Business Pro Rp 249rb atau Pro Rp 99rb)
  const kadaiCost = outletCount > 1 ? 249000 : 99000;
  const netSavingsPerMonth = Math.max(0, estimatedLeakagePerMonth - kadaiCost);
  const annualSavings = netSavingsPerMonth * 12;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <section className="py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 w-full border-t border-slate-200/80 bg-white relative overflow-hidden">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Section Header */}
        <FadeIn className="text-center max-w-2xl mx-auto space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary flex items-center justify-center gap-1.5">
            <Calculator className="size-4" />
            <span>Kalkulator Penghematan Usaha</span>
          </p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 leading-tight">
            Berapa Kebocoran Biaya yang Bisa Anda Selamatkan?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed text-balance">
            Tanpa sistem resep BOM dan radar kadaluwarsa FIFO, rata-rata bisnis kehilangan 3% hingga 6% omzet tiap bulan tanpa disadari.
          </p>
        </FadeIn>

        {/* Interactive Calculator Box */}
        <FadeIn className="rounded-[28px] border border-slate-200/90 bg-slate-50/60 p-6 sm:p-10 shadow-lg grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Inputs (Span 6) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Business Type Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Jenis Usaha Anda
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/70 rounded-xl">
                <button
                  type="button"
                  onClick={() => setBusinessType("fnb")}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                    businessType === "fnb"
                      ? "bg-white text-slate-950 shadow-xs"
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  ☕ Kuliner / Kafe / Resto
                </button>
                <button
                  type="button"
                  onClick={() => setBusinessType("retail")}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                    businessType === "retail"
                      ? "bg-white text-slate-950 shadow-xs"
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  🛍️ Toko Ritel / Kelontong
                </button>
              </div>
            </div>

            {/* Slider: Omzet Bulanan */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Omzet Penjualan per Bulan</span>
                <span className="font-extrabold text-primary tabular-nums text-sm">
                  {formatRupiah(monthlyRevenue)}
                </span>
              </div>
              <input
                type="range"
                min={5000000}
                max={250000000}
                step={5000000}
                value={monthlyRevenue}
                onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Rp 5 Juta</span>
                <span>Rp 100 Jt</span>
                <span>Rp 250 Juta</span>
              </div>
            </div>

            {/* Selector: Jumlah Cabang / Gerai */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Jumlah Gerai (Outlet)</span>
                <span className="font-extrabold text-slate-900 tabular-nums">
                  {outletCount} Gerai
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 5].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setOutletCount(cnt)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      outletCount === cnt
                        ? "bg-slate-950 text-white border-slate-950 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {cnt} {cnt >= 5 ? "Outlet+" : "Outlet"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Results (Span 6): High-Contrast Summary Card */}
          <div className="lg:col-span-6 bg-slate-950 text-white rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl border border-slate-800">
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-widest text-primary uppercase flex items-center gap-1">
                <Sparkles className="size-3" />
                Potensi Efisiensi Bersih
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight tabular-nums pt-1">
                {formatRupiah(netSavingsPerMonth)}
                <span className="text-xs font-semibold text-slate-400 font-normal"> / bulan</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                Atau setara hemat <strong className="text-emerald-400">{formatRupiah(annualSavings)}/tahun</strong> dari eliminasi bahan terbuang dan nota manual.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Penyelamatan Stok Bocor / Expired</span>
                <span className="font-bold text-emerald-400 tabular-nums">
                  ~{formatRupiah(estimatedLeakagePerMonth)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Waktu Rekap Kasir Dihemat</span>
                <span className="font-bold text-white tabular-nums">
                  ~{hoursSavedPerMonth} Jam / bln
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Investasi Langganan KADAI</span>
                <span className="font-bold text-slate-300 tabular-nums">
                  {formatRupiah(kadaiCost)} / bln
                </span>
              </div>
            </div>

            <Button
              asChild
              className="w-full font-bold text-xs h-11 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md transition-all active:scale-95"
            >
              <Link href="/register" className="flex items-center justify-center gap-2">
                <span>Amankan Margin Usaha Anda</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
