"use client";

import {
  Scale,
  Receipt,
  Percent,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";

export function AccountingTaxSection() {
  const cards = [
    {
      title: "Pajak Restoran / PB1 (PBJT)",
      tag: "Pajak Daerah",
      desc: "Konfigurasi tarif Pajak Barang dan Jasa Tertentu (PB1 / PBJT 10%) per outlet restoran atau kafe sesuai Perda daerah masing-masing, terpisah rapi dari omzet bersih.",
      highlight: "Otomatis tertera di struk kasir & rekap setoran daerah",
      icon: Percent,
      accent: "text-orange-600 bg-orange-50 border-orange-200",
    },
    {
      title: "PPN Ritel 11%",
      tag: "Pajak Pusat",
      desc: "Dukungan penghitungan Pajak Pertambahan Nilai (PPN 11%) untuk gerai ritel dan minimarket dengan opsi harga inklusif atau eksklusif pajak per faktur.",
      highlight: "Faktur penjualan tercatat dengan nomor seri rapi",
      icon: Receipt,
      accent: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      title: "Buku Omzet & PPh Final 0.5%",
      tag: "Standar PP 55/2022",
      desc: "Rekapitulasi peredaran bruto harian dan bulanan untuk mempermudah perhitungan setoran PPh Final UMKM 0.5% sesuai ketentuan PP 55 Tahun 2022.",
      highlight: "Dilengkapi simulasi batas omzet bebas pajak (PTKP Rp 500 Jt untuk OP)",
      icon: FileSpreadsheet,
      accent: "text-purple-600 bg-purple-50 border-purple-200",
    },
    {
      title: "Laba Rugi Standar SAK EMKM",
      tag: "Standar Akuntansi RI",
      desc: "Penyusunan laporan laba rugi periodik dengan kalkulasi HPP bahan baku berbasis FIFO riil. Format standar IAI yang diakui untuk pengajuan kredit usaha perbankan.",
      highlight: "Ekspor data CSV & format cetak laporan keuangan resmi",
      icon: Scale,
      accent: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
  ];

  return (
    <section id="pajak-pembukuan" className="py-20 sm:py-28 px-4 sm:px-6 bg-slate-50/70 border-b border-slate-200/80 w-full">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
            <span>Kepatuhan Fiskal & Pembukuan</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950">
            Pembukuan Lebih Tertata. Pengelolaan Pajak Lebih Terarah.
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed text-balance">
            KADAI membantu pemilik usaha mencatat perpajakan daerah dan pusat secara terpisah, menyusun buku omzet bulanan, serta menghasilkan laporan laba rugi yang transparan.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((c, idx) => {
            const Icon = c.icon;
            return (
              <div
                key={idx}
                className="rounded-3xl liquid-glass-card p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
                      {c.tag}
                    </span>
                    <div className={`size-10 rounded-xl flex items-center justify-center border shadow-2xs ${c.accent}`}>
                      <Icon className="size-5" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-950">{c.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                      {c.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>{c.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Responsible Fiscal Notice Disclaimer */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3.5 text-xs text-slate-600">
          <AlertCircle className="size-5 text-slate-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed space-y-1">
            <span className="font-bold text-slate-800 block">Catatan Ketentuan Perpajakan Indonesia:</span>
            <p>
              Penerapan tarif pajak (PBJT / PPN / PPh Final) bergantung pada domisili gerai, klasifikasi bidang usaha, skala omzet tahunan, dan status Wajib Pajak (Orang Pribadi atau Badan). KADAI menyediakan alat pencatatan dan rekonsiliasi data operasional; pelaporan dan penyetoran pajak tetap menjadi tanggung jawab wajib pajak terkait sesuai peraturan perundang-undangan perpajakan yang berlaku.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
