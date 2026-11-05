"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FAQItem {
  q: string;
  a: string;
}

const FAQS: FAQItem[] = [
  {
    q: "Apa itu KADAI dan apa perbedaannya dengan aplikasi kasir konvensional?",
    a: "KADAI adalah platform operasi bisnis terpadu yang menggabungkan kasir POS kilat, inventori multi-batch FIFO, resep Bill of Materials (BOM), Kitchen Display System (KDS), hingga pembukuan standar SAK EMKM dalam satu sistem terintegrasi. KADAI tidak hanya mencatat transaksi penjualan, tetapi juga mengotomatisasi pemotongan stok bahan mentah per porsi dan rekonsiliasi kas shift harian.",
  },
  {
    q: "Model bisnis apa saja yang dapat menggunakan KADAI?",
    a: "KADAI dirancang fleksibel untuk tiga vertikal utama: (1) Kuliner & F&B (kafe, restoran dine-in, cloud kitchen, bakery), (2) Ritel & Perdagangan (minimarket, apotek, butik, toko kelontong), dan (3) Layanan Jasa (barbershop, salon, bengkel, laundry).",
  },
  {
    q: "Apakah KADAI mendukung pengelolaan banyak cabang dan transfer stok?",
    a: "Ya. KADAI mendukung topologi Hub-and-Spoke, di mana Gudang atau Dapur Pusat (HQ) dapat mendistribusikan bahan baku ke cabang-cabang satelit menggunakan Surat Jalan Digital otomatis. Mutasi stok asal terpotong seketika dan cabang tujuan menerima stok melalui konfirmasi 1-klik.",
  },
  {
    q: "Bagaimana cara kerja perhitungan HPP resep makanan/minuman (BOM)?",
    a: "Setiap menu dapat memiliki formula Bill of Materials (BOM) berupa komposisi bahan mentah (contoh: 18g biji kopi + 120ml susu). Saat kasir menjual menu tersebut, stok bahan baku otomatis terdebit dari batch pembelian tertua (FIFO), dan nilai HPP per porsi dihitung presisi mengikuti standar PSAK 14 / SAK EMKM.",
  },
  {
    q: "Bagaimana KADAI mengelola Pajak Restoran (PB1) dan PPN 11%?",
    a: "Anda dapat memilih skema perpajakan per outlet: Pajak Barang dan Jasa Tertentu (PB1 / PBJT 10%) untuk usaha restoran/kafe sesuai Perda setempat, atau PPN 11% untuk perdagangan ritel. KADAI juga menyusun buku peredaran bruto untuk mempermudah perhitungan setoran PPh Final UMKM 0.5% (PP 55/2022).",
  },
  {
    q: "Apakah tersedia masa uji coba sebelum berlangganan berbayar?",
    a: "Ya, Anda dapat memulai dengan paket Starter gratis tanpa biaya bulanan, atau mencoba fitur lengkap KADAI untuk merasakan kemudahan operasional multi-cabang secara langsung.",
  },
  {
    q: "Perangkat keras (hardware) apa saja yang kompatibel dengan KADAI?",
    a: "KADAI adalah software-agnostic (tidak mengunci pengguna pada merek tertentu). KADAI dapat diakses melalui laptop, PC Windows, Mac, iPad, tablet, atau smartphone Android. KADAI fleksibel terhubung dengan berbagai printer kasir thermal standar (58mm/80mm USB, Bluetooth, LAN) dan barcode scanner yang sudah Anda miliki tanpa perlu membeli paket hardware khusus.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50/70 border-t border-slate-200/80 w-full">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge
            variant="outline"
            className="text-xs font-semibold text-primary uppercase tracking-wider px-3.5 py-1 rounded-full border-primary/20 bg-orange-50/60"
          >
            Tanya Jawab (FAQ)
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-950">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed text-balance">
            Jawaban lugas dan transparan seputar fitur, kepatuhan, dan integrasi operasional KADAI.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-[20px] luxury-glass-card overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-slate-900 hover:text-primary transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="size-4 text-primary shrink-0 opacity-70" />
                    <span>{faq.q}</span>
                  </span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-fade-in pl-11">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
