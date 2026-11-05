"use client";

import { useState } from "react";
import Image from "next/image";
import {
  UtensilsCrossed,
  Store,
  Scissors,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const INDUSTRIES = [
  {
    id: "fnb",
    name: "Kuliner, F&B & Hospitality",
    icon: UtensilsCrossed,
    tagline: "Restoran, Kafe, Bakery, Bar, & Cloud Kitchen",
    photoUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80",
    description: "Sistem operasional F&B tanpa hambatan komunikasi antara kasir, pelayan, dan koki. Dilengkapi Kitchen Display System (KDS), pesanan QR mandiri di meja, dan perhitungan HPP bahan baku dinamis.",
    features: [
      "Kitchen Display System (KDS) stasiun Dapur & Bar dengan timer masak real-time",
      "Pemesanan mandiri via scan QR code meja tanpa perlu download aplikasi",
      "Kalkulasi HPP otomatis berbasis resep Bill of Materials (BOM) per porsi laku",
      "Pemisahan pajak restoran PB1 10% dan biaya layanan (service charge) otomatis",
    ],
    highlight: "Bebas kertas bon hilang dan cegah bahan baku dapur menguap",
  },
  {
    id: "retail",
    name: "Ritel & Distribusi Komersial",
    icon: Store,
    tagline: "Minimarket, Toko Bahan Bangunan, Apotek & Butik",
    photoUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
    description: "Operasional penjualan cepat berbasis barcode scanner USB/Bluetooth, pelacakan persediaan multi-batch FIFO dengan tanggal kadaluwarsa, dan pencatatan pajak komersial PPN 11%.",
    features: [
      "Pencatatan ribuan SKU produk komersial dengan barcode scanner cepat",
      "Metode penilaian persediaan FIFO sesuai ketentuan akuntansi SAK EMKM",
      "Radar peringatan stok kritis (< ambang batas) dan batch mendekati kadaluwarsa",
      "Kartu mutasi stok real-time untuk audit opname dan pencegahan selisih barang",
    ],
    highlight: "Kecepatan kasir ritel sub-detik untuk antrean jam sibuk",
  },
  {
    id: "service",
    name: "Layanan Jasa & Multi-Cabang",
    icon: Scissors,
    tagline: "Barbershop, Salon, Bengkel, Laundry & Studio Jasa",
    photoUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80",
    description: "Kombinasi fleksibel antara penagihan jasa layanan (service) dan penjualan produk fisik, pencatatan komisi staf, serta pemantauan kinerja multi-cabang terpusat.",
    features: [
      "Penjualan gabungan: jasa layanan non-fisik dan produk ritel dalam satu nota",
      "Manajemen multi-outlet dengan filter analitik performa per gerai cabang",
      "Hak akses berjenjang 6-Role RBAC (Admin, Manager, Kasir, Dapur, Gudang, Akuntan)",
      "Database CRM pelanggan untuk riwayat transaksi, poin loyalitas, dan diskon tier",
    ],
    highlight: "Satu dashboard pemilik untuk mengawasi seluruh cabang dari mana saja",
  },
];

export function IndustrySolutions() {
  const [activeId, setActiveId] = useState("fnb");

  const active = INDUSTRIES.find((ind) => ind.id === activeId) || INDUSTRIES[0];

  return (
    <section id="solusi-industri" className="py-20 sm:py-28 px-4 sm:px-6 bg-slate-50/70 border-y border-slate-200/80 w-full">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
            <span>Solusi Lintas Industri</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950">
            Satu Platform. Beragam Model Bisnis.
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed text-balance">
            KADAI dirancang fleksibel menyesuaikan karakteristik operasional unik setiap lini usaha di Indonesia.
          </p>
        </div>

        {/* 3 Industry Segment Selector Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {INDUSTRIES.map((ind) => {
            const Icon = ind.icon;
            const isActive = ind.id === activeId;
            return (
              <button
                key={ind.id}
                type="button"
                onClick={() => setActiveId(ind.id)}
                className={`p-4 sm:p-5 rounded-2xl text-left transition-all border flex items-start gap-3.5 ${
                  isActive
                    ? "bg-white border-primary shadow-md shadow-primary/[0.06] ring-1 ring-primary"
                    : "bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300"
                }`}
              >
                <div
                  className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive ? "bg-orange-50 text-primary border border-orange-200" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{ind.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{ind.tagline}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Industry Deep Dive Showcase */}
        <div className="rounded-3xl glass-surface-card p-6 sm:p-10 border border-white/90 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text & Benefits (Col 7) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <Badge variant="outline" className="text-primary border-orange-200 bg-orange-50/70 font-semibold text-xs">
                {active.tagline}
              </Badge>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                {active.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {active.description}
              </p>
            </div>

            {/* Feature Checklist */}
            <ul className="space-y-3 pt-2">
              {active.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span className="font-bold text-slate-900">Keunggulan Kunci:</span>
              <span className="text-primary font-bold">{active.highlight}</span>
            </div>
          </div>

          {/* Right Visual Image (Col 5) */}
          <div className="lg:col-span-5 relative h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-md border border-slate-200">
            <Image
              src={active.photoUrl}
              alt={active.name}
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-4">
              <span className="text-xs font-mono font-bold text-white bg-slate-900/80 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                KADAI Scoped Environment
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
