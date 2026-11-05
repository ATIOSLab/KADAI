"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

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
    q: "Perangkat hardware apa saja yang kompatibel dengan KADAI?",
    a: "KADAI berjalan responsif di peramban web modern (Google Chrome, Safari, Edge) di PC Windows, Mac, iPad, dan tablet Android. KADAI mendukung printer thermal kasir 58mm & 80mm (USB, Bluetooth, Jaringan), barcode scanner USB/Bluetooth, dan laci kasir (cash drawer).",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 sm:py-28 px-4 sm:px-6 bg-slate-50/70 border-b border-slate-200/80 w-full">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
            <span>Tanya Jawab (FAQ)</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed text-balance">
            Informasi lengkap seputar fitur, implementasi, dan operasional platform KADAI.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl glass-surface-card border border-white/90 overflow-hidden shadow-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 hover:text-primary transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-fade-in">
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
