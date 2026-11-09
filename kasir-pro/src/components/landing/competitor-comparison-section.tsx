"use client";

import Link from "next/link";
import { Check, ArrowRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeIn } from "./fade-in";

const COMPARISON_ROWS = [
  {
    feature: "Biaya Langganan Bulanan",
    traditional: "Mulai Rp 299.000 / bln per outlet",
    kadai: "Mulai Rp 0 (Gratis) s/d Rp 99.000 / bln",
    highlight: true,
  },
  {
    feature: "Sistem Kas Modal & Kas Belanja (Petty Cash)",
    traditional: "Tercampur dalam satu laci kas kasir",
    kadai: "Multi-Kantong: Kas Kasir vs Kas Belanja Dapur",
    highlight: true,
  },
  {
    feature: "Migrasi & Impor Data Kasir Lama",
    traditional: "Manual input atau format spreadsheet kaku",
    kadai: "Smart Batch Import: Unggah CSV/Excel apapun Gratis",
    highlight: true,
  },
  {
    feature: "Resep Bahan Pokok (Bill of Materials)",
    traditional: "Tersedia di paket add-on berbayar mahal",
    kadai: "Termasuk di Business Pro dengan potong stok otomatis",
    highlight: false,
  },
  {
    feature: "Pajak Daerah PB1 (10%) & PPh Final 0.5%",
    traditional: "Kalkulasi pajak standar tanpa pemisahan Non-PKP",
    kadai: "Otomatis membedakan Non-PKP (0%) dan PKP (PB1/PPN)",
    highlight: true,
  },
  {
    feature: "Hardware Bebas (Tanpa Sewa Paksa)",
    traditional: "Dianjurkan bundel hardware resmi vendor",
    kadai: "100% Bebas: Printer ESC/POS 58/80mm & Scanner apapun",
    highlight: false,
  },
];

export function CompetitorComparisonSection() {
  return (
    <section className="py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 w-full border-t border-slate-200/80 bg-white relative overflow-hidden">
      {/* Decorative Warm Backlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-orange-500/5 blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-12 relative z-10">
        {/* Section Header */}
        <FadeIn className="text-center max-w-3xl mx-auto space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary flex items-center justify-center gap-1.5">
            <ShieldCheck className="size-3.5" />
            <span>Perbandingan Transparan</span>
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-[1.15]">
            Kenapa Pelaku Usaha Memilih Beralih ke KADAI?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed text-balance">
            Bandingkan langsung nilai ekonomi dan keleluasaan operasional yang Anda dapatkan bersama KADAI dibanding sistem kasir konvensional.
          </p>
        </FadeIn>

        {/* Comparison Table Card */}
        <FadeIn className="rounded-[24px] border border-slate-200/90 bg-white shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="py-4 px-5 sm:px-6 font-bold text-slate-900 w-2/5">
                    Fitur & Kapabilitas Sistem
                  </th>
                  <th className="py-4 px-4 sm:px-6 font-bold text-slate-500 w-3/10 text-center">
                    Aplikasi Kasir Konvensional
                  </th>
                  <th className="py-4 px-4 sm:px-6 font-extrabold text-primary w-3/10 text-center bg-orange-500/5 border-l border-orange-200/60">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-sm sm:text-base">KADAI</span>
                      <Badge className="bg-primary text-white text-[9px] px-1.5 py-0 font-bold uppercase">
                        Solusi Utuh
                      </Badge>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr 
                    key={idx}
                    className={`transition-colors hover:bg-slate-50/50 ${
                      row.highlight ? "bg-orange-500/[0.015]" : ""
                    }`}
                  >
                    <td className="py-4 px-5 sm:px-6 font-semibold text-slate-900">
                      {row.feature}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-slate-500 text-center text-xs leading-relaxed">
                      {row.traditional}
                    </td>
                    <td className="py-4 px-4 sm:px-6 font-bold text-slate-950 text-center text-xs leading-relaxed bg-orange-500/5 border-l border-orange-200/60">
                      <div className="flex items-center justify-center gap-1 text-slate-900">
                        <Check className="size-4 text-emerald-600 shrink-0" />
                        <span>{row.kadai}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer Banner */}
          <div className="p-4 sm:p-6 bg-slate-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-xs sm:text-sm text-slate-100">
                Sudah punya data di kasir sebelumnya?
              </p>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Unggah berkas Excel/CSV lama Anda, sistem kami migrasikan seluruh produk ke katalog toko dalam sekejap.
              </p>
            </div>
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-9 px-5 rounded-lg shrink-0 shadow-sm"
            >
              <Link href="/register" className="flex items-center gap-1.5">
                <span>Mulai Migrasi Bebas Biaya</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
