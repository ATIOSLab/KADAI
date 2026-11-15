"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
import { formatCurrency } from "@/lib/utils";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "./fade-in";

export type LandingPlan = {
  code: string;
  name: string;
  description: string | null;
  badge: string | null;
  features: string[];
  sortOrder: number;
  prices: { MONTHLY: number; QUARTERLY: number; ANNUAL: number };
};

type CardPlan = {
  name: string;
  subtitle: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyBilled: string;
  period: string;
  features: string[];
  cta: string;
  featured: boolean;
  badge?: string;
};

const STATIC_PLANS: CardPlan[] = [
  {
    name: "Starter",
    subtitle: "Untuk warung mikro dan perintis usaha yang baru memulai.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyBilled: "Gratis Selamanya",
    period: "/ bln",
    features: [
      "1 Gerai & 1 Akun Kasir",
      "Maksimal 50 Produk SKU",
      "Kasir POS Cepat & Cetak Struk",
      "Laporan Penjualan Harian",
    ],
    cta: "Mulai Gratis",
    featured: false,
  },
  {
    name: "Professional",
    subtitle: "Operasional tuntas 1 gerai untuk kedai kafe atau toko ritel aktif.",
    monthlyPrice: 99000,
    yearlyPrice: 79200,
    yearlyBilled: `Ditagih ${formatCurrency(950400)}/thn (Hemat 20%)`,
    period: "/ bln",
    features: [
      "1 Gerai & Hingga 3 Akun Kasir",
      "Produk & Transaksi Tanpa Batas",
      "F&B: QR Meja & Pemesanan Mandiri",
      "Ritel: Barcode Scanner & Peringatan Kadaluwarsa",
      "Pembukuan Kas & Pajak SAK EMKM",
    ],
    cta: "Pilih Professional",
    featured: false,
  },
  {
    name: "Business Pro",
    badge: "Paling Banyak Dipilih",
    subtitle: "Kafe, resto & ritel modern dengan manajemen resep, dapur & multi-cabang.",
    monthlyPrice: 249000,
    yearlyPrice: 199200,
    yearlyBilled: `Ditagih ${formatCurrency(2390400)}/thn (Hemat 20%)`,
    period: "/ bln",
    features: [
      "Hingga 3 Gerai / Cabang Usaha",
      "F&B: Resep BOM Bahan Baku & Layar Dapur KDS",
      "Ritel: Inventori Multi-Batch (FIFO & FEFO Asli)",
      "Transfer Stok Antar-Cabang (Surat Jalan)",
      "Rekap PB1/PPN & PPh Final 0.5% PP 55/2022",
      "Dukungan WhatsApp Prioritas",
    ],
    cta: "Pilih Business Pro",
    featured: true,
  },
  {
    name: "Enterprise",
    subtitle: "Waralaba berjejaring, sentra dapur pusat, dan multi-gudang.",
    monthlyPrice: 599000,
    yearlyPrice: 479200,
    yearlyBilled: `Ditagih ${formatCurrency(5750400)}/thn (Hemat 20%)`,
    period: "/ bln",
    features: [
      "Gerai & Gudang Tak Terbatas",
      "Sentra Dapur Pusat (Central Kitchen)",
      "Routing Pesanan Antar-Sentra Produksi",
      "Laporan Konsolidasi Multi-Entitas",
      "Dedicated Account Manager & SLA 99.9%",
    ],
    cta: "Hubungi Tim Kami",
    featured: false,
  },
];

function toCardPlan(plan: LandingPlan): CardPlan {
  const monthly = plan.prices.MONTHLY ?? 0;
  const annual = plan.prices.ANNUAL ?? 0;
  const yearlyPrice = annual > 0 ? Math.round(annual / 12) : 0;
  const savings = monthly > 0 && annual > 0 ? Math.round((1 - annual / (monthly * 12)) * 100) : 0;
  const featured = plan.code === "PRO_BUSINESS";
  const yearlyBilled =
    annual > 0
      ? `Ditagih ${formatCurrency(annual)}/thn${savings > 0 ? ` (Hemat ${savings}%)` : ""}`
      : "Gratis Selamanya";
  const cta =
    plan.code === "FREE"
      ? "Mulai Gratis"
      : plan.code === "ENTERPRISE"
        ? "Hubungi Tim Kami"
        : `Pilih ${plan.name}`;

  return {
    name: plan.name,
    subtitle: plan.description ?? "",
    monthlyPrice: monthly,
    yearlyPrice,
    yearlyBilled,
    period: "/ bln",
    features: plan.features,
    cta,
    featured,
    badge: plan.badge ?? (featured ? "Paling Banyak Dipilih" : undefined),
  };
}

