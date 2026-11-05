"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, UtensilsCrossed, Store, Warehouse, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { HeroBackgroundSlider } from "./hero-background-slider";

interface HeroSectionProps {
  dashboardPath: string | null;
}

const SEGMENTS = [
  {
    id: "fnb",
    name: "Kafe & Restoran (F&B)",
    icon: UtensilsCrossed,
    path: "fnb-operational-engine",
    photoUrl: "/images/hero/slide-1.jpg",
    tag: "LINGKUNGAN OPERASIONAL",
    title: "Kasir POS Kilat, Resep BOM & Layar Dapur KDS",
    desc: "Pesanan meja langsung terhubung ke layar stasiun dapur & bar. HPP bahan baku terpotong otomatis per porsi laku.",
    receipt: {
      table: "Order Meja 04 • Dine In",
      status: "Dapur Aktif",
      meta: "Order ID: 20241105-0041 • Kasir: Budi",
      items: [
        { name: "2x Nasi Goreng Spesial", bom: "BOM: Beras, Ayam, Telur", price: "Rp 64.000" },
        { name: "2x Es Kopi Susu Aren", bom: "BOM: Arabica Gayo, Susu, Aren", price: "Rp 36.000" },
      ],
      pb1: "Rp 10.000",
      service: "Rp 5.000",
      total: "Rp 115.000",
      footer: "Struk Thermal Siap Cetak • Tiket KDS: Terkirim",
    },
    metric1: { label: "PAJAK RESTORAN", val: "PB1 10% Otomatis" },
    metric2: { label: "KECEPATAN KASIR", val: "< 0.2 Detik" },
    metric3: { label: "FORMAT STRUK", val: "58mm / 80mm" },
  },
  {
    id: "retail",
    name: "Ritel & Minimarket",
    icon: Store,
    path: "retail-multi-batch-fifo",
    photoUrl: "/images/hero/slide-3.jpg",
    tag: "MANAJEMEN PERSEDIAAN",
    title: "Kasir Barcode Cepat & Multi-Batch FIFO",
    desc: "Scan barcode USB/Bluetooth instan, pemantauan stok menipis, dan radar kadaluwarsa batch otomatis.",
    receipt: {
      table: "Nota Kasir Ritel • Kasir 01",
      status: "Transaksi Sukses",
      meta: "No. Faktur: RETAIL-20261105-0102 • Kasir: Siti",
      items: [
        { name: "3x Beras Pandan Wangi 5kg", bom: "Batch #02 • Exp: 12/2027", price: "Rp 255.000" },
        { name: "2x Minyak Goreng Sawit 2L", bom: "Batch #05 • Exp: 08/2027", price: "Rp 68.000" },
      ],
      pb1: "Rp 32.300",
      service: "Rp 0",
      total: "Rp 355.300",
      footer: "Struk Thermal 80mm • Kartu Stok Mutasi Terpotong",
    },
    metric1: { label: "PAJAK PERTAMBAHAN NILAI", val: "PPN 11% Otomatis" },
    metric2: { label: "SCANNER BARCODE", val: "USB & Bluetooth" },
    metric3: { label: "PENILAIAN STOK", val: "FIFO SAK EMKM" },
  },
  {
    id: "central",
    name: "Dapur Pusat & Gudang",
    icon: Warehouse,
    path: "central-kitchen-routing",
    photoUrl: "/images/hero/slide-2.jpg",
    tag: "RANTAI PASOK TERPUSAT",
    title: "Produksi Batch & Transfer Mutasi Cabang",
    desc: "Penerbitan surat jalan antar cabang, pencatatan produksi batch bahan baku setengah jadi, dan audit mutasi.",
    receipt: {
      table: "Surat Jalan TRF-20261105-0014",
      status: "Dalam Pengiriman",
      meta: "Gudang Pusat (HQ) → Cabang Thamrin",
      items: [
        { name: "15 kg Biji Kopi Arabica Gayo", bom: "Batch #01 • Scoped HPP", price: "Rp 2.100.000" },
        { name: "30 liter Susu Pasteurisasi", bom: "Batch #04 • Suhu Dingin", price: "Rp 600.000" },
      ],
      pb1: "Rp 0",
      service: "Rp 0",
      total: "Rp 2.700.000",
      footer: "Surat Jalan Digital Terbit • Siap Terima di Cabang",
    },
    metric1: { label: "SURAT JALAN CABANG", val: "Digital Terenkripsi" },
    metric2: { label: "TOPOLOGI JARINGAN", val: "Hub & Spoke" },
    metric3: { label: "KONFIRMASI TERIMA", val: "1-Klik Petugas" },
  },
];

