"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, Building2, Zap, Shield, ArrowRight } from "lucide-react";

export function PricingCalculator() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");

  const plans = [
    {
      name: "Starter",
      badge: "Gratis Selamanya",
      priceMonthly: 0,
      priceAnnual: 0,
      desc: "Ideal untuk warung mikro, pedagang perorangan, dan validasi usaha baru.",
      features: [
        "1 Outlet / Cabang",
        "1 User Kasir Aktif",
        "Kapasitas 100 Produk",
        "Pencatatan Penjualan Harian",
        "Struk Digital & Thermal 58mm",
        "Ekspor Riwayat ke Excel",
      ],
      cta: "Daftar Gratis",
      ctaLink: "/register",
      highlight: false,
    },
    {
      name: "Professional",
      badge: "Toko & Kafe Tunggal",
      priceMonthly: 99000,
      priceAnnual: 79000,
      desc: "Dirancang untuk satu outlet kafe, barbershop, butik, atau restoran mandiri.",
      features: [
        "1 Outlet / Cabang Penuh",
        "User Kasir Unlimited",
        "Produk & Menu Unlimited",
        "Kitchen Display System (KDS)",
        "Resep Otomatis Bill of Materials (BOM)",
        "Manajemen Meja & QR Meja",
        "CRM Poin Member & Diskon",
        "Laporan Penjualan Harian & Bulanan",
      ],
      cta: "Mulai Uji Coba 14 Hari",
      ctaLink: "/register?plan=pro",
      highlight: false,
    },
    {
      name: "Business Pro",
      badge: "Paling Banyak Dipilih",
      priceMonthly: 249000,
      priceAnnual: 199000,
      desc: "Solusi lengkap bisnis berkembang, ritel multi-batch, dan jaringan kuliner.",
      features: [
        "Hingga 5 Outlet / Cabang Terintegrasi",
        "Multi-Batch FIFO & Expired Alert",
        "6 Level RBAC & Supervisor PIN Otorisasi",
        "Laporan SAK EMKM Laba Rugi Realtime",
        "Perhitungan Pajak PB1 10% & PPN 11%",
        "Pelacakan Batas Omzet PP 55/2022",
        "Mutasi Antar Gudang & Kartu Stok",
        "Prioritas Bantuan Customer Support",
      ],
      cta: "Mulai Uji Coba 14 Hari",
      ctaLink: "/register?plan=business",
      highlight: true,
    },
    {
      name: "Enterprise",
      badge: "Waralaba & Multi-Cabang",
      priceMonthly: 599000,
      priceAnnual: 479000,
      desc: "Untuk rantai bisnis besar, franchise, klinik multi-cabang, dan distributor.",
      features: [
        "Cabang & Gudang Pusat Unlimited",
        "Central Kitchen & Sub-Warehouse Sync",
        "Custom Domain & Whitelabel Invoice",
        "Dedicated Database Isolation",
        "SLA Ketersediaan 99.98%",
        "Dedicated Account Manager WhatsApp",
        "Akses REST API untuk Integrasi ERP",
        "Pendampingan Migrasi Data Eksisting",
      ],
      cta: "Hubungi Tim Enterprise",
      ctaLink: "https://wa.me/628127634091?text=Halo%20Netkrida%2C%20saya%20tertarik%20konsultasi%20KADAI%20Enterprise",
      highlight: false,
    },
  ];

  return (
    <div className="w-full space-y-8">
      {/* Billing Switcher */}
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="inline-flex items-center gap-3 p-1.5 bg-slate-900/90 rounded-full border border-white/10 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              billingCycle === "monthly"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Bulanan
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("annual")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              billingCycle === "annual"
                ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Tahunan</span>
            <span className="bg-orange-300 text-orange-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              HEMAT 20%
            </span>
          </button>
        </div>
        <p className="text-xs text-slate-400 font-medium">
          {billingCycle === "annual"
            ? "Penagihan tahunan dengan diskon 20% + gratis migrasi data dari sistem lama."
            : "Fleksibel tanpa kontrak jangka panjang, batalkan kapan saja."}
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
        {plans.map((p, idx) => {
          const currentPrice = billingCycle === "annual" ? p.priceAnnual : p.priceMonthly;
          return (
            <div
              key={idx}
              className={`flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 ${
                p.highlight
                  ? "bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white border-2 border-orange-500 shadow-[0_0_40px_rgba(234,88,12,0.25)] scale-[1.02] relative"
                  : "bg-slate-900/60 text-slate-100 border border-white/10 hover:border-white/20 hover:bg-slate-900/80 shadow-md backdrop-blur-md"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full shadow-lg shadow-orange-600/40 flex items-center gap-1">
                  <Sparkles className="size-3" /> Rekomendasi Utama
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-lg font-black">{p.name}</h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      p.highlight
                        ? "bg-orange-950/80 text-orange-400 border-orange-500/40"
                        : "bg-slate-800 text-slate-400 border-white/10"
                    }`}
                  >
                    {p.badge}
                  </span>
                </div>

                <p
                  className={`text-xs mb-5 min-h-[36px] ${
                    p.highlight ? "text-slate-300" : "text-slate-400"
                  }`}
                >
                  {p.desc}
                </p>

                <div className="mb-6 pb-6 border-b border-white/10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-semibold text-slate-400">Rp</span>
                    <span className="text-3xl font-black font-mono text-white">
                      {currentPrice.toLocaleString("id-ID")}
                    </span>
                    <span className="text-xs text-slate-400">/bln</span>
                  </div>
                  {billingCycle === "annual" && currentPrice > 0 && (
                    <div className="text-[11px] text-emerald-400 font-semibold mt-1">
                      Ditagih tahunan (Rp {(currentPrice * 12).toLocaleString("id-ID")}/thn)
                    </div>
                  )}
                </div>

                <div className="space-y-2.5 mb-8">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Fitur Yang Termasuk:
                  </div>
                  {p.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs">
                      <Check
                        className={`size-4 shrink-0 mt-0.5 ${
                          p.highlight ? "text-orange-400" : "text-emerald-400"
                        }`}
                      />
                      <span className={p.highlight ? "text-slate-200" : "text-slate-300"}>
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={p.ctaLink}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  p.highlight
                    ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg shadow-orange-600/30"
                    : "bg-slate-800 hover:bg-slate-700 text-white border border-white/10"
                }`}
              >
                <span>{p.cta}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
