"use client";

import Link from "next/link";
import { Store } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-16 px-4 sm:px-6 border-t border-slate-800 text-xs">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* 4 Columns Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Info Column (Col 2 on md) */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-white text-slate-950 shadow-xs">
                <Store className="size-4 text-primary" />
              </span>
              <div>
                <span className="text-lg font-black tracking-tight text-white leading-none block">
                  KADAI<span className="text-primary font-black">.</span>
                </span>
                <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase block mt-0.5">
                  Enterprise POS & ERP
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Sistem operasi bisnis terpadu untuk pengusaha Indonesia: kasir POS kilat, inventori multi-batch FIFO, resep BOM, layar dapur KDS, dan kepatuhan akuntansi SAK EMKM.
            </p>

            <div className="text-[11px] font-mono text-slate-500">
              Platform Operasi Bisnis Terpadu Indonesia
            </div>
          </div>

          {/* Col 1: Produk */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Produk
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#produk" className="hover:text-white transition-colors">
                  POS & Kasir Kilat
                </a>
              </li>
              <li>
                <a href="#produk" className="hover:text-white transition-colors">
                  Inventori Batch FIFO
                </a>
              </li>
              <li>
                <a href="#produk" className="hover:text-white transition-colors">
                  Dapur Pusat & BOM
                </a>
              </li>
              <li>
                <a href="#produk" className="hover:text-white transition-colors">
                  Multi-Cabang & Transfer
                </a>
              </li>
            </ul>
          </div>

          {/* Col 2: Solusi */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Solusi
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#solusi-industri" className="hover:text-white transition-colors">
                  Kuliner & F&B
                </a>
              </li>
              <li>
                <a href="#solusi-industri" className="hover:text-white transition-colors">
                  Ritel & Minimarket
                </a>
              </li>
              <li>
                <a href="#solusi-industri" className="hover:text-white transition-colors">
                  Layanan Jasa
                </a>
              </li>
              <li>
                <a href="#pajak-pembukuan" className="hover:text-white transition-colors">
                  Pajak PB1 & SAK EMKM
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Akses & Info */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Akses & Akun
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Masuk Kasir / Toko
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Mulai Uji Coba Gratis
                </Link>
              </li>
              <li>
                <a href="#harga" className="hover:text-white transition-colors">
                  Paket Langganan
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Tanya Jawab (FAQ)
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Attribution Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-mono">
          <p>© 2026 KADAI Enterprise. Hak cipta dilindungi undang-undang.</p>
          <p>
            Dikembangkan secara berdaulat oleh <strong className="text-slate-300">ATIOSLab</strong>.
          </p>
        </div>
      </div>
    </footer>
  );
}
