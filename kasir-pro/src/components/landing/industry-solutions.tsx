"use client";

import { ShoppingCart, UtensilsCrossed, Building2, Check } from "lucide-react";

export function IndustrySolutions() {
  const industries = [
    {
      title: "Ritel & Distribusi Komersial",
      icon: ShoppingCart,
      subtitle: "Minimarket modern, supermarket, fashion, farmasi/apotek, elektronik, toko bangunan, dan grosir.",
      features: [
        "Pelacakan persediaan multi-batch FIFO & expired date.",
        "Scan barcode scanner USB, Bluetooth & kamera HP.",
        "Kartu stok mutasi otomatis & batas minimum restock.",
        "Cetak struk kasir thermal 58mm/80mm & label barcode.",
      ],
    },
    {
      title: "Kuliner, F&B & Hospitality",
      icon: UtensilsCrossed,
      subtitle: "Restoran casual dining, kafe modern, fast food (QSR), bakery, dan cloud kitchen.",
      features: [
        "Bill of Materials: Potong bahan baku otomatis saat menu laku.",
        "Meja & Self-Order QR: Pelanggan pesan langsung dari HP.",
        "Kitchen Display (KDS): Tiket real-time ke monitor dapur & bar.",
        "Otomatisasi Pajak Restoran (PB1 10%) & Service Charge.",
      ],
    },
    {
      title: "Layanan Jasa & Multi-Cabang",
      icon: Building2,
      subtitle: "Barbershop, salon kecantikan, bengkel otomotif, cuci mobil/motor, laundry, dan franchise.",
      features: [
        "Pencatatan invoice billing jasa & produk dalam 1 transaksi.",
        "Database pelanggan CRM, riwayat kunjungan & poin member.",
        "Manajemen multi-cabang terpusat dari satu dashboard akun.",
        "Kontrol hak akses staf RBAC 6 role & PIN supervisor.",
      ],
    },
  ];

  return (
    <section id="solusi-industri" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50/70 border-y border-slate-200/80 w-full">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-primary uppercase tracking-wider font-mono">
            Solusi Lintas Industri
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950">
            Arsitektur Fleksibel untuk Seluruh Sektor Bisnis
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed text-balance">
            KADAI dirancang secara modular dan agnostik untuk beradaptasi dengan model operasional usaha Anda, mulai dari pencatatan barcode ritel, perakitan resep kuliner, hingga reservasi jasa.
          </p>
        </div>

        {/* 3-Column Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {industries.map((ind, idx) => {
            const Icon = ind.icon;
            return (
              <div
                key={idx}
                className="rounded-[24px] luxury-glass-card p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 border border-slate-200/90"
              >
                <div className="space-y-4">
                  <div className="size-11 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">
                      {ind.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 italic leading-relaxed">
                      {ind.subtitle}
                    </p>
                  </div>
                  <ul className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-700">
                    {ind.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5">
                        <Check className="size-4 text-primary shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
