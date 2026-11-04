import Link from "next/link";
import { getServerSessionUser } from "@/lib/session";
import { getDefaultPathForRole } from "@/lib/rbac";
import {
  ShoppingCart,
  Store,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  TrendingUp,
  Receipt,
  ChefHat,
  Warehouse,
  FileSpreadsheet,
  Users,
  QrCode,
  Lock,
  Server,
  Building,
  Laptop,
  Check,
  X,
  PhoneCall,
  Flame,
} from "lucide-react";
import { EnterpriseInteractiveShowcase } from "@/components/landing/enterprise-interactive-showcase";
import { IndustrySolutionsTabs } from "@/components/landing/industry-solutions-tabs";
import { PricingCalculator } from "@/components/landing/pricing-calculator";
import { FaqAccordion } from "@/components/landing/faq-accordion";

export default async function HomePage() {
  const sessionUser = await getServerSessionUser();
  const dashboardPath = sessionUser ? getDefaultPathForRole(sessionUser.role) : null;

  const clientClusters = [
    {
      name: "Dimsum Imperial Heritage",
      category: "Restoran & Central Kitchen",
      tag: "Kuliner Modern",
      icon: ChefHat,
      stats: "2 Cabang • Resep BOM",
      highlight:
        "Otomatisasi potong gramasi bahan mentah daging & tepung saat pesanan masuk, serta routing tiket KDS terpisah antara kukusan dan station bar.",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    },
    {
      name: "Gentlemen & Co.",
      category: "Barbershop & Grooming",
      tag: "Jasa & Servis",
      icon: Users,
      stats: "4 Kursi • CRM Poin",
      highlight:
        "Bundling transaksi potong rambut dan produk pomade dalam 1 nota dengan kalkulasi komisi kapster otomatis dan poin loyalitas pelanggan.",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    },
    {
      name: "GlowAura Aesthetic Clinic",
      category: "Klinik Estetika & Apotek",
      tag: "Medis & Farmasi",
      icon: ShieldCheck,
      stats: "5 Poli • Batch FIFO",
      highlight:
        "Pelacakan nomor batch serum dan expired date ketat, serta pemisahan biaya tindakan medis dokter dari produk krim racikan kasir.",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    },
    {
      name: "Toko Sembako Berkah Jaya",
      category: "Retail Grosir & Eceran",
      tag: "Minimarket / Ritel",
      icon: Store,
      stats: "1.000+ SKU • Barcode",
      highlight:
        "Kecepatan scan barcode kasir 0.18 detik, mutasi antar rak grosir, kartu stok persediaan terintegrasi, dan notifikasi stok menipis.",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    {
      name: "Bakso Mas Sigit Solo",
      category: "Kuliner Tradisional & Warung",
      tag: "Warung Makanan",
      icon: Receipt,
      stats: "1 Cabang • PB1 Restoran",
      highlight:
        "Pencatatan kasir pesanan kilat, perhitungan pajak restoran PB1 10% otomatis untuk Pemda, dan sinkronisasi monitor racik kuah dapur.",
      badgeColor: "bg-orange-100 text-orange-800 border-orange-200",
    },
    {
      name: "Ruang Temu Coffee & Eatery",
      category: "Kafe & Roastery",
      tag: "Coffee Shop & F&B",
      icon: QrCode,
      stats: "18 Meja • QR Order",
      highlight:
        "Pelanggan pesan langsung lewat QR code meja, order langsung muncul di tablet Barista dan Pastry chef tanpa antre di meja kasir.",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
    },
  ];

  const comparisonFeatures = [
    {
      feature: "Kecepatan Scan & Pemrosesan Transaksi",
      traditional: "1.5 - 3.0 detik (sering freeze jika katalog besar)",
      kadai: "< 0.2 detik (arsitektur non-blocking indexed cache)",
    },
    {
      feature: "Manajemen Resep Bahan Baku (BOM)",
      traditional: "Manual di buku/Excel terpisah, sering tekor",
      kadai: "Otomatis potong gramasi bahan baku saat transaksi POS",
    },
    {
      feature: "Layar Monitor Dapur (KDS)",
      traditional: "Pakai kertas nota thermal (sering hilang & kotor)",
      kadai: "Layar KDS interaktif dengan timer dan status siap saji",
    },
    {
      feature: "Pajak Restoran PB1 10% & PPN 11%",
      traditional: "Kasir hitung manual atau rekap ulang tiap akhir bulan",
      kadai: "Dual-tax engine otomatis siap setor Pemda/DJP",
    },
    {
      feature: "Pelacakan Batch & Expired Date",
      traditional: "Tidak ada (risiko barang kadaluarsa terjual)",
      kadai: "Multi-Batch FIFO dengan alert peringatan dini",
    },
    {
      feature: "Otorisasi Diskon & Void Transaksi",
      traditional: "Bebas tanpa kontrol (rawan fraud/kecurangan kasir)",
      kadai: "Wajib Supervisor PIN terenkripsi dengan audit log",
    },
    {
      feature: "Perangkat & Kebutuhan Hardware",
      traditional: "Wajib beli mesin kasir proprietary jutaan rupiah",
      kadai: "Jalan di HP, tablet Android/iPad, laptop, & printer thermal",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Enterprise Ticker Bar */}
      <div className="bg-slate-950 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold text-[10px] tracking-wide uppercase border border-orange-500/30">
              <Sparkles className="size-3" /> Baru: KADAI v2.4
            </span>
            <span className="hidden sm:inline text-slate-300 text-xs">
              Kitchen Display System (KDS) & Multi-Batch FIFO resmi meluncur untuk seluruh outlet aktif.
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="hidden md:flex items-center gap-1.5 text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              SLA Cloud 99.98%
            </span>
            <Link
              href="/login"
              className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1"
            >
              <span>Akses Demo Klien</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Sticky Main Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black shadow-sm">
              <Store className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-950">KADAI</span>
                <span className="text-[10px] font-extrabold uppercase bg-slate-900 text-white px-1.5 py-0.2 rounded font-mono">
                  ENTERPRISE
                </span>
              </div>
              <p className="text-[10px] text-slate-500 -mt-0.5 font-medium hidden sm:block">
                Modern Cloud POS & Business ERP
              </p>
            </div>
          </Link>

          {/* Center Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#demo" className="hover:text-orange-600 transition-colors">
              Demo Interaktif
            </a>
            <a href="#solusi" className="hover:text-orange-600 transition-colors">
              Solusi Industri
            </a>
            <a href="#fitur" className="hover:text-orange-600 transition-colors">
              Arsitektur Sistem
            </a>
            <a href="#klaster" className="hover:text-orange-600 transition-colors">
              Klien Terverifikasi
            </a>
            <a href="#komparasi" className="hover:text-orange-600 transition-colors">
              Perbandingan
            </a>
            <a href="#harga" className="hover:text-orange-600 transition-colors">
              Paket Harga
            </a>
            <a href="#faq" className="hover:text-orange-600 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {dashboardPath ? (
              <div className="flex items-center gap-2">
                <Link
                  href={dashboardPath}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200"
                >
                  Dashboard
                </Link>
                <Link
                  href="/pos"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 shadow-sm transition-all flex items-center gap-1.5"
                >
                  <ShoppingCart className="size-3.5" />
                  <span>Buka Kasir</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-950 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 shadow-sm transition-all flex items-center gap-1.5"
                >
                  <span>Coba 14 Hari Gratis</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-24 overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/80 border border-orange-200 text-orange-900 text-xs font-bold shadow-xs">
              <span className="size-2 rounded-full bg-orange-600 animate-pulse" />
              <span>Platform POS & ERP Standar Kemenkeu & SAK EMKM RI</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.12]">
              Satu Platform Kasir & ERP Terpadu untuk{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
                Operasi Bisnis Indonesia.
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Menyatukan kasir kilat 0.2 detik, multi-batch FIFO inventory, resep otomatis Bill of Materials (BOM),
              monitor dapur (KDS) realtime, hingga kepatuhan pajak PB1 & PPN 11% yang siap diaudit perbankan dan DJP.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/register"
                className="px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-600/20 transition-all flex items-center gap-2"
              >
                <span>Mulai Uji Coba 14 Hari Gratis</span>
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#demo"
                className="px-6 py-3.5 rounded-xl text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs transition-all flex items-center gap-2"
              >
                <Laptop className="size-4 text-orange-600" />
                <span>Lihat Demo Interaktif</span>
              </a>
              <Link
                href="/login"
                className="px-4 py-3.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Login Akun Demo →
              </Link>
            </div>

            {/* Value Telemetry Strip */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
              <div className="p-3 bg-white/80 rounded-xl border border-slate-200/90 shadow-xs text-center">
                <div className="text-[11px] font-semibold text-slate-500">Respon Kasir</div>
                <div className="text-base font-black text-slate-900 font-mono mt-0.5">&lt; 0.2 Detik</div>
              </div>
              <div className="p-3 bg-white/80 rounded-xl border border-slate-200/90 shadow-xs text-center">
                <div className="text-[11px] font-semibold text-slate-500">Sistem Inventori</div>
                <div className="text-base font-black text-slate-900 font-mono mt-0.5">FIFO Multi-Batch</div>
              </div>
              <div className="p-3 bg-white/80 rounded-xl border border-slate-200/90 shadow-xs text-center">
                <div className="text-[11px] font-semibold text-slate-500">Standar Akuntansi</div>
                <div className="text-base font-black text-slate-900 font-mono mt-0.5">SAK EMKM RI</div>
              </div>
              <div className="p-3 bg-white/80 rounded-xl border border-slate-200/90 shadow-xs text-center">
                <div className="text-[11px] font-semibold text-slate-500">Otorisasi Kasir</div>
                <div className="text-base font-black text-slate-900 font-mono mt-0.5">6-Role + PIN</div>
              </div>
            </div>
          </div>

          {/* Interactive Live Demo Window */}
          <div id="demo" className="pt-4 scroll-mt-24">
            <div className="text-center mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">
                Live Interactive Preview
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Klik tab di bawah untuk mencoba simulasi modul POS Kasir, KDS Dapur, Inventori FIFO, dan Laporan Pajak.
              </p>
            </div>
            <EnterpriseInteractiveShowcase />
          </div>
        </div>
      </section>

      {/* Production Client Clusters */}
      <section id="klaster" className="py-16 sm:py-20 border-b border-slate-200 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Building className="size-3.5 text-orange-600" />
              <span>Implementasi Nyata Lintas Industri</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Terbukti Andal di Berbagai Model Bisnis Indonesia
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Dari restoran multi-outlet, kafe roastery, toko sembako grosir 1.000+ SKU, hingga jaringan barbershop dan klinik farmasi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clientClusters.map((c, i) => {
              const Icon = c.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 p-6 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${c.badgeColor}`}>
                        {c.tag}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500">{c.stats}</span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-base text-slate-950">{c.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">{c.category}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3">
                      {c.highlight}
                    </p>
                  </div>

                  <Link
                    href="/login"
                    className="pt-2 flex items-center justify-between text-xs font-bold text-orange-600 hover:text-orange-700"
                  >
                    <span>Masuk Sebagai Klaster Ini</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enterprise System Architecture (Bento Grid) */}
      <section id="fitur" className="py-16 sm:py-20 border-b border-slate-200 bg-slate-100/60 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-2.5 py-1 rounded-md">
              <Layers className="size-3.5" />
              <span>Arsitektur Fitur Terpadu</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Dibangun Khusus untuk Kecepatan dan Kepatuhan
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Setiap komponen dirancang tanpa celah untuk memastikan kasir tidak pernah macet dan data keuangan selalu akurat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento 1: Kasir Kilat (Col 2) */}
            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="size-11 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                  <Zap className="size-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950">
                  Mesin Kasir Kilat 0.2s & Dual Thermal 58/80mm
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                  Dirancang untuk menangani lonjakan antrean ribuan pelanggan per hari. Kompatibel dengan semua printer thermal USB/Bluetooth, barcode scanner nirkabel, cash drawer otomatis, serta struk digital via WhatsApp.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-800">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="text-slate-500 text-[10px]">Pencarian Item</div>
                  <div className="font-bold text-slate-900 mt-0.5">Barcode & Nama</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="text-slate-500 text-[10px]">Ketahanan Sinyal</div>
                  <div className="font-bold text-slate-900 mt-0.5">Offline-Resilient</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="text-slate-500 text-[10px]">Tipe Kertas</div>
                  <div className="font-bold text-slate-900 mt-0.5">58mm & 80mm</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="text-slate-500 text-[10px]">Metode Bayar</div>
                  <div className="font-bold text-slate-900 mt-0.5">QRIS, Cash, EDC</div>
                </div>
              </div>
            </div>

            {/* Bento 2: Resep BOM */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="size-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <ChefHat className="size-6" />
                </div>
                <h3 className="text-lg font-black text-slate-950">Resep Otomatis Bill of Materials (BOM)</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Stok bahan mentah (daging, tepung, susu, sirup, kopi) otomatis terpotong presisi per gram setiap kali menu terjual di POS.
                </p>
              </div>
              <div className="text-xs font-bold text-emerald-600 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                ✓ Akurasi HPP Porsi Realtime
              </div>
            </div>

            {/* Bento 3: Kitchen Display System */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="size-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <Flame className="size-6" />
                </div>
                <h3 className="text-lg font-black text-slate-950">Kitchen Display System (KDS)</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Hilangkan kertas bon hilang. Pesanan masuk otomatis ke layar monitor koki dan barista dengan pemisah station Dapur vs Bar.
                </p>
              </div>
              <div className="text-xs font-bold text-orange-600 bg-orange-50 p-2.5 rounded-lg border border-orange-100">
                ✓ Dilengkapi Notifikasi Suara Chime
              </div>
            </div>

            {/* Bento 4: Self Order QR Meja */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="size-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <QrCode className="size-6" />
                </div>
                <h3 className="text-lg font-black text-slate-950">Self-Order QR Meja Dinamis</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pelanggan scan QR di meja restoran untuk melihat buku menu digital, memesan tanpa menunggu pelayan, dan langsung sinkron ke kasir.
                </p>
              </div>
              <div className="text-xs font-bold text-blue-700 bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                ✓ Tanpa Perlu Install Aplikasi
              </div>
            </div>

            {/* Bento 5: Pajak & SAK EMKM (Col 2) */}
            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="size-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <TrendingUp className="size-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950">
                  Kepatuhan Pajak PB1 10%, PPN 11%, & SAK EMKM RI
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                  Buku kas otomatis, perhitungan HPP FIFO, laporan Laba Rugi real-time, serta monitoring batas omzet tahunan Rp 500 Juta untuk pelaporan PPh Final UMKM 0.5% sesuai PP 55/2022.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="font-bold text-slate-900">Pajak Restoran PB1</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Otomatis dipisahkan untuk Bapenda</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="font-bold text-slate-900">HPP Metode FIFO</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Laba kotor dihitung per batch barang</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="font-bold text-slate-900">Format Laporan Bank</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Siap diajukan untuk pinjaman usaha/KUR</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Industry Solutions Tabs */}
      <section id="solusi" className="py-16 sm:py-20 border-b border-slate-200 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-2.5 py-1 rounded-md">
              <Store className="size-3.5" />
              <span>Solusi Khusus Sektor</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Dirancang Spesifik untuk Karakter Usaha Anda
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Pilih sektor bisnis Anda untuk melihat bagaimana KADAI mengoptimalkan alur operasional dari hulu ke hilir.
            </p>
          </div>

          <IndustrySolutionsTabs />
        </div>
      </section>

      {/* Head-to-Head Comparison */}
      <section id="komparasi" className="py-16 sm:py-20 border-b border-slate-200 bg-slate-50 scroll-mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Analisis Komparasi</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Mengapa Jaringan Bisnis Beralih ke KADAI Enterprise?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Perbandingan objektif antara aplikasi kasir jadul / mesin kasir konvensional dengan ekosistem modern KADAI.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="py-4 px-4 sm:px-6 font-bold w-1/3">Kapabilitas Sistem</th>
                    <th className="py-4 px-4 sm:px-6 font-bold w-1/3 text-slate-300">Aplikasi Kasir Konvensional</th>
                    <th className="py-4 px-4 sm:px-6 font-black w-1/3 text-orange-400 bg-slate-950">
                      KADAI Enterprise Cloud
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {comparisonFeatures.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 sm:px-6 font-bold text-slate-900">
                        {item.feature}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-slate-500 flex items-center gap-2">
                        <X className="size-4 text-rose-500 shrink-0" />
                        <span>{item.traditional}</span>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-slate-950 font-bold bg-orange-50/30">
                        <div className="flex items-center gap-2">
                          <Check className="size-4 text-emerald-600 shrink-0" />
                          <span>{item.kadai}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="harga" className="py-16 sm:py-20 border-b border-slate-200 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-2.5 py-1 rounded-md">
              <Sparkles className="size-3.5" />
              <span>Transparan & Skalabel</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Investasi Terjangkau untuk Pertumbuhan Bisnis Anda
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Semua paket menyertakan garansi ketersediaan cloud, pembaruan sistem berkala, dan tanpa biaya transaksi tersembunyi.
            </p>
          </div>

          <PricingCalculator />
        </div>
      </section>

      {/* Security & Compliance Credentials */}
      <section className="py-12 bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1.5">
              <div className="flex justify-center text-orange-500">
                <Lock className="size-6" />
              </div>
              <div className="text-sm font-bold">Enkripsi Bank-Grade</div>
              <div className="text-xs text-slate-400">TLS 1.3 & HMAC Token Signature</div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-center text-emerald-400">
                <Server className="size-6" />
              </div>
              <div className="text-sm font-bold">Dokploy High Availability</div>
              <div className="text-xs text-slate-400">Auto-heal & 99.98% Cloud Uptime</div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-center text-purple-400">
                <FileSpreadsheet className="size-6" />
              </div>
              <div className="text-sm font-bold">Standar SAK EMKM & PP 55</div>
              <div className="text-xs text-slate-400">Kepatuhan Pajak & Akuntansi RI</div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-center text-amber-400">
                <Warehouse className="size-6" />
              </div>
              <div className="text-sm font-bold">Backup Otomatis Harian</div>
              <div className="text-xs text-slate-400">PostgreSQL WAL Point-in-Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 sm:py-20 border-b border-slate-200 bg-slate-50 scroll-mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pertanyaan yang Sering Diajukan
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Hal-Hal yang Sering Ditanyakan
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Temukan jawaban seputar instalasi perangkat, migrasi data, dan fitur perpajakan KADAI.
            </p>
          </div>

          <FaqAccordion />
        </div>
      </section>

      {/* High-Impact Bottom CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-950 to-slate-900 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-600/20 text-orange-400 text-xs font-bold border border-orange-500/30">
            <Sparkles className="size-3.5" />
            <span>Setup Cepat Kurang Dari 5 Menit</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Siap Mengoptimalkan Operasi Kasir & Inventori Usaha Anda?
          </h2>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Bergabunglah dengan ratusan pengusaha ritel, pemilik restoran, klinik, dan barbershop yang telah mengotomatisasi bisnis mereka bersama KADAI Enterprise.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/register"
              className="px-8 py-4 rounded-xl text-sm font-black text-white bg-orange-600 hover:bg-orange-500 shadow-xl shadow-orange-600/30 transition-all flex items-center gap-2"
            >
              <span>Mulai Uji Coba 14 Hari Gratis</span>
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="https://wa.me/628127634091?text=Halo%20Netkrida%2C%20saya%20ingin%20jadwalkan%20demo%20KADAI%20Enterprise"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-4 rounded-xl text-sm font-bold text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-all flex items-center gap-2"
            >
              <PhoneCall className="size-4 text-emerald-400" />
              <span>Jadwalkan Konsultasi WhatsApp</span>
            </a>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-4">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-400" /> Tanpa Kartu Kredit
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-400" /> Bantuan Setup Gratis
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-400" /> Batalkan Kapan Saja
            </span>
          </div>
        </div>
      </section>

      {/* Enterprise Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-10 border-b border-slate-800/80">
            {/* Col 1: Brand Info */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-black">
                  <Store className="size-4" />
                </div>
                <span className="text-lg font-black tracking-tight text-white">KADAI</span>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                  v2.4
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                Ekosistem cloud point-of-sale dan ERP modular terdepan untuk usaha ritel, restoran, salon jasa, dan klinik di Indonesia.
              </p>
              <div className="text-[11px] text-slate-500">
                Infrastruktur High-Availability & Dokploy Production Server.
              </div>
            </div>

            {/* Col 2: Produk */}
            <div className="space-y-3">
              <div className="font-bold text-white text-xs uppercase tracking-wider">Produk</div>
              <ul className="space-y-2 text-xs">
                <li><a href="#demo" className="hover:text-white transition-colors">POS Kasir Kilat</a></li>
                <li><a href="#demo" className="hover:text-white transition-colors">Kitchen Monitor (KDS)</a></li>
                <li><a href="#demo" className="hover:text-white transition-colors">Resep BOM Bahan Baku</a></li>
                <li><a href="#demo" className="hover:text-white transition-colors">Inventori Multi-Batch FIFO</a></li>
                <li><a href="#demo" className="hover:text-white transition-colors">Self-Order QR Meja</a></li>
              </ul>
            </div>

            {/* Col 3: Solusi Sektor */}
            <div className="space-y-3">
              <div className="font-bold text-white text-xs uppercase tracking-wider">Solusi Industri</div>
              <ul className="space-y-2 text-xs">
                <li><a href="#solusi" className="hover:text-white transition-colors">Resto, Kafe & Kuliner</a></li>
                <li><a href="#solusi" className="hover:text-white transition-colors">Minimarket & Ritel Grosir</a></li>
                <li><a href="#solusi" className="hover:text-white transition-colors">Barbershop & Jasa Servis</a></li>
                <li><a href="#solusi" className="hover:text-white transition-colors">Klinik Estetika & Apotek</a></li>
                <li><a href="#klaster" className="hover:text-white transition-colors">Klaster Demo Resmi</a></li>
              </ul>
            </div>

            {/* Col 4: Kepatuhan & Keamanan */}
            <div className="space-y-3">
              <div className="font-bold text-white text-xs uppercase tracking-wider">Kepatuhan</div>
              <ul className="space-y-2 text-xs">
                <li><span className="text-slate-400">Standar SAK EMKM RI</span></li>
                <li><span className="text-slate-400">Pajak Restoran PB1 10%</span></li>
                <li><span className="text-slate-400">PPh Final PP 55/2022</span></li>
                <li><span className="text-slate-400">Enkripsi Data TLS 1.3</span></li>
                <li><Link href="/login" className="text-orange-400 hover:text-orange-300 font-semibold">Portal Akun Demo</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-xs">
            <div>
              &copy; {new Date().getFullYear()} KADAI. All rights reserved. Sovereign Cloud Enterprise Ecosystem.
            </div>
            <div className="flex items-center gap-6">
              <a href="#demo" className="hover:text-slate-300">Syarat Ketentuan</a>
              <a href="#demo" className="hover:text-slate-300">Kebijakan Privasi</a>
              <a href="#harga" className="hover:text-slate-300">Tingkat Layanan (SLA)</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
