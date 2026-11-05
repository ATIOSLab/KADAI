"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    name: "Starter",
    subtitle: "Untuk perintis usaha mikro yang baru memulai.",
    price: "Rp 0",
    period: "/ bln",
    features: [
      "1 Outlet & 1 Kasir",
      "Maksimal 50 Produk",
      "Kasir POS Standar",
      "Struk Cetak Thermal",
    ],
    cta: "Mulai Gratis",
    featured: false,
  },
  {
    name: "Professional",
    subtitle: "Untuk unit usaha ritel, F&B, dan jasa mandiri yang berkembang.",
    price: "Rp 99.000",
    period: "/ bln",
    features: [
      "1 Outlet & 3 Akun Kasir",
      "Unlimited Produk Ritel",
      "Inventori Batch FIFO",
      "Pajak PPN 11% / PB1 10%",
      "Laporan Laba Rugi Dasar",
    ],
    cta: "Pilih Professional",
    featured: false,
  },
  {
    name: "Business Pro",
    badge: "Paling Populer",
    subtitle: "Kafe, resto & gerai ritel modern dengan operasional penuh.",
    price: "Rp 249.000",
    period: "/ bln",
    features: [
      "Hingga 3 Outlet Cabang",
      "Unlimited Kasir & Staf",
      "Resep Bahan Pokok (BOM)",
      "Meja & Self-Order QR HP",
      "Kitchen Display System (KDS)",
      "Laporan Lengkap SAK EMKM",
    ],
    cta: "Pilih Business Pro",
    featured: true,
  },
  {
    name: "Enterprise",
    subtitle: "Jaringan multi-cabang & central kitchen korporasi.",
    price: "Rp 599.000",
    period: "/ bln",
    features: [
      "Unlimited Outlet & Gudang",
      "Central Kitchen (CK) Routing",
      "Transfer Stok Antar-Cabang",
      "Laporan Konsolidasi Grup",
      "Prioritas Support Teknis 24/7",
    ],
    cta: "Hubungi Tim Kami",
    featured: false,
  },
];

export function PricingSection() {
  return (
    <section id="harga" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50/70 border-t border-slate-200/80 w-full">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            Paket Komersial
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-950">
            Pilihan Paket Langganan Sesuai Skala Bisnis Anda
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed text-balance">
            Semua paket dilengkapi garansi update fitur berkala dan penyimpanan database cloud yang aman.
          </p>
        </div>

        {/* 4-Tier Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-[24px] p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-all duration-300 relative ${
                plan.featured
                  ? "bg-white border-2 border-primary shadow-2xl ring-2 ring-primary/20 scale-[1.02]"
                  : "luxury-glass-card border border-slate-200/90 shadow-xs hover:shadow-xl hover:scale-[1.01]"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-xs">
                  {plan.badge}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-950">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 min-h-[32px] leading-relaxed">
                    {plan.subtitle}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-baseline gap-1">
                  <span className={`text-3xl font-bold tabular-nums tracking-tight ${plan.featured ? "text-primary" : "text-slate-950"}`}>
                    {plan.price}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-2.5 pt-3 border-t border-slate-100 text-xs text-slate-700">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="size-4 text-primary shrink-0 mt-0.5" />
                      <span className={plan.featured ? "font-semibold text-slate-900" : ""}>
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Button
                  asChild
                  className={`w-full font-bold text-xs h-10 rounded-xl transition-all ${
                    plan.featured
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                      : "border-slate-300 text-slate-800 hover:bg-slate-50 bg-white"
                  }`}
                  variant={plan.featured ? "default" : "outline"}
                >
                  <Link href="/register">{plan.cta}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
