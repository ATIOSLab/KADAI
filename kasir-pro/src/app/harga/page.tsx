import { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Paket Langganan & Harga Resmi",
  description:
    "Pilihan paket langganan resmi KADAI mulai dari Starter (Rp 0/bln), Professional (Rp 99.000/bln), Business Pro (Rp 249.000/bln), hingga Enterprise (Rp 599.000/bln). Transparan tanpa biaya tersembunyi.",
  alternates: {
    canonical: "https://kadai.asia/harga",
  },
};

const tiers = [
  {
    name: "Starter",
    badge: "UMKM Pemula",
    price: "Rp 0",
    period: "/bulan",
    desc: "Untuk usaha mikro atau rintisan yang baru memulai pencatatan kasir digital.",
    features: [
      "1 Gerai (Outlet)",
      "Hingga 50 Produk SKU",
      "Pencatatan Penjualan Kasir Kilat",
      "Cetak Struk Thermal Bluetooth/USB",
      "Laporan Penjualan Dasar",
    ],
    cta: "Mulai Gratis",
    popular: false,
  },
  {
    name: "Professional",
    badge: "Paling Fleksibel",
    price: "Rp 99.000",
    period: "/bulan",
    desc: "Untuk kedai, kafe, atau toko ritel aktif yang membutuhkan kasir tanpa batas produk.",
    features: [
      "1 Gerai (Outlet)",
      "Produk & Transaksi Tanpa Batas",
      "Multi-User & Hak Akses Kasir",
      "Layar Dapur & Bar (KDS)",
      "Pengaturan Pajak Restoran PB1 10%",
      "Ekspor Laporan Excel / CSV",
    ],
    cta: "Coba Gratis 14 Hari",
    popular: false,
  },
  {
    name: "Business Pro",
    badge: "Paling Populer",
    price: "Rp 249.000",
    period: "/bulan",
    desc: "Solusi lengkap bisnis berkembang dengan manajemen bahan baku resep dan batch kadaluwarsa.",
    features: [
      "Hingga 3 Gerai (Outlet)",
      "Inventori Multi-Batch FIFO (PSAK 14)",
      "Radar Tanggal Kadaluwarsa",
      "Resep Produksi / Bill of Materials (BOM)",
      "Transfer Stok Antar Outlet (Surat Jalan)",
      "Perhitungan PPh Final PP 55/2022",
      "Dukungan WhatsApp Prioritas",
    ],
    cta: "Coba Gratis 14 Hari",
    popular: true,
  },
  {
    name: "Enterprise",
    badge: "Skala Besar",
    price: "Rp 599.000",
    period: "/bulan",
    desc: "Untuk waralaba, grup resto, jaringan minimarket, atau sentra dapur pusat dengan multi-gudang.",
    features: [
      "Outlet & Gudang Tak Terbatas",
      "Sentra Dapur Pusat (Central Kitchen)",
      "Otorisasi Granular RBAC Kustom",
      "Rekonsiliasi Pajak Konsolidasi",
      "Akses API Integrasi Kustom",
      "Dedicated Account Manager & SLA 99.9%",
    ],
    cta: "Hubungi Enterprise",
    popular: false,
  },
];