export function HeroSection({ dashboardPath }: HeroSectionProps) {
  const [activeTab, setActiveTab] = useState(0);
  const current = SEGMENTS[activeTab];

  return (
    <section className="relative w-full overflow-hidden">
      {/* 1. Full-Width Background Slider Banner (Full Viewport Width Behind Hero Text) */}
      <div className="relative w-full min-h-[520px] sm:min-h-[580px] md:min-h-[620px] flex items-center justify-center pt-16 sm:pt-20 pb-12 sm:pb-16 px-4 sm:px-6">
        {/* Full-bleed background carousel */}
        <HeroBackgroundSlider
          currentSlide={activeTab}
          onSlideChange={setActiveTab}
        />

        {/* Studio Key-light Overhead Vignette */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[360px] studio-keylight pointer-events-none z-10" />

        {/* Hero Header Copy (Positioned with high-contrast backdrop legibility) */}
        <div className="relative z-30 max-w-4xl mx-auto text-center space-y-6">
          {/* Eyebrow Pill */}
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full luxury-glass-pill text-slate-700 text-xs font-semibold shadow-2xs border-slate-200/80"
          >
            <span className="size-2 rounded-full bg-primary" />
            <span className="text-[11px] text-slate-700 uppercase tracking-wider font-semibold">
              KADAI OPERATING SYSTEM // ENTERPRISE POS & RANTAI PASOK ID
            </span>
          </Badge>

          {/* Headline H1 */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-bold tracking-tight text-slate-950 leading-[1.12] text-balance">
            Satu Sistem Terpadu untuk Gerai, Dapur Pusat, & Pembukuan Anda.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-slate-600 font-normal max-w-3xl mx-auto leading-relaxed text-balance">
            KADAI menyatukan kasir POS kilat, inventori multi-batch FIFO, resep Bill of Materials (BOM), Kitchen Display System (KDS), hingga pelaporan pajak daerah PB1 10% & PPh Final 0.5% (PP 55/2022).
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-sm sm:max-w-none mx-auto w-full">
            {dashboardPath ? (
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto font-bold text-sm h-12 px-7 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
              >
                <Link href={dashboardPath} className="flex items-center gap-2">
                  <span>Buka Dashboard Operasional</span>
                  <ArrowUpRight className="size-4 shrink-0" />
                </Link>
              </Button>
            ) : (
              <>
                {/* Compound Capsule Button */}
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-center gap-4 pl-6 pr-2 py-2 rounded-full bg-slate-950 text-white hover:bg-slate-900 transition-all shadow-md group border border-slate-800"
                >
                  <span className="font-semibold text-xs sm:text-sm tracking-tight">
                    Mulai Uji Coba Gratis 14 Hari
                  </span>
                  <span className="size-8 rounded-full bg-primary text-white flex items-center justify-center group-hover:scale-105 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                    <ArrowUpRight className="size-4" />
                  </span>
                </Link>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto font-medium text-xs sm:text-sm h-12 px-6 rounded-full luxury-glass-pill text-slate-800 hover:bg-white border-slate-300"
                >
                  <Link href="/login">Masuk ke Toko Anda</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Interactive Operational Cockpit Section (Unobstructed, Clean Vertical Flow) */}
      <div className="relative z-30 max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-16 sm:pb-24 space-y-6">
        {/* 3 Operational Switcher Tabs (Centered Segmented Control) */}
        <div className="flex items-center justify-center overflow-x-auto pb-1">
          <div className="inline-flex p-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md gap-1.5">
            {SEGMENTS.map((seg, idx) => {
              const Icon = seg.icon;
              const isActive = idx === activeTab;
              return (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? "bg-slate-950 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/70"
                  }`}
                >
                  <Icon className={`size-3.5 ${isActive ? "text-primary" : "text-slate-500"}`} />
                  <span>{seg.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Mockup Container Window Frame */}
        <div className="relative rounded-[28px] bg-white shadow-2xl overflow-hidden border border-slate-200/90">
          {/* Top Browser Bar */}
          <div className="bg-slate-950 text-slate-300 px-4 sm:px-5 py-3 flex items-center justify-between border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-red-500 inline-block" />
              <span className="size-2.5 rounded-full bg-amber-500 inline-block" />
              <span className="size-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="font-mono text-slate-300 ml-2 text-[11px] font-semibold">
                kadai.os // {current.path}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              Realtime Operational Engine
            </span>
          </div>

          {/* Split Cockpit View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
            {/* Left Side: Dark Culinary / Operational Scene with Scrim */}
            <div className="lg:col-span-6 relative p-6 sm:p-10 flex flex-col justify-end overflow-hidden min-h-[280px] lg:min-h-full">
              <Image
                src={current.photoUrl}
                alt={current.title}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {/* Scrim Gradasi Gelap Sinematik */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-transparent -z-0" />

              <div className="relative z-10 space-y-3">
                <span className="inline-block text-[10px] font-semibold tracking-widest text-primary uppercase bg-primary/20 border border-primary/40 px-2.5 py-0.5 rounded-full">
                  {current.tag}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                  {current.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-lg font-normal">
                  {current.desc}
                </p>
              </div>
            </div>

            {/* Right Side: Live Digital Thermal Receipt Card */}
            <div className="lg:col-span-6 bg-slate-50/70 p-5 sm:p-8 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-slate-200">
              <Card className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                {/* Receipt Header */}
                <CardHeader className="p-0 flex flex-row items-center justify-between border-b border-slate-100 pb-3 space-y-0">
                  <CardTitle className="font-bold text-sm text-slate-950">
                    {current.receipt.table}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200"
                  >
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{current.receipt.status}</span>
                  </Badge>
                </CardHeader>

                <div className="text-[11px] text-slate-500">
                  {current.receipt.meta}
                </div>

                {/* Items Table */}
                <CardContent className="p-0 space-y-2.5 text-xs">
                  {current.receipt.items.map((it, i) => (
                    <div key={i} className="flex justify-between items-start py-1 border-b border-dashed border-slate-100">
                      <div>
                        <span className="font-semibold text-slate-900 block">{it.name}</span>
                        <span className="text-[10px] text-slate-500">{it.bom}</span>
                      </div>
                      <span className="font-semibold tabular-nums text-slate-900">{it.price}</span>
                    </div>
                  ))}

                  {current.receipt.pb1 !== "Rp 0" && (
                    <div className="flex justify-between items-center text-slate-600 pt-1">
                      <span>Pajak Daerah Resto PB1 (10%)</span>
                      <span className="font-medium tabular-nums">{current.receipt.pb1}</span>
                    </div>
                  )}

                  {current.receipt.service !== "Rp 0" && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Biaya Layanan (5%)</span>
                      <span className="font-medium tabular-nums">{current.receipt.service}</span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex justify-between items-center text-sm font-bold text-slate-950 pt-3 border-t border-slate-200">
                    <span>TOTAL TAGIHAN</span>
                    <span className="text-primary font-bold text-base sm:text-lg tabular-nums">
                      {current.receipt.total}
                    </span>
                  </div>
                </CardContent>

                {/* Receipt Footer */}
                <CardFooter className="p-0 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>{current.receipt.footer}</span>
                  <span className="font-semibold text-slate-700">KADAI POS</span>
                </CardFooter>
              </Card>
            </div>
          </div>

          {/* Bottom 3 Performance Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-slate-200 bg-slate-50 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-xs">
            <div className="p-4 text-center">
              <span className="text-[10px] font-medium text-slate-500 block uppercase tracking-wider">
                {current.metric1.label}
              </span>
              <span className="text-xs font-bold text-slate-900 mt-0.5 block tabular-nums">
                {current.metric1.val}
              </span>
            </div>
            <div className="p-4 text-center">
              <span className="text-[10px] font-medium text-slate-500 block uppercase tracking-wider">
                {current.metric2.label}
              </span>
              <span className="text-xs font-bold text-slate-900 mt-0.5 block tabular-nums">
                {current.metric2.val}
              </span>
            </div>
            <div className="p-4 text-center">
              <span className="text-[10px] font-medium text-slate-500 block uppercase tracking-wider">
                {current.metric3.label}
              </span>
              <span className="text-xs font-bold text-slate-900 mt-0.5 block tabular-nums">
                {current.metric3.val}
              </span>
            </div>
          </div>
        </div>

        {/* Floating Realtime KPI Badge (Hexus Layered Depth Pattern) */}
        <div className="hidden sm:flex absolute -bottom-4 right-6 z-20 items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-900/[0.08]">
          <div className="size-9 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-primary">
            <TrendingUp className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Akurasi HPP FIFO & BOM</span>
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-xs font-bold text-slate-950 tabular-nums flex items-baseline gap-1.5">
              <span>99.8% Efisiensi Teruji</span>
              <span className="text-[10px] font-semibold text-emerald-600 font-normal">• Live Multi-Batch</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
