import { Metadata } from "next";
import Link from "next/link";
import {
  UtensilsCrossed,
  Store,
  Warehouse,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Solusi Industri: F&B, Ritel, & Dapur Pusat | KADAI",
  description:
    "Solusi sistem operasional kasir dan rantai pasok terarah untuk kafe, restoran, toko ritel, minimarket, serta sentra dapur pusat dan gudang distribusi.",
  alternates: {
    canonical: "https://kadai.asia/solusi",
  },
};

const solutions = [
  {
    slug: "kuliner-fnb",
    title: "Kafe, Restoran & Kuliner (F&B)",
    category: "Food & Beverage",
    desc: "Dirancang untuk ritme cepat industri kuliner. Kelola pesanan meja, pemisahan tagihan, tiket otomatis ke stasiun dapur/bar, dan resep bahan baku (BOM) presisi.",
    icon: UtensilsCrossed,
    painPoints: [
      "Tiket kertas dapur rawan hilang atau terlewat saat jam sibuk",
      "Selisih stok bahan baku mahal (daging, keju, sirup) tanpa jejak",
      "Pusing memisahkan pungutan pajak restoran PB1 10%",
    ],
    features: [
      "Kitchen Display System (KDS) stasiun dapur & bar dengan bel audio",
      "Bill of Materials (BOM) pemotongan bahan baku otomatis per porsi",
      "Manajemen denah meja & pemisahan tagihan kasir (split-bill)",
      "Pemisahan pajak restoran daerah PB1 10% di setiap struk",
    ],
  },
  {
    slug: "ritel-minimarket",
    title: "Toko Ritel, Minimarket & Fashion",
    category: "Retail & Commerce",
    desc: "Kecepatan transaksi kasir tinggi untuk gerai dengan ribuan SKU. Scan barcode USB kilat, kontrol varian warna/ukuran, dan deteksi barang kadaluwarsa.",
    icon: Store,
    painPoints: [
      "Antrean kasir menumpuk karena pencarian nama barang lambat",
      "Barang di rak kedaluwarsa tanpa diketahui, menyebabkan kerugian",
      "Stok fisik gudang tidak sinkron dengan catatan kasir",
    ],
    features: [
      "Input kilat barcode scanner fisik & tombol pintas F2/F4",
      "Inventori batch FIFO (PSAK 14) dengan radar tanggal kedaluwarsa",
      "Dukungan varian produk dinamis: ukuran, warna, aroma",
      "Peringatan otomatis saat stok barang mencapai batas minimum",
    ],
  },
  {
    slug: "dapur-pusat-gudang",
    title: "Dapur Pusat & Multi-Gudang",
    category: "Central Kitchen & Logistics",
    desc: "Standarisasi resep porsi massal dan distribusi bahan baku antar cabang. Terbitkan surat jalan digital dan pantau persediaan antar outlet tanpa kebocoran.",
    icon: Warehouse,
    painPoints: [
      "Cabang mengeluh rasa dan kualitas menu tidak konsisten",
      "Pengiriman bahan baku antar cabang rawan hilang di perjalanan",
      "Owner kesulitan melihat stok total gabungan seluruh gerai",
    ],
    features: [
      "Pencatatan produksi porsi massal (batching) dapur pusat",
      "Surat jalan mutasi stok cabang dengan persetujuan penerimaan",
      "Laporan konsolidasian omzet dan persediaan seluruh outlet",
      "Otorisasi bertingkat (RBAC) untuk melindungi data finansial pusat",
    ],
  },
];

export default function SolusiIndexPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased">
      <SiteHeader dashboardPath={null} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-16">
        {/* Header Breadcrumb & Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="outline" className="px-3 py-1 text-xs font-semibold rounded-full border-primary/30 text-primary bg-primary/5">
            SOLUSI INDUSTRI KADAI
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950">
            Disesuaikan dengan Alur Kerja Sektor Usaha Anda
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed text-balance">
            Setiap industri memiliki tantangan operasional unik. KADAI menyediakan alur konfigurasi khusus agar kasir, dapur, dan gudang berjalan selaras tanpa gesekan.
          </p>
        </div>

        {/* Solutions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {solutions.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.slug}
                id={item.slug}
                className="flex flex-col h-full bg-white/90 backdrop-blur-md border-slate-200/90 shadow-xs hover:shadow-lg transition-all rounded-3xl overflow-hidden group"
              >
                <div className="p-6 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                  <span className="size-12 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                    <Icon className="size-6" />
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-bold bg-white text-slate-700 border border-slate-200/60">
                    {item.category}
                  </Badge>
                </div>

                <CardHeader className="pb-3 space-y-2">
                  <CardTitle className="text-2xl font-bold text-slate-950 group-hover:text-primary transition-colors">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.desc}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 space-y-5">
                  {/* Solusi Masalah */}
                  <div className="p-3.5 rounded-2xl bg-orange-50/50 border border-orange-100 space-y-2">
                    <span className="text-[11px] font-bold text-orange-950 block">
                      Tantangan Yang Diselesaikan:
                    </span>
                    <ul className="space-y-1.5">
                      {item.painPoints.map((p, idx) => (
                        <li key={idx} className="text-xs text-orange-900/80 flex items-start gap-1.5">
                          <span className="text-primary font-bold">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Fitur Utama */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 mt-auto">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Modul Unggulan:
                    </span>
                    <ul className="space-y-2">
                      {item.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4">
                    <Button asChild className="w-full text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-xs">
                      <Link href="/register" className="flex items-center justify-center gap-1.5">
                        <span>Pilih Solusi {item.title.split(",")[0]}</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}