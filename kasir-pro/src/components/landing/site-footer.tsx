"use client";

import Link from "next/link";
import { Store } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs py-12 px-4 sm:px-6 border-t border-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pb-8 border-b border-slate-900 text-left">
          {/* Col 1 */}
          <div className="space-y-3">
            <span className="font-bold text-white text-xs uppercase tracking-wider block">
              Kapabilitas
            </span>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/fitur#kasir-pos" className="hover:text-white transition-colors">Kasir POS Kilat</Link></li>
              <li><Link href="/fitur#inventori-fifo" className="hover:text-white transition-colors">Inventori FIFO PSAK 14</Link></li>
              <li><Link href="/fitur#dapur-kds" className="hover:text-white transition-colors">Kitchen Display System</Link></li>
              <li><Link href="/fitur#resep-bom" className="hover:text-white transition-colors">Resep Produksi (BOM)</Link></li>
              <li><Link href="/fitur#pembukuan-pajak" className="hover:text-white transition-colors">Pajak Daerah & SAK EMKM</Link></li>
            </ul>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <span className="font-bold text-white text-xs uppercase tracking-wider block">
              Solusi Industri
            </span>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/solusi#kuliner-fnb" className="hover:text-white transition-colors">Kafe & Restoran (F&B)</Link></li>
              <li><Link href="/solusi#ritel-minimarket" className="hover:text-white transition-colors">Toko Ritel & Minimarket</Link></li>
              <li><Link href="/solusi#dapur-pusat-gudang" className="hover:text-white transition-colors">Dapur Pusat & Gudang</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <span className="font-bold text-white text-xs uppercase tracking-wider block">
              Perusahaan & Harga
            </span>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/demo" className="hover:text-white transition-colors text-primary font-bold">Request Demo KADAI</Link></li>
              <li><Link href="/referral" className="hover:text-white transition-colors">Program Mitra Referral</Link></li>
              <li><Link href="/hardware" className="hover:text-white transition-colors">Panduan Hardware</Link></li>
              <li><Link href="/harga" className="hover:text-white transition-colors">Paket Langganan</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Pusat Edukasi & Blog</Link></li>
              <li><Link href="/#faq" className="hover:text-white transition-colors">Tanya Jawab (FAQ)</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Portal Masuk Kasir</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <span className="font-bold text-white text-xs uppercase tracking-wider block">
              Kepatuhan & Regulasi
            </span>
            <ul className="space-y-2 text-slate-400 text-[11px] leading-relaxed">
              <li>Pajak Restoran PB1 10% (UU HKPD)</li>
              <li>PPh Final UMKM 0.5% (PP 55/2022)</li>
              <li>Standar Persediaan PSAK 14 / IAS 2</li>
              <li>Laporan Keuangan SAK EMKM</li>
              <li>
                <Link href="/kebijakan-privasi" className="hover:text-white transition-colors text-primary font-semibold">
                  Kebijakan Privasi (UU PDP)
                </Link>
              </li>
              <li>
                <Link href="/syarat-ketentuan" className="hover:text-white transition-colors text-primary font-semibold">
                  Syarat & Ketentuan Layanan
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left pt-2">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-slate-900 p-0.5">
              <svg viewBox="0 0 100 100" fill="none" className="size-full">
                <rect x="18" y="14" width="16" height="72" rx="8" fill="#FFFFFF" />
                <path d="M38 66 C 46 66, 68 62, 78 30" stroke="#EA580C" strokeWidth="14" strokeLinecap="round" />
                <path d="M48 52 L 77 78" stroke="#EA580C" strokeWidth="14" strokeLinecap="round" />
                <circle cx="82" cy="18" r="8" fill="#F59E0B" />
              </svg>
            </span>
            <span className="font-bold text-slate-200">
              KADAI
            </span>
            <span>•</span>
            <span className="tracking-wide">SISTEM OPERASI BISNIS</span>
          </div>

          <div className="text-slate-500 text-[11px]">
            Dikembangkan secara berdaulat oleh <strong className="text-slate-400">ATIOSLab</strong> untuk kemajuan ekonomi nasional.
          </div>
        </div>
      </div>
    </footer>
  );
}
