"use client";

import { motion } from "motion/react";
import Link from "next/link";
import {
  ShoppingCart,
  UtensilsCrossed,
  Building,
  CheckCircle2,
  Receipt,
  Scale,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function LandingFeaturesSection() {
  return (
    <section id="multi-vertikal" className="py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-12">
      <div className="text-center space-y-3">
        <Badge variant="outline" className="font-semibold rounded-full px-3 py-1">
          Solusi Lintas Industri
        </Badge>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-950">
          Arsitektur Fleksibel untuk Seluruh Sektor Bisnis
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto">
          KADAI dirancang secara modular dan agnostik untuk beradaptasi dengan model operasional usaha Anda, mulai dari pencatatan barcode ritel, perakitan resep kuliner, hingga reservasi jasa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card Ritel */}
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="h-full">
          <Card className="border border-border shadow-sm hover:shadow-md transition-shadow bg-card p-5 sm:p-6 space-y-4 rounded-xl flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="size-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                <ShoppingCart className="size-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Ritel & Distribusi Komersial</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Minimarket modern, supermarket, fashion, farmasi/apotek, elektronik, toko bangunan, dan grosir.
                </p>
              </div>
              <ul className="space-y-2 text-xs font-medium text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>Pelacakan persediaan multi-batch FIFO & expired date.</span>
                </li>
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>Scan barcode scanner USB, Bluetooth & kamera HP.</span>
                </li>
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>Kartu stok mutasi otomatis & batas minimum restock.</span>
                </li>
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>Cetak struk kasir thermal 58mm/80mm & label barcode.</span>
                </li>
              </ul>
            </div>
          </Card>
        </motion.div>

        {/* Card FnB */}
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="h-full">
          <Card className="border border-border shadow-sm hover:shadow-md transition-shadow bg-card p-5 sm:p-6 space-y-4 rounded-xl flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="size-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                <UtensilsCrossed className="size-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Kuliner, F&B & Hospitality</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Restoran casual dining, kafe modern, fast food (QSR), bakery, dan cloud kitchen.
                </p>
              </div>
              <ul className="space-y-2 text-xs font-medium text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span><strong>Bill of Materials (BOM):</strong> Potong bahan baku otomatis saat menu laku.</span>
                </li>
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span><strong>Meja & Self-Order QR:</strong> Pelanggan pesan langsung dari HP.</span>
                </li>
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span><strong>Kitchen Display (KDS):</strong> Tiket real-time ke monitor dapur & bar.</span>
                </li>
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>Otomatisasi Pajak Restoran (PB1 10%) & Service Charge.</span>
                </li>
              </ul>
            </div>
          </Card>
        </motion.div>

        {/* Card Services */}
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="h-full">
          <Card className="border border-border shadow-sm hover:shadow-md transition-shadow bg-card p-5 sm:p-6 space-y-4 rounded-xl flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="size-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                <Building className="size-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Layanan Jasa & Multi-Cabang</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Barbershop, salon kecantikan, bengkel otomotif, cuci mobil/motor, laundry, dan franchise.
                </p>
              </div>
              <ul className="space-y-2 text-xs font-medium text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>Pencatatan invoice billing jasa & produk dalam 1 transaksi.</span>
                </li>
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>Database pelanggan CRM, riwayat kunjungan & poin member.</span>
                </li>
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>Transfer stok antar cabang dari gudang pusat ke gerai booth.</span>
                </li>
                <li className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>Kontrol hak akses staf RBAC 6 role & otorisasi supervisor.</span>
                </li>
              </ul>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

export function LandingPricingSection() {
  return (
    <section id="harga" className="py-20 px-6 max-w-6xl mx-auto w-full space-y-12">
      <div className="text-center space-y-3">
        <Badge variant="outline" className="font-semibold rounded-full px-3 py-1">
          Paket Komersial
        </Badge>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-950">
          Pilihan Paket Langganan Sesuai Skala Bisnis Anda
        </h2>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Semua paket dilengkapi garansi update fitur berkala dan penyimpanan database cloud yang aman.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Free Tier */}
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="h-full">
          <Card className="border border-border shadow-sm bg-card p-6 space-y-4 flex flex-col justify-between rounded-xl h-full">
            <div className="space-y-3">
              <h4 className="font-bold text-lg text-slate-950">Starter</h4>
              <p className="text-xs text-muted-foreground">Untuk perintis usaha mikro yang baru memulai.</p>
              <div className="text-2xl font-black text-slate-950">
                Rp 0 <span className="text-xs font-normal text-muted-foreground">/ bln</span>
              </div>
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
        </motion.div>

        {/* Professional Tier */}
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="h-full">
          <Card className="border border-border shadow-sm bg-card p-6 space-y-4 flex flex-col justify-between rounded-xl h-full">
            <div className="space-y-3">
              <h4 className="font-bold text-lg text-slate-950">Professional</h4>
              <p className="text-xs text-muted-foreground">Untuk unit usaha ritel, F&B, dan jasa mandiri yang berkembang.</p>
              <div className="text-2xl font-black text-primary">
                Rp 99.000 <span className="text-xs font-normal text-muted-foreground">/ bln</span>
              </div>
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
        </motion.div>

        {/* Pro Bisnis - POPULAR */}
        <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }} className="h-full">
          <Card className="border-2 border-primary shadow-md bg-card p-6 space-y-4 flex flex-col justify-between rounded-xl relative h-full">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-3 py-0.5 rounded-full font-bold shadow-sm">
              Paling Populer
            </span>
            <div className="space-y-3">
              <h4 className="font-bold text-lg text-slate-950">Business Pro</h4>
              <p className="text-xs text-muted-foreground">Kafe, resto & gerai ritel modern dengan operasional penuh.</p>
              <div className="text-2xl font-black text-primary">
                Rp 249.000 <span className="text-xs font-normal text-muted-foreground">/ bln</span>
              </div>
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
        </motion.div>

        {/* Enterprise */}
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="h-full">
          <Card className="border border-border shadow-sm bg-card p-6 space-y-4 flex flex-col justify-between rounded-xl h-full">
            <div className="space-y-3">
              <h4 className="font-bold text-lg text-slate-950">Enterprise</h4>
              <p className="text-xs text-muted-foreground">Jaringan multi-cabang & central kitchen korporasi.</p>
              <div className="text-2xl font-black text-slate-950">
                Rp 599.000 <span className="text-xs font-normal text-muted-foreground">/ bln</span>
              </div>
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
        </motion.div>
      </div>
    </section>
  );
}