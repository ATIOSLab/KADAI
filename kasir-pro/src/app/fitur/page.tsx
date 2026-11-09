import { Metadata } from "next";

export const revalidate = 300;
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Layers,
  ChefHat,
  Receipt,
  ShoppingBag,
  Warehouse,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { LandingPageShell } from "@/components/landing/landing-page-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Fitur & Kapabilitas Sistem Operasi Bisnis",
  description:
    "Jelajahi kapabilitas terpadu KADAI: kasir POS kilat, inventori multi-batch fleksibel (FIFO, FEFO, Average), dapur KDS, resep BOM, kepatuhan pajak daerah PB1 10%, dan integrasi multi-cabang.",
  alternates: {
    canonical: "https://kadai.asia/fitur",
  },
  openGraph: {
    title: "Fitur & Kapabilitas Sistem Operasi Bisnis | KADAI",
    description:
      "Kasir POS kilat, inventori multi-batch fleksibel (FIFO, FEFO, Average), kitchen display KDS, resep produksi BOM, dan kepatuhan pajak SAK EMKM.",
    url: "https://kadai.asia/fitur",
    images: [{ url: "https://kadai.asia/og-image.png", width: 1200, height: 630 }],
  },
};

const featureList = [
  {
    slug: "kasir-pos",
    title: "Kasir POS Kilat",
    subtitle: "Terminal Penjualan Sentuh & Tombol Pintas F2/F4",
    desc: "Transaksi kasir berkecepatan tinggi dengan pencarian produk instan, dukungan barcode scanner fisik, tombol pembayaran uang pas, dan cetak struk thermal 58mm/80mm.",
    icon: ShoppingBag,
    badge: "Kecepatan Kasir",
    metrics: "< 0.2 detik per transaksi",
    specs: [
      "Tombol cepat pencarian (F2) & bayar langsung (F4)",
      "Pilihan nominal pecahan rupiah kilat & uang pas",
      "Cetak struk thermal USB/Bluetooth ESC/POS 58/80mm",
      "Pemisahan pesanan meja (split-bill) & take away",
    ],
  },
  {
    slug: "inventori-fifo",
    title: "Inventori Multi-Batch (FIFO / FEFO / Average)",
    subtitle: "Penilaian Persediaan Fleksibel Berstandar PSAK 14",
    desc: "Sistem melacak setiap batch stok barang masuk lengkap dengan tanggal kadaluwarsa, vendor asal, dan harga perolehan historis. Mendukung metode First-In First-Out, First-Expired First-Out, maupun Moving Average.",
    icon: Layers,
    badge: "PSAK 14 / IAS 2",
    metrics: "100% Lacak Batch & Kadaluwarsa",
    specs: [
      "Penilaian persediaan First-In, First-Out otomatis",
      "Radar peringatan batch stok mendekati kadaluwarsa",
      "Penyesuaian stok opname fisik berbasis alasan tercatat",
      "Notifikasi stok minimum per gerai sebelum kehabisan",
    ],
  },
  {
    slug: "dapur-kds",
    title: "Layar Dapur & Bar (KDS)",
    subtitle: "Kitchen Display System Tanpa Kertas",
    desc: "Pesanan dari kasir atau scan QR pelanggan langsung terkirim ke layar stasiun dapur dan bar minuman secara real-time dengan sinyal audio lonceng bel pesanan baru.",
    icon: ChefHat,
    badge: "Operasional F&B",
    metrics: "Zero Kertas Tiket Hilang",
    specs: [
      "Routing cerdas: stasiun makanan panas, dingin, dan bar",
      "Pengatur waktu durasi pengerjaan pesanan antrean",
      "Efek audio lonceng web audio sintetis tanpa file eksternal",
      "Status dinamis: Antre, Dimasak, Siap Saji",
    ],
  },
  {
    slug: "resep-bom",
    title: "Resep Produksi (BOM)",
    subtitle: "Bill of Materials & Pemotongan HPP Otomatis",
    desc: "Tautkan formula bahan baku ke menu jadi. Setiap kali 1 porsi menu terjual di kasir, stok bahan dasar (seperti biji kopi, susu, saus) terpotong presisi sesuai takaran resep.",
    icon: Zap,
    badge: "HPP Presisi",
    metrics: "Kalkulasi HPP Real-Time",
    specs: [
      "Multi-level komposisi bahan baku per unit porsi",
      "Perhitungan Harga Pokok Penjualan (HPP) otomatis",
      "Dukungan konversi satuan: kg, gram, liter, ml, pcs",
      "Pencatatan produksi batch porsi masal dapur",
    ],
  },
  {
    slug: "pembukuan-pajak",
    title: "Pajak Daerah & SAK EMKM",
    subtitle: "Kepatuhan Regulasi Indonesia Terpasang Otomatis",
    desc: "Sistem otomatis menghitung pajak restoran/PB1 10% dan PPh Final 0.5% (PP 55/2022). Jurnal buku besar dan ringkasan laba kotor tersusun tanpa perlu software akuntansi terpisah.",
    icon: Receipt,
    badge: "Regulasi RI",
    metrics: "PB1 10% & PPh Final 0.5%",
    specs: [
      "Pemisahan nilai subtotal dan pungutan PB1 10%",
      "Simulasi PPh Final UMKM 0.5% atas omzet bruto",
      "Laporan laba kotor real-time per outlet dan tanggal",
      "Rekonsiliasi arus kas masuk shift kasir X/Z report",
    ],
  },
  {
    slug: "kas-modal-belanja",
    title: "Buku Kas & Modal Belanja Operasional (Petty Cash)",
    subtitle: "Pemisahan Kas Laci Kasir & Dana Belanja Dapur",
    desc: "Sistem dual-kantong kas memisahkan uang kembalian kasir dari dana belanja harian koki/staf (pasar, es batu, bumbu). Suntikan modal kerja owner tercatat rapi dan rekonsiliasi kas harian otomatis presisi.",
    icon: ShoppingBag,
    badge: "Arus Kas Rapi",
    metrics: "Zero Selisih Laci Kas",
    specs: [
      "Pemisahan Kantong Kas Kasir vs Kas Belanja Tim Dapur",
      "Pencatatan kas masuk modal kerja & kas keluar operasional",
      "Otorisasi supervisor PIN untuk belanja di atas batas limit",
      "Rekonsiliasi otomatis fisik kas saat tutup shift Z-Report",
    ],
  },
  {
    slug: "migrasi-ai-import",
    title: "AI Smart Import & Migrasi Data Cepat",
    subtitle: "Pindah dari Kasir Lain dalam 1 Detik Bebas Biaya",
    desc: "Cukup unggah file Excel atau CSV dari aplikasi kasir lama (Moka, Majoo, Pawoon, Olsera, dsb). Algoritma AI cerdas KADAI otomatis mengenali kolom nama barang, harga, HPP, kategori, dan stok awal tanpa repot input manual satu per satu.",
    icon: Zap,
    badge: "100% Gratis",
    metrics: "Impor Ribuan SKU Sub-Detik",
    specs: [
      "Deteksi otomatis header kolom CSV/Excel tanpa format kaku",
      "Pembuatan otomatis kategori produk dan batch stok awal FIFO",
      "Pratinjau tabel interaktif sebelum konfirmasi eksekusi",
      "Tersedia gratis di seluruh tier paket termasuk Starter",
    ],
  },
  {
    slug: "multi-cabang",
    title: "Konsolidasi Multi-Cabang",
    subtitle: "Kendali Grup Bisnis dari Satu Akun Terpusat",
    desc: "Kelola puluhan gerai atau gudang cabang. Terbitkan surat jalan mutasi stok antar gerai, kunci hak akses staf kasir (RBAC), dan pantau grafik omzet konsolidasian di smartphone.",
    icon: Warehouse,
    badge: "Skala Bisnis",
    metrics: "Multi-Outlet Terpadu",
    specs: [
      "Transfer stok antar-cabang dengan approval dua arah",
      "Surat jalan digital dan pelacakan barang dalam perjalanan",
      "Hak akses berjenjang: Owner, Manajer, Kasir, Kitchen",
      "Laporan penjualan gabungan seluruh cabang real-time",
    ],
  },
];

