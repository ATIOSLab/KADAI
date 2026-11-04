"use client";

import { useState } from "react";
import {
  ShoppingCart,
  ChefHat,
  Warehouse,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Printer,
  Barcode,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Percent,
  AlertTriangle,
  Sparkles,
  Zap,
  Activity,
  CreditCard,
  QrCode,
  ShieldAlert,
} from "lucide-react";

export function EnterpriseInteractiveShowcase() {
  const [activeTab, setActiveTab] = useState<"pos" | "kds" | "fifo" | "finance">("pos");

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_20px_rgba(234,88,12,0.15)] overflow-hidden transition-all duration-300">
      {/* Top Chrome Titlebar */}
      <div className="bg-slate-900/90 text-slate-300 px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-rose-500/80 inline-block shadow-xs shadow-rose-500/50" />
            <span className="size-3 rounded-full bg-amber-500/80 inline-block shadow-xs shadow-amber-500/50" />
            <span className="size-3 rounded-full bg-emerald-500/80 inline-block shadow-xs shadow-emerald-500/50" />
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <span className="text-orange-400 font-bold">kadai-os</span>
            <span className="text-slate-600">//</span>
            <span className="text-slate-300">terminal.cluster-01.live</span>
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
          </div>
        </div>

        {/* Interactive Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/[0.08] text-xs font-semibold overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab("pos")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "pos"
                ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold shadow-md shadow-orange-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            <ShoppingCart className="size-3.5" />
            <span>POS Kasir Kilat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("kds")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "kds"
                ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold shadow-md shadow-orange-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            <ChefHat className="size-3.5" />
            <span>KDS Kitchen Monitor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("fifo")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "fifo"
                ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold shadow-md shadow-orange-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            <Warehouse className="size-3.5" />
            <span>Inventori Batch FIFO</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("finance")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "finance"
                ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold shadow-md shadow-orange-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            <FileSpreadsheet className="size-3.5" />
            <span>Pajak & SAK EMKM</span>
          </button>
        </div>
      </div>

      {/* Showcase Content Canvas */}
      <div className="p-4 sm:p-6 bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950 min-h-[400px] text-slate-100">
        {/* TAB 1: POS KASIR */}
        {activeTab === "pos" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                <span className="text-xs font-bold text-slate-200">POS Terminal #01 — Menteng Flagship</span>
                <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                  SCANNER 0.18s READY
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Pelanggan CRM:</span>
                <span className="bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold px-2 py-0.5 rounded text-[11px]">
                  Bpk. Hendro (VIP 420 Poin)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cart List */}
              <div className="md:col-span-2 space-y-2 bg-slate-900/60 p-4 rounded-xl border border-white/[0.08] backdrop-blur-sm">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
                  <span>Keranjang Aktif (3 Item)</span>
                  <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <Activity className="size-3" /> BOM Auto-Deduct
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-white/[0.05] text-xs hover:border-orange-500/30 transition-colors">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>Hakau Udang Imperial (4 pcs)</span>
                        <span className="text-[10px] bg-orange-950/80 text-orange-400 border border-orange-500/30 px-1.5 py-0.2 rounded font-mono">
                          DAPUR 1
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Resep: Udang 120g • Tepung Tang Mien 40g
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400">2x @ Rp 38.000</div>
                      <div className="font-mono text-orange-400 font-bold">Rp 76.000</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-white/[0.05] text-xs hover:border-orange-500/30 transition-colors">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>Siomay Ayam Jamur Premium</span>
                        <span className="text-[10px] bg-orange-950/80 text-orange-400 border border-orange-500/30 px-1.5 py-0.2 rounded font-mono">
                          DAPUR 1
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Resep: Ayam 100g • Jamur Shiitake 30g
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400">1x @ Rp 32.000</div>
                      <div className="font-mono text-orange-400 font-bold">Rp 32.000</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-white/[0.05] text-xs hover:border-orange-500/30 transition-colors">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>Es Teh Oolong Chrysanthemum</span>
                        <span className="text-[10px] bg-blue-950/80 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 rounded font-mono">
                          BAR MINUMAN
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Resep: Daun Oolong 15g • Bunga Krisan 5g
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400">2x @ Rp 16.000</div>
                      <div className="font-mono text-orange-400 font-bold">Rp 32.000</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkout Calculation Panel */}
              <div className="space-y-3 bg-slate-900/90 border border-white/10 p-4 rounded-xl flex flex-col justify-between backdrop-blur-md">
                <div>
                  <div className="text-xs text-slate-400 font-semibold mb-3 flex items-center justify-between">
                    <span>Perhitungan Pembayaran</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      PAJAK RESMI
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal Item</span>
                      <span className="font-mono text-slate-200">Rp 140.000</span>
                    </div>
                    <div className="flex justify-between text-emerald-400">
                      <span>Diskon Loyalty (10%)</span>
                      <span className="font-mono">-Rp 14.000</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Pajak Restoran PB1 (10%)</span>
                      <span className="font-mono text-slate-200">Rp 12.600</span>
                    </div>
                    <div className="border-t border-white/10 pt-2 flex justify-between text-sm font-bold text-white">
                      <span>Total Bayar</span>
                      <span className="font-mono text-orange-400 text-lg">Rp 138.600</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold">
                    <button type="button" className="bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-slate-200 border border-white/[0.08] flex items-center justify-center gap-1 cursor-pointer">
                      <QrCode className="size-3 text-orange-400" />
                      <span>QRIS Dinamis</span>
                    </button>
                    <button type="button" className="bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-slate-200 border border-white/[0.08] flex items-center justify-center gap-1 cursor-pointer">
                      <CreditCard className="size-3 text-blue-400" />
                      <span>Kartu EDC</span>
                    </button>
                  </div>
                  <button type="button" className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-orange-600/30 cursor-pointer">
                    <Printer className="size-3.5" />
                    <span>Cetak Struk Thermal (58/80mm)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KDS KITCHEN MONITOR */}
        {activeTab === "kds" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316] animate-pulse" />
                <span className="text-xs font-bold text-slate-200">Monitor Dapur Real-Time (Kitchen Display System)</span>
                <span className="text-[10px] font-mono bg-orange-950/80 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded">
                  AUDIO CHIME READY
                </span>
              </div>
              <div className="text-xs font-mono text-slate-400">Zero Lost Ticket • Auto-Split Station</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Ticket 1 */}
              <div className="bg-slate-900/80 rounded-xl border-2 border-orange-500/80 p-3.5 shadow-lg shadow-orange-500/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-sm">Meja #04 • Dine-In</div>
                  <span className="bg-orange-950 text-orange-400 border border-orange-500/40 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <Clock className="size-3" /> 04:12 Menit
                  </span>
                </div>
                <div className="space-y-1.5 text-xs border-y border-white/[0.08] py-2">
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>2x Hakau Udang Imperial</span>
                    <span className="text-orange-400 font-bold">Kukusan #2</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>1x Xiao Long Bao Daging</span>
                    <span className="text-orange-400 font-bold">Kukusan #1</span>
                  </div>
                  <div className="text-[11px] text-amber-300 italic">Catatan: Kuah ekstra jahe</div>
                </div>
                <button type="button" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30 cursor-pointer">
                  <CheckCircle2 className="size-3.5" />
                  <span>Tandai Siap Saji</span>
                </button>
              </div>

              {/* Ticket 2 */}
              <div className="bg-slate-900/80 rounded-xl border border-white/10 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-sm">Meja #09 • Self-Order QR</div>
                  <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <Clock className="size-3" /> 01:45 Menit
                  </span>
                </div>
                <div className="space-y-1.5 text-xs border-y border-white/[0.08] py-2">
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>2x Siomay Kepiting Menteng</span>
                    <span className="text-slate-400 font-bold">Dapur 1</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>1x Lumpia Kulit Tahu Goreng</span>
                    <span className="text-amber-400 font-bold">Penggorengan</span>
                  </div>
                </div>
                <button type="button" className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer">
                  <span>Mulai Masak</span>
                </button>
              </div>

              {/* Ticket 3 */}
              <div className="bg-slate-900/80 rounded-xl border border-white/10 p-3.5 space-y-3 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-sm">Station Barista // Meja #04</div>
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                    SELESAI (02:10)
                  </span>
                </div>
                <div className="space-y-1.5 text-xs border-y border-white/[0.08] py-2">
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>2x Es Teh Oolong Chrysanthemum</span>
                    <span className="text-emerald-400 font-bold">Siap Antar</span>
                  </div>
                </div>
                <div className="bg-slate-950 text-slate-400 font-semibold py-1.5 rounded-lg text-xs text-center border border-white/[0.05]">
                  Telah Diantar Pramusaji
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FIFO INVENTORY */}
        {activeTab === "fifo" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-orange-400" />
                <span className="text-xs font-bold text-slate-200">Inventori Multi-Batch & Tanggal Kadaluarsa (FIFO)</span>
                <span className="text-[10px] font-mono bg-blue-950 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">
                  FIRST IN, FIRST OUT
                </span>
              </div>
              <div className="text-xs text-slate-400">Proteksi Nol Kerugian Bahan Basi</div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-slate-900/60 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-white/10 text-slate-400 font-semibold">
                    <th className="py-2.5 px-3">Batch ID</th>
                    <th className="py-2.5 px-3">Bahan Baku / Produk</th>
                    <th className="py-2.5 px-3">Tgl Masuk</th>
                    <th className="py-2.5 px-3">Expired Date</th>
                    <th className="py-2.5 px-3">Sisa Stok</th>
                    <th className="py-2.5 px-3">Harga Pokok (HPP)</th>
                    <th className="py-2.5 px-3">Prioritas Alokasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] font-medium text-slate-200">
                  <tr className="bg-orange-500/10">
                    <td className="py-2.5 px-3 font-mono font-bold text-orange-400">BATCH-UDG-202611-A</td>
                    <td className="py-2.5 px-3 font-bold text-white">Udang Vaname Fresh Kupas</td>
                    <td className="py-2.5 px-3 text-slate-400">01 Nov 2026</td>
                    <td className="py-2.5 px-3 text-amber-400 font-semibold">08 Nov 2026 (7 hari)</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-white">4.200 gram</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">Rp 88 / gram</td>
                    <td className="py-2.5 px-3">
                      <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs shadow-orange-600/50">
                        PRIORITAS 1 (KELUAR SEKARANG)
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono text-slate-400">BATCH-UDG-202611-B</td>
                    <td className="py-2.5 px-3 font-bold text-slate-300">Udang Vaname Fresh Kupas</td>
                    <td className="py-2.5 px-3 text-slate-400">03 Nov 2026</td>
                    <td className="py-2.5 px-3 text-slate-400">10 Nov 2026 (9 hari)</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">10.000 gram</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">Rp 85 / gram</td>
                    <td className="py-2.5 px-3">
                      <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded border border-white/[0.08]">
                        Antrean Batch 2
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono text-slate-400">BATCH-SRM-ACNE-04</td>
                    <td className="py-2.5 px-3 font-bold text-slate-300">Serum Acne Clarifying 20ml</td>
                    <td className="py-2.5 px-3 text-slate-400">15 Okt 2026</td>
                    <td className="py-2.5 px-3 text-slate-400">15 Okt 2027</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">45 botol</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">Rp 65.000</td>
                    <td className="py-2.5 px-3">
                      <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                        Stok Farmasi Aman
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>HPP dihitung otomatis per batch secara real-time saat transaksi selesai di kasir.</span>
              <span className="font-bold text-orange-400 flex items-center gap-1">
                Akurasi Biaya 99.98% <ArrowUpRight className="size-3.5" />
              </span>
            </div>
          </div>
        )}

        {/* TAB 4: PAJAK & SAK EMKM */}
        {activeTab === "finance" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">Kepatuhan Akuntansi SAK EMKM & Pajak RI Resmi</span>
                <span className="text-[10px] font-mono bg-purple-950 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded">
                  SIAP AUDIT DJP & BANK
                </span>
              </div>
              <div className="text-xs text-slate-400">PP 55/2022 & PB1 Pemda Otomatis</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-white/10 space-y-1">
                <div className="text-[11px] font-semibold text-slate-400">Omzet Bruto Bulan Ini</div>
                <div className="text-xl font-black text-white font-mono">Rp 184.500.000</div>
                <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="size-3" /> +14.2% vs bulan lalu
                </div>
              </div>

              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-white/10 space-y-1">
                <div className="text-[11px] font-semibold text-slate-400">Laba Bersih Operasional (HPP FIFO)</div>
                <div className="text-xl font-black text-emerald-400 font-mono">Rp 68.210.000</div>
                <div className="text-[10px] text-slate-400">Margin Bersih: 36.9%</div>
              </div>

              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-white/10 space-y-1">
                <div className="text-[11px] font-semibold text-slate-400">Setoran Pajak PB1 10% (Pemda)</div>
                <div className="text-xl font-black text-orange-400 font-mono">Rp 18.450.000</div>
                <div className="text-[10px] text-slate-400">Terpisah dari kas pendapatan</div>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-white/10 text-xs space-y-2.5">
              <div className="flex items-center justify-between font-bold text-white">
                <span className="flex items-center gap-2">
                  <ShieldAlert className="size-4 text-emerald-400" />
                  <span>Monitoring Batas Bebas Pajak UMKM (PP 55/2022)</span>
                </span>
                <span className="font-mono text-emerald-400">Rp 184,5 Juta / Rp 500 Juta</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-white/[0.05]">
                <div className="bg-gradient-to-r from-emerald-500 to-amber-500 h-2.5 rounded-full w-[37%]" />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Wajib Pajak Orang Pribadi: Tarif 0.5% berlaku setelah omzet melewati Rp 500 Juta.</span>
                <span className="text-emerald-400 font-semibold font-mono">PPh Final Saat Ini: Rp 0 (Bebas)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="bg-slate-950 px-4 py-2.5 border-t border-white/[0.08] flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="size-3.5" /> Engine: PostgreSQL WAL HA
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline text-slate-400">Protokol: TLS 1.3 End-to-End</span>
        </div>
        <div className="font-semibold text-slate-300 flex items-center gap-1">
          <Zap className="size-3 text-orange-400" />
          <span>KADAI Enterprise Core v2.4</span>
        </div>
      </div>
    </div>
  );
}
