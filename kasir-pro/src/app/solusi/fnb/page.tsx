import { Metadata } from "next";
import Link from "next/link";
import {
  UtensilsCrossed,
  ChefHat,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Layers,
  ShieldCheck,
  QrCode,
  Zap,
} from "lucide-react";
import { LandingPageShell } from "@/components/landing/landing-page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Aplikasi Kasir Restoran & Kafe (F&B) | KADAI",
  description:
    "Sistem kasir dan operasional F&B terbaik untuk kafe, restoran, dan gerai kuliner. Terintegrasi manajemen meja, QR self-order, dapur KDS, dan pemotongan resep bahan baku otomatis.",
  alternates: {
    canonical: "https://kadai.asia/solusi/fnb",
  },
  openGraph: {
    title: "Aplikasi Kasir Restoran & Kafe (F&B) | KADAI",
    description:
      "Kendali penuh operasional kuliner: antrean kasir cepat, pesanan langsung ke layar dapur KDS, dan kalkulasi HPP otomatis per porsi laku.",
    url: "https://kadai.asia/solusi/fnb",
  },
};

const painPoints = [
  {
    title: "Tiket Kertas Dapur Kerap Hilang & Salah Masak",
    desc: "Saat jam makan siang atau malam tiba, pesanan manual di nota rentan robek, basah, atau terlewat oleh koki dapur.",
    solution: "KDS Dapur Tanpa Kertas",
  },
  {
    title: "Bahan Baku Mahal Bocor Tanpa Jejak",
    desc: "Daging, keju impor, susu segar, dan sirup habis lebih cepat dari jumlah menu yang terjual tanpa diketahui penyebabnya.",
    solution: "Bill of Materials (BOM) Resep",
  },
  {
    title: "Bingung Menghitung Pajak Restoran (PB1 10%)",
    desc: "Menghitung manual selisih titipan pajak daerah restoran di setiap nota saat tutup buku malam hari memakan waktu berjam-jam.",
    solution: "Pemisahan PB1 Otomatis",
  },
];

const coreCapabilities = [
  {
    title: "Point of Sale (POS) Kilat & Split Bill",
    desc: "Kasir sentuh cepat dengan tombol cepat F2/F4, dukungan pemisahan tagihan per kursi pelanggan, dan pembayaran campuran (Tunai + QRIS).",
    icon: Zap,
  },
  {
    title: "Kitchen Display System (KDS) Realtime",
    desc: "Pesanan meja langsung muncul di layar stasiun dapur makanan dan bar minuman lengkap dengan penanda waktu durasi masak.",
    icon: ChefHat,
  },
  {
    title: "Pemotongan Bahan Baku Otomatis (Recipe BOM)",
    desc: "Tiap kali 1 porsi menu terjual, stok bahan dasar (gram biji kopi, ml susu, gram saus) terpotong otomatis dari kartu stok gudang.",
    icon: Layers,
  },
  {
    title: "Manajemen Denah Meja & QR Self-Order",
    desc: "Pelanggan bisa langsung scan QR code di meja untuk melihat menu visual, memesan mandiri, dan tagihan langsung terhubung ke kasir.",
    icon: QrCode,
  },
];

export default function SolutionFnbPage() {
  return (
    <LandingPageShell
      badgeText="SOLUSI KULINER & FOOD SERVICE"
      title="Satu Sistem Terpadu untuk Kasir Gerai, Dapur, dan Pembukuan Resto"
      description="Tingkatkan kecepatan rotasi meja (table turnover), hilangkan pesanan salah antar kasir dan dapur, serta kendalikan margin keuntungan kuliner secara presisi."
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 -mt-8 pb-4">
        <Button asChild size="lg" className="rounded-xl font-bold text-sm h-11 px-7 bg-primary text-white shadow-xs">
          <Link href="/register">Coba Gratis 14 Hari</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-xl font-semibold text-sm h-11 px-6 bg-white border-slate-300">
          <Link href="/demo">Jadwalkan Demo Resto</Link>
        </Button>
      </div>

      {/* Problem vs Solution Grid */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Tantangan Terbesar Operasional F&B
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Bagaimana KADAI mengamankan kelancaran jam sibuk restoran Anda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {painPoints.map((item, idx) => (
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
              Fitur Andalan untuk Restoran & Kafe
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Setiap komponen dirancang sinkron tanpa aplikasi pihak ketiga
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {coreCapabilities.map((cap, idx) => {
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
            Siap Merevolusi Layanan Restoran Anda?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Mulai uji coba gratis 14 hari tanpa kartu kredit. Aktifkan terminal kasir dan stasiun dapur KDS Anda dalam 5 menit.
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
