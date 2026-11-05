"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  ShoppingCart,
  Warehouse,
  ChefHat,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductShowcase } from "@/components/landing/product-showcase";

interface HeroSectionProps {
  dashboardPath: string | null;
}

export function HeroSection({ dashboardPath }: HeroSectionProps) {
  const highlights = [
    { label: "POS & Kasir", icon: ShoppingCart },
    { label: "Inventori Multi-Cabang", icon: Warehouse },
    { label: "Dapur Pusat & BOM", icon: ChefHat },
    { label: "Pembukuan & Pajak RI", icon: Scale },
  ];

  return (
    <section className="relative overflow-hidden pt-8 sm:pt-14 pb-16 sm:pb-24 px-4 sm:px-6 w-full">
      {/* Soft Ambient Glows (Subtle Blue & Brand Orange Atmosphere) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[360px] glow-blue pointer-events-none -z-10" />
      <div className="absolute top-24 right-1/4 w-[400px] h-[300px] glow-orange pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Hero Top Copy */}
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200/90 text-slate-800 text-xs font-semibold shadow-xs backdrop-blur-md">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[11px] text-slate-500 uppercase tracking-wider">
              KADAI — Enterprise POS & ERP
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.12] text-slate-950 text-balance">
            Satu Platform untuk Seluruh Operasional Bisnis Anda.
          </h1>

          {/* Subheadline */}
          <p className="text-sm sm:text-base md:text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed text-balance">
            Kelola transaksi, inventori, dapur pusat, operasional multi-cabang, dan pembukuan dalam satu sistem terintegrasi yang dirancang untuk kebutuhan bisnis Indonesia.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1 max-w-sm sm:max-w-none mx-auto w-full">
            {dashboardPath ? (
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto font-bold text-sm h-12 px-7 shadow-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link href={dashboardPath} className="flex items-center gap-2">
                  <span>Buka Dashboard Operasional</span>
                  <ArrowRight className="size-4 shrink-0" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto font-bold text-sm h-12 px-7 shadow-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Link href="/register" className="flex items-center gap-2">
                    <span>Coba Gratis 14 Hari</span>
                    <ArrowRight className="size-4 shrink-0" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto font-semibold text-sm h-12 px-6 rounded-xl border-slate-300 hover:bg-slate-50 bg-white/90 text-slate-900 shadow-xs backdrop-blur-md"
                >
                  <a href="#kapabilitas" className="flex items-center gap-2">
                    <span>Jelajahi Fitur</span>
                    <ChevronDown className="size-4 shrink-0 text-slate-500" />
                  </a>
                </Button>
              </>
            )}
          </div>

          {/* Verified Highlight Pills under CTA */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto text-xs font-semibold text-slate-700">
            {highlights.map((h, i) => {
              const Icon = h.icon;
              return (
                <div
                  key={i}
                  className="px-3 py-1 rounded-full bg-white/80 border border-slate-200/80 shadow-2xs flex items-center gap-1.5"
                >
                  <Icon className="size-3.5 text-primary shrink-0" />
                  <span>{h.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Master Floating Showcase Cockpit */}
        <ProductShowcase />
      </div>
    </section>
  );
}
