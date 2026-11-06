"use client";

import Link from "next/link";
import {
  Gift,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Wallet,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ReferralSection() {
  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6 w-full relative overflow-hidden bg-white border-t border-slate-200/80">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 px-3.5 py-1 text-xs font-semibold rounded-full border-primary/30 text-primary bg-primary/5"
          >
            <Gift className="size-3.5 text-primary shrink-0" />
            <span>PROGRAM KEMITRAAN & REFERRAL RESMI</span>
          </Badge>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight text-balance">
            Rekomendasikan KADAI, Dapatkan Komisi Berkelanjutan 20%
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed text-balance max-w-2xl mx-auto">
            Punya rekan pemilik kafe, restoran, atau toko ritel? Bantu usaha mereka bertransformasi ke kasir modern dan inventori FIFO. Dapatkan bagi hasil komisi rutin yang langsung ditransfer ke rekening bank Anda setiap awal bulan.
          </p>
        </div>

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all bg-slate-50/60 p-6 space-y-3">
            <span className="size-11 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-primary">
              <TrendingUp className="size-5" />
            </span>
            <h3 className="text-base font-bold text-slate-950">Komisi Rutin 20% / Bulan</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bukan sekadar bonus 1 kali. Selama rekan bisnis yang Anda ajak aktif memperpanjang paket langganan, Anda tetap menerima bagi hasil 20% setiap bulannya.
            </p>
          </Card>

          <Card className="rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all bg-slate-50/60 p-6 space-y-3">
            <span className="size-11 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="size-5" />
            </span>
            <h3 className="text-base font-bold text-slate-950">Pelacakan Mengikat 30 Hari</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hak referal Anda terlindungi. Sekali calon klien membuka link Anda, sistem dual-persistence kami mengingat perangkat mereka hingga 30 hari meskipun mereka mendaftar di kemudian hari.
            </p>
          </Card>

          <Card className="rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all bg-slate-50/60 p-6 space-y-3">
            <span className="size-11 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600">
              <Wallet className="size-5" />
            </span>
            <h3 className="text-base font-bold text-slate-950">Pencairan Bank & E-Wallet</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Komisi terkumpul ditransfer otomatis setiap tanggal 5 ke rekening bank (BCA, Mandiri, BRI, BNI) atau akun e-wallet (GoPay, OVO, DANA) tanpa potongan rumit.
            </p>
          </Card>
        </div>

        {/* CTA Card Banner */}
        <div className="rounded-3xl bg-slate-950 text-white p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left max-w-xl">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
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
