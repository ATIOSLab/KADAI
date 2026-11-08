"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    subtitle: "Untuk toko ritel mandiri, kafe, dan unit usaha berkembang.",
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
    badge: "Paling Banyak Dipilih",
    subtitle: "Kafe, resto & ritel modern dengan operasional resep dan dapur.",
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
    subtitle: "Jaringan multi-cabang waralaba dan dapur pusat.",
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
    <section id="harga" className="py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/70 border-t border-slate-200/80 w-full">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Paket & Biaya Langganan
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-[1.15]">
            Biaya Langganan Jujur Tanpa Biaya Tersembunyi
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed text-balance">
            Pilih paket yang paling pas untuk skala usaha Anda. Bebas upgrade atau batalkan kapan saja tanpa ikatan kontrak rumit.
          </p>
        </div>

        {/* 4-Tier Reusable Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={`rounded-[24px] p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-all duration-300 relative ${
                plan.featured
                  ? "bg-white border-2 border-primary shadow-2xl ring-2 ring-primary/20 scale-[1.02]"
                  : "luxury-glass-card border border-slate-200/90 shadow-xs hover:shadow-xl hover:scale-[1.01]"
              }`}
            >
              {plan.featured && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-md shadow-xs border-0">
                  {plan.badge}
                </Badge>
              )}

              <div className="space-y-4">
                <CardHeader className="p-0">
                  <CardTitle className="text-lg font-bold text-slate-950">{plan.name}</CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1 min-h-[32px] leading-relaxed">
                    {plan.subtitle}
                  </CardDescription>
                </CardHeader>

                <div className="pt-2 border-t border-slate-100 flex items-baseline gap-1">
                  <span className={`text-3xl font-bold tabular-nums tracking-tight ${plan.featured ? "text-primary" : "text-slate-950"}`}>
                    {plan.price}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {plan.period}
                  </span>
                </div>

                <CardContent className="p-0 flex-1">
                  <ul className="space-y-2.5 pt-3 border-t border-slate-100 text-xs text-slate-700 min-h-[170px]">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="size-4 text-primary shrink-0 mt-0.5" />
                        <span className={plan.featured ? "font-semibold text-slate-900" : ""}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </div>

              <CardFooter className="p-0 pt-4 border-t border-slate-100 mt-auto">
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
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