export default function FiturIndexPage() {
  return (
    <LandingPageShell
      badgeText="KAPABILITAS SISTEM KADAI"
      title="Satu Ekosistem Lengkap untuk Seluruh Urusan Operasional"
      description="Bukan sekadar aplikasi pencatat pesanan. KADAI menggabungkan terminal kasir, pelacakan inventori berstandar PSAK 14, alur produksi dapur, hingga rekonsiliasi pajak daerah dalam satu platform terpadu."
    >
      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureList.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.slug}
                id={item.slug}
                className="flex flex-col h-full bg-white/80 backdrop-blur-md border-slate-200/80 shadow-xs hover:shadow-md transition-all rounded-2xl group"
              >
                <CardHeader className="pb-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                      <Icon className="size-5" />
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {item.badge}
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-950 group-hover:text-primary transition-colors">
                      {item.title}
                    </CardTitle>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 space-y-4">
                  <CardDescription className="text-xs sm:text-sm text-slate-600 leading-relaxed min-h-[50px]">
                    {item.desc}
                  </CardDescription>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                    <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-800">
                      Metrik Inti: {item.metrics}
                    </span>
                  </div>

                  <ul className="space-y-2 pt-2 border-t border-slate-100 mt-auto">
                    {item.specs.map((spec, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4">
                    <Button asChild variant="outline" className="w-full text-xs font-bold rounded-xl group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors">
                      <Link href="/register" className="flex items-center justify-center gap-1.5">
                        <span>Coba Fitur {item.title}</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom Conversion Banner */}
        <div className="rounded-3xl bg-slate-950 text-white p-8 sm:p-12 relative overflow-hidden text-center space-y-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Siap Mengotomatiskan Operasional Usaha Anda?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Daftar dalam 2 menit tanpa kartu kredit. Dapatkan akses penuh ke kasir POS, modul inventori FIFO, dan laporan pajak.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-white px-6">
              <Link href="/register">Mulai Uji Coba Gratis 14 Hari</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl font-semibold bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Link href="/harga">Lihat Paket Langganan</Link>
            </Button>
          </div>
        </div>
      </LandingPageShell>
  );
}