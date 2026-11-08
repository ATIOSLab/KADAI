"use client";

import Link from "next/link";
import { Store } from "lucide-react";
import { KadaiLockup } from "@/components/shared/kadai-logo";

export function SiteFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs py-12 px-4 sm:px-6 border-t border-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-8 border-b border-slate-900 text-left">
          {/* Col 1 */}
          <div className="space-y-3">
            <span className="font-bold text-white text-xs uppercase tracking-wider block">
              Produk & Modul
            </span>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/fitur#kasir-pos" className="hover:text-white transition-colors">Kasir POS Kilat</Link></li>
              <li><Link href="/fitur#inventori-fifo" className="hover:text-white transition-colors">Inventori FIFO & Expired</Link></li>
              <li><Link href="/fitur#dapur-kds" className="hover:text-white transition-colors">Kitchen Display System</Link></li>
              <li><Link href="/fitur#pembukuan-pajak" className="hover:text-white transition-colors">Pajak Restoran & Akuntansi</Link></li>
            </ul>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <span className="font-bold text-white text-xs uppercase tracking-wider block">
              Solusi Industri
            </span>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/solusi/fnb" className="hover:text-white transition-colors">Restoran & Kafe (F&B)</Link></li>
              <li><Link href="/solusi/ritel" className="hover:text-white transition-colors">Toko Ritel & Grosir</Link></li>
              <li><Link href="/solusi#dapur-pusat-gudang" className="hover:text-white transition-colors">Dapur Pusat & Multi-Gudang</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <span className="font-bold text-white text-xs uppercase tracking-wider block">
              Ekosistem
            </span>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/harga" className="hover:text-white transition-colors">Paket Langganan</Link></li>
              <li><Link href="/hardware" className="hover:text-white transition-colors">Panduan Hardware</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog Edukasi</Link></li>
              <li><Link href="/referral" className="hover:text-white transition-colors">Mitra Referral</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <span className="font-bold text-white text-xs uppercase tracking-wider block">
              Akses & Legalitas
            </span>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/demo" className="hover:text-white transition-colors text-primary font-bold">Request Demo</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Portal Masuk</Link></li>
              <li><Link href="/kebijakan-privasi" className="hover:text-white transition-colors">Kebijakan Privasi</Link></li>
              <li><Link href="/syarat-ketentuan" className="hover:text-white transition-colors">Syarat & Ketentuan</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left pt-2 pb-16 sm:pb-0">
          <div className="flex items-center gap-3">
            <KadaiLockup variant="on-dark" height={28} className="h-6 sm:h-7 w-auto" />
            <span className="text-slate-700 hidden sm:inline">•</span>
            <span className="tracking-[0.16em] uppercase text-[10px] sm:text-xs font-bold text-slate-400 hidden sm:inline">
              SISTEM OPERASI BISNIS
            </span>
          </div>

          <div className="text-slate-500 text-[11px] flex flex-col sm:flex-row items-center gap-1 sm:gap-2 sm:pr-44">
            <span>
              KADAI adalah produk teknologi di bawah naungan{" "}
              <a
                href="https://newasiatech.co.id"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 font-semibold hover:text-primary transition-colors hover:underline"
              >
                NEW ASIA TECH
              </a>
              .
            </span>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <span>Hak Cipta &copy; 2026. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
