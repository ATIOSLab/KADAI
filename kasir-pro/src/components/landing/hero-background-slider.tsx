"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

export interface HeroSlide {
  id: string;
  image: string;
  alt: string;
  title: string;
  subtitle: string;
  badge: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "finance",
    image: "/images/hero/slide-1.jpg",
    alt: "Pembukuan, Laba Rugi & Dashboard Keuangan KADAI",
    title: "Executive Cockpit & Pembukuan Finansial",
    subtitle: "Otomasi laporan laba rugi, rekonsiliasi kasir harian, dan kepatuhan pajak daerah PB1 & PPh Final.",
    badge: "Pembukuan & SAK EMKM",
  },
  {
    id: "cafe",
    image: "/images/hero/slide-2.jpg",
    alt: "Gerai Kafe, Restoran & Kitchen Display KADAI POS",
    title: "Gerai Kafe & Restoran Terpadu",
    subtitle: "Pemesanan meja kilat, split bill, Kitchen Display System (KDS), dan sinkronisasi resep BOM bahan baku.",
    badge: "F&B POS & Kitchen Display",
  },
  {
    id: "retail",
    image: "/images/hero/slide-3.jpg",
    alt: "Ritel, Minimarket & Rantai Pasok Multi-Gudang KADAI",
    title: "Kasir Ritel & Inventori Multi-Gudang",
    subtitle: "Pindai barcode secepat kilat, multi-satuan grosir/eceran, dan kartu stok FIFO multi-batch otomatis.",
    badge: "Ritel & Rantai Pasok",
  },
];

interface HeroBackgroundSliderProps {
  currentSlide: number;
  onSlideChange: (index: number) => void;
}

export function HeroBackgroundSlider({
  currentSlide,
  onSlideChange,
}: HeroBackgroundSliderProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Auto-advance slides every 6 seconds if not hovered
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      onSlideChange((currentSlide + 1) % HERO_SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [currentSlide, isHovered, onSlideChange]);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSlideChange((currentSlide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSlideChange((currentSlide + 1) % HERO_SLIDES.length);
  };

  return (
    <div
      className="absolute inset-0 pointer-events-auto select-none overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3 Slides Layer with Smooth Crossfade & Subtle Ken Burns Zoom */}
      {HERO_SLIDES.map((slide, index) => {
        const isActive = index === currentSlide;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <div
              className={`relative w-full h-full transform transition-transform duration-[7000ms] ease-out ${
                isActive ? "scale-105" : "scale-100"
              }`}
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={index === 0}
                unoptimized
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        );
      })}

      {/* Layer 1: Exquisite Dual-Gradient Scrim for 100% Typography Contrast */}
      {/* Radial soft spotlight behind center copy */}
      <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(ellipse_at_center,_rgba(248,250,252,0.92)_0%,_rgba(248,250,252,0.82)_45%,_rgba(248,250,252,0.4)_75%,_rgba(248,250,252,0.2)_100%)]" />

      {/* Top and Bottom Linear Fade Masks into Page Background */}
      <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-b from-[#F8FAFC]/95 via-transparent to-[#F8FAFC]" />
      <div className="absolute inset-x-0 bottom-0 h-48 z-20 pointer-events-none bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent" />

      {/* Slide Navigation Overlay Controls (Positioned at bottom center of the hero banner) */}
      <div className="absolute bottom-6 inset-x-0 z-30 flex items-center justify-center gap-2">
        {/* Active Scene Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 shadow-md text-[11px] font-semibold text-white">
          <Sparkles className="size-3 text-primary" />
          <span>{HERO_SLIDES[currentSlide].badge}</span>
        </div>

        {/* Carousel Arrow Controls */}
        <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-full border border-white/20 shadow-md">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Slide Sebelumnya"
            className="size-7 rounded-full flex items-center justify-center text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>

          {/* Indicator Dots */}
          <div className="flex items-center gap-1.5 px-2">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onSlideChange(i);
                }}
                aria-label={`Buka Slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentSlide
                    ? "w-6 bg-primary"
                    : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Slide Berikutnya"
            className="size-7 rounded-full flex items-center justify-center text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
