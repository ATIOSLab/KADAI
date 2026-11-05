"use client";

import { Percent, Scale, BarChart3 } from "lucide-react";

export function AccountingTaxSection() {
  const cards = [
    {
      title: "Perhitungan Pajak Fleksibel",
      icon: Percent,
      desc: "Mendukung PPN 11%/12% (Inklusif & Eksklusif) untuk ritel umum, dan PB1 (Pajak Restoran 10%) untuk usaha kuliner. Bisa diaktifkan atau dinonaktifkan sesuai status wajib pajak.",
    },
    {
      title: "Rekap PPh Final UMKM 0,5%",
      icon: Scale,
      desc: "Sesuai PP 55/2022 (pengganti PP 23/2018). Sistem merangkum otomatis Buku Peredaran Bruto Bulanan dan memonitor batas pembebasan omzet Rp 500 Juta bagi Wajib Pajak Orang Pribadi.",
    },
    {
      title: "Laporan Standar SAK EMKM",
      icon: BarChart3,
      desc: "Laporan Laba Rugi real-time berbasis HPP FIFO, Laporan Posisi Keuangan (Neraca Sederhana), dan Laporan Arus Kas (Cash Flow) yang siap dicetak untuk pelaporan perbankan.",
    },
  ];

  return (
    <section id="pajak-pembukuan" className="py-16 sm:py-24 px-4 sm:px-6 w-full max-w-6xl mx-auto space-y-12">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">
          Standar Keuangan Indonesia
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-950">
          Pajak & Pembukuan Resmi Sesuai Regulasi Republik Indonesia
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed text-balance">
          Tak perlu pusing menghitung pajak manual atau menyusun laporan pembukuan akuntansi dari nol saat pemeriksaan pajak.
        </p>
      </div>

      {/* 3-Column Compliance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="rounded-[24px] luxury-glass-card p-6 sm:p-8 flex flex-col justify-between space-y-4 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 border border-slate-200/90"
            >
              <div className="space-y-4">
                <div className="size-11 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-950">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
