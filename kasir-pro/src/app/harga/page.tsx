import { Metadata } from "next";

export const revalidate = 300;
import Link from "next/link";
import { Check } from "lucide-react";
import { LandingPageShell } from "@/components/landing/landing-page-shell";
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
  openGraph: {
    title: "Paket Langganan & Harga Resmi | KADAI",
    description:
      "Struktur paket langganan transparan: Starter Rp 0, Professional Rp 99rb (QR Meja F&B / Barcode & Alert Expired Ritel), Business Pro Rp 249rb (Resep BOM + KDS Dapur / Multi-Batch FIFO), dan Enterprise Rp 599rb.",
    url: "https://kadai.asia/harga",
    images: [{ url: "https://kadai.asia/og-image.png", width: 1200, height: 630 }],
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
      "1 Gerai (Outlet) & 1 Akun Kasir",
      "Hingga 50 Produk SKU",
      "Pencatatan Penjualan Kasir Kilat",
      "Cetak Struk Thermal Bluetooth/USB",
      "Laporan Penjualan Harian",
    ],
    cta: "Mulai Gratis",
    popular: false,
  },
  {
    name: "Professional",
    badge: "Paling Fleksibel",
    price: "Rp 99.000",
    period: "/bulan",
    desc: "Untuk kedai kafe atau toko ritel aktif yang membutuhkan operasional 1 gerai tuntas.",
    features: [
      "1 Gerai & Hingga 3 Akun Kasir",
      "Produk & Transaksi Tanpa Batas",
      "F&B: QR Meja & Pemesanan Mandiri",
      "Ritel: Barcode Scanner & Peringatan Kadaluwarsa",
      "Pembukuan Kas & Pajak SAK EMKM",
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
    desc: "Solusi lengkap bisnis berkembang dengan manajemen bahan baku resep, dapur, dan multi-cabang.",
    features: [
      "Hingga 3 Gerai (Outlet)",
      "F&B: Resep Bahan Baku (BOM) & Layar Dapur KDS",
      "Ritel: Inventori Multi-Batch (FIFO & FEFO Asli)",
      "Transfer Stok Antar Outlet (Surat Jalan)",
      "Rekap PB1/PPN & PPh Final PP 55/2022",
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
      "Routing Pesanan Antar-Sentra Produksi",
      "Rekonsiliasi Pajak Konsolidasi Grup",
      "Akses API Integrasi Kustom",
      "Dedicated Account Manager & SLA 99.9%",
    ],
    cta: "Hubungi Enterprise",
    popular: false,
  },
];

export default function HargaPage() {
  return (
    <LandingPageShell
      badgeText="TRANSPARAN TANPA BIAYA TERSEMBUNYI"
      title="Investasi Terjangkau untuk Pertumbuhan Bisnis Nyata"
      description="Pilih paket yang sesuai dengan skala usaha Anda. Tanpa kontrak jangka panjang yang mengikat, bebas upgrade atau downgrade kapan saja."
    >
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
                  <Badge className="bg-primary hover:bg-primary text-white font-bold text-[11px] px-3 py-0.5 rounded-lg shadow-sm uppercase tracking-wider">
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
                  <td className="py-3 px-4 text-center text-slate-400 font-medium">Opsional F&B</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Multi-Stasiun</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Routing CK</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Manajemen Meja & QR Self-Order</td>
                  <td className="py-3 px-4 text-center text-slate-300">—</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Termasuk (F&B)</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Termasuk</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Termasuk</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Barcode Scanner & Radar Expired Date</td>
                  <td className="py-3 px-4 text-center text-slate-300">—</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Termasuk (Ritel)</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Lengkap</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Multi-Gudang</td>
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
                  <td className="py-3 px-4 font-medium">Buku Kas & Modal Belanja Operasional</td>
                  <td className="py-3 px-4 text-center text-slate-300">—</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Kas Kasir</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Multi-Kantong (Kasir & Dapur)</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Terkonsolidasi</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Migrasi Data Cepat Kasir Lama (Excel/CSV)</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Gratis Selamanya</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Gratis Selamanya</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Gratis Selamanya</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Prioritas Assisted</td>
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
      </LandingPageShell>
  );
}