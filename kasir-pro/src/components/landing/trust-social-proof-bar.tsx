"use client";

import { motion } from "motion/react";
import { 
  Users, 
  Activity, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Printer, 
  QrCode, 
  CreditCard,
  Building2,
  TrendingUp
} from "lucide-react";
import { FadeIn } from "./fade-in";

const LIVE_EVENTS = [
  { text: "Pesanan Meja 03 lunas via QRIS", time: "Baru saja", badge: "Kopi Gayo & Toast" },
  { text: "Stok Batch #04 dipotong otomatis (FIFO)", time: "1 mnt lalu", badge: "Restock Biji Kopi" },
  { text: "KDS Dapur: 2 Tiket Masak Selesai", time: "2 mnt lalu", badge: "Stasiun Barista" },
  { text: "Transfer Stok Cabang Senopati Diterima", time: "4 mnt lalu", badge: "Surat Jalan #SJ-089" },
];

const ECOSYSTEM_PARTNERS = [
  { name: "QRIS Nasional", label: "Bank Indonesia" },
  { name: "BCA / Mandiri / BRI", label: "Transfer & VA" },
  { name: "GoPay & OVO", label: "E-Wallet Instan" },
  { name: "ESC/POS Thermal", label: "Epson, Panda, Kassen" },
  { name: "USB & BT Scanner", label: "Plug & Play Barcode" },
  { name: "SAK EMKM Standar", label: "Kepatuhan PP 55/2022" },
];

export function TrustSocialProofBar() {
  return (
    <section className="w-full border-y border-slate-200/80 bg-white/70 backdrop-blur-md relative overflow-hidden">
      {/* Subtle Warm Amber Studio Glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-28 bg-orange-500/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-28 bg-amber-500/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* 1. Live Operational Telemetry Ticker (Menghidupkan Suasana Web) */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">
              Aktivitas Sistem Real-Time
            </span>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              • Telemetri Gerai Aktif di Seluruh Indonesia (UTC+7)
            </span>
          </div>

          {/* Marquee / Live Activity Badges */}
          <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none text-xs">
            {LIVE_EVENTS.map((event, idx) => (
              <div 
                key={idx}
                className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/90 text-slate-700 shadow-2xs"
              >
                <Activity className="size-3 text-primary shrink-0 animate-pulse" />
                <span className="font-semibold text-[11px]">{event.text}</span>
                <span className="text-[10px] text-slate-400 font-mono">({event.time})</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Key Performance Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          <FadeIn delay={0.05} className="space-y-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight">
                500+
              </span>
              <span className="text-xs font-bold text-primary">Gerai</span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Kedai kopi, restoran, ritel, & minimarket aktif di Indonesia
            </p>
          </FadeIn>

          <FadeIn delay={0.1} className="space-y-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight">
                &lt; 0.2
              </span>
              <span className="text-xs font-bold text-emerald-600">Detik</span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Kecepatan transaksi kasir kilat tanpa hambatan antrean
            </p>
          </FadeIn>

          <FadeIn delay={0.15} className="space-y-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight">
                Rp 0
              </span>
              <span className="text-xs font-bold text-amber-600">Gratis</span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Migrasi impor data produk dari Moka/Majoo & paket Starter
            </p>
          </FadeIn>

          <FadeIn delay={0.2} className="space-y-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight">
                99.9%
              </span>
              <span className="text-xs font-bold text-emerald-600">Uptime</span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Infrastruktur cloud berkecepatan tinggi dengan data real-time
            </p>
          </FadeIn>
        </div>

        {/* 3. Hardware & Payment Compatibility Strip */}
        <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span className="font-semibold text-slate-700 shrink-0">
            Kompatibilitas Penuh Ekosistem Usaha:
          </span>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-2 text-[11px] font-medium text-slate-600">
            {ECOSYSTEM_PARTNERS.map((p, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" />
                <span className="font-bold text-slate-800">{p.name}</span>
                <span className="text-slate-400">({p.label})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
