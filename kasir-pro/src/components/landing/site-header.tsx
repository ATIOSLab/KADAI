"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Store,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  ShoppingBag,
  Layers,
  ChefHat,
  Receipt,
  UtensilsCrossed,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KadaiWordmark } from "@/components/shared/kadai-logo";

interface SiteHeaderProps {
  dashboardPath: string | null;
}

export function SiteHeader({ dashboardPath }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const capabilities = [
    {
      title: "Kasir POS Kilat",
      desc: "Transaksi cepat dengan tombol pintas F2/F4 dan cetak struk thermal 58/80mm.",
      href: "/fitur#kasir-pos",
      icon: ShoppingBag,
    },
    {
      title: "Inventori Multi-Batch FIFO",
      desc: "Penilaian stok akurat berstandar PSAK 14 dan radar peringatan tanggal kadaluwarsa.",
      href: "/fitur#inventori-fifo",
      icon: Layers,
    },
    {
      title: "Layar Dapur & Bar (KDS)",
      desc: "Routing pesanan otomatis ke dapur dengan notifikasi audio suara lonceng.",
      href: "/fitur#dapur-kds",
      icon: ChefHat,
    },
    {
      title: "Pajak & Pembukuan",
      desc: "Kelola pengaturan pajak dan laporan pembukuan usaha.",
      href: "/fitur#pembukuan-pajak",
      icon: Receipt,
    },
  ];

  const solutions = [
    {
      title: "Kafe & Restoran (F&B)",
      desc: "Manajemen meja, pesanan split-bill, dan pemotongan resep bahan baku (BOM).",
      href: "/solusi#kuliner-fnb",
      icon: UtensilsCrossed,
    },
    {
      title: "Toko Ritel & Minimarket",
      desc: "Scan barcode produk kilat, kontrol varian SKU, dan batas minimum stok.",
      href: "/solusi#ritel-minimarket",
      icon: Store,
    },
    {
      title: "Dapur Pusat & Multi-Gudang",
      desc: "Penerbitan surat jalan antar-cabang dan konsolidasi laporan grup owner.",
      href: "/solusi#dapur-pusat-gudang",
      icon: Warehouse,
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300">
      <div className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
          {/* Brand Logo (Clean Human-Grade, No Pill Nesting) */}
          <Link
            href="/"
            className="flex items-center gap-3 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
          >
            <span className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-slate-950 text-white shadow-xs group-hover:shadow-md transition-all p-1">
              <svg viewBox="0 0 512 512" fill="none" className="size-full">
                <defs>
                  <linearGradient id="hdr-ga" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0%" stopColor="#EA580C" />
                    <stop offset="100%" stopColor="#FB923C" />
                  </linearGradient>
                  <linearGradient id="hdr-gl" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#EA580C" />
                  </linearGradient>
                  <linearGradient id="hdr-gs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#E2E8F0" />
                  </linearGradient>
                </defs>
                <rect x="120" y="78" width="60" height="356" rx="30" fill="url(#hdr-gs)" />
                <path d="M212 256L350 114" stroke="url(#hdr-ga)" strokeWidth="60" strokeLinecap="round" fill="none" />
                <path d="M212 256A150 150 0 0 1 362 406" stroke="url(#hdr-gl)" strokeWidth="60" strokeLinecap="round" fill="none" />
                <circle cx="408" cy="150" r="22" fill="#F59E0B" />
              </svg>
            </span>
            <div className="flex flex-col justify-center">
              <KadaiWordmark size="text-2xl" />
              <span className="text-[8.5px] font-bold text-slate-500 tracking-[0.18em] uppercase mt-0.5 font-sans">
                SISTEM OPERASI BISNIS
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Clean Flat Typography like Moka) */}
          <nav
            aria-label="Navigasi Utama"
            className="hidden xl:flex items-center gap-1 text-sm font-medium text-slate-600 relative h-full"
            onMouseLeave={() => setActiveDropdown(null)}
            onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setActiveDropdown(null); }}
            onKeyDown={(event) => { if (event.key === "Escape") { event.currentTarget.querySelector<HTMLButtonElement>('button[aria-expanded="true"]')?.focus(); setActiveDropdown(null); } }}
          >
            {/* 1. Dropdown Kapabilitas */}
            <div
              className="relative h-full flex items-center"
              onMouseEnter={() => setActiveDropdown("kapabilitas")}
            >
              <button
                type="button"
                aria-expanded={activeDropdown === "kapabilitas"}
                aria-controls="nav-kapabilitas"
                onClick={() => setActiveDropdown(activeDropdown === "kapabilitas" ? null : "kapabilitas")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors cursor-pointer ${
                  activeDropdown === "kapabilitas"
                    ? "text-primary font-bold bg-slate-50"
                    : "text-slate-700 hover:text-primary hover:bg-slate-50"
                }`}
              >
                <span>Layanan & Fitur</span>
                <ChevronDown
                  className={`size-3.5 text-slate-400 transition-transform duration-200 ${
                    activeDropdown === "kapabilitas" ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>

              {/* Moka-Style Large Mega Dropdown Card */}
              {activeDropdown === "kapabilitas" && (
                <div
                  id="nav-kapabilitas"
                  className="absolute top-full left-0 w-88 p-4 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Modul Operasional Utama
                  </div>
                  {capabilities.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={idx}
                        href={item.href}
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-start gap-3.5 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <span className="size-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                          <Icon className="size-4" />
                        </span>
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-500 leading-tight">
                            {item.desc}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Dropdown Solusi Bisnis */}
            <div
              className="relative h-full flex items-center"
              onMouseEnter={() => setActiveDropdown("solusi")}
            >
              <button
                type="button"
                aria-expanded={activeDropdown === "solusi"}
                aria-controls="nav-solusi"
                onClick={() => setActiveDropdown(activeDropdown === "solusi" ? null : "solusi")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors cursor-pointer ${
                  activeDropdown === "solusi"
                    ? "text-primary font-bold bg-slate-50"
                    : "text-slate-700 hover:text-primary hover:bg-slate-50"
                }`}
              >
                <span>Solusi Industri</span>
                <ChevronDown
                  className={`size-3.5 text-slate-400 transition-transform duration-200 ${
                    activeDropdown === "solusi" ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>

              {/* Moka-Style Large Mega Dropdown Card */}
              {activeDropdown === "solusi" && (
                <div
                  id="nav-solusi"
                  className="absolute top-full left-0 w-88 p-4 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Sektor Industri
                  </div>
                  {solutions.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={idx}
                        href={item.href}
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-start gap-3.5 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <span className="size-8 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 shrink-0 group-hover:scale-105 transition-transform">
                          <Icon className="size-4" />
                        </span>
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-500 leading-tight">
                            {item.desc}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Direct Links */}
            <Link
              href="/#identitas-brand"
              className="px-3.5 py-2 rounded-lg hover:text-primary hover:bg-slate-50 transition-colors text-slate-700"
            >
              Desain Brand
            </Link>
            <Link
              href="/harga"
              className="px-3.5 py-2 rounded-lg hover:text-primary hover:bg-slate-50 transition-colors text-slate-700"
            >
              Harga
            </Link>
            <Link
              href="/hardware"
              className="px-3.5 py-2 rounded-lg hover:text-primary hover:bg-slate-50 transition-colors text-slate-700"
            >
              Hardware
            </Link>
            <Link
              href="/#faq"
              className="px-3.5 py-2 rounded-lg hover:text-primary hover:bg-slate-50 transition-colors text-slate-700"
            >
              FAQ
            </Link>
          </nav>

          {/* Right Action: Clean Login + Rounded Solid CTA */}
          <div className="hidden xl:flex items-center gap-3 shrink-0">
            {dashboardPath ? (
              <Button
                asChild
                className="font-bold text-sm h-10 px-5 rounded-full bg-primary hover:bg-primary/90 text-white shadow-xs"
              >
                <Link href={dashboardPath} className="flex items-center gap-1.5">
                  <span>Dashboard</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-primary transition-colors px-3 py-1.5"
                >
                  Masuk
                </Link>
                <Button
                  asChild
                  className="font-bold text-sm h-10 px-6 rounded-full bg-primary hover:bg-primary/90 text-white shadow-xs transition-transform active:scale-95"
                >
                  <Link href="/register">Coba Gratis</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex xl:hidden items-center gap-1.5 sm:gap-3 shrink-0">
            {dashboardPath ? (
              <Button asChild size="sm" className="h-8 sm:h-9 text-xs font-bold px-2.5 sm:px-3 rounded-full bg-primary text-white">
                <Link href={dashboardPath}>Dashboard</Link>
              </Button>
            ) : (
              <Button asChild size="sm" className="hidden min-[380px]:inline-flex h-8 sm:h-9 text-xs font-bold px-3 sm:px-4 rounded-full bg-primary text-white">
                <Link href="/register">Coba Gratis</Link>
              </Button>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle Menu"
              className="p-1.5 sm:p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden mt-2 max-w-6xl mx-auto luxury-glass-card rounded-2xl p-4 space-y-3 shadow-xl">
          <nav className="flex flex-col space-y-1 text-sm font-semibold text-slate-700">
            <Link
              href="/demo"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-primary bg-orange-50/80 font-bold hover:bg-orange-100 transition-colors"
            >
              Request Demo & Konsultasi
            </Link>
            <Link
              href="/fitur"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-primary transition-colors"
            >
              Fitur & Kapabilitas
            </Link>
            <Link
              href="/solusi"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-primary transition-colors"
            >
              Solusi Industri
            </Link>
            <Link
              href="/hardware"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-primary transition-colors"
            >
              Panduan Hardware
            </Link>
            <Link
              href="/referral"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-primary transition-colors"
            >
              Program Mitra Referral
            </Link>
            <Link
              href="/harga"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-primary transition-colors"
            >
              Paket Langganan
            </Link>
            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-primary transition-colors"
            >
              Blog & Edukasi
            </Link>
            <Link
              href="/#pajak-pembukuan"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-primary transition-colors"
            >
              Pajak & Pembukuan
            </Link>
            <Link
              href="/#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-primary transition-colors"
            >
              FAQ
            </Link>
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
