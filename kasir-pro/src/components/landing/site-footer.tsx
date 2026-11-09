"use client";

import Link from "next/link";
import { KadaiLockup } from "@/components/shared/kadai-logo";

export function SiteFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs py-12 px-4 sm:px-6 border-t border-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12 pb-8 border-b border-slate-900 text-left">
          {/* Brand Info (Span 2 cols on md+) */}
          <div className="md:col-span-2 space-y-3">
            <KadaiLockup variant="on-dark" height={32} className="h-7 w-auto" />
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Satu sistem operasi bisnis terpadu untuk gerai kasir, dapur KDS, manajemen persediaan bahan baku, dan pembukuan usaha.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
              <span className="size-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span>Sistem Operasional Aktif • Indonesia (UTC+7)</span>
            </div>
          </div>

          {/* Col 1: Produk & Hardware */}
          <div className="space-y-3">
            <span className="font-bold text-white text-xs uppercase tracking-wider block">
              Produk
            </span>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/fitur" className="hover:text-white transition-colors">Semua Fitur</Link></li>
              <li><Link href="/fitur#kasir-pos" className="hover:text-white transition-colors">Kasir POS Kilat</Link></li>
              <li><Link href="/fitur#dapur-kds" className="hover:text-white transition-colors">Layar Dapur KDS</Link></li>
              <li><Link href="/hardware" className="hover:text-white transition-colors">Panduan Hardware</Link></li>
            </ul>
          </div>

          {/* Col 2: Solusi & Bisnis */}
          <div className="space-y-3">
            <span className="font-bold text-white text-xs uppercase tracking-wider block">
              Solusi & Paket
            </span>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/solusi/fnb" className="hover:text-white transition-colors">Restoran & Kafe (F&B)</Link></li>
              <li><Link href="/solusi/ritel" className="hover:text-white transition-colors">Toko Ritel & Grosir</Link></li>
              <li><Link href="/harga" className="hover:text-white transition-colors">Paket Langganan</Link></li>
              <li><Link href="/demo" className="hover:text-white transition-colors text-primary font-bold">Request Demo</Link></li>
            </ul>
          </div>

          {/* Col 3: Ekosistem & Legal */}
          <div className="space-y-3">
            <span className="font-bold text-white text-xs uppercase tracking-wider block">
              Informasi
            </span>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog Edukasi</Link></li>
              <li><Link href="/referral" className="hover:text-white transition-colors">Mitra Referral</Link></li>
              <li><Link href="/kebijakan-privasi" className="hover:text-white transition-colors">Kebijakan Privasi</Link></li>
              <li><Link href="/syarat-ketentuan" className="hover:text-white transition-colors">Syarat & Ketentuan</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left pt-2 pb-16 sm:pb-0 text-slate-500 text-[11px]">
          <div>
            &copy; 2026 KADAI by{" "}
            <a
              href="https://newasiatech.co.id"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 font-semibold hover:text-white transition-colors hover:underline"
            >
              NEW ASIA TECH
            </a>
            . Hak Cipta Dilindungi.
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/login" className="hover:text-white transition-colors">
              Portal Masuk
            </Link>
            <span>•</span>
            <Link href="/harga" className="hover:text-white transition-colors">
              Biaya Layanan
            </Link>
            <span>•</span>
            <Link href="/#faq" className="hover:text-white transition-colors">
              Tanya Jawab
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
