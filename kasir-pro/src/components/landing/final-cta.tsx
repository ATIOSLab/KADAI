"use client";

import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function FinalCTA() {
  return (
    <section className="py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 w-full relative overflow-hidden bg-slate-50/60 border-t border-slate-200/80">
      {/* Studio Keylight Vignette */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] studio-keylight pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto rounded-[28px] luxury-glass-card p-8 sm:p-14 shadow-2xl text-center space-y-6 relative border border-slate-200/90">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Mulai Tanpa Risiko
        </p>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-950 text-balance leading-tight">
          Saatnya Bisnis Anda Berjalan Lebih Rapi dan Tenang.
        </h2>

        <p className="text-xs sm:text-base md:text-lg text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed text-balance">
          Mulai kelola antrean kasir, pantau sisa stok bahan otomatis, dan nikmati laporan pembukuan yang siap saji setiap malam tanpa lembur hitung nota.
        </p>

        <div className="flex flex-col items-center justify-center gap-3.5 pt-2 max-w-sm sm:max-w-none mx-auto w-full">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto font-bold text-sm h-12 px-8 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-md transition-all active:scale-95"
            >
              <Link href="/register" className="flex items-center gap-2">
                <span>Mulai Uji Coba Gratis 14 Hari</span>
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto font-semibold text-sm h-12 px-7 rounded-lg bg-white hover:bg-slate-50 text-slate-900 border-slate-300 shadow-xs"
            >
              <a href="#harga">Lihat Paket Langganan</a>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-5 text-[11px] sm:text-xs text-slate-500 font-medium pt-1 flex-wrap">
            <span>✓ Tanpa kartu kredit</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span>✓ Setup instan 5 menit</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span>✓ Dukungan teknis Indonesia</span>
          </div>
        </div>
      </div>
    </section>
  );
}
