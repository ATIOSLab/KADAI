import { Metadata } from "next";

export const revalidate = 300;
import Link from "next/link";
import {
  Calendar,
  Clock,
  ArrowRight,
} from "lucide-react";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pusat Panduan & Edukasi Operasional Bisnis",
  description:
    "Wawasan praktis seputar tata kelola restoran, ritel modern, metode stok FIFO PSAK 14, dan panduan kepatuhan pajak daerah PB1 10% untuk pengusaha Indonesia.",
  alternates: {
    canonical: "https://kadai.asia/blog",
  },
};

export const articles = [
  {
    slug: "cara-hitung-pajak-restoran-pb1-dan-pph-final",
    title: "Panduan Menghitung Pajak Restoran PB1 10% dan PPh Final 0.5% Tanpa Selisih",
    summary:
      "Penjelasan komprehensif mengenai perbedaan pajak daerah (PB1) yang dipungut dari pelanggan dan pajak penghasilan final UMKM (PP 55/2022) atas omzet usaha.",
    category: "Perpajakan & Legal",
    date: "2026-11-06",
    readTime: "5 min baca",
    author: "Tim Riset Regulasi KADAI",
    tags: ["Pajak Restoran PB1", "PP 55/2022", "SAK EMKM"],
  },
  {
    slug: "mencegah-kerugian-bahan-baku-dengan-metode-fifo-psak-14",
    title: "Strategi Mengurangi Bahan Baku Basi dengan Pencatatan Multi-Batch FIFO",
    summary:
      "Mengapa metode First-In First-Out (FIFO) berstandar PSAK 14 krusial untuk bisnis kuliner dan ritel yang mengelola barang berumur simpan pendek.",
    category: "Manajemen Persediaan",
    date: "2026-11-04",
    readTime: "6 min baca",
    author: "Praktisi Rantai Pasok KADAI",
    tags: ["FIFO", "PSAK 14", "Stok Opname"],
  },
  {
    slug: "standar-operasional-prosedur-kds-dapur-restoran",
    title: "Mengganti Tiket Kertas dengan Kitchen Display System (KDS): SOP Bebas Pesanan Salah",
    summary:
      "Langkah transisi dari printer struk dapur manual ke layar digital interaktif dengan sinyal audio lonceng bel agar kecepatan penyajian meningkat 40%.",
    category: "Operasional Dapur",
    date: "2026-11-02",
    readTime: "4 min baca",
    author: "Spesialis F&B KADAI",
    tags: ["KDS", "Dapur Restoran", "Efisiensi Layanan"],
  },
  {
    slug: "resep-bill-of-materials-bom-untuk-menghitung-hpp-akurat",
    title: "Kalkulasi HPP Presisi: Menghubungkan Bill of Materials (BOM) ke Setiap Penjualan Menu",
    summary:
      "Cara menghitung modal dasar per menu hingga satuan gram/mililiter sehingga margin keuntungan bersih restoran terlindungi dari lonjakan harga pasar.",
    category: "Keuangan & Costing",
    date: "2026-10-28",
    readTime: "7 min baca",
    author: "Analis Keuangan Usaha KADAI",
    tags: ["Bill of Materials", "HPP Kuliner", "Costing"],
  },
];

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased overflow-x-hidden w-full max-w-full">
      <SiteHeader dashboardPath={null} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12 sm:pb-16 space-y-16 overflow-hidden">
        {/* Header Breadcrumb & Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="outline" className="px-3 py-1 text-xs font-semibold rounded-full border-primary/30 text-primary bg-primary/5">
            EDUKASI & PRAKTIK TERBAIK
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950">
            Wawasan Bisnis, Tata Kelola Pajak & Efisiensi Operasional
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed text-balance">
            Panduan aplikatif berbasis pengalaman nyata untuk membantu pemilik bisnis di Indonesia mengelola rantai pasok, dapur, dan kepatuhan perpajakan.
          </p>
        </div>

        {/* Featured Article Card (First) */}
        {articles.length > 0 && (
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-xs hover:shadow-md transition-all group">
            <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center gap-3">
                  <Badge className="bg-primary text-white font-bold text-xs px-3 py-1 rounded-full">
                    Artikel Utama
                  </Badge>
                  <span className="text-xs font-semibold text-slate-500">
                    {articles[0].category}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 group-hover:text-primary transition-colors leading-tight">
                  <Link href={`/blog/${articles[0].slug}`}>
                    {articles[0].title}
                  </Link>
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {articles[0].summary}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="size-3.5 text-slate-400" />
                    {articles[0].date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="size-3.5 text-slate-400" />
                    {articles[0].readTime}
                  </span>
                </div>
              </div>
              <div className="shrink-0 self-center lg:self-end">
                <Button asChild className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-xs">
                  <Link href={`/blog/${articles[0].slug}`} className="flex items-center gap-1.5">
                    <span>Baca Selengkapnya</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Grid Articles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.slice(1).map((art) => (
            <Card
              key={art.slug}
              className="flex flex-col h-full bg-white/80 backdrop-blur-md border-slate-200/80 shadow-xs hover:shadow-md transition-all rounded-2xl group overflow-hidden"
            >
              <CardHeader className="pb-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-[10px] font-bold bg-slate-100 text-slate-700">
                    {art.category}
                  </Badge>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {art.readTime}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-slate-950 group-hover:text-primary transition-colors leading-snug">
                  <Link href={`/blog/${art.slug}`}>
                    {art.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 space-y-4">
                <CardDescription className="text-xs text-slate-600 leading-relaxed min-h-[60px]">
                  {art.summary}
                </CardDescription>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {art.tags.map((t, idx) => (
                    <span key={idx} className="text-[10px] font-medium bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/60">
                      #{t}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 mt-auto">
                  <Link
                    href={`/blog/${art.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:underline"
                  >
                    <span>Baca Panduan</span>
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}