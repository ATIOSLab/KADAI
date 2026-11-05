"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

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
    </div>
  );
}
