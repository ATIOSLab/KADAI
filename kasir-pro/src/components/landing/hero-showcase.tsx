"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface IndustryTab {
  id: string;
  name: string;
  badge: string;
  photoUrl: string;
  photoAlt: string;
  headline: string;
  description: string;
  metrics: Array<{ label: string; value: string }>;
  uiPreview: {
    title: string;
    sub: string;
    tag: string;
    lines: Array<{ label: string; detail?: string; value: string }>;
    totalLabel: string;
    totalValue: string;
    footerNote: string;
  };
}

const TABS: IndustryTab[] = [
  {
    id: "fnb",
    name: "Kafe & Restoran (F&B)",
    badge: "Food & Beverage",
    photoUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80",
    photoAlt: "Suasana Kafe & Restoran Modern",
    headline: "Kasir POS Kilat, Resep BOM & Layar Dapur KDS",
    description: "Pesanan meja langsung terhubung ke layar stasiun dapur & bar. HPP bahan baku terpotong otomatis per porsi laku.",
    metrics: [
      { label: "Pajak Restoran", value: "PB1 10%" },
      { label: "Kecepatan Kasir", value: "< 0.2 Detik" },
      { label: "Format Struk", value: "58mm / 80mm" },
    ],
    uiPreview: {
      title: "Order Meja 04 • Dine In",
      sub: "INV-20261105-0042 • Kasir: Budi",
      tag: "Dapur Aktif",
      lines: [
        { label: "2x Nasi Goreng Spesial", detail: "BOM: Beras, Ayam, Telur", value: "Rp 64.000" },
        { label: "2x Es Kopi Susu Aren", detail: "BOM: Arabica Gayo, Susu UHT", value: "Rp 36.000" },
        { label: "Pajak Daerah Resto PB1 (10%)", value: "Rp 10.000" },
        { label: "Biaya Layanan (5%)", value: "Rp 5.000" },
      ],
      totalLabel: "TOTAL TAGIHAN",
      totalValue: "Rp 115.000",
      footerNote: "Struk Thermal Siap Cetak • Tiket KDS: Terkirim",
    },
  },
  {
    id: "retail",
    name: "Ritel & Minimarket",
    badge: "Retail & Commerce",
    photoUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
    photoAlt: "Toko Ritel & Gerai Cabang",
    headline: "Scan Barcode Kilat, Batch FIFO & PPN 11%",
    description: "Pencatatan ribuan SKU produk komersial, barcode scanner USB/Bluetooth, batas minimum restock, dan kartu stok mutasi otomatis.",
    metrics: [
      { label: "Metode HPP", value: "FIFO Akurat" },
      { label: "Sistem Pajak", value: "PPN 11%" },
      { label: "Deteksi Kadaluwarsa", value: "Radar Batch" },
    ],
    uiPreview: {
      title: "Transaksi Kasir Barcode",
      sub: "INV-20261105-0118 • Scan Cepat",
      tag: "Stok Terverifikasi",
      lines: [
        { label: "1x Susu UHT 1L (Batch #04)", detail: "Exp: 14 Des 2026", value: "Rp 22.000" },
        { label: "2x Biskuit Gandum Gandaria", detail: "SKU: BSK-GND-01", value: "Rp 28.000" },
        { label: "PPN Ritel 11% (Inklusif)", value: "Rp 4.955" },
        { label: "Potongan Member Tier Emas", value: "-Rp 5.000" },
      ],
      totalLabel: "TOTAL BELANJA",
      totalValue: "Rp 45.000",
      footerNote: "Stok Berkurang Otomatis • Struk Kasir Ritel",
    },
  },
  {
    id: "supply",
    name: "Dapur Pusat & Gudang",
    badge: "Supply Chain & Hub",
    photoUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80",
    photoAlt: "Dapur Komersial & Central Kitchen",
    headline: "Distribusi Rantai Pasok & Transfer Stok Cabang",
    description: "Kirim pasokan bahan baku dari Gudang/Dapur Pusat ke seluruh gerai cabang dengan surat jalan digital dan audit trail tak terhapuskan.",
    metrics: [
      { label: "Topologi", value: "Hub & Spoke" },
      { label: "Standar Akuntansi", value: "SAK EMKM" },
      { label: "Pajak Omzet", value: "PPh Final 0.5%" },
    ],
    uiPreview: {
      title: "Surat Jalan Transfer Stok",
      sub: "TRF-20261105-0014 • Status: In Transit",
      tag: "Dalam Pengiriman",
      lines: [
        { label: "Biji Kopi Arabica (15 kg)", detail: "Gudang HQ → Booth Thamrin", value: "Rp 2.100.000" },
        { label: "Susu UHT Segar (30 liter)", detail: "Batch #02 • Scoped FIFO", value: "Rp 600.000" },
        { label: "Cup Takeaway 16oz (500 pcs)", detail: "Kemasan Standar", value: "Rp 350.000" },
      ],
      totalLabel: "VALUASI TRANSFER",
      totalValue: "Rp 3.050.000",
      footerNote: "1-Klik Konfirmasi Penerimaan di Gerai Tujuan",
    },
  },
];

