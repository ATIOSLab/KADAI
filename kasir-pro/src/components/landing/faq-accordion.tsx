"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "Printer dan hardware kasir apa saja yang kompatibel dengan KADAI?",
    answer:
      "KADAI mendukung 100% printer thermal berstandar ESC/POS ukuran 58mm dan 80mm, baik koneksi Bluetooth nirkabel, USB kabel, maupun LAN/Ethernet jaringan. Kompatibel juga dengan barcode scanner laser/2D, cash drawer otomatis (laci uang RJ11), serta tablet Android, iPad, dan laptop PC.",
  },
  {
    question: "Bagaimana jika koneksi internet mati di tengah jam sibuk kasir?",
    answer:
      "KADAI dirancang dengan arsitektur ketahanan offline (Offline-Resilient Local Storage). Kasir tetap dapat melakukan pemindaian barcode, menerima pembayaran tunai, dan mencetak struk thermal secara normal. Begitu koneksi internet pulih, seluruh transaksi otomatis tersinkronisasi ke database cloud pusat.",
  },
  {
    question: "Apakah KADAI mendukung resep bahan baku makanan (BOM) & kadaluarsa obat?",
    answer:
      "Ya. Untuk bisnis kuliner, fitur Bill of Materials (BOM) otomatis memotong persediaan bahan baku (misal: gramasi daging, tepung, susu, sirup) setiap porsi makanan terjual. Untuk ritel dan farmasi, sistem menerapkan aturan FIFO (First In, First Out) dengan pelacakan nomor batch dan tanggal kadaluarsa.",
  },
  {
    question: "Bagaimana sistem menangani Pajak Restoran (PB1 10%) vs PPN 11%?",
    answer:
      "KADAI memiliki dual-tax matrix resmi. Anda dapat mengaktifkan Pajak Restoran / PBJT 10% untuk usaha kuliner (disetor ke Bapenda/Pemda) atau PPN 11%/12% untuk ritel kena pajak (DJP). Sistem juga secara otomatis memantau batas omzet Rp 500 Juta untuk pelaporan PPh Final UMKM 0.5% sesuai PP 55/2022.",
  },
  {
    question: "Bisakah saya mengelola banyak cabang dan gudang pusat (Central Kitchen)?",
    answer:
      "Sangat bisa. Anda dapat memantau omzet seluruh cabang secara terpusat dari satu dashboard akun Owner. Fitur mutasi stok memungkinkan pengiriman bahan dari gudang utama/central kitchen ke cabang outlet dengan surat jalan dan approval penerimaan resmi.",
  },
  {
    question: "Bagaimana proses migrasi data dari sistem kasir lama kami?",
    answer:
      "Kami menyediakan template impor massal berbasis spreadsheet (.xlsx / .csv) untuk memindahkan ribuan data produk, harga modal, barcode, stok awal, serta kontak pelanggan hanya dalam hitungan menit tanpa entri ulang manual.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3">
      {FAQS.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={idx}
            className="rounded-xl border border-white/10 bg-slate-900/60 overflow-hidden transition-all duration-200 backdrop-blur-md hover:border-white/20"
          >
            <button
              type="button"
              onClick={() => toggle(idx)}
              className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-white text-sm sm:text-base hover:bg-white/[0.03] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <HelpCircle className="size-4 text-orange-400 shrink-0" />
                <span>{faq.question}</span>
              </span>
              <ChevronDown
                className={`size-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-orange-400" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/[0.06] bg-slate-950/40">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
