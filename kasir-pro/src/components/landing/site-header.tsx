"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Store, ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SiteHeaderProps {
  dashboardPath: string | null;
}

export function SiteHeader({ dashboardPath }: SiteHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Produk", href: "#produk" },
    { label: "Solusi Industri", href: "#solusi-industri" },
    { label: "Pajak & Pembukuan", href: "#pajak-pembukuan" },
    { label: "Harga", href: "#harga" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header className="sticky top-0 z-50 px-4 sm:px-6 pt-3 sm:pt-4 transition-all duration-300 w-full">
      <div
        className={`max-w-6xl mx-auto rounded-2xl transition-all duration-300 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-4 ${
          isScrolled
            ? "liquid-glass-nav shadow-xl shadow-slate-900/[0.04]"
            : "bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-xs"
        }`}
      >
        {/* Original Unmodified KADAI Brand Identity */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <span className="flex size-9 items-center justify-center rounded-xl bg-slate-950 text-white shadow-xs group-hover:scale-105 transition-transform">
            <Store className="size-4 text-primary" />
          </span>
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-black tracking-tight text-slate-950 leading-none">
                KADAI
              </span>
              <span className="text-primary font-black text-xl leading-none">.</span>
            </div>
            <span className="text-[9px] font-mono font-bold tracking-wider text-slate-500 uppercase block mt-0.5">
              Enterprise POS & ERP
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Navigasi Utama"
          className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3.5 py-1.5 rounded-xl hover:text-slate-950 hover:bg-slate-100/70 transition-all text-slate-700 font-medium"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          {dashboardPath ? (
            <Button
              asChild
              size="sm"
              className="font-bold text-xs h-9 px-4 rounded-xl shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-md hover:shadow-primary/20"
            >
              <Link href={dashboardPath} className="flex items-center gap-1.5">
                <span>Buka Dashboard</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="font-semibold text-xs h-9 px-3 text-slate-700 hover:text-slate-950 hover:bg-slate-100/70 rounded-xl"
              >
                <Link href="/login">Masuk</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="font-bold text-xs h-9 px-4 rounded-xl shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-md hover:shadow-primary/20"
              >
                <Link href="/register" className="flex items-center gap-1.5">
                  <span>Coba Gratis</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex sm:hidden items-center gap-2">
          {dashboardPath ? (
            <Button asChild size="sm" className="h-8 text-xs font-bold px-3 rounded-lg">
              <Link href={dashboardPath}>Dashboard</Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="h-8 text-xs font-bold px-3 rounded-lg bg-primary text-primary-foreground">
              <Link href="/register">Coba</Link>
            </Button>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle Menu"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Accessible Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden mt-2 max-w-6xl mx-auto rounded-2xl liquid-glass-card p-4 border border-slate-200/90 shadow-xl space-y-3 animate-slide-down">
          <nav className="flex flex-col space-y-1 text-sm font-semibold text-slate-700">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-slate-950 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-2 border-t border-slate-200/80 flex flex-col gap-2">
            {!dashboardPath && (
              <Button asChild variant="outline" className="w-full text-xs font-semibold h-10 rounded-xl">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  Masuk ke Akun
                </Link>
              </Button>
            )}
            <Button asChild className="w-full text-xs font-bold h-10 rounded-xl bg-primary text-primary-foreground">
              <Link
                href={dashboardPath ?? "/register"}
                onClick={() => setMobileMenuOpen(false)}
              >
                {dashboardPath ? "Buka Dashboard" : "Mulai Uji Coba Gratis"}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
