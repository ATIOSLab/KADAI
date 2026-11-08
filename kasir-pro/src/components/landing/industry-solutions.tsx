"use client";

import { ShoppingCart, UtensilsCrossed, Building2, Check } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      title: "Layanan Jasa & Multi-Cabang",
      icon: Building2,
      subtitle: "Barbershop, salon kecantikan, bengkel otomotif, laundry, dan jaringan franchise.",
      features: [
        "Pencatatan nota jasa servis dan penjualan produk dalam 1 transaksi.",
        "Database pelanggan CRM, nomor kontak, dan riwayat kunjungan rutin.",
        "Pantau seluruh cabang toko secara terpusat dari satu akun pemilik.",
        "Kontrol hak akses kasir, manajer, dan pembukuan dengan PIN aman.",
      ],
    },
  ];

  return (
    <section id="solusi-industri" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50/70 border-y border-slate-200/80 w-full">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge
            variant="outline"
            className="text-xs font-semibold text-primary uppercase tracking-wider px-3.5 py-1 rounded-full border-primary/20 bg-orange-50/60"
          >
            Fleksibel Lintas Sektor
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-950">
            Dibuat Khusus untuk Karakter Usaha Anda
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed text-balance">
            Setiap model bisnis punya tantangan berbeda. KADAI menyediakan alur operasional yang langsung pas sejak hari pertama tanpa perlu kustomisasi mahal.
          </p>
        </div>

        {/* 3-Column Reusable Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {industries.map((ind, idx) => {
            const Icon = ind.icon;
            return (
              <Card
                key={idx}
                className="rounded-[24px] luxury-glass-card p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 border border-slate-200/90"
              >
                <CardHeader className="p-0 space-y-4">
                  <div className="size-11 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-950">
                      {ind.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-1 italic leading-relaxed">
                      {ind.subtitle}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-700">
                    {ind.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5">
                        <Check className="size-4 text-primary shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
