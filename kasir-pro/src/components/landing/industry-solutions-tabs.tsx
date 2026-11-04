"use client";

import { useState } from "react";
import {
  ShoppingCart,
  UtensilsCrossed,
  Scissors,
  Stethoscope,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Receipt,
  Layers,
  ChefHat,
  Sparkles,
} from "lucide-react";

interface VerticalData {
  id: string;
  name: string;
  badge: string;
  icon: any;
  title: string;
  description: string;
  clusterRef: string;
  highlights: { title: string; desc: string }[];
  specs: string[];
  metrics: { label: string; value: string }[];
}

const VERTICALS: VerticalData[] = [
  {
    id: "retail",
    name: "Ritel & Grosir",
    badge: "Minimarket, Apotek, Toko Bangunan",
    icon: ShoppingCart,
    title: "Mesin Kasir Barcode Kilat dengan Pelacakan Batch FIFO",
    description:
      "Dirancang untuk menangani ribuan SKU dengan kecepatan respon 0.2 detik per scan. Mendukung mutasi antar gudang, pencatatan expired date obat/makanan, dan struk thermal kasir.",
    clusterRef: "Toko Sembako Berkah Jaya (1.000+ SKU Grosir & Eceran)",
    highlights: [
      {
        title: "Scan Barcode Cepat & Fleksibel",
        desc: "Kompatibel langsung dengan barcode scanner USB, Bluetooth nirkabel, hingga kamera smartphone kasir.",
      },
      {
        title: "Multi-Batch FIFO & Expired Alert",
        desc: "Setiap barang masuk dicatat nomor batch dan tanggal kadaluarsanya. Stok terlama otomatis keluar lebih dulu.",
      },
      {
        title: "Kartu Stok & Auto-Restock Trigger",
        desc: "Kartu stok mutasi otomatis dengan notifikasi saat persediaan menyentuh batas minimum pemesanan ulang.",
      },
    ],
    specs: ["Cetak Label Barcode & Rak", "Struk Thermal 58mm & 80mm", "Pajak PPN 11%/12% Inklusif/Eksklusif", "Multi-Satuan (Pcs, Box, Karton)"],
    metrics: [
      { label: "Waktu Scan Barcode", value: "< 0.2s" },
      { label: "Kapasitas Katalog", value: "Unlimited" },
      { label: "Reduksi Selisih Stok", value: "99.4%" },
    ],
  },
  {
    id: "fnb",
    name: "Resto, Kafe & Kuliner",
    badge: "Casual Dining, QSR, Barista, Bakery",
    icon: UtensilsCrossed,
    title: "Ekosistem Terintegrasi: Resep BOM, KDS Dapur & QR Self-Order",
    description:
      "Hilangkan nota bon kertas yang hilang atau kotor. Pesanan dari kasir atau QR meja langsung terkirim ke monitor dapur (KDS) dan bahan baku terpotong otomatis per gram.",
    clusterRef: "Dimsum Imperial Heritage & Ruang Temu Coffee",
    highlights: [
      {
        title: "Bill of Materials (BOM) Resep Realtime",
        desc: "Setiap menu terjual memotong stok bahan baku mentah (misal: tepung, daging udang, kopi beans, susu) secara proporsional.",
      },
      {
        title: "Kitchen Display System (KDS)",
        desc: "Pesanan masuk real-time ke layar monitor koki dan barista dengan timer durasi masak dan routing station otomatis.",
      },
      {
        title: "Self-Order QR Meja Dinamis",
        desc: "Pelanggan langsung scan QR di meja, memilih menu, dan pesan tanpa menunggu pelayan mencatat manual.",
      },
    ],
    specs: ["Pajak Restoran PB1 / PBJT 10%", "Service Charge Terpisah", "Split Bill & Gabung Meja", "Audio Chime Notifikasi KDS"],
    metrics: [
      { label: "Kecepatan Antrean Meja", value: "3x Lebih Cepat" },
      { label: "Tiket Pesanan Hilang", value: "0 Kasus" },
      { label: "Akurasi HPP Bahan Makanan", value: "99.9%" },
    ],
  },
  {
    id: "services",
    name: "Barbershop & Jasa",
    badge: "Barber, Salon Kecantikan, Bengkel, Cuci Mobil",
    icon: Scissors,
    title: "Billing Servis Jasa + Produk, CRM Poin & Komisi Staf",
    description:
      "Kelola antrean pelanggan, gabungkan layanan potong rambut dengan produk pomade dalam 1 transaksi, serta hitung komisi kapster/terapis secara otomatis dan transparan.",
    clusterRef: "Gentlemen & Co. Premium Barbershop",
    highlights: [
      {
        title: "Bundling Jasa & Retail dalam 1 Nota",
        desc: "Pelanggan bisa membayar jasa potong rambut/treatment sekaligus membeli produk after-care tanpa kasir memisah struk.",
      },
      {
        title: "Kalkulasi Komisi Kapster Otomatis",
        desc: "Sistem mencatat staf yang mengerjakan tiap layanan dan menghitung persentase komisi secara otomatis di laporan.",
      },
      {
        title: "Database CRM & Riwayat Member",
        desc: "Catat riwayat kunjungan, preferensi gaya, dan akumulasi poin loyalitas yang dapat ditukar diskon di kasir.",
      },
    ],
    specs: ["Katalog Jasa & Durasi Kerja", "Poin Member & Riwayat Servis", "Laporan Komisi Karyawan", "Otorisasi Supervisor PIN"],
    metrics: [
      { label: "Perhitungan Komisi", value: "100% Otomatis" },
      { label: "Retensi Pelanggan Member", value: "+38%" },
      { label: "Kecepatan Kasir Billing", value: "< 15 Detik" },
    ],
  },
  {
    id: "clinic",
    name: "Klinik & Farmasi",
    badge: "Apotek, Klinik Estetika, Praktek Bersama",
    icon: Stethoscope,
    title: "Manajemen Resep Medis, Expired Date Serum & Pembukuan PPh",
    description:
      "Pencatatan resep dokter, nomor batch obat dan serum kecantikan dengan pelacakan tanggal kadaluarsa ketat, serta pemisahan omzet tindakan medis dengan produk farmasi.",
    clusterRef: "GlowAura Aesthetic Clinic & Apotek",
    highlights: [
      {
        title: "Pelacakan Batch Serum & Obat Ketat",
        desc: "Setiap vial atau botol serum kecantikan dilacak tanggal expired date-nya untuk menjamin keamanan klinis pasien.",
      },
      {
        title: "Pemisahan Biaya Medis & Obat",
        desc: "Pemisahan billing tindakan dokter spesialis dengan penjualan krim racik dalam satu faktur resmi pasien.",
      },
      {
        title: "Laporan Keuangan & Pajak Usaha Klinik",
        desc: "Ringkasan pembukuan akuntansi SAK EMKM dan rekap pajak penghasilan yang siap diaudit akuntan atau perbankan.",
      },
    ],
    specs: ["Nomor Izin BPOM & Batching", "Resep Obat & Bahan Racikan", "Laporan Laba Bersih Per Dokter", "Audit Trail Keamanan Data"],
    metrics: [
      { label: "Insiden Obat Kadaluarsa", value: "0%" },
      { label: "Audit Kepatuhan Rekam Medis", value: "100% Sesuai" },
      { label: "Efisiensi Inventori Apotek", value: "+45%" },
    ],
  },
];

