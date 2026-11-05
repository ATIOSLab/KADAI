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
      href: "#kapabilitas",
      icon: ShoppingBag,
    },
    {
      title: "Inventori Multi-Batch FIFO",
      desc: "Penilaian stok akurat berstandar PSAK 14 dan radar peringatan tanggal kadaluwarsa.",
      href: "#kapabilitas",
      icon: Layers,
    },
    {
      title: "Layar Dapur & Bar (KDS)",
      desc: "Routing pesanan otomatis ke dapur dengan notifikasi audio suara lonceng.",
      href: "#kapabilitas",
      icon: ChefHat,
    },
    {
      title: "Pajak & Pembukuan",
      desc: "Kelola pengaturan pajak dan laporan pembukuan usaha.",
      href: "#pajak-pembukuan",
      icon: Receipt,
    },
  ];

  const solutions = [
    {
      title: "Kafe & Restoran (F&B)",
      desc: "Manajemen meja, pesanan split-bill, dan pemotongan resep bahan baku (BOM).",
      href: "#solusi-industri",
      icon: UtensilsCrossed,
    },
    {
      title: "Toko Ritel & Minimarket",
      desc: "Scan barcode produk kilat, kontrol varian SKU, dan batas minimum stok.",
      href: "#solusi-industri",
      icon: Store,
    },
    {
      title: "Dapur Pusat & Multi-Gudang",
      desc: "Penerbitan surat jalan antar-cabang dan konsolidasi laporan grup owner.",
      href: "#solusi-industri",
      icon: Warehouse,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/70 bg-white/75 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left Modular Island: Brand Squircle */}
        <Link
          href="/"
          className="px-1 py-1 rounded-xl flex items-center gap-2.5 shrink-0 group hover:border-slate-300 transition-all"
        >
          <span className="flex size-8 items-center justify-center rounded-xl bg-slate-950 text-white shadow-2xs group-hover:scale-105 transition-transform">
            <Store className="size-4 text-primary" />
          </span>
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-bold tracking-tight text-slate-950 leading-none">
                KADAI
              </span>
              <span className="text-primary font-bold text-xl leading-none">.</span>
            </div>
            <span className="text-[9px] font-semibold text-slate-500 block leading-tight">
              Sistem Operasi Bisnis Indonesia
            </span>
          </div>
        </Link>

        {/* Center Modular Island: Minimalist Transparent Glass Menu with Mega Dropdown */}
        <nav
          aria-label="Navigasi Utama"
          className="hidden xl:flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-semibold text-slate-600 relative"
          onMouseLeave={() => setActiveDropdown(null)}
          onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setActiveDropdown(null); }}
          onKeyDown={(event) => { if (event.key === "Escape") { event.currentTarget.querySelector<HTMLButtonElement>('button[aria-expanded="true"]')?.focus(); setActiveDropdown(null); } }}
        >
          {/* 1. Dropdown Kapabilitas */}
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown("kapabilitas")}
                      >
                        <button
                          type="button"
                          aria-expanded={activeDropdown === "kapabilitas"}
                          aria-controls="nav-kapabilitas"
                          onClick={() => setActiveDropdown(activeDropdown === "kapabilitas" ? null : "kapabilitas")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all font-medium whitespace-nowrap ${
                activeDropdown === "kapabilitas"
                  ? "text-slate-950 bg-slate-100/90 font-bold"
                  : "text-slate-700 hover:text-slate-950 hover:bg-slate-100/80"
              }`}
            >
              <span>Fitur & Kapabilitas</span>
              <ChevronDown
                className={`size-3 text-slate-500 transition-transform duration-200 ${
                  activeDropdown === "kapabilitas" ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Glass Dropdown Panel: Kapabilitas */}
            {activeDropdown === "kapabilitas" && (
              <div id="nav-kapabilitas" className="absolute top-full left-0 w-80 p-3 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl space-y-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Modul Utama KADAI
                </div>
                {capabilities.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={idx}
                      href={item.href}
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <span className="size-8 rounded-lg bg-orange-50 border border-orange-200/60 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
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
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Dropdown Solusi Bisnis */}
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown("solusi")}
                      >
                        <button
                          type="button"
                          aria-expanded={activeDropdown === "solusi"}
                          aria-controls="nav-solusi"
                          onClick={() => setActiveDropdown(activeDropdown === "solusi" ? null : "solusi")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all font-medium whitespace-nowrap ${
                activeDropdown === "solusi"
                  ? "text-slate-950 bg-slate-100/90 font-bold"
                  : "text-slate-700 hover:text-slate-950 hover:bg-slate-100/80"
              }`}
            >
              <span>Solusi Industri</span>
              <ChevronDown
                className={`size-3 text-slate-500 transition-transform duration-200 ${
                  activeDropdown === "solusi" ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Glass Dropdown Panel: Solusi Industri */}
            {activeDropdown === "solusi" && (
              <div id="nav-solusi" className="absolute top-full left-0 w-80 p-3 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl space-y-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Sektor Industri
                </div>
                {solutions.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={idx}
                      href={item.href}
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
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
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Tautan Tunggal Tanpa Dropdown (Harga & FAQ) */}
          <a
            href="#pajak-pembukuan"
            className="px-3.5 py-1.5 rounded-full hover:text-slate-950 hover:bg-slate-100/80 transition-all font-medium text-slate-700 whitespace-nowrap"
          >
            Pajak & Pembukuan
          </a>
          <a
            href="#harga"
            className="px-3.5 py-1.5 rounded-full hover:text-slate-950 hover:bg-slate-100/80 transition-all font-medium text-slate-700 whitespace-nowrap"
          >
            Paket Langganan
          </a>
          <a
            href="#faq"
            className="px-3.5 py-1.5 rounded-full hover:text-slate-950 hover:bg-slate-100/80 transition-all font-medium text-slate-700 whitespace-nowrap"
          >
            FAQ
          </a>
        </nav>

        {/* Right Modular Island: Auth & CTA Pill */}
        <div className="hidden xl:flex items-center gap-2 shrink-0 p-1.5 rounded-2xl">
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
        <div className="flex xl:hidden items-center gap-2">
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
        <div className="xl:hidden mt-2 max-w-6xl mx-auto luxury-glass-card rounded-2xl p-4 space-y-3 shadow-xl">
          <nav className="flex flex-col space-y-1 text-sm font-semibold text-slate-700">
            <a
              href="#kapabilitas"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-primary transition-colors"
            >
              Fitur & Kapabilitas
            </a>
            <a
              href="#solusi-industri"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-primary transition-colors"
            >
              Solusi Industri
            </a>
            <a
              href="#pajak-pembukuan"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-primary transition-colors"
            >
              Pajak & Pembukuan
            </a>
            <a
              href="#harga"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-primary transition-colors"
            >
              Paket Langganan
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-primary transition-colors"
            >
              FAQ
            </a>
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
