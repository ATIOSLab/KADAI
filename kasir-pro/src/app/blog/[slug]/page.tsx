import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ArticleDetail {
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  intro: string;
  sections: {
    heading: string;
    body: string[];
    callout?: string;
  }[];
}

const articleDatabase: Record<string, ArticleDetail> = {
  "cara-hitung-pajak-restoran-pb1-dan-pph-final": {
    slug: "cara-hitung-pajak-restoran-pb1-dan-pph-final",
    title: "Panduan Menghitung Pajak Restoran PB1 10% dan PPh Final 0.5% Tanpa Selisih",
    category: "Perpajakan & Legal",
    date: "2026-11-06",
    readTime: "5 min baca",
    author: "Tim Riset Regulasi KADAI",
    intro:
      "Banyak pengusaha restoran dan kafe pemula masih bingung membedakan antara Pajak Daerah (PB1 / Pajak Barang dan Jasa Tertentu) yang dititipkan oleh konsumen dengan Pajak Penghasilan (PPh) Final atas omzet usaha. Artikel ini mengupas tuntas cara perhitungannya sesuai Undang-Undang dan regulasi terbaru.",
    sections: [
      {
        heading: "1. Hakikat Pajak Restoran (PB1 / PBJT)",
        body: [
          "PB1 (sekarang diatur dalam UU HKPD sebagai PBJT Makanan dan Minuman) dengan tarif maksimal 10% bukanlah beban biaya bagi restoran, melainkan titipan dari pembeli.",
          "Restoran bertindak sebagai pemungut. Oleh karena itu, uang 10% yang terkumpul dari setiap tagihan kasir tidak boleh diakui sebagai pendapatan (revenue), melainkan dicatat sebagai utang pajak lancar hingga disetorkan ke kas daerah.",
        ],
        callout:
          "Tips KADAI: Selalu pisahkan subtotal makanan/minuman dengan kolom PB1 10% pada struk kasir agar tidak terjadi kekeliruan pencatatan omzet bruto.",
      },
      {
        heading: "2. PPh Final 0.5% Berdasarkan PP 55/2022",
        body: [
          "PPh Final 0.5% merupakan pajak penghasilan yang dibayarkan oleh pelaku usaha dengan omzet tahunan di bawah Rp 4.8 miliar.",
          "Dasar pengenaan pajaknya adalah murni omzet penjualan barang/jasa (subtotal sebelum pajak restoran PB1). Jangan memasukkan nilai PB1 ke dalam dasar perhitungan PPh Final.",
          "Bagi Wajib Pajak Orang Pribadi, omzet kumulatif hingga Rp 500 juta dalam satu tahun pajak tidak dikenai pajak.",
        ],
      },
      {
        heading: "3. Solusi Otomatisasi dengan Sistem KADAI",
        body: [
          "Sistem Operasi Bisnis KADAI telah memprogram formula ini langsung di level kasir. Setiap kali transaksi dibayarkan:",
          "1. Nilai transaksi dipisahkan otomatis antara omzet bersih dan titipan PB1 10%.",
          "2. Jurnal harian menyusun simulasi kewajiban PPh Final 0.5% secara transparan.",
          "3. Laporan bulanan dapat diekspor langsung dalam format yang siap dilaporkan ke Bapenda daerah maupun DJP.",
        ],
      },
    ],
  },
  "mencegah-kerugian-bahan-baku-dengan-metode-fifo-psak-14": {
    slug: "mencegah-kerugian-bahan-baku-dengan-metode-fifo-psak-14",
    title: "Strategi Mengurangi Bahan Baku Basi dengan Pencatatan Multi-Batch FIFO",
    category: "Manajemen Persediaan",
    date: "2026-11-04",
    readTime: "6 min baca",
    author: "Praktisi Rantai Pasok KADAI",
    intro:
      "Kerugian terbesar bisnis F&B dan ritel sering kali bukan berasal dari kurangnya penjualan, melainkan dari bahan baku yang terbuang sia-sia karena kedaluwarsa di dalam gudang. Metode First-In First-Out (FIFO) menjadi standar mutlak pencegahannya.",
    sections: [
      {
        heading: "1. Mengapa Rata-Rata Sederhana Tidak Cukup?",
        body: [
          "Banyak software kasir hanya mencatat persediaan dengan metode rata-rata (Average Cost). Masalahnya, sistem tersebut tidak membedakan mana barang yang dibeli 3 minggu lalu dan mana yang baru datang kemarin.",
          "Akibatnya, staf dapur sering mengambil bahan yang baru datang karena posisinya paling depan di rak, sementara bahan lama membusuk di belakang.",
        ],
      },
      {
        heading: "2. Pelacakan Multi-Batch Berstandar PSAK 14",
        body: [
          "Standar Akuntansi Keuangan (PSAK 14 / IAS 2) mengatur bahwa persediaan harus dinilai berdasarkan arus biaya masuk pertama keluar pertama (FIFO) atau rata-rata tertimbang.",
          "Dengan pelacakan batch per tanggal penerimaan barang, sistem dapat mengarahkan juru masak untuk menghabiskan stok batch terlama terlebih dahulu.",
        ],
        callout:
          "Fitur Radar Kedaluwarsa KADAI memberi peringatan warna kuning (30 hari sebelum kedaluwarsa) dan merah (7 hari sebelum kedaluwarsa) langsung di dashboard owner.",
      },
    ],
  },
  "standar-operasional-prosedur-kds-dapur-restoran": {
    slug: "standar-operasional-prosedur-kds-dapur-restoran",
    title: "Mengganti Tiket Kertas dengan Kitchen Display System (KDS): SOP Bebas Pesanan Salah",
    category: "Operasional Dapur",
    date: "2026-11-02",
    readTime: "4 min baca",
    author: "Spesialis F&B KADAI",
    intro:
      "Kertas struk dapur yang basah, sobek, atau tertumpuk sering menjadi biang keladi pesanan salah dan komplain pelanggan. Simak bagaimana migrasi ke KDS menyelamatkan operasional dapur Anda.",
    sections: [
      {
        heading: "1. Hambatan Alur Tiket Kertas Manual",
        body: [
          "Dalam jam sibuk (peak hour), koki kesulitan memprioritaskan meja mana yang memesan lebih dulu.",
          "Modifikasi pesanan (seperti 'tanpa cabai' atau 'es sedikit') sering tidak terbaca jelas pada kertas struk mini 58mm.",
        ],
      },
      {
        heading: "2. Tampilan Digital KDS KADAI",
        body: [
          "KDS KADAI mengubah tablet atau layar TV dapur menjadi stasiun kerja interaktif.",
          "Setiap tiket memiliki indikator warna durasi tunggu: Hijau (kurang dari 10 menit), Kuning (10-20 menit), dan Merah (lebih dari 20 menit).",
          "Audio bel berdentang setiap ada pesanan baru, memastikan koki tidak perlu terus menerus menatap layar.",
        ],
      },
    ],
  },
  "resep-bill-of-materials-bom-untuk-menghitung-hpp-akurat": {
    slug: "resep-bill-of-materials-bom-untuk-menghitung-hpp-akurat",
    title: "Kalkulasi HPP Presisi: Menghubungkan Bill of Materials (BOM) ke Setiap Penjualan Menu",
    category: "Keuangan & Costing",
    date: "2026-10-28",
    readTime: "7 min baca",
    author: "Analis Keuangan Usaha KADAI",
    intro:
      "Tahukah Anda berapa modal riil dari satu cangkir kopi susu yang Anda jual seharga Rp 22.000? Tanpa rincian formula bahan baku, margin laba yang Anda nikmati bisa jadi semu.",
    sections: [
      {
        heading: "1. Definisi Bill of Materials (BOM) dalam Kuliner",
        body: [
          "BOM adalah daftar lengkap bahan mentah, takaran gramatur, dan biaya perolehan yang dibutuhkan untuk memproduksi satu unit porsi menu jadi.",
          "Misalnya: 1 cup Kopi Susu terdiri atas 18 gram biji kopi espresso, 120 ml susu segar, 20 ml gula aren, dan 1 set cup + sedotan.",
        ],
      },
      {
        heading: "2. Manfaat Pemotongan Bahan Otomatis di Kasir",
        body: [
          "Saat kasir mengetuk tombol 'Jual 1 Kopi Susu', stok biji kopi, susu, dan sirup di gudang langsung terpotong secara otomatis tanpa perlu staf dapur mencatat manual.",
          "Ini mengeliminasi potensi kecurangan (fraud) dan selisih stok misterius di akhir bulan.",
        ],
      },
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = articleDatabase[slug];

  if (!article) {
    return {
      title: "Artikel Tidak Ditemukan | KADAI",
    };
  }

  return {
    title: `${article.title} | Blog KADAI`,
    description: article.intro,
    alternates: {
      canonical: `https://kadai.asia/blog/${slug}`,
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articleDatabase[slug];

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased">
      <SiteHeader dashboardPath={null} />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Kembali ke Pusat Edukasi</span>
        </Link>

        {/* Article Header */}
        <div className="space-y-4">
          <Badge variant="outline" className="text-xs font-semibold px-3 py-1 rounded-full border-primary/30 text-primary bg-primary/5">
            {article.category}
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
            <span className="font-semibold text-slate-800">Oleh {article.author}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              {article.date}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {article.readTime}
            </span>
          </div>
        </div>

        {/* Article Intro */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-slate-700 text-sm sm:text-base leading-relaxed italic border-l-4 border-l-primary">
          {article.intro}
        </div>

        {/* Article Body Sections */}
        <div className="space-y-8 text-slate-800 leading-relaxed">
          {article.sections.map((sec, idx) => (
            <div key={idx} className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-950">
                {sec.heading}
              </h2>
              {sec.body.map((p, pIdx) => (
                <p key={pIdx} className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {p}
                </p>
              ))}
              {sec.callout && (
                <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200/60 text-xs sm:text-sm text-orange-950 flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                  <span>{sec.callout}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Post Bottom CTA */}
        <div className="rounded-3xl bg-slate-950 text-white p-8 space-y-4 mt-12 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 max-w-lg">
            <h3 className="text-lg font-bold text-white">
              Coba Otomatisasi Sistem Ini di Bisnis Anda
            </h3>
            <p className="text-xs text-slate-300">
              Daftar akun KADAI sekarang. Akses modul kasir, inventori FIFO, dan kepatuhan pajak daerah gratis 14 hari.
            </p>
          </div>
          <Button asChild className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shrink-0">
            <Link href="/register">Mulai Uji Coba</Link>
          </Button>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}