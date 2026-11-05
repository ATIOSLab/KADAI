"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ShoppingCart,
  ChefHat,
  Truck,
  QrCode,
  Scale,
  Printer,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Utensils,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SLIDES = [
  {
    id: "pos",
    num: "01",
    title: "Kasir POS Kilat & Struk Thermal",
    subtitle: "Pencatatan nota, pajak restoran PB1 10%, diskon, hingga cetak struk 58/80mm.",
    tag: "Point of Sale",
    icon: ShoppingCart,
    accent: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  {
    id: "kds",
    num: "02",
    title: "Kitchen Display System (KDS)",
    subtitle: "Routing tiket pesanan langsung ke layar dapur & bar dengan timer masak real-time.",
    tag: "Cockpit Dapur",
    icon: ChefHat,
    accent: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    id: "transfer",
    num: "03",
    title: "Transfer Stok Antar Cabang",
    subtitle: "Distribusi bahan baku dari Gudang/Dapur Pusat ke gerai cabang & booth kaki lima.",
    tag: "Rantai Pasok",
    icon: Truck,
    accent: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    id: "qr",
    num: "04",
    title: "Self-Order QR Mandiri & Meja",
    subtitle: "Pelanggan pesan dan bayar dari smartphone tanpa antre di meja kasir.",
    tag: "Dining & QR",
    icon: QrCode,
    accent: "text-purple-600 bg-purple-50 border-purple-200",
  },
  {
    id: "tax",
    num: "05",
    title: "Laba Rugi & Pajak SAK EMKM",
    subtitle: "Kalkulasi otomatis PPh Final UMKM 0.5% (PP 55/2022) dan buku omzet bulanan.",
    tag: "Finansial RI",
    icon: Scale,
    accent: "text-rose-600 bg-rose-50 border-rose-200",
  },
] as const;

export function HeroShowcase({
  dashboardPath,
}: {
  dashboardPath: string | null;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = SLIDES.length;

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  // Autoplay timer with pause on hover
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide]);

  const slide = SLIDES[currentSlide];

  return (
    <section className="relative overflow-hidden py-10 sm:py-16 md:py-20 px-4 sm:px-6 border-b border-border bg-gradient-to-b from-card via-card to-background w-full">
      <div className="max-w-5xl mx-auto text-center space-y-6">
        {/* Animated Headline Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/90 text-slate-800 text-xs font-semibold shadow-xs"
        >
          <Sparkles className="size-3.5 text-primary shrink-0" />
          <span>Sistem Operasi Bisnis, Kasir POS & Rantai Pasok Multi-Cabang Indonesia</span>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight sm:leading-tight text-slate-950 text-balance"
        >
          Kelola Penjualan, Distribusi Stok, & Pembukuan dengan Presisi Enterprise.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm sm:text-base md:text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed text-balance"
        >
          KADAI menyatukan kasir POS kilat, inventori multi-batch FIFO, resep Bill of Materials (BOM), Kitchen Display System (KDS), hingga pelaporan pajak resmi PB1 10% & PPN 11%.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1 max-w-sm sm:max-w-none mx-auto w-full"
        >
          {dashboardPath ? (
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto font-bold text-sm h-12 px-7 shadow-sm rounded-xl"
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
                className="w-full sm:w-auto font-bold text-sm h-12 px-7 shadow-sm rounded-xl"
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
                className="w-full sm:w-auto font-semibold text-sm h-12 px-6 rounded-xl border-slate-300 hover:bg-slate-50"
              >
                <Link href="/login">Masuk ke Toko Anda</Link>
              </Button>
            </>
          )}
        </motion.div>

        {/* Core Value Micro-Pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="pt-2 flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto text-xs font-semibold text-slate-700"
        >
          <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" /> SAK EMKM RI & PPh Final 0.5%
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" /> Pajak Daerah PB1 10% & PPN 11%
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" /> Struk Thermal 58mm / 80mm
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" /> Multi-Cabang & Layar Dapur KDS
          </span>
        </motion.div>

        {/* ========================================================================= */}
        {/* INTERACTIVE HERO SHOWCASE SLIDER (Motion.dev & Live Workflow Sandbox)     */}
        {/* ========================================================================= */}
        <div
          className="pt-6 max-w-4xl mx-auto w-full text-left"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Slide Category Quick Selector Pills */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-none">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs">
              {SLIDES.map((s, idx) => {
                const Icon = s.icon;
                const isActive = currentSlide === idx;
                return (
                  <button
                    key={s.id}
                    onClick={() => goToSlide(idx)}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                      isActive
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    }`}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span>{s.tag}</span>
                    <span className="text-[10px] opacity-60 ml-0.5">{s.num}</span>
                  </button>
                );
              })}
            </div>

            {/* Slider Controls (Prev, Next, Pause/Play) */}
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsPaused(!isPaused)}
                className="size-8 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-100"
                title={isPaused ? "Lanjutkan Slide" : "Jeda Slide"}
              >
                {isPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={prevSlide}
                className="size-8 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-100"
                title="Slide Sebelumnya"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextSlide}
                className="size-8 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-100"
                title="Slide Berikutnya"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          {/* Presentation Card Shell */}
          <div className="rounded-2xl border border-slate-300/90 bg-card shadow-lg overflow-hidden relative">
            {/* Window Topbar */}
            <div className="bg-slate-950 text-slate-200 px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-red-500/80 inline-block" />
                <span className="size-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="size-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-xs font-mono font-bold text-slate-300 ml-2">
                  kadai.preview // {slide.id}-cockpit
                </span>
              </div>

              {/* Slide Counter & Header Badge */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-slate-400">
                  {slide.num} / 0{totalSlides}
                </span>
                <Badge variant="outline" className="text-[10px] font-mono border-slate-700 text-slate-300">
                  {slide.title}
                </Badge>
              </div>
            </div>

            {/* Slider Content Area with Directional Slide Transitions */}
            <div className="p-4 sm:p-6 bg-slate-50/70 min-h-[350px] flex flex-col justify-center relative overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={slide.id}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -direction * 40 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  className="w-full max-w-3xl mx-auto"
                >
                  {/* ==================== SLIDE 1: POS & THERMAL ==================== */}
                  {slide.id === "pos" && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-4 sm:p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                        <div>
                          <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-2">
                            <span>INV-20261105-0042</span>
                            <span>•</span>
                            <span>MEJA 04 (DINE-IN)</span>
                          </div>
                          <h4 className="text-base font-bold text-slate-900 mt-0.5">
                            Order Meja 04 • Kopi Kenangan & Nasi Goreng Spesial
                          </h4>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs w-fit">
                          Kasir Aktif
                        </Badge>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center py-1 border-b border-dashed">
                          <div>
                            <span className="font-medium text-slate-900">2x Nasi Goreng Spesial</span>
                            <span className="text-[10px] text-muted-foreground block font-mono">BOM: Beras, Ayam, Telur, Bumbu</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900">Rp 64.000</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-dashed">
                          <div>
                            <span className="font-medium text-slate-900">2x Es Kopi Susu Gula Aren</span>
                            <span className="text-[10px] text-muted-foreground block font-mono">BOM: Arabica Gayo, Susu UHT, Aren</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900">Rp 36.000</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500 pt-1">
                          <span>Pajak Restoran PB1 (10%)</span>
                          <span className="font-mono font-semibold">Rp 10.000</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500">
                          <span>Biaya Layanan (5%)</span>
                          <span className="font-mono font-semibold">Rp 5.000</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-black text-slate-950 pt-2 border-t">
                          <span>TOTAL TAGIHAN</span>
                          <span className="font-mono text-primary text-base">Rp 115.000</span>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                          <Printer className="size-4" />
                          <span>Siap Cetak Struk Kasir Thermal (58mm/80mm)</span>
                        </div>
                        <Badge variant="outline" className="text-[11px] font-mono">
                          Kalkulasi FIFO HPP: Rp 42.500 (Margin 63%)
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* ==================== SLIDE 2: KITCHEN DISPLAY SYSTEM ==================== */}
                  {slide.id === "kds" && (
                    <div className="bg-slate-900 border border-slate-800 text-white rounded-xl shadow-xs p-4 sm:p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground font-mono font-bold text-xs">
                            STASIUN: DAPUR PUSAT
                          </span>
                          <span className="text-xs font-bold text-slate-200">
                            Meja 07 • Dine In • #INV-0089
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono font-bold">
                          <Clock className="size-3.5 animate-spin" />
                          <span>04:18 (Sedang Dimasak)</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-slate-800/90 border border-slate-700 space-y-1">
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-sm text-white">2x Ayam Bakar Madu Pedas</p>
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                              COOKING
                            </Badge>
                          </div>
                          <p className="text-[11px] text-amber-300">Catatan: Sambal terpisah, ekstra lalapan</p>
                        </div>

                        <div className="p-3 rounded-lg bg-slate-800/90 border border-slate-700 space-y-1">
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-sm text-white">1x Sup Iga Sapi Kuah Rempah</p>
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                              COOKING
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-400">Standar porsi meja keluarga</p>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-wrap justify-between items-center gap-2 text-xs text-slate-400 border-t border-slate-800">
                        <span>Mode Langsung Saji (Direct Serve) Otomatis Bypass KDS untuk Gerai Booth</span>
                        <span className="text-emerald-400 font-bold">Aksi Dapur: Siap Saji →</span>
                      </div>
                    </div>
                  )}

                  {/* ==================== SLIDE 3: STOCK TRANSFERS ==================== */}
                  {slide.id === "transfer" && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-4 sm:p-5 space-y-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <div>
                          <div className="text-[11px] font-mono text-muted-foreground">
                            TRF-20261105-0014 • DISTRIBUSI HARIAN
                          </div>
                          <h4 className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                            <span>Gudang Pusat (HQ)</span>
                            <span className="text-primary">→</span>
                            <span className="text-primary font-black">Booth Kaki Lima Thamrin</span>
                          </h4>
                        </div>
                        <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold text-xs flex items-center gap-1">
                          <Truck className="size-3" /> Dalam Pengiriman
                        </Badge>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-12 gap-2 font-mono font-bold text-slate-500 pb-1 border-b">
                          <span className="col-span-6">Nama Komoditas</span>
                          <span className="col-span-3 text-center">Jumlah Kirim</span>
                          <span className="col-span-3 text-right">Valuasi HPP</span>
                        </div>
                        <div className="grid grid-cols-12 gap-2 py-1 border-b border-dashed items-center text-slate-800">
                          <span className="col-span-6 font-semibold truncate">Biji Kopi Arabica Gayo (Batch #01)</span>
                          <span className="col-span-3 text-center font-mono font-bold">15 kg</span>
                          <span className="col-span-3 text-right font-mono">Rp 2.100.000</span>
                        </div>
                        <div className="grid grid-cols-12 gap-2 py-1 border-b border-dashed items-center text-slate-800">
                          <span className="col-span-6 font-semibold truncate">Susu Pasteurisasi UHT Segar</span>
                          <span className="col-span-3 text-center font-mono font-bold">30 liter</span>
                          <span className="col-span-3 text-right font-mono">Rp 600.000</span>
                        </div>
                        <div className="grid grid-cols-12 gap-2 py-1 border-b border-dashed items-center text-slate-800">
                          <span className="col-span-6 font-semibold truncate">Cup & Tutup Takeaway 16oz</span>
                          <span className="col-span-3 text-center font-mono font-bold">500 pcs</span>
                          <span className="col-span-3 text-right font-mono">Rp 350.000</span>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Layers className="size-4 text-primary" />
                          <span>Otomatis potong stok asal & tambah batch di cabang tujuan via konfirmasi</span>
                        </div>
                        <span className="font-bold text-emerald-700">1-Click Penerimaan Barang</span>
                      </div>
                    </div>
                  )}

                  {/* ==================== SLIDE 4: SELF-ORDER QR ==================== */}
                  {slide.id === "qr" && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-4 sm:p-5 space-y-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <div>
                          <div className="text-[11px] font-mono text-muted-foreground">
                            DINING ROOM COCKPIT • 8 MEJA TERHUBUNG
                          </div>
                          <h4 className="text-base font-bold text-slate-900 mt-0.5">
                            Status Meja Restoran & Akses Self-Order HP
                          </h4>
                        </div>
                        <Badge className="bg-purple-100 text-purple-900 border-purple-300 font-bold text-xs flex items-center gap-1">
                          <QrCode className="size-3" /> QR Aktif
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-xl border bg-emerald-50/70 border-emerald-300 space-y-1 text-center">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-sm text-emerald-950">Meja 01</span>
                            <span className="size-2 rounded-full bg-emerald-600 animate-ping" />
                          </div>
                          <p className="text-[10px] text-emerald-800 font-bold">Terisi (Sedang Makan)</p>
                          <p className="text-[10px] font-mono text-muted-foreground">Order: Rp 145.000</p>
                        </div>

                        <div className="p-2.5 rounded-xl border bg-slate-50 border-slate-200 space-y-1 text-center">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-sm text-slate-900">Meja 02</span>
                            <span className="size-2 rounded-full bg-slate-400" />
                          </div>
                          <p className="text-[10px] text-muted-foreground font-semibold">Tersedia (Siap)</p>
                          <p className="text-[10px] font-mono text-muted-foreground">QR Scan Standby</p>
                        </div>

                        <div className="p-2.5 rounded-xl border bg-emerald-50/70 border-emerald-300 space-y-1 text-center">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-sm text-emerald-950">Meja 03</span>
                            <span className="size-2 rounded-full bg-emerald-600 animate-ping" />
                          </div>
                          <p className="text-[10px] text-emerald-800 font-bold">Terisi (Pesan Mandiri)</p>
                          <p className="text-[10px] font-mono text-muted-foreground">Order: Rp 88.000</p>
                        </div>

                        <div className="p-2.5 rounded-xl border bg-slate-50 border-slate-200 space-y-1 text-center">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-sm text-slate-900">Meja 04</span>
                            <span className="size-2 rounded-full bg-slate-400" />
                          </div>
                          <p className="text-[10px] text-muted-foreground font-semibold">Tersedia (Siap)</p>
                          <p className="text-[10px] font-mono text-muted-foreground">QR Scan Standby</p>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs border-t">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Utensils className="size-4 text-purple-600" />
                          <span>Pelanggan scan QR code di meja → pesan langsung dari browser tanpa instal app</span>
                        </div>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          Anti-Salah Catat Pesanan
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* ==================== SLIDE 5: TAX & SAK EMKM ==================== */}
                  {slide.id === "tax" && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-4 sm:p-5 space-y-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <div>
                          <div className="text-[11px] font-mono text-muted-foreground">
                            BUKU PEREDARAN BRUTO • STANDAR PP 55/2022
                          </div>
                          <h4 className="text-base font-bold text-slate-900 mt-0.5">
                            Rekapitulasi Omzet, Pajak PB1/PPN & PPh Final 0.5%
                          </h4>
                        </div>
                        <Badge className="bg-rose-100 text-rose-900 border-rose-300 font-bold text-xs flex items-center gap-1">
                          <Percent className="size-3" /> Fiskal RI
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="p-3 rounded-xl bg-slate-50 border space-y-1">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase block">Omzet Bruto</span>
                          <span className="text-base font-black font-mono text-slate-900 block">Rp 48.500.000</span>
                          <span className="text-[10px] text-emerald-600 font-semibold">+18% vs bulan lalu</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border space-y-1">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase block">HPP FIFO Baku</span>
                          <span className="text-base font-black font-mono text-slate-900 block">Rp 17.250.000</span>
                          <span className="text-[10px] text-muted-foreground font-mono">Beban pokok riil</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border space-y-1">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase block">PB1 10% Terhimpun</span>
                          <span className="text-base font-black font-mono text-primary block">Rp 4.850.000</span>
                          <span className="text-[10px] text-muted-foreground">Siap setor kas daerah</span>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                          <span className="text-[10px] text-emerald-800 font-bold uppercase block">PPh Final 0.5%</span>
                          <span className="text-base font-black font-mono text-emerald-900 block">Rp 0 (Bebas)</span>
                          <span className="text-[10px] text-emerald-700 font-bold">PTKP &lt; Rp 500 Jt</span>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs border-t">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Scale className="size-4 text-rose-600" />
                          <span>Laporan Laba Rugi Periodik & Neraca Keuangan Sah Standar SAK EMKM</span>
                        </div>
                        <span className="font-bold text-slate-900">Audit-Ready Export CSV/PDF</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Navigation Strip & Progress Bar */}
            <div className="bg-slate-900 border-t border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-[11px]">Alur Operasional:</span>
                <span className="text-slate-400 hidden sm:inline">{slide.subtitle}</span>
              </div>

              {/* Progress Dots */}
              <div className="flex items-center gap-1.5">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToSlide(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      currentSlide === i ? "w-6 bg-primary" : "w-1.5 bg-slate-700 hover:bg-slate-500"
                    }`}
                    title={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
