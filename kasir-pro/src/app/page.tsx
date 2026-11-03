import Link from "next/link";
import {
  Store,
  ShoppingCart,
  ChefHat,
  QrCode,
  Receipt,
  Warehouse,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Scale,
  Sparkles,
  BarChart3,
  UtensilsCrossed,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getServerSessionUser } from "@/lib/session";
import { getDefaultPathForRole } from "@/lib/rbac";

export default async function HomePage() {
  const sessionUser = await getServerSessionUser();
  const dashboardPath = sessionUser ? getDefaultPathForRole(sessionUser.role) : null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-card/90 backdrop-blur border-b border-border shadow-sm px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <Store className="size-5" />
            </span>
            <div>
              <span className="text-xl font-bold tracking-tight block text-slate-950">KADAI</span>
              <span className="text-[10px] text-muted-foreground font-mono font-bold tracking-widest uppercase block -mt-1">
                Enterprise POS & ERP
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#fitur" className="hover:text-primary transition-colors">Fitur Solusi</a>
            <a href="#multi-vertikal" className="hover:text-primary transition-colors">Ritel & F&B</a>
            <a href="#standar-keuangan" className="hover:text-primary transition-colors">Pajak & SAK EMKM</a>
            <a href="#harga" className="hover:text-primary transition-colors">Paket Langganan</a>
          </div>

          <div className="flex items-center gap-2.5">
            {dashboardPath ? (
              <Button asChild className="font-semibold text-xs shadow-sm">
                <Link href={dashboardPath}>
                  Buka Dashboard <ArrowRight className="size-3.5 ml-1.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" className="font-semibold text-xs border-slate-300">
                  <Link href="/login">Masuk Kasir</Link>
                </Button>
                <Button asChild className="font-semibold text-xs shadow-sm">
                  <Link href="/register">Daftar Akun Baru</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 px-6 border-b border-border bg-gradient-to-b from-card via-card to-background">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold shadow-sm">
            <Sparkles className="size-3.5 text-primary" />
            <span>Platform Operasi Bisnis & Point of Sale Terintegrasi</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] text-slate-950">
            Kelola Penjualan, Rantai Pasok, dan Akuntansi dengan Akurasi Enterprise.
          </h1>

          <p className="text-base md:text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            KADAI menyatukan terminal transaksi kasir cepat, manajemen persediaan FIFO multi-batch, formula resep Bill of Materials (BOM), Kitchen Display System (KDS), hingga pelaporan pajak resmi PPN 11% dan PBJT/PB1 10%.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button asChild size="lg" className="w-full sm:w-auto font-bold text-sm px-8 h-12 shadow-sm rounded-lg">
              <Link href="/register">
                Mulai Uji Coba Gratis 14 Hari <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto font-semibold text-sm h-12 px-6 rounded-lg border-slate-300">
              <Link href="/login">Masuk ke Toko Anda</Link>
            </Button>
          </div>

          {/* Trust Metrics Pill Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
              <CheckCircle2 className="size-3.5 text-emerald-600" /> Kepatuhan Standar SAK EMKM RI
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
              <CheckCircle2 className="size-3.5 text-emerald-600" /> Otomatisasi Pajak PPN & PBJT
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
              <CheckCircle2 className="size-3.5 text-emerald-600" /> Self-Order QR & Layar Dapur KDS
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
              <CheckCircle2 className="size-3.5 text-emerald-600" /> Otorisasi Keamanan Multi-Role RBAC
            </span>
          </div>
        </div>
      </section>

      {/* Multi-Vertical Solution Section */}
      <section id="multi-vertikal" className="py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="font-semibold rounded-full px-3 py-1">Solusi Lintas Industri</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-950">
            Arsitektur Fleksibel untuk Seluruh Sektor Bisnis
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto">
            KADAI dirancang secara modular dan agnostik untuk beradaptasi dengan model operasional usaha Anda, mulai dari pencatatan barcode ritel, perakitan resep kuliner, hingga reservasi jasa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Ritel */}
          <Card className="border border-border shadow-sm hover:shadow-md transition-shadow bg-card p-5 sm:p-6 space-y-4 rounded-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="size-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                <ShoppingCart className="size-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Ritel & Distribusi Komersial</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Minimarket modern, supermarket, fashion, farmasi/apotek, elektronik, toko bangunan, dan grosir.
                </p>
              </div>
              <ul className="space-y-2 text-xs font-medium text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> Pelacakan persediaan multi-batch FIFO & expired date.
                </li>
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> Scan barcode scanner USB, Bluetooth & kamera HP.
                </li>
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> Kartu stok mutasi otomatis & batas minimum restock.
                </li>
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> Cetak struk kasir thermal 58mm/80mm & label barcode.
                </li>
              </ul>
            </div>
          </Card>

          {/* Card FnB */}
          <Card className="border border-border shadow-sm hover:shadow-md transition-shadow bg-card p-5 sm:p-6 space-y-4 rounded-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="size-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                <UtensilsCrossed className="size-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Kuliner, F&B & Hospitality</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Restoran casual dining, kafe modern, fast food (QSR), bakery, dan cloud kitchen.
                </p>
              </div>
              <ul className="space-y-2 text-xs font-medium text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> <strong>Bill of Materials (BOM):</strong> Potong bahan baku otomatis saat menu laku.
                </li>
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> <strong>Meja & Self-Order QR:</strong> Pelanggan pesan langsung dari HP.
                </li>
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> <strong>Kitchen Display (KDS):</strong> Tiket real-time ke monitor dapur & bar.
                </li>
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> Otomatisasi Pajak Restoran (PB1 10%) & Service Charge.
                </li>
              </ul>
            </div>
          </Card>

          {/* Card Services */}
          <Card className="border border-border shadow-sm hover:shadow-md transition-shadow bg-card p-5 sm:p-6 space-y-4 rounded-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="size-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                <Building className="size-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Layanan Jasa & Multi-Cabang</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Barbershop, salon kecantikan, bengkel otomotif, cuci mobil/motor, laundry, dan franchise.
                </p>
              </div>
              <ul className="space-y-2 text-xs font-medium text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> Pencatatan invoice billing jasa & produk dalam 1 transaksi.
                </li>
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> Database pelanggan CRM, riwayat kunjungan & poin member.
                </li>
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> Manajemen multi-cabang terpusat dari satu dashboard akun.
                </li>
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> Kontrol hak akses staf RBAC 6 role & PIN supervisor.
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </section>

      {/* Tax & Financial Standards Section */}
      <section id="pajak-keuangan" className="py-16 px-6 bg-slate-50/60 border-y border-border">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <Badge variant="outline" className="font-semibold rounded-full px-3 py-1">Standar Keuangan Indonesia</Badge>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-950">
              Pajak & Pembukuan Resmi Sesuai Regulasi Republik Indonesia
            </h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto">
              Tak perlu pusing menghitung pajak manual atau menyusun laporan pembukuan akuntansi dari nol saat pemeriksaan pajak.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border border-border shadow-sm bg-card p-5 space-y-3 rounded-xl">
              <Receipt className="size-8 text-primary" />
              <h4 className="font-bold text-base text-slate-950">Perhitungan Pajak Fleksibel</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mendukung PPN 11%/12% (Inklusif & Eksklusif) untuk ritel umum, dan PB1 (Pajak Restoran 10%) untuk usaha kuliner. Bisa diaktifkan atau dinonaktifkan sesuai status wajib pajak.
              </p>
            </Card>

            <Card className="border border-border shadow-sm bg-card p-5 space-y-3 rounded-xl">
              <Scale className="size-8 text-primary" />
              <h4 className="font-bold text-base text-slate-950">Rekap PPh Final UMKM 0.5%</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sesuai PP 55/2022 (pengganti PP 23/2018). Sistem merangkum otomatis Buku Peredaran Bruto Bulanan dan memonitor batas pembebasan omzet Rp 500 Juta bagi Wajib Pajak Orang Pribadi.
              </p>
            </Card>

            <Card className="border border-border shadow-sm bg-card p-5 space-y-3 rounded-xl">
              <BarChart3 className="size-8 text-primary" />
              <h4 className="font-bold text-base text-slate-950">Laporan Standar SAK EMKM</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Laporan Laba Rugi real-time berbasis HPP FIFO, Laporan Posisi Keuangan (Neraca Sederhana), dan Laporan Arus Kas (Cash Flow) yang siap dicetak untuk pelaporan perbankan.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Matrix Section */}
      <section id="harga" className="py-20 px-6 max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="font-semibold rounded-full px-3 py-1">Paket Komersial</Badge>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-950">
            Pilihan Paket Langganan Sesuai Skala Bisnis Anda
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Semua paket dilengkapi garansi update fitur berkala dan penyimpanan database cloud yang aman.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Free Tier */}
          <Card className="border border-border shadow-sm bg-card p-6 space-y-4 flex flex-col justify-between rounded-xl">
            <div className="space-y-3">
              <h4 className="font-bold text-lg text-slate-950">Starter</h4>
              <p className="text-xs text-muted-foreground">Untuk perintis usaha mikro yang baru memulai.</p>
              <div className="text-2xl font-black text-slate-950">Rp 0 <span className="text-xs font-normal text-muted-foreground">/ bln</span></div>
              <ul className="space-y-2 text-xs font-medium text-slate-600 pt-2 border-t border-border">
                <li>• 1 Outlet & 1 Kasir</li>
                <li>• Maksimal 50 Produk</li>
                <li>• Kasir POS Standar</li>
                <li>• Struk Cetak Thermal</li>
              </ul>
            </div>
            <Button asChild variant="outline" className="w-full font-semibold text-xs mt-4 rounded-lg border-slate-300">
              <Link href="/register">Mulai Gratis</Link>
            </Button>
          </Card>

          {/* Professional Tier */}
          <Card className="border border-border shadow-sm bg-card p-6 space-y-4 flex flex-col justify-between rounded-xl">
            <div className="space-y-3">
              <h4 className="font-bold text-lg text-slate-950">Professional</h4>
              <p className="text-xs text-muted-foreground">Untuk unit usaha ritel, F&B, dan jasa mandiri yang berkembang.</p>
              <div className="text-2xl font-black text-primary">Rp 99.000 <span className="text-xs font-normal text-muted-foreground">/ bln</span></div>
              <ul className="space-y-2 text-xs font-medium text-slate-600 pt-2 border-t border-border">
                <li>• 1 Outlet & 3 Akun Kasir</li>
                <li>• Unlimited Produk Ritel</li>
                <li>• Inventori Batch FIFO</li>
                <li>• Pajak PPN 11% / PB1 10%</li>
                <li>• Laporan Laba Rugi Dasar</li>
              </ul>
            </div>
            <Button asChild variant="outline" className="w-full font-semibold text-xs mt-4 rounded-lg border-slate-300">
              <Link href="/register">Pilih Professional</Link>
            </Button>
          </Card>

          {/* Pro Bisnis - POPULAR */}
          <Card className="border-2 border-primary shadow-md bg-card p-6 space-y-4 flex flex-col justify-between rounded-xl relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-3 py-0.5 rounded-full font-bold shadow-sm">
              Paling Populer
            </span>
            <div className="space-y-3">
              <h4 className="font-bold text-lg text-slate-950">Business Pro</h4>
              <p className="text-xs text-muted-foreground">Kafe, resto & gerai ritel modern dengan operasional penuh.</p>
              <div className="text-2xl font-black text-primary">Rp 249.000 <span className="text-xs font-normal text-muted-foreground">/ bln</span></div>
              <ul className="space-y-2 text-xs font-medium text-slate-800 pt-2 border-t border-border">
                <li className="font-semibold">• Hingga 3 Outlet Cabang</li>
                <li className="font-semibold">• Unlimited Kasir & Staf</li>
                <li className="font-semibold">• Resep Bahan Pokok (BOM)</li>
                <li className="font-semibold">• Meja & Self-Order QR HP</li>
                <li className="font-semibold">• Kitchen Display System (KDS)</li>
                <li>• Laporan Lengkap SAK EMKM</li>
              </ul>
            </div>
            <Button asChild className="w-full font-bold text-xs mt-4 rounded-lg shadow-sm">
              <Link href="/register">Pilih Business Pro</Link>
            </Button>
          </Card>

          {/* Enterprise */}
          <Card className="border border-border shadow-sm bg-card p-6 space-y-4 flex flex-col justify-between rounded-xl">
            <div className="space-y-3">
              <h4 className="font-bold text-lg text-slate-950">Enterprise</h4>
              <p className="text-xs text-muted-foreground">Jaringan multi-cabang & central kitchen korporasi.</p>
              <div className="text-2xl font-black text-slate-950">Rp 599.000 <span className="text-xs font-normal text-muted-foreground">/ bln</span></div>
              <ul className="space-y-2 text-xs font-medium text-slate-600 pt-2 border-t border-border">
                <li>• Unlimited Outlet & Gudang</li>
                <li>• Central Kitchen (CK) Routing</li>
                <li>• Transfer Stok Antar Cabang</li>
                <li>• Laporan Konsolidasi Grup</li>
                <li>• Prioritas Support Teknis 24/7</li>
              </ul>
            </div>
            <Button asChild variant="outline" className="w-full font-semibold text-xs mt-4 rounded-lg border-slate-300">
              <Link href="/register">Hubungi Tim Kami</Link>
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-slate-900 text-slate-400 py-8 px-6 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">KADAI</span>
            <span>• Platform Operasi Bisnis Terpadu UMKM Indonesia</span>
          </div>
          <div>
            Dikembangkan secara berdaulat oleh <strong className="text-white">ATIOSLab</strong> untuk kemajuan ekonomi nasional.
          </div>
        </div>
      </footer>
    </div>
  );
}
