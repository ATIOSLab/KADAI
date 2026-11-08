import { Metadata } from "next";
import Link from "next/link";
import {
  Store,
  Layers,
  ArrowRight,
  Barcode,
  Truck,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Aplikasi Kasir Toko Ritel, Grosir & Minimarket | KADAI",
  description:
    "Software kasir ritel dan grosir dengan barcode scan cepat, manajemen multi-batch FIFO, radar kadaluwarsa produk, dan mutasi transfer antar cabang.",
  alternates: {
    canonical: "https://kadai.asia/solusi/ritel",
  },
  openGraph: {
    title: "Aplikasi Kasir Toko Ritel, Grosir & Minimarket | KADAI",
    description:
      "Kendali puluhan ribu SKU barang dengan scan barcode USB kilat, pelacakan batch expired date, dan kartu stok persediaan otomatis.",
    url: "https://kadai.asia/solusi/ritel",
  },
};

const retailPainPoints = [
  {
    title: "Antrean Kasir Macet Karena Ribuan SKU",
    desc: "Mencari nama produk manual di komputer kasir saat pelanggan membawa keranjang belanjaan penuh menyebabkan antrean panjang dan komplain.",
    solution: "Scan Barcode 0.1 Detik",
  },
  {
    title: "Barang di Rak Kadaluwarsa Tanpa Terpantau",
    desc: "Produk makanan/minuman tersembunyi di sudut rak hingga lewat tanggal expired date, mengakibatkan kerugian finansial yang harus dibuang.",
    solution: "Radar Expired Date FEFO",
  },
  {
    title: "Selisih Stok Fisik Toko dan Catatan Kasir",
    desc: "Barang rusak, hilang, atau salah hitung saat stok opname bulanan membuat laporan laba rugi toko menjadi tidak akurat.",
    solution: "Kartu Stok & Audit Mutasi",
  },
];

const retailFeatures = [
  {
    title: "Dukungan Barcode Scanner Fisik & Varian SKU",
    desc: "Cukup scan barcode kemasan menggunakan scanner USB atau Bluetooth. Mendukung varian dinamis: ukuran, warna, nomor seri, dan multi-satuan (Dus, Pak, Pcs).",
    icon: Barcode,
  },
  {
    title: "Inventori Multi-Batch (FIFO / FEFO / Average)",
    desc: "Penilaian persediaan berstandar PSAK 14 / IAS 2. Stok yang masuk lebih awal otomatis keluar lebih dulu untuk melindungi modal modal harga beli.",
    icon: Layers,
  },
  {
    title: "Transfer Stok Antar Gudang & Gerai Cabang",
    desc: "Kirim barang dari gudang pusat ke cabang toko dengan surat jalan mutasi digital, status barang dalam perjalanan (*in-transit*), dan verifikasi terima.",
    icon: Truck,
  },
  {
    title: "Peringatan Stok Menipis & PO Otomatis",
    desc: "Dapatkan radar peringatan otomatis saat barang mendekati batas minimum stok agar tidak pernah kehabisan barang dagangan laris.",
    icon: AlertTriangle,
  },
];

export default function SolutionRetailPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased">
      <SiteHeader dashboardPath={null} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 space-y-16">
        {/* Hero Solution */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="outline" className="px-3.5 py-1 text-xs font-semibold rounded-lg border-primary/30 text-primary bg-primary/5">
            SOLUSI TOKO RITEL & DISTRIBUSI GROSIR
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Kasir Barcode Cepat & Manajemen Persediaan Berstandar PSAK
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed text-balance">
            Kelola ribuan SKU barang dagangan, lacak mutasi batch kadaluwarsa, dan distribusikan stok antar cabang tanpa risiko selisih kas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button asChild size="lg" className="rounded-lg font-bold text-sm h-11 px-7 bg-primary text-white shadow-xs">
              <Link href="/register">Coba Gratis 14 Hari</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-lg font-semibold text-sm h-11 px-6 bg-white border-slate-300">
              <Link href="/demo">Jadwalkan Demo Ritel</Link>
            </Button>
          </div>
        </div>

        {/* Problem vs Solution Grid */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Tantangan Operasional Toko Ritel & Grosir
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              KADAI menyederhanakan manajemen puluhan ribu produk menjadi mudah
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {retailPainPoints.map((item, idx) => (
              <Card key={idx} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                  Solusi KADAI: {item.solution}
                </span>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Core Capabilities */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Fitur Andalan untuk Ritel & Minimarket
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Kecepatan transaksi kasir maksimal dan akurasi gudang tanpa kompromi
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {retailFeatures.map((cap, idx) => {
              const Icon = cap.icon;
              return (
                <div key={idx} className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-start gap-4">
                  <div className="size-10 rounded-xl bg-orange-50 text-primary flex items-center justify-center shrink-0 border border-orange-100">
                    <Icon className="size-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">{cap.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{cap.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Card */}
        <div className="rounded-3xl bg-slate-950 text-white p-8 sm:p-12 text-center space-y-4 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Mulai Operasikan Toko Ritel Anda Lebih Cepat Hari Ini
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Daftar sekarang untuk menikmati kasir barcode cepat dan kartu stok otomatis. Tanpa kartu kredit.
          </p>
          <div className="pt-2">
            <Button asChild size="lg" className="rounded-lg font-bold text-sm h-11 px-8 bg-primary text-white shadow-xs">
              <Link href="/register">Mulai Uji Coba Gratis</Link>
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
