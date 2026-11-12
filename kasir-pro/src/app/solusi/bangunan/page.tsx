import { Metadata } from "next";
import Link from "next/link";
import {
  Hammer,
  Warehouse,
  Layers,
  Barcode,
  Truck,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { LandingPageShell } from "@/components/landing/landing-page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Aplikasi Kasir Toko Bangunan, Depo Material & Alat Teknik | KADAI",
  description:
    "Software kasir toko bangunan dan supplier material dengan multi-gudang semen & besi, kartu stok HPP FIFO komoditas fluktuatif, nota tempo bon mandor, dan scan barcode ribuan perkakas.",
  alternates: {
    canonical: "https://kadai.asia/solusi/bangunan",
  },
  openGraph: {
    title: "Aplikasi Kasir Toko Bangunan, Depo Material & Alat Teknik | KADAI",
    description:
      "Kendalikan persediaan material semen, besi, cat, dan ribuan SKU perkakas teknik dengan pemisahan toko display depan vs gudang muat.",
    url: "https://kadai.asia/solusi/bangunan",
    images: [{ url: "https://kadai.asia/og-image.png", width: 1200, height: 630 }],
  },
};

const buildingPainPoints = [
  {
    title: "Harga Komoditas Material Sangat Fluktuatif",
    desc: "Harga semen, besi beton, seng, dan baja ringan sering berubah dari pabrik/distributor. Tanpa kalkulasi FIFO otomatis, estimasi margin laba kotor bisa meleset dan rugi.",
    solution: "Kalkulasi HPP Sistem FIFO",
  },
  {
    title: "Pemisahan Toko Display Depan vs Gudang Berat",
    desc: "Toko depan melayani transaksi kasir, sementara semen sak dan besi batangan diambil dari gudang terpisah. Sering terjadi selisih stok jika mutasi barang tidak tercatat.",
    solution: "Surat Jalan Transfer Multi-Gudang",
  },
  {
    title: "Bon Gantung & Pembayaran Tempo Mandor Proyek",
    desc: "Kontraktor dan tukang langganan sering mengambil material terlebih dahulu dan pelunasan di akhir pekan atau termin proyek, rawan lupa tertagih jika pakai buku manual.",
    solution: "Modul Pembayaran Tempo & Piutang",
  },
];

const buildingFeatures = [
  {
    title: "Multi-Gudang: Toko Kasir Depan vs Gudang Material",
    desc: "Kelola stok display perkakas toko depan dan gudang berat (semen, besi, pasir) secara terpisah dengan mutasi transfer stok digital.",
    icon: Warehouse,
  },
  {
    title: "Kalkulasi HPP FIFO untuk Komoditas Fluktuatif",
    desc: "Setiap restock semen atau besi tercatat nomor batch dan harga belinya. Saat terjual, sistem otomatis menghitung HPP berdasarkan modal batch tertua.",
    icon: Layers,
  },
  {
    title: "Scan Barcode Cepat untuk Ribuan SKU Perkakas & Fitting",
    desc: "Scan barcode USB atau Bluetooth kilat untuk fitting pipa PVC, kran, saklar, cat, kuas, dan perkakas teknik tanpa perlu ketik nama manual.",
    icon: Barcode,
  },
  {
    title: "Dukungan Pembayaran Fleksibel: Tunai, QRIS, Transfer & Tempo",
    desc: "Kasir dapat memilih metode pembayaran lunas instan maupun Tempo (Bon Mandor) dengan pencatatan nama pelanggan proyek yang terarsip rapi.",
    icon: FileText,
  },
];

export default function SolutionBuildingPage() {
  return (
    <LandingPageShell
      badgeText="SOLUSI TOKO BANGUNAN & MATERIAL"
      title="Kasir Toko Bangunan, Manajemen Multi-Gudang & HPP FIFO Presisi"
      description="Kendalikan ribuan SKU perkakas, pisahkan stok toko depan dan gudang material berat, serta amankan margin laba saat harga semen dan besi berfluktuasi."
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 -mt-8 pb-4">
        <Button asChild size="lg" className="rounded-xl font-bold text-sm h-11 px-7 bg-primary text-white shadow-xs">
          <Link href="/register">Coba Gratis 14 Hari</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-xl font-semibold text-sm h-11 px-6 bg-white border-slate-300">
          <Link href="/demo">Jadwalkan Demo Toko Bangunan</Link>
        </Button>
      </div>

      {/* Problem vs Solution Grid */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Tantangan Khas Toko Bangunan & Material
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            KADAI dirancang khusus mengatasi kerumitan logistik material berat dan fluktuasi harga
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {buildingPainPoints.map((item, idx) => (
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
            Fitur Unggulan untuk Toko Bangunan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Sinkronisasi toko kasir depan dengan gudang semen & besi tanpa risiko selisih stok
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {buildingFeatures.map((cap, idx) => {
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
          Modernkan Operasional Toko Bangunan Anda Hari Ini
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
          Uji coba langsung dengan dataset TB Surya Abadi di halaman demo KADAI. Tanpa ribet, langsung siap pakai.
        </p>
        <div className="pt-2">
          <Button asChild size="lg" className="rounded-lg font-bold text-sm h-11 px-8 bg-primary text-white shadow-xs">
            <Link href="/register">Mulai Uji Coba Gratis</Link>
          </Button>
        </div>
      </div>
    </LandingPageShell>
  );
}
