"use client";

import { Percent, Scale, BarChart3, Check } from "lucide-react";

export function AccountingTaxSection() {
  const complianceItems = [
    {
      title: "Fleksibel untuk Usaha Non-PKP & PKP",
      icon: Percent,
      desc: "Warung, toko kelontong, dan UMKM mikro Non-PKP bebas bertransaksi tanpa pungutan pajak (0%). Bagi restoran dan badan usaha PKP, sistem otomatis memisahkan PB1 10% atau PPN 11% secara transparan di setiap struk kasir.",
    },
    {
      title: "Rekap Otomatis PPh Final UMKM 0,5%",
      icon: Scale,
      desc: "Sesuai regulasi PP 55/2022. KADAI merangkum omzet peredaran bruto bulanan otomatis dan memantau batas pembebasan omzet Rp 500 Juta untuk Wajib Pajak Orang Pribadi.",
    },
    {
      title: "Legalitas NIB OSS & Standar SAK EMKM",
      icon: BarChart3,
      desc: "Tercatat rapi dengan dukungan nomor NIB OSS 13 digit, NIK Pemilik, dan NPWP untuk PT Perorangan, CV, maupun PT. Dilengkapi laporan laba rugi riil dan arus kas siap saji untuk perbankan.",
    },
  ];

  return (
    <section id="pajak-pembukuan" className="py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 w-full border-t border-slate-200/80">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left Column: Bold Editorial Narrative (Span 5) */}
        <div className="lg:col-span-5 space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Pajak & Standar Akuntansi
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-[1.15]">
            Urusan Pajak Beres, Pembukuan Rapi Tanpa Pusing
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            KADAI memberi kebebasan penuh: usaha Non-PKP dapat bertransaksi 0% tanpa potongan pajak, sementara badan usaha PKP siap dengan hitungan PB1 10% atau PPN 11% yang akurat.
          </p>
          <div className="pt-2 text-xs font-semibold text-slate-500 flex items-center gap-2">
            <Check className="size-4 text-emerald-600" />
            <span>Kepatuhan PP 55/2022 & SAK EMKM Indonesia</span>
          </div>
        </div>

        {/* Right Column: Direct Typographic Rows (Span 7) */}
        <div className="lg:col-span-7 divide-y divide-slate-200/80">
          {complianceItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className={`space-y-2.5 ${idx === 0 ? "pb-8" : "py-8"}`}>
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 shrink-0">
                    <Icon className="size-4" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-950">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed pl-12">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
