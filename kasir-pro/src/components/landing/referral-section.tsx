"use client";

import Link from "next/link";
import {
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReferralSection() {
  const pillars = [
    {
      title: "Komisi Rutin 20% / Bulan",
      icon: TrendingUp,
      desc: "Bukan sekadar bonus 1 kali. Selama rekan bisnis yang Anda ajak aktif memperpanjang paket langganan, Anda tetap menerima bagi hasil 20% setiap bulannya.",
    },
    {
      title: "Pelacakan Mengikat 30 Hari",
      icon: ShieldCheck,
      desc: "Hak referal Anda terlindungi. Sekali calon klien membuka link Anda, sistem dual-persistence kami mengingat perangkat mereka hingga 30 hari meskipun mereka mendaftar di kemudian hari.",
    },
    {
      title: "Pencairan Bank & E-Wallet",
      icon: Wallet,
      desc: "Komisi terkumpul ditransfer otomatis setiap tanggal 5 ke rekening bank (BCA, Mandiri, BRI, BNI) atau akun e-wallet (GoPay, OVO, DANA) tanpa potongan rumit.",
    },
  ];

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 w-full relative overflow-hidden bg-white border-t border-slate-200/80">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Section Header: Pure Typography */}
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Program Kemitraan & Referral
          </p>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-[1.15]">
            Rekomendasikan KADAI, Dapatkan Komisi Berkelanjutan 20%
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Punya rekan pemilik kafe, restoran, atau toko ritel? Bantu usaha mereka bertransformasi ke kasir modern dan inventori FIFO. Dapatkan bagi hasil komisi rutin yang langsung ditransfer ke rekening bank Anda setiap awal bulan.
          </p>
        </div>

        {/* 3 Value Pillars: Open Editorial Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12 border-t border-slate-200/80 pt-10 sm:pt-12">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div key={idx} className="flex flex-col space-y-3">
                <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-950">
                  {pillar.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA Card Banner */}
        <div className="rounded-3xl bg-slate-950 text-white p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left max-w-xl">
            <span className="text-xs font-bold text-primary uppercase tracking-wider block">
              Daftar Gratis • Tanpa Biaya Pendaftaran • 1 Menit Jadi
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Siap Menjadi Mitra Pemasaran Resmi KADAI?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Daftar sekarang untuk langsung menerima Kode Referral unik, link promosi personal, dan dashboard pencairan komisi Anda.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto">
            <Button
              asChild
              className="rounded-full font-bold h-11 px-7 bg-primary hover:bg-primary/90 text-white shadow-xs"
            >
              <Link href="/referral" className="flex items-center justify-center gap-2">
                <span>Daftar Jadi Mitra</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="rounded-full font-semibold h-11 px-6 bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Link href="/referral">Lihat Simulasi Komisi</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
