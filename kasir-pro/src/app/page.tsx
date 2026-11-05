import Link from "next/link";
import {
  Store,
  Receipt,
  ArrowRight,
  Scale,
  ShieldCheck,
  Lock,
  Percent,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getServerSessionUser } from "@/lib/session";
import { getDefaultPathForRole } from "@/lib/rbac";
import { HeroShowcase } from "@/components/landing/hero-showcase";
import { SupplyChainTopology } from "@/components/landing/supply-chain-topology";
import { EnterpriseBentoGrid } from "@/components/landing/enterprise-bento-grid";
import { RoiSavingsCalculator } from "@/components/landing/roi-savings-calculator";

export default async function HomePage() {
  const sessionUser = await getServerSessionUser();
  const dashboardPath = sessionUser ? getDefaultPathForRole(sessionUser.role) : null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden w-full font-sans selection:bg-primary/20">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border shadow-xs px-4 sm:px-6 py-2.5 sm:py-3 w-full">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex size-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
              <Store className="size-4 text-primary" />
            </span>
            <div>
              <span className="text-lg sm:text-xl font-bold tracking-tight block text-slate-950 leading-none">
                KADAI<span className="text-primary font-black">.</span>
              </span>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono font-bold tracking-wider uppercase block mt-0.5">
                Enterprise POS & Supply OS
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#topologi-rantai-pasok" className="hover:text-primary transition-colors">Topologi Pasok</a>
            <a href="#fitur-enterprise" className="hover:text-primary transition-colors">Core Engines</a>
            <a href="#pajak-keuangan" className="hover:text-primary transition-colors">Pajak PB1 & SAK EMKM</a>
            <a href="#kalkulator-roi" className="hover:text-primary transition-colors">Kalkulator ROI</a>
            <a href="#harga" className="hover:text-primary transition-colors">Paket Harga</a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {dashboardPath ? (
              <Button asChild size="sm" className="font-bold text-xs shadow-xs h-8 sm:h-9 px-3 sm:px-4 rounded-lg">
                <Link href={dashboardPath}>
                  Dashboard <ArrowRight className="size-3.5 ml-1 hidden sm:inline" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="font-semibold text-xs h-8 sm:h-9 px-2.5 sm:px-3 text-slate-700 hover:text-slate-900">
                  <Link href="/login">Masuk</Link>
                </Button>
                <Button asChild size="sm" className="font-bold text-xs shadow-xs h-8 sm:h-9 px-3 sm:px-4 rounded-lg">
                  <Link href="/register">Coba Gratis 14 Hari</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Section 1: Hero Section with Motion Showcase Slider */}
      <HeroShowcase dashboardPath={dashboardPath} />

      {/* Live Operational Ticker Bar */}
      <div className="border-b border-border bg-slate-900 text-slate-300 py-3 px-4 text-xs font-mono">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-white">Live Platform Metrics:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-[11px]">
            <div>Latensi Kasir: <strong className="text-emerald-400">&lt; 0.2s</strong></div>
            <div>Akurasi HPP FIFO: <strong className="text-white">100% SAK EMKM</strong></div>
            <div>Struk Cetak: <strong className="text-white">58mm / 80mm</strong></div>
            <div>SLA Uptime: <strong className="text-emerald-400">99.9% Cloudflare</strong></div>
          </div>
        </div>
      </div>

      {/* Section 2: Hub-and-Spoke Topology & Supply Chain Architecture */}
      <SupplyChainTopology />

      {/* Section 3: Enterprise Bento Grid Core Engines */}
      <EnterpriseBentoGrid />

      {/* Section 4: Indonesian Fiscal & Legal Moat */}
      <section id="pajak-keuangan" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50/70 border-y border-border w-full">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <Badge variant="outline" className="font-semibold rounded-full px-3.5 py-1 bg-white text-slate-800 border-slate-300">
              Kepatuhan Fiskal & Akuntansi Indonesia
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950">
              Dibangun Presisi Mengikuti Regulasi Fiskal & Akuntansi Republik Indonesia
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Tidak perlu memaksakan sistem luar negeri yang kaku. KADAI memahami perbedaan Pajak Daerah PB1 10% dan PPN 11%, serta menyusun buku omzet bulanan sesuai PP 55/2022.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border border-border shadow-xs bg-white p-6 space-y-3.5 rounded-2xl">
              <div className="size-11 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-primary">
                <Percent className="size-5" />
              </div>
              <h3 className="text-base font-bold text-slate-950">Pajak Fleksibel: PPN 11% & PB1 10%</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tentukan mode perpajakan per cabang: Pajak Pertambahan Nilai (PPN 11%) untuk perdagangan ritel atau Pajak Restoran (PB1 10%) untuk usaha kuliner dan kafe. Tarif dapat dikustomisasi sesuai Perda setempat.
              </p>
            </Card>

            <Card className="border border-border shadow-xs bg-white p-6 space-y-3.5 rounded-2xl">
              <div className="size-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Receipt className="size-5" />
              </div>
              <h3 className="text-base font-bold text-slate-950">PPh Final UMKM 0.5% (PP 55/2022)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kalkulasi otomatis proyeksi setoran pajak penghasilan final 0.5% dari omzet bruto bulanan. Dilengkapi simulasi ambang batas bebas pajak Rp 500 Juta untuk Wajib Pajak Orang Pribadi.
              </p>
            </Card>

            <Card className="border border-border shadow-xs bg-white p-6 space-y-3.5 rounded-2xl">
              <div className="size-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Scale className="size-5" />
              </div>
              <h3 className="text-base font-bold text-slate-950">Laporan Laba Rugi SAK EMKM</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Susun laporan laba rugi periodik yang mencerminkan pendapatan riil, beban pokok penjualan (HPP berbasis FIFO), dan laba bersih yang sah untuk pengajuan modal perbankan & audit internal.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 5: Interactive TCO & Shrinkage Savings ROI Calculator */}
      <RoiSavingsCalculator />

      {/* Section 6: Commercial Pricing Section */}
      <section id="harga" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="font-semibold rounded-full px-3 py-1">Paket Komersial</Badge>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950">
            Pilihan Paket Langganan Sesuai Skala Bisnis Anda
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Semua paket dilengkapi garansi update fitur berkala dan penyimpanan database cloud yang aman.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Section 7: Enterprise Security & SLA */}
      <section className="py-16 px-4 sm:px-6 bg-slate-950 text-white border-t border-slate-800">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold text-emerald-400 block uppercase tracking-wider">
                Enterprise Trust & Security
              </span>
              <h3 className="text-xl sm:text-2xl font-black mt-1">
                Keamanan Data, Audit Trail & Garansi Keandalan 99.9% SLA
              </h3>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-mono py-1 px-3">
              ISO-grade Hygiene Ready
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <ShieldCheck className="size-5 text-emerald-400" />
              <h4 className="font-bold text-sm text-slate-200">Zero Trust Boundary</h4>
              <p className="text-slate-400 leading-relaxed">
                Validasi input tak terpercaya via skema Zod ketat di setiap gateway API untuk menangkal injeksi & tamper.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <Lock className="size-5 text-blue-400" />
              <h4 className="font-bold text-sm text-slate-200">Session Cookie HMAC-SHA256</h4>
              <p className="text-slate-400 leading-relaxed">
                Token sesi terenkripsi dengan bendera HttpOnly, SameSite=Lax, Secure, dan invalidasi otomatis saat perubahan role.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <Layers className="size-5 text-purple-400" />
              <h4 className="font-bold text-sm text-slate-200">Immutable Activity Log</h4>
              <p className="text-slate-400 leading-relaxed">
                Seluruh aktivitas kritis seperti transfer stok, void penjualan, dan opname dicatat permanen dengan metadata aktor & IP.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <Sparkles className="size-5 text-amber-400" />
              <h4 className="font-bold text-sm text-slate-200">99.9% SLA Guaranteed</h4>
              <p className="text-slate-400 leading-relaxed">
                Arsitektur Docker swarm di VPS Dokploy berkecepatan tinggi dengan transmisi jaringan Cloudflare Tunnel terisolasi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-slate-900 text-slate-400 py-10 px-4 sm:px-6 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-black text-white text-base">KADAI</span>
            <span>• Platform Operasi Bisnis Terpadu & Rantai Pasok Indonesia</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <a href="#topologi-rantai-pasok" className="hover:text-white transition-colors">Topologi Pasok</a>
            <a href="#fitur-enterprise" className="hover:text-white transition-colors">Core Engines</a>
            <a href="#pajak-keuangan" className="hover:text-white transition-colors">Pajak PB1/PPN</a>
            <a href="#kalkulator-roi" className="hover:text-white transition-colors">Kalkulator ROI</a>
            <a href="#harga" className="hover:text-white transition-colors">Paket Harga</a>
            <Link href="/login" className="hover:text-white transition-colors">Masuk Kasir</Link>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Dikembangkan secara berdaulat oleh <strong className="text-slate-300">ATIOSLab</strong>. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
