"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 w-full relative overflow-hidden bg-white">
      {/* Ambient Radial Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] glow-orange pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] glow-blue pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto rounded-3xl glass-surface-card p-8 sm:p-14 border border-white/90 shadow-2xl text-center space-y-6 relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/90 text-primary text-xs font-bold shadow-2xs">
          <Sparkles className="size-3.5 shrink-0" />
          <span>Langkah Nyata Efisiensi Bisnis</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 text-balance leading-tight">
          Saatnya Operasional Bisnis Anda Lebih Terhubung.
        </h2>

        <p className="text-xs sm:text-base md:text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed text-balance">
          Mulai kelola operasional bisnis dengan platform terintegrasi yang dirancang untuk kebutuhan usaha modern di Indonesia.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-sm sm:max-w-none mx-auto w-full">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto font-bold text-sm h-12 px-8 rounded-xl shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/register" className="flex items-center gap-2">
              <span>Mulai dengan KADAI</span>
              <ArrowRight className="size-4 shrink-0" />
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto font-semibold text-sm h-12 px-7 rounded-xl border-slate-300 hover:bg-slate-50 bg-white"
          >
            <a href="#harga">Lihat Paket Langganan</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
