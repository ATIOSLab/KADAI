"use client";

import { ShoppingCart, UtensilsCrossed, Building2, Check } from "lucide-react";

export function IndustrySolutions() {
  const industries = [
    {
      title: "Kuliner, Kafe & Restoran (F&B)",
      icon: UtensilsCrossed,
      subtitle: "Kedai kopi, kafe modern, restoran dine-in, bakery, fast food, hingga cloud kitchen.",
      features: [
        "Takaran resep bahan baku terpotong otomatis saat pesanan dibuat.",
        "Layar monitor dapur (KDS) memisahkan tiket stasiun koki dan barista.",
        "Pengaturan nomor meja kasir, pesanan mandiri QR, dan split-bill.",
        "Hitung otomatis Pajak Restoran (PB1 10%) dan biaya layanan.",
      ],
    },
    {
      title: "Toko Ritel & Minimarket",
      icon: ShoppingCart,
      subtitle: "Minimarket, toko kelontong sembako, apotek, butik fashion, dan grosir.",
      features: [
        "Scan barcode cepat dengan scanner USB, Bluetooth, atau kamera HP.",
        "Metode fleksibel FIFO, FEFO (First Expired First Out), atau Rata-rata (Average) memastikan barang dagangan batch lama dan tanggal kadaluwarsa terjaga rapi.",
        "Radar peringatan stok menipis dan tanggal kadaluwarsa produk masuk.",
        "Cetak struk kasir thermal 58mm/80mm dan label harga barcode.",
      ],
    },
    {
      title: "Grosir & Jaringan Multi-Cabang",
      icon: Building2,
      subtitle: "Distribusi logistik, transfer antar cabang, booth waralaba, dan multi-outlet.",
      features: [
        "Transfer persediaan dari gudang/dapur pusat ke seluruh gerai cabang.",
        "Pantau performa penjualan seluruh gerai secara konsolidasi realtime.",
        "Pencatatan nota retur, penyesuaian stok opname, dan kartu stok FIFO.",
        "Kontrol hak akses kasir, manajer, dan pembukuan dengan PIN aman.",
      ],
    },
  ];

  return (
    <section id="solusi-industri" className="py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 w-full border-t border-slate-200/80">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Section Header: Pure Typography */}
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Solusi Lintas Sektor
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-[1.15]">
            Dibuat Khusus untuk Karakter Usaha Anda
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Setiap model bisnis punya tantangan berbeda. KADAI menyediakan alur operasional yang langsung pas sejak hari pertama tanpa perlu kustomisasi rumit.
          </p>
        </div>

        {/* 3-Column Clean Editorial Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12 border-t border-slate-200/80 pt-10 sm:pt-12">
          {industries.map((ind, idx) => {
            const Icon = ind.icon;
            return (
              <div key={idx} className="flex flex-col space-y-4">
                <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-950">
                    {ind.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                    {ind.subtitle}
                  </p>
                </div>
                <ul className="space-y-3 pt-3 border-t border-slate-100 text-xs sm:text-sm text-slate-700">
                  {ind.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5">
                      <Check className="size-4 text-primary shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
