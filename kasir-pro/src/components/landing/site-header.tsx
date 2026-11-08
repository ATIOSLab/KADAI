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
import { KadaiLockup } from "@/components/shared/kadai-logo";

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
      href: "/solusi/fnb",
      icon: UtensilsCrossed,
    },
    {
      title: "Toko Ritel & Minimarket",
      desc: "Scan barcode produk kilat, kontrol varian SKU, dan batas minimum stok.",
      href: "/solusi/ritel",
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
          {/* Brand Logo (Official Horizontal Lockup from /png/lockup/) */}
          <Link
            href="/"
            className="flex items-center shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg py-1"
          >
            <KadaiLockup
              variant="on-light"
              height={48}
              priority
              className="h-10 sm:h-11 md:h-12 w-auto group-hover:opacity-90 transition-opacity"
            />
          </Link>

          {/* Center Navigation Links (Clean Flat Typography - Focused & Uncluttered) */}
          <nav
            aria-label="Navigasi Utama"
            className="hidden lg:flex items-center gap-1.5 text-sm font-semibold text-slate-600 relative h-full"
          >
            <Link
              href="/fitur"
              className="px-3.5 py-2 rounded-lg hover:text-primary hover:bg-slate-50 transition-colors text-slate-700"
            >
              Fitur
            </Link>
            <Link
              href="/solusi"
              className="px-3.5 py-2 rounded-lg hover:text-primary hover:bg-slate-50 transition-colors text-slate-700"
            >
              Solusi
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
              href="/blog"
              className="px-3.5 py-2 rounded-lg hover:text-primary hover:bg-slate-50 transition-colors text-slate-700"
            >
              Blog
            </Link>
            <Link
              href="/#faq"
              className="px-3.5 py-2 rounded-lg hover:text-primary hover:bg-slate-50 transition-colors text-slate-700"
            >
              FAQ
            </Link>
          </nav>

          {/* Right Action: Clean Login + Rounded Solid CTA */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {dashboardPath ? (
              <Button
                asChild
                className="font-bold text-sm h-10 px-5 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-xs"
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
                  className="font-bold text-sm h-10 px-6 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-xs transition-transform active:scale-95"
                >
                  <Link href="/register">Coba Gratis</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-1.5 sm:gap-3 shrink-0">
            {dashboardPath ? (
              <Button asChild size="sm" className="h-8 sm:h-9 text-xs font-bold px-2.5 sm:px-3 rounded-lg bg-primary text-white">
                <Link href={dashboardPath}>Dashboard</Link>
              </Button>
            ) : (
              <Button asChild size="sm" className="hidden min-[380px]:inline-flex h-8 sm:h-9 text-xs font-bold px-3 sm:px-4 rounded-lg bg-primary text-white">
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
        <div className="lg:hidden mt-2 max-w-6xl mx-auto bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-xl">
          <nav className="flex flex-col space-y-1 text-sm font-semibold text-slate-700">
            <Link
              href="/fitur"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-primary transition-colors flex items-center justify-between"
            >
              <span>Fitur & Modul POS</span>
              <span className="text-[10px] font-normal text-slate-400">Kasir, KDS, Stok</span>
            </Link>
            <Link
              href="/solusi"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-primary transition-colors flex items-center justify-between"
            >
              <span>Solusi Bisnis</span>
              <span className="text-[10px] font-mono text-primary font-bold">F&B & Ritel</span>
            </Link>
            <Link
              href="/harga"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-primary transition-colors"
            >
              Paket Harga
            </Link>
            <Link
              href="/hardware"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-primary transition-colors"
            >
              Hardware
            </Link>
            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-primary transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-primary transition-colors"
            >
              FAQ
            </Link>
          </nav>
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Button asChild className="w-full text-xs font-bold h-10 rounded-xl bg-primary text-white shadow-xs">
              <Link
                href={dashboardPath ?? "/register"}
                onClick={() => setMobileMenuOpen(false)}
              >
                {dashboardPath ? "Buka Dashboard" : "Coba Gratis 14 Hari"}
              </Link>
            </Button>
            {!dashboardPath && (
              <Button asChild variant="outline" className="w-full text-xs font-semibold h-10 rounded-xl bg-white border-slate-200">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  Masuk ke Akun
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