export default function HargaPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased overflow-x-hidden w-full max-w-full">
      <SiteHeader dashboardPath={null} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12 sm:pb-16 space-y-16 overflow-hidden">
        {/* Header Breadcrumb & Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="outline" className="px-3 py-1 text-xs font-semibold rounded-full border-primary/30 text-primary bg-primary/5">
            TRANSPARAN TANPA BIAYA TERSEMBUNYI
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950">
            Investasi Terjangkau untuk Pertumbuhan Bisnis Nyata
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed text-balance">
            Pilih paket yang sesuai dengan skala usaha Anda. Tanpa kontrak jangka panjang yang mengikat, bebas upgrade atau downgrade kapan saja.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`flex flex-col h-full rounded-3xl transition-all duration-200 relative ${
                tier.popular
                  ? "bg-white border-2 border-primary shadow-xl scale-[1.02] z-10"
                  : "bg-white/80 backdrop-blur-md border border-slate-200/90 shadow-xs hover:shadow-md"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary hover:bg-primary text-white font-bold text-[11px] px-3.5 py-1 rounded-full shadow-md uppercase tracking-wider">
                    {tier.badge}
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4 pt-6 space-y-2">
                {!tier.popular && (
                  <Badge variant="secondary" className="w-fit text-[10px] font-semibold bg-slate-100 text-slate-600">
                    {tier.badge}
                  </Badge>
                )}
                <CardTitle className="text-xl font-bold text-slate-950">
                  {tier.name}
                </CardTitle>
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-3xl font-black tracking-tight text-slate-950">
                    {tier.price}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {tier.period}
                  </span>
                </div>
                <CardDescription className="text-xs text-slate-600 leading-relaxed pt-1">
                  {tier.desc}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col flex-1 space-y-3 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Fitur Termasuk:
                </span>
                <ul className="space-y-2.5">
                  {tier.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2 text-xs text-slate-700">
                      <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-4 mt-auto">
                <Button
                  asChild
                  className={`w-full font-bold text-xs h-10 rounded-xl transition-all ${
                    tier.popular
                      ? "bg-primary text-white hover:bg-primary/90 shadow-md"
                      : "bg-slate-950 text-white hover:bg-slate-900"
                  }`}
                >
                  <Link href="/register">{tier.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Feature Comparison Matrix Table */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-950">
              Matriks Perbandingan Lengkap
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Detail spesifikasi fitur antar paket langganan resmi KADAI.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-900">
                  <th className="py-3 px-4 font-bold text-sm">Fitur & Modul</th>
                  <th className="py-3 px-4 font-bold text-center">Starter</th>
                  <th className="py-3 px-4 font-bold text-center">Professional</th>
                  <th className="py-3 px-4 font-bold text-center text-primary">Business Pro</th>
                  <th className="py-3 px-4 font-bold text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-medium">Batas Jumlah Gerai (Outlet)</td>
                  <td className="py-3 px-4 text-center">1 Outlet</td>
                  <td className="py-3 px-4 text-center">1 Outlet</td>
                  <td className="py-3 px-4 text-center font-bold text-primary">Hingga 3 Outlet</td>
                  <td className="py-3 px-4 text-center">Tanpa Batas</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Katalog Produk SKU</td>
                  <td className="py-3 px-4 text-center">50 Produk</td>
                  <td className="py-3 px-4 text-center">Tanpa Batas</td>
                  <td className="py-3 px-4 text-center font-bold text-primary">Tanpa Batas</td>
                  <td className="py-3 px-4 text-center">Tanpa Batas</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Metode Penilaian Inventori</td>
                  <td className="py-3 px-4 text-center">Pencatatan Stok Masuk</td>
                  <td className="py-3 px-4 text-center">Stok Real-Time</td>
                  <td className="py-3 px-4 text-center font-bold text-primary">Multi-Batch FIFO (PSAK 14)</td>
                  <td className="py-3 px-4 text-center">Multi-Batch FIFO (PSAK 14)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Layar Dapur & Bar (KDS)</td>
                  <td className="py-3 px-4 text-center text-slate-300">—</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Termasuk</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Termasuk</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Termasuk</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Resep Bahan Pokok (BOM)</td>
                  <td className="py-3 px-4 text-center text-slate-300">—</td>
                  <td className="py-3 px-4 text-center text-slate-300">—</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Termasuk</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Termasuk</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Mutasi Stok Antar-Cabang (Surat Jalan)</td>
                  <td className="py-3 px-4 text-center text-slate-300">—</td>
                  <td className="py-3 px-4 text-center text-slate-300">—</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Termasuk</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Termasuk</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Pajak PB1 10% & PPh Final PP 55/2022</td>
                  <td className="py-3 px-4 text-center text-slate-300">—</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ PB1 10%</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Lengkap</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Konsolidasi Grup</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}