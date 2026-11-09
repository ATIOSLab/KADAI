"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { motion, useScroll, useSpring } from "motion/react";
import { Button } from "@/components/ui/button";
import { KadaiLockup } from "@/components/shared/kadai-logo";

interface SiteHeaderProps {
  dashboardPath: string | null;
}

export function SiteHeader({ dashboardPath }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 4 Primary Navigation Links: Clean, Focused, Enterprise Standards
  const navLinks = [
    { label: "Fitur", href: "/fitur" },
    { label: "Solusi", href: "/solusi" },
    { label: "Harga", href: "/harga" },
    { label: "Hardware", href: "/hardware" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300">
      {/* Top Hairline Scroll Progress Bar (Enterprise Accent) */}
      <motion.div
        style={{ scaleX, transformOrigin: "0%" }}
        className="h-[2px] bg-gradient-to-r from-primary via-orange-500 to-amber-500 w-full fixed top-0 left-0 right-0 z-50 pointer-events-none"
      />

      <div
        className={`w-full transition-all duration-200 border-b ${
          scrolled
            ? "bg-white/95 backdrop-blur-md border-slate-200/90 shadow-sm"
            : "bg-white/80 backdrop-blur-sm border-slate-200/60"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-6">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg py-1"
          >
            <KadaiLockup
              variant="on-light"
              height={42}
              priority
              className="h-9 sm:h-10 md:h-11 w-auto group-hover:opacity-90 transition-opacity"
            />
          </Link>

          {/* Center Navigation Links: Clean, Spacious, Zero Overcrowding */}
          <nav
            aria-label="Navigasi Utama"
            className="hidden md:flex items-center gap-1 sm:gap-2 text-sm font-semibold text-slate-600 h-full"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-lg text-slate-700 hover:text-primary hover:bg-slate-50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action: Clean Login + High-Contrast Solid CTA */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {dashboardPath ? (
              <Button
                asChild
                className="font-bold text-sm h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-2xs transition-all hover:shadow-sm active:scale-98"
              >
                <Link href={dashboardPath} className="flex items-center gap-1.5">
                  <span>Panel Kontrol</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-slate-600 hover:text-slate-950 transition-colors px-3 py-1.5"
                >
                  Masuk
                </Link>
                <Button
                  asChild
                  className="font-bold text-sm h-9 px-5 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-2xs transition-all hover:shadow-sm active:scale-95"
                >
                  <Link href="/register">Coba Gratis</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            {dashboardPath ? (
              <Button asChild size="sm" className="h-8 text-xs font-bold px-3 rounded-lg bg-primary text-white">
                <Link href={dashboardPath}>Panel Kontrol</Link>
              </Button>
            ) : (
              <Button asChild size="sm" className="h-8 text-xs font-bold px-3 rounded-lg bg-primary text-white">
                <Link href="/register">Coba Gratis</Link>
              </Button>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle Menu"
              className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Streamlined & Clean) */}
      {mobileMenuOpen && (
        <div className="md:hidden max-w-6xl mx-auto px-4 mt-2">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-xl">
            <nav className="flex flex-col space-y-0.5 text-sm font-semibold text-slate-700">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg hover:bg-slate-50 hover:text-primary transition-colors flex items-center justify-between"
                >
                  <span>{link.label}</span>
                  <ArrowRight className="size-3.5 text-slate-400" />
                </Link>
              ))}
              <Link
                href="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg hover:bg-slate-50 hover:text-primary transition-colors flex items-center justify-between text-slate-500 font-medium"
              >
                <span>Blog & Panduan</span>
                <span className="text-[10px] text-slate-400">Edukasi</span>
              </Link>
            </nav>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              {!dashboardPath && (
                <Button asChild variant="outline" className="w-full text-xs font-semibold h-9 rounded-lg bg-white border-slate-200">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    Masuk ke Akun
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
