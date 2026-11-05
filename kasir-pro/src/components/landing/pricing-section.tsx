"use client";

import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    name: "Starter",
    price: "Rp 0",
    period: "/ bulan",
    desc: "Untuk perintis usaha mikro yang baru memulai operasional kasir.",
    features: [
      "1 Outlet Gerai",
      "1 Akun Staf Kasir",
      "Maksimal 50 Produk",
      "Terminal Kasir POS Kilat",
      "Cetak Struk Thermal 58mm/80mm",
      "Laporan Penjualan Harian",
    ],
    cta: "Mulai Gratis",
    ctaVariant: "outline" as const,
    featured: false,
  },
  {
    name: "Professional",
    price: "Rp 99.000",
    period: "/ bulan",
    desc: "Untuk unit usaha ritel, F&B, dan jasa mandiri yang sedang bertumbuh.",
    features: [
      "1 Outlet Gerai",
      "3 Akun Staf Kasir",
      "Unlimited Produk & Kategori",
      "Inventori Multi-Batch FIFO",
      "Radar Kadaluwarsa Produk",
      "Pajak PPN 11% / PB1 10%",
      "Laporan Laba Rugi Dasar",
    ],
    cta: "Pilih Professional",
    ctaVariant: "outline" as const,
    featured: false,
  },
  {
    name: "Business Pro",
    price: "Rp 249.000",
    period: "/ bulan",
    desc: "Kafe, resto & gerai ritel modern dengan operasional dapur penuh.",
    features: [
      "Hingga 3 Outlet Cabang",
      "Unlimited Akun Kasir & Staf",
      "Resep Bahan Pokok (BOM)",
      "Meja & Self-Order QR HP",
      "Kitchen Display System (KDS)",
      "Laporan Laba Rugi SAK EMKM",
      "Tutup Shift Kasir (Z-Report)",
    ],
    cta: "Pilih Business Pro",
    ctaVariant: "default" as const,
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Rp 599.000",
    period: "/ bulan",
    desc: "Jaringan multi-cabang, franchise, dan central kitchen korporasi.",
    features: [
      "Unlimited Outlet & Gudang",
      "Dapur Pusat (CK) Routing",
      "Transfer Stok Antar-Cabang",
      "Surat Jalan Digital Terenkripsi",
      "Laporan Konsolidasi Multi-Cabang",
      "Hak Akses 6-Role & Supervisor PIN",
      "Prioritas Bantuan Teknis",
    ],
    cta: "Hubungi Tim Kami",
    ctaVariant: "outline" as const,
    featured: false,
  },
];

export function PricingSection() {
  return (
    <section id="harga" className="py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-12">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
          <span>Paket Komersial</span>
        </div>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950">
          Pilihan Paket Sesuai Skala Bisnis Anda.
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed text-balance">
          Pilihan paket langganan transparan dengan garansi pembaruan fitur berkala dan penyimpanan database cloud yang aman.
        </p>
      </div>

      {/* 4 Pricing Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-all duration-300 relative ${
              plan.featured
                ? "bg-white border-2 border-primary shadow-2xl shadow-primary/[0.12] ring-2 ring-primary/20 scale-[1.02]"
                : "liquid-glass-card hover:shadow-xl hover:scale-[1.01]"
            }`}
          >
            {plan.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                <ShieldCheck className="size-3" />
                <span>Paling Populer</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg text-slate-950">{plan.name}</h3>
                <p className="text-xs text-slate-500 mt-1 min-h-[32px] leading-relaxed">
                  {plan.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-baseline gap-1">
                <span className={`text-3xl font-black font-mono tracking-tight ${plan.featured ? "text-primary" : "text-slate-950"}`}>
                  {plan.price}
                </span>
                <span className="text-xs font-medium text-slate-500">{plan.period}</span>
              </div>

              {/* Feature Checklist */}
              <ul className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
                {plan.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700">
                    <Check className={`size-3.5 shrink-0 mt-0.5 ${plan.featured ? "text-primary font-bold" : "text-emerald-600"}`} />
                    <span className={plan.featured ? "font-medium text-slate-900" : ""}>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              asChild
              variant={plan.ctaVariant}
              className={`w-full font-bold text-xs h-11 rounded-xl shadow-xs ${
                plan.featured
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-slate-300 hover:bg-slate-50 bg-white"
              }`}
            >
              <Link href="/register">{plan.cta}</Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
