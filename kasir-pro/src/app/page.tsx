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
      <nav className="sticky top-0 z-50 bg-card/90 backdrop-blur border-b border-border neo-shadow-sm px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground neo-border neo-shadow-sm">
              <Store className="size-5" />
            </span>
            <div>
              <span className="text-xl font-black tracking-tight block">KADAI</span>
              <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase block -mt-1">
                Enterprise POS & SaaS
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-bold">
            <a href="#fitur" className="hover:text-primary transition-colors">Fitur Unggulan</a>
            <a href="#fnb-ritel" className="hover:text-primary transition-colors">Multi-Vertikal</a>
            <a href="#pajak-keuangan" className="hover:text-primary transition-colors">Pajak & SAK EMKM</a>
            <a href="#harga" className="hover:text-primary transition-colors">Paket Harga</a>
          </div>

          <div className="flex items-center gap-2.5">
            {dashboardPath ? (
              <Button asChild className="neo-border neo-shadow font-black bg-primary text-primary-foreground text-xs">
                <Link href={dashboardPath}>
                  Buka Dashboard <ArrowRight className="size-3.5 ml-1.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" className="neo-border font-bold text-xs">
                  <Link href="/login">Masuk Kasir</Link>
                </Button>
                <Button asChild className="neo-border neo-shadow font-black bg-primary text-primary-foreground text-xs">
                  <Link href="/register">Daftar Gratis</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 px-6 border-b border-border bg-gradient-to-b from-card via-card to-background">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 neo-shadow-sm">
            <Sparkles className="size-4 text-primary" />
            <span className="text-xs font-bold text-primary">
              Sistem Operasi POS & Bisnis Standar Indonesia
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
            Kelola Ritel, Kafe, Dimsum & UMKM dengan Presisi Finansial Nyata.
          </h1>

          <p className="text-base md:text-lg text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Bukan sekadar pencatat transaksi. KADAI memadukan akurasi inventori batch FIFO, resep bahan baku (BOM) otomatis, pemesanan meja QR, Kitchen Display System (KDS), hingga kepatuhan pajak PPN 11% & PB1 Restoran 10%.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button asChild size="lg" className="w-full sm:w-auto neo-border neo-shadow font-black bg-primary text-primary-foreground text-sm px-8 h-12">
              <Link href="/register">
                Mulai Uji Coba Gratis 14 Hari <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto neo-border font-bold text-sm h-12 px-6">
              <Link href="/login">Masuk ke Toko Anda</Link>
            </Button>
          </div>

          {/* Social Proof Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-accent-success" /> Kepatuhan SAK EMKM RI
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-accent-success" /> PPN 11% & PB1 10% Otomatis
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-accent-success" /> Self-Order QR & Layar Dapur
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-accent-success" /> Bebas Hardware Khusus
            </span>
          </div>
        </div>
      </section>

      {/* Multi-Vertical Feature Section */}
      <section id="fnb-ritel" className="py-16 px-6 max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3">
          <Badge className="font-bold neo-border bg-accent-secondary text-white">Multi-Vertical Dynamic</Badge>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            Satu Aplikasi, Siap untuk Segala Jenis Model Bisnis
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            KADAI menyesuaikan alur operasionalnya sesuai tipe usaha Anda, mulai dari toko ritel dengan barcode hingga kafe dan kedai dimsum yang sarat resep bahan baku.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card Ritel */}
          <Card className="neo-border neo-shadow bg-card p-6 space-y-4">
            <div className="size-12 rounded-xl bg-accent-secondary/10 neo-border flex items-center justify-center text-accent-secondary">
              <ShoppingCart className="size-6" />
            </div>
            <div>
              <h3 className="text-xl font-black">Untuk Toko Ritel & Grosir</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Toko kelontong, minimarket, toko baju, apotek, dan barang konsumsi langsung jual.
              </p>
            </div>
            <ul className="space-y-2 text-xs font-semibold text-muted-foreground pt-2">
              <li className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="size-4 text-accent-success" /> Pelacakan stok per batch FIFO dengan tanggal kedaluwarsa.
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="size-4 text-accent-success" /> Scan barcode USB & Bluetooth super cepat tanpa jeda.
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="size-4 text-accent-success" /> Peringatan stok menipis dan kartu stok mutasi masuk/keluar.
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="size-4 text-accent-success" /> Pencetakan label harga dan struk kasir thermal 58mm/80mm.
              </li>
            </ul>
          </Card>

          {/* Card FnB */}
          <Card className="neo-border neo-shadow bg-card p-6 space-y-4">
            <div className="size-12 rounded-xl bg-primary/10 neo-border flex items-center justify-center text-primary">
              <UtensilsCrossed className="size-6" />
            </div>
            <div>
              <h3 className="text-xl font-black">Untuk Kafe, Restoran & Dimsum</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Kedai kopi, penjual dimsum, warung makan, bakery, hingga restoran casual dining.
              </p>
            </div>
            <ul className="space-y-2 text-xs font-semibold text-muted-foreground pt-2">
              <li className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="size-4 text-primary" /> <strong>Bill of Materials (BOM):</strong> Potong bahan mentah otomatis saat menu terjual.
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="size-4 text-primary" /> <strong>Meja & QR Code:</strong> Pelanggan scan QR di meja untuk pesan langsung dari HP.
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="size-4 text-primary" /> <strong>Kitchen Display System (KDS):</strong> Tiket real-time ke layar koki dan barista bar.
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="size-4 text-primary" /> Perhitungan PB1 Pajak Restoran 10% dan Service Charge kafe.
              </li>
            </ul>
          </Card>
        </div>
      </section>

      {/* Tax & Financial Standards Section */}
      <section id="pajak-keuangan" className="py-16 px-6 bg-muted/40 border-y border-border">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <Badge className="font-bold neo-border bg-accent-success text-white">Standar Keuangan Indonesia</Badge>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Pajak & Pembukuan Resmi Sesuai Regulasi Republik Indonesia
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Tak perlu pusing menghitung pajak manual atau menyusun laporan pembukuan akuntansi dari nol saat pemeriksaan pajak.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="neo-border neo-shadow bg-card p-5 space-y-3">
              <Receipt className="size-8 text-primary" />
              <h4 className="font-black text-base">Perhitungan Pajak Fleksibel</h4>
              <p className="text-xs text-muted-foreground">
                Mendukung PPN 11%/12% (Inklusif & Eksklusif) untuk ritel umum, dan PB1 (Pajak Restoran 10%) untuk usaha kuliner. Bisa diaktifkan atau dinonaktifkan sesuai status wajib pajak.
              </p>
            </Card>

            <Card className="neo-border neo-shadow bg-card p-5 space-y-3">
              <Scale className="size-8 text-accent-secondary" />
              <h4 className="font-black text-base">Rekap PPh Final UMKM 0.5%</h4>
              <p className="text-xs text-muted-foreground">
                Sesuai PP 55/2022 (pengganti PP 23/2018). Sistem merangkum otomatis Buku Peredaran Bruto Bulanan dan memonitor batas pembebasan omzet Rp 500 Juta bagi Wajib Pajak Orang Pribadi.
              </p>
            </Card>

            <Card className="neo-border neo-shadow bg-card p-5 space-y-3">
              <BarChart3 className="size-8 text-accent-success" />
              <h4 className="font-black text-base">Laporan Standar SAK EMKM</h4>
              <p className="text-xs text-muted-foreground">
                Laporan Laba Rugi real-time berbasis HPP FIFO, Laporan Posisi Keuangan (Neraca Sederhana), dan Laporan Arus Kas (Cash Flow) yang siap dicetak untuk pelaporan perbankan.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Matrix Section */}
      <section id="harga" className="py-20 px-6 max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3">
          <Badge className="font-bold neo-border bg-accent-warning text-black">Transparan & Terjangkau</Badge>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            Pilihan Paket Langganan Sesuai Skala Bisnis Anda
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Semua paket dilengkapi garansi update fitur berkala dan penyimpanan database cloud yang aman.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Free Tier */}
          <Card className="neo-border bg-card p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="font-black text-lg">Gratis</h4>
              <p className="text-xs text-muted-foreground">Untuk perintis usaha mikro yang baru memulai.</p>
              <div className="text-2xl font-black">Rp 0 <span className="text-xs font-normal text-muted-foreground">/ bln</span></div>
              <ul className="space-y-2 text-xs font-medium text-muted-foreground pt-2 border-t border-border">
                <li>• 1 Outlet & 1 Kasir</li>
                <li>• Maksimal 50 Produk</li>
                <li>• Kasir POS Standar</li>
                <li>• Struk Cetak Thermal</li>
              </ul>
            </div>
            <Button asChild variant="outline" className="w-full neo-border font-bold text-xs mt-4">
              <Link href="/register">Mulai Gratis</Link>
            </Button>
          </Card>

          {/* Starter */}
          <Card className="neo-border bg-card p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="font-black text-lg">Starter</h4>
              <p className="text-xs text-muted-foreground">Toko ritel mandiri atau kedai kuliner berkembang.</p>
              <div className="text-2xl font-black text-primary">Rp 99.000 <span className="text-xs font-normal text-muted-foreground">/ bln</span></div>
              <ul className="space-y-2 text-xs font-medium text-muted-foreground pt-2 border-t border-border">
                <li>• 1 Outlet & 3 Akun Kasir</li>
                <li>• Unlimited Produk Ritel</li>
                <li>• Inventori Batch FIFO</li>
                <li>• Pajak PPN 11% / PB1 10%</li>
                <li>• Laporan Laba Rugi Dasar</li>
              </ul>
            </div>
            <Button asChild variant="outline" className="w-full neo-border font-bold text-xs mt-4">
              <Link href="/register">Pilih Starter</Link>
            </Button>
          </Card>

          {/* Pro Bisnis - POPULAR */}
          <Card className="neo-border neo-shadow bg-card p-6 space-y-4 flex flex-col justify-between border-primary relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-warning text-black text-[10px] px-3 py-0.5 rounded-full font-black neo-border">
              Paling Populer
            </span>
            <div className="space-y-3">
              <h4 className="font-black text-lg">Pro Bisnis</h4>
              <p className="text-xs text-muted-foreground">Kafe, resto & gerai ritel modern dengan operasional penuh.</p>
              <div className="text-2xl font-black text-primary">Rp 249.000 <span className="text-xs font-normal text-muted-foreground">/ bln</span></div>
              <ul className="space-y-2 text-xs font-medium text-foreground pt-2 border-t border-border">
                <li className="font-bold">• Hingga 3 Outlet Cabang</li>
                <li className="font-bold">• Unlimited Kasir & Staf</li>
                <li className="font-bold">• Resep Bahan Pokok (BOM)</li>
                <li className="font-bold">• Meja & Self-Order QR HP</li>
                <li className="font-bold">• Kitchen Display System (KDS)</li>
                <li>• Laporan Lengkap SAK EMKM</li>
              </ul>
            </div>
            <Button asChild className="w-full neo-border neo-shadow font-black bg-primary text-primary-foreground text-xs mt-4">
              <Link href="/register">Pilih Pro Bisnis</Link>
            </Button>
          </Card>

          {/* Enterprise */}
          <Card className="neo-border bg-card p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="font-black text-lg">Enterprise</h4>
              <p className="text-xs text-muted-foreground">Jaringan multi-cabang & central kitchen korporasi.</p>
              <div className="text-2xl font-black">Rp 599.000 <span className="text-xs font-normal text-muted-foreground">/ bln</span></div>
              <ul className="space-y-2 text-xs font-medium text-muted-foreground pt-2 border-t border-border">
                <li>• Unlimited Outlet & Gudang</li>
                <li>• Central Kitchen (CK) Routing</li>
                <li>• Transfer Stok Antar Cabang</li>
                <li>• Laporan Konsolidasi Grup</li>
                <li>• Prioritas Support Teknis 24/7</li>
              </ul>
            </div>
            <Button asChild variant="outline" className="w-full neo-border font-bold text-xs mt-4">
              <Link href="/register">Hubungi Tim Kami</Link>
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card py-8 px-6 text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-foreground">KADAI</span>
            <span>• Platform Operasi Bisnis Terpadu UMKM Indonesia</span>
          </div>
          <div>
            Dikembangkan secara berdaulat oleh <strong className="text-foreground">ATIOSLab</strong> untuk kemajuan ekonomi nasional.
          </div>
        </div>
      </footer>
    </div>
  );
}
