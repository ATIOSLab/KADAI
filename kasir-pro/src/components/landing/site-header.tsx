"use client";

import { useState } from "react";
import Link from "next/link";
import { Store, ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SiteHeaderProps {
  dashboardPath: string | null;
}

export function SiteHeader({ dashboardPath }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Solusi Industri", href: "#solusi-industri" },
    { label: "Pajak & SAK EMKM", href: "#pajak-pembukuan" },
    { label: "Paket Langganan", href: "#harga" },
  ];

  return (
    <header className="sticky top-0 z-50 pt-3 sm:pt-4 px-4 sm:px-6 w-full">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Left Modular Island: Brand Squircle (GetLayers style) */}
        <Link
          href="/"
          className="luxury-glass-pill px-3.5 py-2 rounded-2xl flex items-center gap-2.5 shrink-0 group hover:border-slate-300 transition-all"
        >
          <span className="flex size-8 items-center justify-center rounded-xl bg-slate-950 text-white shadow-2xs group-hover:scale-105 transition-transform">
            <Store className="size-4 text-primary" />
          </span>
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-black tracking-tight text-slate-950 leading-none">
                KADAI
              </span>
              <span className="text-primary font-black text-xl leading-none">.</span>
            </div>
            <span className="text-[9px] font-semibold text-slate-500 block leading-tight">
              Enterprise POS & Rantai Pasok
            </span>
          </div>
        </Link>

        {/* Center Modular Island: Navigation Pill (GetLayers style) */}
        <nav
          aria-label="Navigasi Utama"
          className="hidden md:flex items-center gap-1 luxury-glass-pill px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-4 py-1.5 rounded-full hover:text-slate-950 hover:bg-slate-100/80 transition-all font-medium text-slate-700 whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Modular Island: Auth & CTA Pill */}
        <div className="hidden sm:flex items-center gap-2 shrink-0 luxury-glass-pill p-1.5 rounded-2xl">
          {dashboardPath ? (
            <Button
              asChild
              size="sm"
              className="font-bold text-xs h-8 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
            >
              <Link href={dashboardPath} className="flex items-center gap-1.5">
                <span>Dashboard</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="font-semibold text-xs h-8 px-3 text-slate-700 hover:text-slate-950 hover:bg-slate-100/70 rounded-xl"
              >
                <Link href="/login">Masuk</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="font-bold text-xs h-8 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
              >
                <Link href="/register">Daftar Akun</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex sm:hidden items-center gap-2">
          {dashboardPath ? (
            <Button asChild size="sm" className="h-8 text-xs font-bold px-3 rounded-xl bg-primary text-primary-foreground">
              <Link href={dashboardPath}>Dashboard</Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="h-8 text-xs font-bold px-3 rounded-xl bg-primary text-primary-foreground">
              <Link href="/register">Daftar</Link>
            </Button>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle Menu"
            className="p-2 rounded-xl luxury-glass-pill text-slate-700 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Accessible Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden mt-2 max-w-6xl mx-auto luxury-glass-card rounded-2xl p-4 space-y-3 shadow-xl">
          <nav className="flex flex-col space-y-1 text-sm font-semibold text-slate-700">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
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
                {dashboardPath ? "Buka Dashboard" : "Mulai Uji Coba Gratis 14 Hari"}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
