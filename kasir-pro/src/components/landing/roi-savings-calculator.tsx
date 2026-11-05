"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Clock,
  ArrowRight,
  CircleDollarSign,
  Percent,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function RoiSavingsCalculator() {
  const [outletsCount, setOutletsCount] = useState<number>(3);
  const [monthlyRevenuePerOutlet, setMonthlyRevenuePerOutlet] = useState<number>(50); // in millions IDR

  // Total monthly revenue in IDR
  const totalMonthlyRevenue = outletsCount * monthlyRevenuePerOutlet * 1_000_000;

  // Typical F&B / Retail stock shrinkage without automated BOM is 3.5%
  const monthlyStockSavings = totalMonthlyRevenue * 0.035;

  // Monthly labor saved in reconciliation: ~25 hours per outlet
  const hoursSavedPerMonth = outletsCount * 25;

  // Estimated cashier leakage / human error prevented: Rp 1.2M per outlet per month
  const cashierErrorPrevention = outletsCount * 1_200_000;

  // Total monthly value generated
  const totalMonthlyValue = monthlyStockSavings + cashierErrorPrevention;

  // Kadai plan estimated cost (e.g. Business Pro ~249k/mo or Enterprise ~599k/mo)
  const estimatedKadaiCost = outletsCount <= 3 ? 249_000 : 599_000;

  // ROI multiple
  const roiMultiple = Math.round(totalMonthlyValue / estimatedKadaiCost);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <section id="kalkulator-roi" className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-12">
      <div className="text-center space-y-3">
        <Badge variant="outline" className="font-semibold rounded-full px-3.5 py-1 text-slate-800 border-slate-300">
          Kalkulator Efisiensi Finansial
        </Badge>
        <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950">
          Hitung Penghematan Nyata dari Pengendalian Stok Otomatis
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          KADAI bukan sekadar biaya perangkat lunak, melainkan benteng penyelamat margin bisnis Anda dari kebocoran bahan baku, selisih kas kasir, dan waktu tutup buku yang berlarut-larut.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Sliders Input Panel */}
        <div className="lg:col-span-6 space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-bold text-slate-900 block">Jumlah Cabang Gerai / Outlet</label>
                <span className="text-xs text-muted-foreground">Termasuk gerai dine-in, booth, atau gudang</span>
              </div>
              <span className="font-mono text-xl font-black text-primary px-3 py-1 rounded-lg bg-orange-50 border border-orange-200">
                {outletsCount} Cabang
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              step="1"
              value={outletsCount}
              onChange={(e) => setOutletsCount(parseInt(e.target.value) || 1)}
              className="w-full accent-primary h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-600">
              <span>1 Gerai</span>
              <span>10 Cabang</span>
              <span>25+ Jaringan</span>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-bold text-slate-900 block">Rata-rata Omzet per Cabang</label>
                <span className="text-xs text-muted-foreground">Pendapatan kotor bulanan rata-rata</span>
              </div>
              <span className="font-mono text-xl font-black text-primary px-3 py-1 rounded-lg bg-orange-50 border border-orange-200">
                Rp {monthlyRevenuePerOutlet} Juta
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="250"
              step="5"
              value={monthlyRevenuePerOutlet}
              onChange={(e) => setMonthlyRevenuePerOutlet(parseInt(e.target.value) || 10)}
              className="w-full accent-primary h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-600">
              <span>Rp 10 Juta</span>
              <span>Rp 100 Juta</span>
              <span>Rp 250+ Juta</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-3">
            <CircleDollarSign className="size-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">Estimasi Omzet Jaringan Bulanan:</span>
              <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                {formatIDR(totalMonthlyRevenue)} / bulan
              </p>
            </div>
          </div>
        </div>

        {/* Realtime Output Card */}
        <div className="lg:col-span-6 h-full">
          <Card className="h-full border-2 border-slate-900 bg-slate-950 text-white p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-mono text-xs font-bold">
                  PROYEKSI EFISIENSI REAL
                </Badge>
                <span className="text-xs font-mono text-slate-400">ROI Multiple: {roiMultiple}x</span>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">
                  Total Nilai Finansial Terselamatkan:
                </span>
                <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 mt-1">
                  {formatIDR(totalMonthlyValue)}
                  <span className="text-xs font-normal text-slate-400 font-sans ml-1">/ bulan</span>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
                    <span>Pencegahan Kebocoran Stok (BOM Variance 3.5%)</span>
                  </div>
                  <span className="font-mono font-bold text-white">{formatIDR(monthlyStockSavings)}</span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-amber-400 shrink-0" />
                    <span>Jam Kerja Rekonsiliasi & Tutup Buku Dihemat</span>
                  </div>
                  <span className="font-mono font-bold text-white">{hoursSavedPerMonth} Jam / bln</span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Percent className="size-4 text-purple-400 shrink-0" />
                    <span>Selisih Hitung Kasir & Human Error Dicegah</span>
                  </div>
                  <span className="font-mono font-bold text-white">{formatIDR(cashierErrorPrevention)}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-400 text-center sm:text-left">
                <span>Biaya KADAI: </span>
                <span className="font-mono text-white font-bold">{formatIDR(estimatedKadaiCost)}/bln</span>
                <span className="block text-[11px] text-emerald-400">Balik modal dalam &lt; 2 hari kerja</span>
              </div>
              <Button asChild className="w-full sm:w-auto font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                <Link href="/register" className="flex items-center justify-center gap-2">
                  <span>Mulai Uji Coba Gratis</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