export function IndustrySolutionsTabs() {
  const [activeVertical, setActiveVertical] = useState<string>("retail");
  const selected = VERTICALS.find((v) => v.id === activeVertical) || VERTICALS[0];
  const IconComponent = selected.icon;

  return (
    <div className="w-full space-y-8">
      {/* Sector Navigation Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-slate-900/80 rounded-2xl max-w-3xl mx-auto border border-white/10 backdrop-blur-md">
        {VERTICALS.map((v) => {
          const VIcon = v.icon;
          const isActive = activeVertical === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setActiveVertical(v.id)}
              className={`flex-1 min-w-[130px] sm:min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/30 scale-[1.02]"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <VIcon className={`size-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span className="truncate">{v.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active Sector Deep-Dive Card */}
      <div className="bg-slate-900/60 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] p-6 sm:p-8 space-y-8 max-w-5xl mx-auto backdrop-blur-xl">
        {/* Top Header of Sector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 bg-orange-950/60 border border-orange-500/30 px-2.5 py-1 rounded-md">
              <IconComponent className="size-3.5" />
              <span>{selected.badge}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">{selected.title}</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              {selected.description}
            </p>
          </div>

          <div className="shrink-0 bg-slate-950/80 p-3.5 rounded-xl border border-white/10 text-left md:text-right">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Klaster Terverifikasi</div>
            <div className="text-xs font-black text-orange-400 mt-0.5">{selected.clusterRef}</div>
          </div>
        </div>

        {/* Feature Highlights Bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {selected.highlights.map((h, i) => (
            <div key={i} className="bg-slate-950/60 p-4 rounded-xl border border-white/[0.06] space-y-2 hover:border-orange-500/30 transition-colors">
              <div className="size-7 rounded-lg bg-orange-950/80 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-xs font-mono">
                0{i + 1}
              </div>
              <h4 className="font-bold text-sm text-white">{h.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>

        {/* Specs & Performance Metrics Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-white/[0.08] items-center">
          {/* Specs Checklist */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Fitur Bawaan Standar
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-300">
              {selected.specs.map((spec, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  <span>{spec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Real Metrics Telemetry */}
          <div className="grid grid-cols-3 gap-2 bg-slate-950 p-4 rounded-xl border border-white/10">
            {selected.metrics.map((m, i) => (
              <div key={i} className="text-center space-y-1">
                <div className="text-[10px] text-slate-400 font-medium">{m.label}</div>
                <div className="text-sm sm:text-base font-black text-orange-400 font-mono">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
