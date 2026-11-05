"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const BACKGROUND_SLIDES = [
  {
    url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1920&q=80",
    label: "Kafe & Restoran Modern",
    tagline: "Point of Sale Kilat, Resep BOM & Layar Dapur KDS",
  },
  {
    url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1920&q=80",
    label: "Toko Ritel & Gerai Cabang",
    tagline: "Inventori Multi-Batch FIFO, Barcode Scanner & PPN 11%",
  },
  {
    url: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1920&q=80",
    label: "Dapur Komersial & Central Kitchen",
    tagline: "Distribusi Rantai Pasok, Transfer Stok & SAK EMKM RI",
  },
] as const;

export function HeroShowcase({
  dashboardPath,
}: {
  dashboardPath: string | null;
}) {
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-advance slide every 5.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % BACKGROUND_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setActiveSlide((prev) => (prev - 1 + BACKGROUND_SLIDES.length) % BACKGROUND_SLIDES.length);
  };

  const handleNext = () => {
    setActiveSlide((prev) => (prev + 1) % BACKGROUND_SLIDES.length);
  };

  const current = BACKGROUND_SLIDES[activeSlide];

  return (
    <section className="relative overflow-hidden py-14 sm:py-20 md:py-24 px-4 sm:px-6 border-b border-border bg-gradient-to-b from-card via-card to-background text-slate-950 w-full min-h-[580px] flex items-center justify-center">
      {/* 3-Slide Real Background Image Elements with Smooth Crossfade */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        {BACKGROUND_SLIDES.map((slide, index) => (
          <div
            key={slide.url}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              activeSlide === index ? "opacity-70" : "opacity-0"
            }`}
          >
            <Image
              src={slide.url}
              alt={slide.label}
              fill
              priority={index === 0}
              unoptimized
              className="object-cover"
              sizes="100vw"
            />
          </div>
        ))}
        {/* Luminous Light Gradient Scrim: Clear Photo Visibility + Crisp Clean Typography */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/70 to-background backdrop-blur-[1px]" />
      </div>

      {/* Main Hero Content - Direct Clean Layout (No Box/Card) */}
      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 w-full">
        {/* Animated Headline Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200/90 text-slate-800 text-xs font-semibold shadow-xs backdrop-blur-md"
        >
          <Sparkles className="size-3.5 text-primary shrink-0" />
          <span>Sistem Operasi Bisnis, Kasir POS & Rantai Pasok Indonesia</span>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight sm:leading-tight text-slate-950 text-balance"
        >
          Kelola Penjualan, Rantai Pasok, & Pembukuan dengan Akurasi Enterprise.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="text-sm sm:text-base md:text-lg text-slate-700 font-semibold max-w-2xl mx-auto leading-relaxed text-balance"
        >
          KADAI menyatukan kasir POS kilat, inventori multi-batch FIFO, resep
          Bill of Materials (BOM), Kitchen Display System (KDS), hingga pelaporan
          pajak resmi PPN 11% & PB1 10%.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-sm sm:max-w-none mx-auto w-full"
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
                className="w-full sm:w-auto font-semibold text-sm h-12 px-6 rounded-xl border-slate-300 hover:bg-slate-50 bg-white/90 text-slate-900 shadow-xs backdrop-blur-md"
              >
                <Link href="/login">Masuk ke Toko Anda</Link>
              </Button>
            </>
          )}
        </motion.div>

        {/* Value Props Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl mx-auto text-left w-full"
        >
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/85 border border-slate-200/90 shadow-xs backdrop-blur-xs">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-800">
              Kepatuhan Standar SAK EMKM RI & PPh Final 0.5%
            </span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/85 border border-slate-200/90 shadow-xs backdrop-blur-xs">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-800">
              Otomatisasi Pajak Restoran PB1 10% & PPN 11%
            </span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/85 border border-slate-200/90 shadow-xs backdrop-blur-xs">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-800">
              Self-Order QR Mandiri & Layar Dapur KDS Real-time
            </span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/85 border border-slate-200/90 shadow-xs backdrop-blur-xs">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-800">
              Multi-Cabang, Transfer Stok & Hak Akses 6-Role RBAC
            </span>
          </div>
        </motion.div>

        {/* Clean Background Slide Indicator */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 border-t border-slate-300/60 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Store className="size-3.5 text-primary" />
            <span className="font-bold text-slate-900">{current.label}:</span>
            <span className="text-slate-600 text-[11px] hidden sm:inline">{current.tagline}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrev}
              className="p-1 rounded-full hover:bg-slate-200/80 text-slate-700 transition-colors"
              title="Slide Sebelumnya"
              aria-label="Slide Sebelumnya"
            >
              <ChevronLeft className="size-3.5" />
            </button>

            <div className="flex items-center gap-1.5">
              {BACKGROUND_SLIDES.map((slide, idx) => (
                <button
                  key={slide.url}
                  onClick={() => setActiveSlide(idx)}
                  className={`transition-all rounded-full ${
                    activeSlide === idx
                      ? "w-6 h-1.5 bg-primary"
                      : "w-1.5 h-1.5 bg-slate-400 hover:bg-slate-600"
                  }`}
                  title={slide.label}
                  aria-label={slide.label}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="p-1 rounded-full hover:bg-slate-200/80 text-slate-700 transition-colors"
              title="Slide Berikutnya"
              aria-label="Slide Berikutnya"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