export function HeroShowcase({
  dashboardPath,
}: {
  dashboardPath: string | null;
}) {
  const [activeTab, setActiveTab] = useState<string>("fnb");
  const [isPaused, setIsPaused] = useState(false);

  const selected = TABS.find((t) => t.id === activeTab) || TABS[0];

  // Auto-advance tabs every 7 seconds unless hovered
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveTab((prev) => {
        const idx = TABS.findIndex((t) => t.id === prev);
        return TABS[(idx + 1) % TABS.length].id;
      });
    }, 7000);
    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <section className="relative overflow-hidden pt-12 sm:pt-16 pb-16 sm:pb-20 px-4 sm:px-6 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/50 border-b border-slate-200/80 w-full">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Main Hero Header */}
        <div className="max-w-3xl mx-auto text-center space-y-5">
          {/* Subtle Enterprise Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            <span>KADAI Operating System // Enterprise POS & Rantai Pasok RI</span>
          </div>

          {/* Master Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.15] text-slate-950 text-balance">
            Satu Sistem Terpadu untuk Gerai, Dapur Pusat, & Pembukuan Anda.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed text-balance">
            KADAI menyatukan kasir POS kilat, inventori multi-batch FIFO, resep Bill of Materials (BOM), Kitchen Display System (KDS), hingga pelaporan pajak daerah PB1 10% & PPh Final 0.5% (PP 55/2022).
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1 max-w-sm sm:max-w-none mx-auto w-full">
            {dashboardPath ? (
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto font-bold text-sm h-12 px-7 shadow-xs rounded-xl"
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
                  className="w-full sm:w-auto font-bold text-sm h-12 px-7 shadow-xs rounded-xl"
                >
                  <Link href="/register" className="flex items-center gap-2">
                    <span>Mulai Uji Coba Gratis 14 Hari</span>
                    <ArrowRight className="size-4 shrink-0" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto font-semibold text-sm h-12 px-6 rounded-xl border-slate-300 hover:bg-slate-50 bg-white"
                >
                  <Link href="/login">Masuk ke Toko Anda</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SIGNATURE ENTERPRISE HARDWARE & SOFTWARE SHOWCASE COCKPIT                  */}
        {/* ========================================================================= */}
        <div
          className="max-w-5xl mx-auto w-full space-y-3"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Refined Segmented Tab Controls */}
          <div className="flex items-center justify-center">
            <div className="inline-flex p-1 rounded-2xl bg-slate-100/90 border border-slate-200/90 text-xs shadow-xs">
              {TABS.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                      isActive
                        ? "bg-white text-slate-950 shadow-xs ring-1 ring-black/[0.04]"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Master Cockpit Window Frame */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 overflow-hidden">
            {/* Window Chrome Header Bar */}
            <div className="bg-slate-950 text-slate-200 px-4 py-3 flex items-center justify-between border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-red-500/80 inline-block" />
                <span className="size-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="size-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="font-mono text-slate-300 ml-2 text-[11px] font-semibold">
                  kadai.os // {selected.id}-operational-engine
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-mono border-slate-700 text-slate-300">
                  {selected.badge}
                </Badge>
              </div>
            </div>

            {/* Split Content: Lifestyle Operation Photo + Live KADAI Terminal UI */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px]"
              >
                {/* Left Side: Authentic Photography of Real Operational Environment (Col 5) */}
                <div className="lg:col-span-5 relative min-h-[220px] lg:min-h-full overflow-hidden bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-100">
                  <Image
                    src={selected.photoUrl}
                    alt={selected.photoAlt}
                    fill
                    unoptimized
                    priority
                    className="object-cover transition-transform duration-700 hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                  {/* Subtle Gradient & Context Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex flex-col justify-end p-5 text-white">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-semibold block">
                      Lingkungan Operasional
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">{selected.headline}</h3>
                    <p className="text-xs text-slate-200 mt-1 leading-relaxed line-clamp-2">
                      {selected.description}
                    </p>
                  </div>
                </div>

                {/* Right Side: High-Precision KADAI Terminal UI Artifact (Col 7) */}
                <div className="lg:col-span-7 p-5 sm:p-6 bg-slate-50/70 flex flex-col justify-between space-y-4">
                  {/* Terminal Card */}
                  <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{selected.uiPreview.title}</h4>
                        <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                          {selected.uiPreview.sub}
                        </p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px]">
                        {selected.uiPreview.tag}
                      </Badge>
                    </div>

                    {/* Breakdown Rows */}
                    <div className="space-y-1.5 text-xs">
                      {selected.uiPreview.lines.map((line, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1 border-b border-dashed border-slate-100">
                          <div>
                            <span className="font-semibold text-slate-800">{line.label}</span>
                            {line.detail && (
                              <span className="text-[10px] text-muted-foreground block font-mono">
                                {line.detail}
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-bold text-slate-900">{line.value}</span>
                        </div>
                      ))}

                      {/* Total Bar */}
                      <div className="flex justify-between items-center text-sm font-black text-slate-950 pt-2 border-t border-slate-200">
                        <span>{selected.uiPreview.totalLabel}</span>
                        <span className="font-mono text-primary text-base">
                          {selected.uiPreview.totalValue}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>{selected.uiPreview.footerNote}</span>
                      <span className="font-mono font-bold text-slate-800">KADAI Engine</span>
                    </div>
                  </div>

                  {/* 3 Metric Pills Bottom Strip */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    {selected.metrics.map((m, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-semibold text-muted-foreground block uppercase">
                          {m.label}
                        </span>
                        <span className="text-xs font-black text-slate-900 font-mono mt-0.5 block">
                          {m.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
