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
    q: "Apa itu KADAI dan apa bedanya dengan kasir biasa?",
    a: "Aplikasi kasir biasa umumnya hanya mencatat transaksi bayar. KADAI menghubungkan meja kasir, dapur, dan stok gudang: saat pesanan dibuat, layar dapur langsung membunyikan lonceng pesanan, stok bahan baku terpotong otomatis, dan rekap laba kotor hari itu langsung dihitung tanpa perlu rekap nota manual.",
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
    q: "Bagaimana cara kerja hitungan resep makanan atau minuman?",
    a: "Anda tinggal masukkan takaran bahan per menu (misalnya: 18 gram kopi bubuk + 120 ml susu cair). Setiap kali menu itu terjual di kasir, stok kopi dan susu di gudang otomatis berkurang sesuai takaran, dan modal harga pokok per porsi langsung terhitung otomatis.",
  },
  {
    q: "Apakah KADAI bisa mengurus Pajak Restoran (PB1) dan PPN?",
    a: "Bisa. Anda cukup mengaktifkan opsi pajak di menu pengaturan. Untuk restoran atau kafe, sistem otomatis menghitung Pajak Restoran (PB1 10%) di struk. Untuk toko ritel, bisa diatur PPN 11%. Rekap omzet bulanan juga sudah rapi jika Anda ingin menghitung PPh final UMKM 0,5%.",
  },
  {
    q: "Apakah tersedia masa uji coba sebelum berlangganan berbayar?",
    a: "Ya, Anda dapat memulai dengan paket Starter gratis tanpa biaya bulanan, atau mencoba fitur lengkap KADAI untuk merasakan kemudahan operasional multi-cabang secara langsung.",
  },
  {
    q: "Alat apa saja yang bisa dipakai untuk menjalankan KADAI?",
    a: "KADAI bisa dibuka di laptop, komputer Windows, Mac, iPad, tablet, maupun HP Android biasa tanpa perlu beli alat baru. Printer struk kasir yang sudah Anda punya (tipe 58mm atau 80mm USB, Bluetooth, LAN) dan scanner barcode bisa langsung dicolok atau dihubungkan.",
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