export function PricingSection({ plans = [] }: { plans?: LandingPlan[] }) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const cards = plans.length > 0 ? plans.map(toCardPlan) : STATIC_PLANS;

  return (
    <section id="harga" className="py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/70 border-t border-slate-200/80 w-full">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section Header */}
        <FadeIn className="text-center max-w-3xl mx-auto space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Paket & Biaya Langganan
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-[1.15]">
            Biaya Langganan Jujur Tanpa Biaya Tersembunyi
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed text-balance">
            Pilih paket yang paling pas untuk skala usaha Anda. Bebas upgrade atau batalkan kapan saja tanpa ikatan kontrak rumit.
          </p>

          {/* Interactive Billing Cycle Toggle Pill */}
          <div className="pt-4 flex items-center justify-center">
            <div className="relative inline-flex items-center p-1 rounded-full bg-slate-200/80 border border-slate-300/80 shadow-inner">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`relative z-10 px-4 sm:px-5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  billingCycle === "monthly" ? "text-slate-950" : "text-slate-600 hover:text-slate-950"
                }`}
              >
                {billingCycle === "monthly" && (
                  <motion.div
                    layoutId="activeBillingCyclePill"
                    className="absolute inset-0 bg-white rounded-full shadow-xs -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                Bulanan
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`relative z-10 px-4 sm:px-5 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  billingCycle === "yearly" ? "text-slate-950" : "text-slate-600 hover:text-slate-950"
                }`}
              >
                {billingCycle === "yearly" && (
                  <motion.div
                    layoutId="activeBillingCyclePill"
                    className="absolute inset-0 bg-white rounded-full shadow-xs -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <span>Tahunan</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Hemat 20%
                </span>
              </button>
            </div>
          </div>
        </FadeIn>

        {/* 4-Tier Reusable Pricing Grid */}
        <FadeInStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {cards.map((plan) => {
            const price = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
            return (
              <FadeInStaggerItem key={plan.name} className="flex">
                <Card
                  className={`rounded-[24px] p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-all duration-300 relative w-full ${
                    plan.featured
                      ? "bg-white border-2 border-primary shadow-2xl ring-2 ring-primary/20 scale-[1.02]"
                      : "bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:scale-[1.01]"
                  }`}
                >
                  {plan.featured && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-md shadow-xs border-0 flex items-center gap-1">
                      <span>{plan.badge}</span>
                    </Badge>
                  )}

                  <div className="space-y-4">
                    <CardHeader className="p-0">
                      <CardTitle className="text-lg font-bold text-slate-950">{plan.name}</CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-1 min-h-[32px] leading-relaxed">
                        {plan.subtitle}
                      </CardDescription>
                    </CardHeader>

                    <div className="pt-2 border-t border-slate-100 flex flex-col">
                      <div className="flex items-baseline gap-1">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={`${billingCycle}-${price}`}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.15 }}
                            className={`text-3xl font-bold tabular-nums tracking-tight ${plan.featured ? "text-primary" : "text-slate-950"}`}
                          >
                            {formatCurrency(price)}
                          </motion.span>
                        </AnimatePresence>
                        <span className="text-xs font-medium text-slate-500">
                          {plan.period}
                        </span>
                      </div>
                      {billingCycle === "yearly" && (
                        <span className="text-[10px] text-emerald-700 font-medium mt-0.5">
                          {plan.yearlyBilled}
                        </span>
                      )}
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
              </FadeInStaggerItem>
            );
          })}
        </FadeInStagger>
      </div>
    </section>
  );
}
