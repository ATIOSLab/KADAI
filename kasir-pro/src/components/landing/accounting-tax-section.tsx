"use client";

import { Percent, Scale, BarChart3 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AccountingTaxSection() {
  const cards = [
    {
      title: "Fleksibel untuk Non-PKP & PKP",
      icon: Percent,
      desc: "Usaha mikro & toko kelontong Non-PKP bebas bertransaksi tanpa pungutan pajak (0%). Bagi restoran atau badan usaha PKP, sistem otomatis menghitung PB1 10% atau PPN 11% secara rapi.",
    },
    {
      title: "Rekap PPh Final UMKM 0,5%",
      icon: Scale,
      desc: "Sesuai PP 55/2022 (pengganti PP 23/2018). Sistem merangkum otomatis Buku Peredaran Bruto Bulanan dan memonitor batas pembebasan omzet Rp 500 Juta bagi Wajib Pajak Orang Pribadi.",
    },
    {
      title: "Legalitas Usaha & SAK EMKM",
      icon: BarChart3,
      desc: "Mendukung pencatatan NIB OSS 13 digit, NIK Pemilik, dan NPWP untuk PT Perorangan (PP 8/2021), CV, maupun PT. Dilengkapi laporan laba rugi berbasis HPP FIFO dan arus kas siap saji.",
    },
  ];

  return (
    <section id="pajak-pembukuan" className="py-16 sm:py-24 px-4 sm:px-6 w-full max-w-6xl mx-auto space-y-12">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <Badge
          variant="outline"
          className="text-xs font-semibold text-primary uppercase tracking-wider px-3.5 py-1 rounded-full border-primary/20 bg-orange-50/60"
        >
          Pajak & Legalitas Resmi RI
        </Badge>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-950">
          Pajak Beres, Pembukuan Rapi Tanpa Ribet
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed text-balance">
          Cocok untuk warung & toko kelontong Non-PKP (bebas pajak 0%) hingga badan usaha PKP (PB1 10% & PPN 11%). Rekap omzet PPh final UMKM 0,5% dan pembukuan resmi SAK EMKM siap unduh kapan saja.
        </p>
      </div>

      {/* 3-Column Reusable Compliance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card
              key={idx}
              className="rounded-[24px] luxury-glass-card p-6 sm:p-8 flex flex-col justify-between space-y-4 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 border border-slate-200/90"
            >
              <CardHeader className="p-0 space-y-4">
                <div className="size-11 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-primary">
                  <Icon className="size-5" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-950">
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {card.desc}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
