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
} from "lucide-react";

export function EnterpriseInteractiveShowcase() {
  const [activeTab, setActiveTab] = useState<"pos" | "kds" | "fifo" | "finance">("pos");

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-slate-200/90 bg-white shadow-xl overflow-hidden transition-all duration-200">
      {/* Window Titlebar */}
      <div className="bg-slate-900 text-slate-300 px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="size-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="size-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="ml-2 font-mono text-xs text-slate-400 font-semibold hidden sm:inline">
            kadai-os // live-terminal-preview
          </span>
        </div>

        {/* Interactive Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl text-xs font-semibold overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab("pos")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "pos"
                ? "bg-orange-600 text-white shadow-sm font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShoppingCart className="size-3.5" />
            <span>POS Kasir Kilat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("kds")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "kds"
                ? "bg-orange-600 text-white shadow-sm font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ChefHat className="size-3.5" />
            <span>KDS Kitchen Monitor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("fifo")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "fifo"
                ? "bg-orange-600 text-white shadow-sm font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Warehouse className="size-3.5" />
            <span>Inventori Batch FIFO</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("finance")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "finance"
                ? "bg-orange-600 text-white shadow-sm font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileSpreadsheet className="size-3.5" />
            <span>Pajak & SAK EMKM</span>
          </button>
        </div>
      </div>

      {/* Showcase Content Canvas */}
      <div className="p-4 sm:p-6 bg-slate-50/50 min-h-[380px]">
        {/* TAB 1: POS KASIR */}
        {activeTab === "pos" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-800">Terminal POS #01 — Kasir Aktif</span>
                <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                  SCANNER READY (0.18s)
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Pelanggan:</span>
                <span className="bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded text-[11px]">
                  Bpk. Hendro (VIP 420 Poin)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cart List */}
              <div className="md:col-span-2 space-y-2 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
                  <span>Keranjang Transaksi (3 Item)</span>
                  <span className="text-emerald-600 font-mono font-bold">BOM Realtime Deducted</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <div className="font-bold text-slate-900">Dimsum Hakau Udang Imperial (4 pcs)</div>
                      <div className="text-[11px] text-slate-500">Resep BOM: Udang 120g, Tepung Tang Mien 40g</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">2x @ Rp 38.000</div>
                      <div className="font-mono text-emerald-600 font-bold">Rp 76.000</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <div className="font-bold text-slate-900">Siomay Ayam Jamur Premium</div>
                      <div className="text-[11px] text-slate-500">Resep BOM: Daging Ayam 100g, Jamur Shiitake 30g</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">1x @ Rp 32.000</div>
                      <div className="font-mono text-emerald-600 font-bold">Rp 32.000</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <div className="font-bold text-slate-900">Es Teh Oolong Chrysanthemum</div>
                      <div className="text-[11px] text-slate-500">Station Barista / Minuman</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">2x @ Rp 16.000</div>
                      <div className="font-mono text-emerald-600 font-bold">Rp 32.000</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="space-y-3 bg-slate-900 text-white p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-semibold mb-3">Rincian Perhitungan Pajak & Total</div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Subtotal Item</span>
                      <span className="font-mono font-semibold">Rp 140.000</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Diskon Loyalty (10%)</span>
                      <span className="font-mono text-emerald-400">-Rp 14.000</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>PB1 / PBJT Restoran (10%)</span>
                      <span className="font-mono font-semibold">Rp 12.600</span>
                    </div>
                    <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-white">
                      <span>Total Tagihan</span>
                      <span className="font-mono text-orange-400 text-base">Rp 138.600</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold">
                    <button type="button" className="bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-center text-slate-200">
                      QRIS Dinamis
                    </button>
                    <button type="button" className="bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-center text-slate-200">
                      Tunai Pas
                    </button>
                  </div>
                  <button type="button" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md">
                    <Printer className="size-3.5" />
                    <span>Cetak Struk Thermal (58/80mm)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KDS KITCHEN DISPLAY */}
        {activeTab === "kds" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-800">Layar Monitor Dapur (Kitchen Display System)</span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  0 ANTRIAN HILANG
                </span>
              </div>
              <div className="text-xs font-mono text-slate-500">Routing Otomatis: Dapur Makanan vs Bar Minuman</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Ticket 1 */}
              <div className="bg-white rounded-xl border-2 border-orange-500 p-3.5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm">Meja #04 • Dine-In</div>
                  <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <Clock className="size-3" /> 04:12 Menit
                  </span>
                </div>
                <div className="space-y-1.5 text-xs border-y border-slate-100 py-2">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>2x Hakau Udang Imperial</span>
                    <span className="text-orange-600 font-bold">Kukus</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>1x Xiao Long Bao Daging</span>
                    <span className="text-orange-600 font-bold">Kukus</span>
                  </div>
                  <div className="text-[11px] text-slate-400 italic">Catatan: Jangan pakai daun bawang</div>
                </div>
                <button type="button" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  <span>Tandai Siap Saji</span>
                </button>
              </div>

              {/* Ticket 2 */}
              <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm">Meja #09 • QR Self-Order</div>
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <Clock className="size-3" /> 01:45 Menit
                  </span>
                </div>
                <div className="space-y-1.5 text-xs border-y border-slate-100 py-2">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>2x Siomay Kepiting Menteng</span>
                    <span className="text-slate-600 font-bold">Dapur 1</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>1x Lumpia Kulit Tahu Goreng</span>
                    <span className="text-amber-600 font-bold">Goreng</span>
                  </div>
                </div>
                <button type="button" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5">
                  <span>Mulai Masak</span>
                </button>
              </div>

              {/* Ticket 3: Station Bar */}
              <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs space-y-3 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm">Station Barista // Meja #04</div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    SELESAI (02:10)
                  </span>
                </div>
                <div className="space-y-1.5 text-xs border-y border-slate-100 py-2">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>2x Es Teh Oolong Chrysanthemum</span>
                    <span className="text-emerald-600 font-bold">Siap Antar</span>
                  </div>
                </div>
                <div className="bg-slate-50 text-slate-500 font-semibold py-1.5 rounded-lg text-xs text-center">
                  Telah Diantar Pramusaji
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FIFO INVENTORY */}
        {activeTab === "fifo" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-orange-600" />
                <span className="text-xs font-bold text-slate-800">Manajemen Inventori & Pelacakan Batch FIFO</span>
                <span className="text-[10px] font-mono bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                  FIRST IN, FIRST OUT
                </span>
              </div>
              <div className="text-xs text-slate-500">Mencegah Kerugian Kadaluarsa (Expired Date Guard)</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Batch Number</th>
                    <th className="py-2.5 px-3">Nama Bahan / Produk</th>
                    <th className="py-2.5 px-3">Tgl Masuk</th>
                    <th className="py-2.5 px-3">Expired Date</th>
                    <th className="py-2.5 px-3">Sisa Stok</th>
                    <th className="py-2.5 px-3">Harga Pokok (HPP)</th>
                    <th className="py-2.5 px-3">Status Alokasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  <tr className="bg-orange-50/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-orange-800">BATCH-UDG-202611-A</td>
                    <td className="py-2.5 px-3 font-bold">Udang Vaname Fresh Kupas</td>
                    <td className="py-2.5 px-3 text-slate-500">01 Nov 2026</td>
                    <td className="py-2.5 px-3 text-amber-700 font-semibold">08 Nov 2026 (7 hari)</td>
                    <td className="py-2.5 px-3 font-mono font-bold">4.200 gram</td>
                    <td className="py-2.5 px-3 font-mono">Rp 88 / gram</td>
                    <td className="py-2.5 px-3">
                      <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        PRIORITAS KONSUMSI 1
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">BATCH-UDG-202611-B</td>
                    <td className="py-2.5 px-3 font-bold">Udang Vaname Fresh Kupas</td>
                    <td className="py-2.5 px-3 text-slate-500">03 Nov 2026</td>
                    <td className="py-2.5 px-3 text-slate-600">10 Nov 2026 (9 hari)</td>
                    <td className="py-2.5 px-3 font-mono font-bold">10.000 gram</td>
                    <td className="py-2.5 px-3 font-mono">Rp 85 / gram</td>
                    <td className="py-2.5 px-3">
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                        Antrean Batch 2
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">BATCH-SRM-ACNE-04</td>
                    <td className="py-2.5 px-3 font-bold">Serum Acne Clarifying 20ml</td>
                    <td className="py-2.5 px-3 text-slate-500">15 Okt 2026</td>
                    <td className="py-2.5 px-3 text-slate-600">15 Okt 2027</td>
                    <td className="py-2.5 px-3 font-mono font-bold">45 botol</td>
                    <td className="py-2.5 px-3 font-mono">Rp 65.000</td>
                    <td className="py-2.5 px-3">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        Stok Aman (FIFO)
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <span className="font-medium">Otomatis menghitung HPP ril pada Laporan Laba Rugi saat setiap porsi terjual.</span>
              <span className="font-bold text-orange-600 flex items-center gap-1">
                Akurasi Biaya 99.98% <ArrowUpRight className="size-3.5" />
              </span>
            </div>
          </div>
        )}

        {/* TAB 4: PAJAK & SAK EMKM */}
        {activeTab === "finance" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">Laporan Akuntansi Standar SAK EMKM & Pajak Resmi</span>
                <span className="text-[10px] font-mono bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">
                  SIAP AUDIT PAJAK & BANK
                </span>
              </div>
              <div className="text-xs text-slate-500">Kepatuhan PP 55/2022 & PB1 Pemda</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-[11px] font-semibold text-slate-500">Omzet Bruto Bulan Ini</div>
                <div className="text-lg font-black text-slate-900 font-mono">Rp 184.500.000</div>
                <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="size-3" /> +14.2% vs bulan lalu
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-[11px] font-semibold text-slate-500">Laba Bersih Operasional (HPP FIFO)</div>
                <div className="text-lg font-black text-emerald-700 font-mono">Rp 68.210.000</div>
                <div className="text-[10px] text-slate-500 font-semibold">Margin Bersih: 36.9%</div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-[11px] font-semibold text-slate-500">Setoran Pajak PB1 10% (Pemda)</div>
                <div className="text-lg font-black text-orange-600 font-mono">Rp 18.450.000</div>
                <div className="text-[10px] text-slate-500 font-semibold">Otomatis terpisah dari kas</div>
              </div>
            </div>

            <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-white">
                <span>Monitoring Batas Bebas Pajak UMKM (PP 55/2022)</span>
                <span className="font-mono text-emerald-400">Rp 184,5 Juta / Rp 500 Juta</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-2 rounded-full w-[37%]" />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Wajib Pajak Orang Pribadi: Tarif 0.5% berlaku setelah omzet melewati Rp 500 Juta.</span>
                <span className="text-emerald-400 font-semibold">Pajak PPh Final Saat Ini: Rp 0 (Bebas)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="bg-slate-100 px-4 py-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-600 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="size-3 text-emerald-600" /> Database: PostgreSQL WAL
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Enkripsi: TLS 1.3 / HMAC</span>
        </div>
        <div className="font-semibold text-slate-800">
          Versi Produksi KADAI v2.4 // Uptime 99.98%
        </div>
      </div>
    </div>
  );
}
