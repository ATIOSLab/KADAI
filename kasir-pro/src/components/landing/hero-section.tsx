"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, UtensilsCrossed, Store, Warehouse, TrendingUp, CheckCircle2 } from "lucide-react";
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
import { KadaiLockup } from "@/components/shared/kadai-logo";

interface HeroSectionProps {
  dashboardPath: string | null;
}

const SEGMENTS = [
  {
    id: "fnb",
    name: "Kafe & Resto",
    icon: UtensilsCrossed,
    path: "fnb-operational-engine",
    photoUrl: "/images/hero/slide-1.jpg",
    tag: "LINGKUNGAN OPERASIONAL",
    title: "Kasir POS Kilat, Resep BOM & Layar Dapur KDS",
    desc: "Pesanan meja langsung terhubung ke layar stasiun dapur & bar. HPP bahan baku terpotong otomatis per porsi laku.",
    receipt: {
      table: "Meja 04 · Dine In",
      status: "Dapur Aktif",
      meta: "No. Struk: KADAI-20261107-0041 • Kasir: Budi",
      items: [
        { name: "2x Nasi Goreng", bom: "Resep Terpotong Otomatis", price: "Rp 64.000" },
        { name: "2x Es Kopi Aren", bom: "Resep Terpotong Otomatis", price: "Rp 36.000" },
      ],
      pb1: "Rp 10.000",
      service: "Rp 0",
      total: "Rp 110.000",
      footer: "Struk Thermal 80mm • Terima kasih",
    },
    metric1: { label: "PAJAK RESTORAN", val: "PB1 10% Otomatis" },
    metric2: { label: "KECEPATAN KASIR", val: "< 0.2 Detik" },
    metric3: { label: "FORMAT STRUK", val: "58mm / 80mm" },
  },
  {
    id: "retail",
    name: "Toko & Ritel",
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
    metric1: { label: "PAJAK & LEGALITAS", val: "Non-PKP / PPN / PB1" },
    metric2: { label: "SCANNER BARCODE", val: "USB & Bluetooth" },
    metric3: { label: "PENILAIAN STOK", val: "FIFO Terverifikasi" },
  },
  {
    id: "central",
    name: "Gudang & Cabang",
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
      <div className="relative w-full min-h-[520px] sm:min-h-[580px] md:min-h-[620px] flex items-center justify-center pt-24 sm:pt-28 pb-12 sm:pb-16 px-4 sm:px-6">
        {/* Full-bleed background carousel */}
        <HeroBackgroundSlider
          currentSlide={activeTab}
          onSlideChange={setActiveTab}
        />

        {/* Studio Key-light Overhead Vignette */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[360px] studio-keylight pointer-events-none z-10" />

        {/* Hero Header Copy (Positioned with high-contrast backdrop legibility) */}
        <div className="relative z-30 max-w-4xl mx-auto text-center space-y-6 w-full px-2 sm:px-0">
          {/* Eyebrow Pill */}
          <div className="inline-flex max-w-full justify-center">
            <Badge
              variant="outline"
              className="inline-flex max-w-full items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 rounded-lg luxury-glass-pill text-slate-700 text-xs font-semibold shadow-2xs border-slate-200/80 whitespace-normal text-left sm:text-center"
            >
              <span className="size-2 rounded-full bg-primary shrink-0 animate-pulse" />
              <span className="text-[11px] sm:text-xs text-slate-900 uppercase tracking-widest font-black leading-tight">
                SISTEM OPERASI BISNIS
              </span>
            </Badge>
          </div>

          {/* Headline H1 (Official Brand Slogan) */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.1] text-balance px-2 sm:px-0">
            Satu sistem untuk gerai, dapur, dan pembukuan.
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-base md:text-lg text-slate-600 font-normal max-w-3xl mx-auto leading-relaxed text-balance px-3 sm:px-0">
            KADAI mencatat transaksi kasir dalam hitungan detik, memotong stok resep bahan baku otomatis saat pesanan dibuat, dan menyusun laporan pembukuan rapi setiap hari. Spesialis bisnis Kuliner (F&B) dan Ritel Multi-Cabang.
          </p>

          {/* CTA Buttons (Clean Focused Action) */}
          <div className="flex flex-col items-center justify-center gap-3.5 pt-2 max-w-md sm:max-w-none mx-auto w-full px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
              {dashboardPath ? (
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto font-bold text-sm h-12 px-8 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-md"
                >
                  <Link href={dashboardPath} className="flex items-center gap-2">
                    <span>Buka Dashboard Operasional</span>
                    <ArrowUpRight className="size-4 shrink-0" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="w-full sm:w-auto font-bold text-sm sm:text-base h-12 px-8 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-md transition-all active:scale-95"
                  >
                    <Link href="/register">Coba Gratis 14 Hari</Link>
                  </Button>

                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto font-semibold text-sm h-12 px-7 rounded-lg bg-white hover:bg-slate-50 text-slate-900 border-slate-300 shadow-xs"
                  >
                    <Link href="/demo">Jadwalkan Demo</Link>
                  </Button>
                </>
              )}
            </div>

            {!dashboardPath && (
              <div className="flex items-center justify-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-slate-500 font-medium pt-1 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-primary" />
                  Gratis 14 hari
                </span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-primary" />
                  Tanpa kartu kredit
                </span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-primary" />
                  Siap untuk Non-PKP & PKP
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Interactive Operational Cockpit Section (Unobstructed, Clean Vertical Flow) */}
      <div className="relative z-30 max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-16 sm:pb-24 space-y-6">
        {/* 3 Operational Switcher Tabs (Responsive Grid, Zero Horizontal Overflow) */}
        <div className="flex items-center justify-center w-full px-2">
          <div className="w-full max-w-lg p-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md grid grid-cols-3 gap-1">
            {SEGMENTS.map((seg, idx) => {
              const Icon = seg.icon;
              const isActive = idx === activeTab;
              return (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all text-center ${
                    isActive
                      ? "bg-slate-950 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/70"
                  }`}
                >
                  <Icon className={`size-3.5 shrink-0 ${isActive ? "text-primary" : "text-slate-500"}`} />
                  <span className="truncate">{seg.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Mockup Container Window Frame */}
        <div className="relative rounded-[28px] bg-white shadow-2xl overflow-hidden border border-slate-200/90">
          {/* Top Operational Status Bar */}
          <div className="bg-slate-950 text-slate-300 px-4 sm:px-5 py-3 flex items-center justify-between border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span className="text-slate-200 text-xs font-bold tracking-tight">
                KADAI Cloud POS
              </span>
              <span className="hidden sm:inline-block text-slate-500 font-medium">|</span>
              <span className="hidden sm:inline-block text-slate-400 text-[11px]">
                {current.name} • Gerai Online
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium bg-slate-900/90 px-2.5 py-0.5 rounded-md border border-slate-800 flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Realtime Sync
              </span>
            </div>
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
                <span className="inline-block text-[10px] font-semibold tracking-widest text-primary uppercase bg-primary/20 border border-primary/40 px-2.5 py-0.5 rounded-lg">
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
                {/* Official Brand Stamped Receipt Header (Using /png/lockup/) */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <KadaiLockup variant="on-light" height={26} className="h-6 w-auto" />
                  <Badge
                    variant="outline"
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                  >
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{current.receipt.status}</span>
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium pt-1">
                  <span className="font-bold text-slate-900">{current.receipt.table}</span>
                  <span className="text-slate-400 font-mono text-[10px]">{current.receipt.meta}</span>
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
      </div>
    </section>
  );
}
