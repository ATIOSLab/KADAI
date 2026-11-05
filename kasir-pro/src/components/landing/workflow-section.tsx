"use client";

import {
  ShoppingCart,
  Warehouse,
  ChefHat,
  Scale,
  Receipt,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export function WorkflowSection() {
  const steps = [
    {
      num: "01",
      title: "Transaksi Kasir & QR",
      desc: "Nota kasir tercatat instan di kasir POS fisik atau pesanan mandiri scan QR meja dari smartphone pelanggan.",
      icon: ShoppingCart,
      color: "text-primary bg-orange-50 border-orange-200/90",
    },
    {
      num: "02",
      title: "Debit Stok FIFO & BOM",
      desc: "Sistem mendebit bahan baku secara atomik dari nomor batch tertua sesuai formula resep BOM per item laku.",
      icon: Warehouse,
      color: "text-slate-800 bg-slate-100 border-slate-200",
    },
    {
      num: "03",
      title: "Routing Dapur KDS",
      desc: "Tiket pesanan otomatis terpecah ke layar koki dapur atau bar dengan timer masak real-time tanpa kertas bon fisik.",
      icon: ChefHat,
      color: "text-slate-800 bg-slate-100 border-slate-200",
    },
    {
      num: "04",
      title: "Pembukuan SAK EMKM",
      desc: "Pendapatan kotor, potongan diskon, dan beban pokok penjualan (HPP) otomatis dibukukan ke jurnal akuntansi resmi.",
      icon: Scale,
      color: "text-slate-800 bg-slate-100 border-slate-200",
    },
    {
      num: "05",
      title: "Laporan & Pajak Terpadu",
      desc: "Rekapitulasi pajak PB1 10%, PPN 11%, dan buku omzet bulanan PPh Final UMKM 0.5% siap audit tanpa selisih.",
      icon: Receipt,
      color: "text-slate-800 bg-slate-100 border-slate-200",
    },
  ];

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-12">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
          <span>Alur Terintegrasi</span>
        </div>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950">
          Dari Transaksi hingga Laporan. Semua Mengalir dalam Satu Sistem.
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed text-balance">
          Setiap transaksi kasir langsung memicu pemotongan stok bahan, koordinasi dapur, hingga perhitungan laba kotor tanpa perlu entri manual ganda.
        </p>
      </div>

      {/* Connected Nodes Timeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="rounded-2xl liquid-glass-card p-5 shadow-xs flex flex-col justify-between space-y-4 relative group hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-slate-400">
                    LANGKAH {step.num}
                  </span>
                  <div className={`size-9 rounded-xl flex items-center justify-center border shadow-2xs ${step.color}`}>
                    <Icon className="size-4" />
                  </div>
                </div>

                <h3 className="font-bold text-sm text-slate-950">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 text-slate-300">
                  <ArrowRight className="size-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Verification Callout Box */}
      <div className="p-4 sm:p-5 rounded-2xl glass-surface-subtle border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">
            Sinkronisasi data real-time: tidak ada lagi selisih antara uang kasir fisik, catatan gudang, dan laporan laba rugi.
          </span>
        </div>
        <span className="font-mono font-bold text-slate-900 shrink-0">Zero Reconciliation Friction</span>
      </div>
    </section>
  );
}
