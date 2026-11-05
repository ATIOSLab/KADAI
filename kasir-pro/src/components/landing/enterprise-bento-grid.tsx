"use client";

import { motion } from "motion/react";
import {
  Layers,
  Printer,
  QrCode,
  ChefHat,
  ShieldAlert,
  Lock,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function EnterpriseBentoGrid() {
  return (
    <section id="fitur-enterprise" className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-12">
      <div className="text-center space-y-3">
        <Badge variant="outline" className="font-semibold rounded-full px-3.5 py-1 text-slate-800 border-slate-300">
          Enterprise Core Engines
        </Badge>
        <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950">
          Enam Fondasi Mesin Operasional Tanpa Celah
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Dirancang dari nol untuk stabilitas tinggi, akurasi akuntansi, dan pencegahan kecurangan di seluruh lini penjualan dan dapur.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Card 1: BOM & FIFO (Span 7) */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="md:col-span-7">
          <Card className="h-full border border-slate-200 bg-white p-6 rounded-2xl shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="size-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Layers className="size-5" />
              </div>
              <h3 className="text-lg font-black text-slate-950">
                Engine FIFO Batch & Bill of Materials (BOM)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Setiap kali menu makanan atau minuman terjual, sistem secara atomik mendebit stok bahan baku mentah (gram/ml) dari batch pembelian tertua secara berurutan. HPP per porsi dihitung presisi mengikuti standar PSAK 14 / SAK EMKM.
              </p>
            </div>

            {/* Micro Live Sandbox */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-500 font-mono text-[11px] pb-1 border-b">
                <span>Formula Resep: Es Kopi Susu Aren</span>
                <span className="font-bold text-emerald-700">FIFO Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span>18g Kopi Arabica Gayo (Batch #01)</span>
                <span className="font-mono font-semibold">HPP Rp 2.520</span>
              </div>
              <div className="flex justify-between items-center">
                <span>120ml Susu Segar UHT (Batch #04)</span>
                <span className="font-mono font-semibold">HPP Rp 2.400</span>
              </div>
              <div className="flex justify-between items-center text-slate-900 font-black pt-1 border-t">
                <span>Total HPP / Porsi (Harga Jual Rp 18.000)</span>
                <span className="font-mono text-emerald-600 font-bold">Rp 5.720 (Margin 68.2%)</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Card 2: Thermal Print Engine (Span 5) */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="md:col-span-5">
          <Card className="h-full border border-slate-200 bg-white p-6 rounded-2xl shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="size-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <Printer className="size-5" />
              </div>
              <h3 className="text-lg font-black text-slate-950">
                Thermal Print Engine 58/80mm
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stylesheet media print khusus yang mengisolasi nota kasir bebas margin berlebih. Mendukung cetak via browser, printer USB, Bluetooth POS, serta rincian legal PB1 & QR code.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 font-mono text-[11px] space-y-1 text-slate-800">
              <div className="text-center font-bold pb-1 border-b border-dashed border-slate-400">
                *** KADAI COFFEE ROASTERS ***
              </div>
              <div className="flex justify-between">
                <span>Subtotal (3 item)</span>
                <span>Rp 85.000</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>PB1 Resto (10%)</span>
                <span>Rp 8.500</span>
              </div>
              <div className="flex justify-between font-bold text-slate-950 pt-1 border-t border-slate-400">
                <span>TOTAL BAYAR</span>
                <span>Rp 93.500</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Card 3: Kitchen Display System (Span 5) */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="md:col-span-5">
          <Card className="h-full border border-slate-200 bg-white p-6 rounded-2xl shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="size-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <ChefHat className="size-5" />
              </div>
              <h3 className="text-lg font-black text-slate-950">
                Kitchen Display (KDS) & Timer Masak
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Antarmuka stasiun dapur dengan timer masak berwarna. Tiket otomatis terpecah ke layar Dapur atau Bar tanpa kertas bon yang rentan hilang atau tersiram minyak.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-200">Meja 09 • 2 Item</span>
                <span className="font-mono text-[11px] text-amber-400 font-bold flex items-center gap-1">
                  <Clock className="size-3" /> 05:20 Masak
                </span>
              </div>
              <p className="text-[11px] text-slate-300">2x Ayam Bakar Taliwang (Pedas Sedang)</p>
            </div>
          </Card>
        </motion.div>

        {/* Card 4: QR Dining Table Matrix (Span 7) */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="md:col-span-7">
          <Card className="h-full border border-slate-200 bg-white p-6 rounded-2xl shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="size-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                <QrCode className="size-5" />
              </div>
              <h3 className="text-lg font-black text-slate-950">
                Meja Dinamis & Contactless QR Self-Order
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pelanggan cukup memindai QR code unik di meja restoran untuk membuka e-menu, memilih varian, menulis catatan dapur, dan mengirim pesanan langsung ke kasir & KDS tanpa perlu memanggil pelayan.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300">
                <span className="font-black text-emerald-950 block">Meja 01</span>
                <span className="text-[10px] text-emerald-700 font-semibold">Aktif Dining</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-black text-slate-900 block">Meja 02</span>
                <span className="text-[10px] text-muted-foreground font-semibold">Tersedia</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300">
                <span className="font-black text-emerald-950 block">Meja 03</span>
                <span className="text-[10px] text-emerald-700 font-semibold">Self-Order</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Card 5: Supervisor PIN (Span 6) */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="md:col-span-6">
          <Card className="h-full border border-slate-200 bg-white p-6 rounded-2xl shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="size-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
                <ShieldAlert className="size-5" />
              </div>
              <h3 className="text-lg font-black text-slate-950">
                Supervisor PIN & Anti-Fraud Protection
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tindakan berisiko tinggi seperti pembatalan nota (void), penyesuaian opname mendadak, atau diskon manual di luar promo wajib diotorisasi dengan PIN Supervisor dan tercatat di immutable Activity Audit Log.
              </p>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border text-xs text-slate-700">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>Pencegahan kebocoran kas kasir dan manipulasi stok shift malam.</span>
            </div>
          </Card>
        </motion.div>

        {/* Card 6: Multi-Tenant RBAC & Cost Masking (Span 6) */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="md:col-span-6">
          <Card className="h-full border border-slate-200 bg-white p-6 rounded-2xl shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="size-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                <Lock className="size-5" />
              </div>
              <h3 className="text-lg font-black text-slate-950">
                Role RBAC & Recursive Cost Redaction
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pemisahan hak akses ketat (Admin, Manager, Kasir, Dapur, Gudang, Akuntan). Role Kasir secara rekursif tidak pernah dapat melihat nilai harga beli HPP bahan baku atau margin kotor perusahaan.
              </p>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border text-xs text-slate-700">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>Privasi data bisnis terlindungi saat ekspansi ratusan staf gerai.</span>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
