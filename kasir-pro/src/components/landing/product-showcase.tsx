"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingCart,
  Warehouse,
  ChefHat,
  Scale,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TabItem {
  id: string;
  name: string;
  icon: typeof ShoppingCart;
  badge: string;
  title: string;
  subtitle: string;
  metrics: Array<{ label: string; value: string }>;
  content: {
    meta: { ref: string; status: string; statusClass: string };
    rows: Array<{ label: string; sub?: string; val: string; bold?: boolean }>;
    summary: { label: string; val: string; note: string };
  };
}

const TABS: TabItem[] = [
  {
    id: "pos",
    name: "POS & Kasir",
    icon: ShoppingCart,
    badge: "Point of Sale",
    title: "Terminal Kasir POS Kilat & Struk Thermal",
    subtitle: "Pencatatan nota kasir sub-detik, kalkulasi pajak daerah PB1 10%, biaya layanan, diskon member, hingga cetak thermal 58mm/80mm.",
    metrics: [
      { label: "Latensi Transaksi", value: "< 0.2 Detik" },
      { label: "Pajak Restoran", value: "PB1 10% Otomatis" },
      { label: "Dukungan Cetak", value: "58mm & 80mm" },
    ],
    content: {
      meta: { ref: "INV-20261105-0042 • MEJA 04 (DINE IN)", status: "KASIR LUNAS", statusClass: "bg-emerald-100 text-emerald-800 border-emerald-300" },
      rows: [
        { label: "2x Nasi Goreng Spesial", sub: "BOM: Beras, Telur, Ayam Potong", val: "Rp 64.000" },
        { label: "2x Es Kopi Susu Aren Gayo", sub: "BOM: Arabica Gayo, Susu UHT, Aren", val: "Rp 36.000" },
        { label: "Pajak Restoran Daerah PB1 (10%)", val: "Rp 10.000" },
        { label: "Biaya Layanan Service (5%)", val: "Rp 5.000" },
      ],
      summary: { label: "TOTAL TAGIHAN", val: "Rp 115.000", note: "Kalkulasi HPP FIFO: Rp 42.500 (Margin 63%) • Siap Cetak Thermal" },
    },
  },
  {
    id: "inventory",
    name: "Inventori",
    icon: Warehouse,
    badge: "Stok FIFO",
    title: "Inventori Multi-Batch FIFO & Radar Kadaluwarsa",
    subtitle: "Pelacakan alur First-In First-Out per nomor batch, peringatan otomatis bahan mendekati expired date, dan kartu stok mutasi riil.",
    metrics: [
      { label: "Metode Penilaian", value: "FIFO SAK EMKM" },
      { label: "Radar Expired", value: "Alert < 30 Hari" },
      { label: "Akurasi Opname", value: "100% Tercatat" },
    ],
    content: {
      meta: { ref: "SKU: BMF-ARABICA-01 • GUDANG PUSAT", status: "FIFO AKTIF", statusClass: "bg-blue-100 text-blue-800 border-blue-300" },
      rows: [
        { label: "Batch #01 (Prioritas Keluar)", sub: "Tgl Beli: 01 Nov 2026 • Sisa 12 kg", val: "HPP Rp 140.000/kg" },
        { label: "Batch #02 (Stok Masuk Baru)", sub: "Tgl Beli: 04 Nov 2026 • Sisa 25 kg", val: "HPP Rp 145.000/kg" },
        { label: "Total Stok Tersedia", sub: "Ambang Minimum: 10 kg", val: "37 kg (Aman)", bold: true },
        { label: "Valuasi Persediaan Riil", sub: "Sesuai Standar PSAK 14", val: "Rp 5.305.000" },
      ],
      summary: { label: "TOTAL VALUASI BATCH", val: "Rp 5.305.000", note: "Batch #01 otomatis terpotong lebih dulu saat pesanan kasir masuk" },
    },
  },
  {
    id: "kitchen",
    name: "Dapur Pusat",
    icon: ChefHat,
    badge: "Central Kitchen",
    title: "Resep BOM, Produksi Batch & Layar KDS",
    subtitle: "Standardisasi resep menu, eksekusi produksi batch bahan baku setengah jadi, dan sinkronisasi tiket langsung ke layar koki dapur & bar.",
    metrics: [
      { label: "Alur Produksi", value: "1-Click Batch" },
      { label: "Routing Tiket", value: "Dapur & Bar" },
      { label: "Bypass Antrean", value: "Direct Serve" },
    ],
    content: {
      meta: { ref: "BATCH-PROD-20261105-08 • STATUS: SIAP SAJI", status: "KDS TERHUBUNG", statusClass: "bg-amber-100 text-amber-900 border-amber-300" },
      rows: [
        { label: "Eksekusi Batch 50 Porsi Saus Rendang", sub: "Komponen BOM: Daging, Santan, Bumbu Halus", val: "50 Porsi" },
        { label: "Debit Stok Bahan Mentah", sub: "FIFO Batch Gudang Pusat", val: "Rp 850.000" },
        { label: "Tiket Dapur #INV-0089", sub: "Meja 07 • 2x Ayam Bakar Madu", val: "04:18 (Sedang Dimasak)" },
        { label: "Tiket Bar #INV-0089", sub: "Meja 07 • 2x Es Kopi Susu", val: "Ready Saji" },
      ],
      summary: { label: "HPP / PORSI TERSTANDARISASI", val: "Rp 17.000", note: "Otomatis menambah stok produk jadi dan mendebit bahan mentah" },
    },
  },
  {
    id: "finance",
    name: "Pembukuan",
    icon: Scale,
    badge: "Akuntansi RI",
    title: "Laba Rugi SAK EMKM & Pajak PP 55/2022",
    subtitle: "Penyusunan otomatis laporan laba rugi berbasis HPP riil, buku peredaran bruto bulanan, dan kalkulasi PPh Final UMKM 0.5%.",
    metrics: [
      { label: "Standar Laporan", value: "SAK EMKM IAI" },
      { label: "Pajak Omzet", value: "PPh Final 0.5%" },
      { label: "Batas Bebas OP", value: "PTKP < Rp 500 Jt" },
    ],
    content: {
      meta: { ref: "PERIODE: OKTOBER 2026 • BUKU PEREDARAN BRUTO", status: "AUDIT READY", statusClass: "bg-rose-100 text-rose-800 border-rose-300" },
      rows: [
        { label: "Peredaran Bruto (Omzet Penjualan)", sub: "Total 480 Transaksi Kasir", val: "Rp 48.500.000", bold: true },
        { label: "Beban Pokok Penjualan (HPP FIFO)", sub: "Bahan Baku & Kemasan Terpakai", val: "-Rp 17.250.000" },
        { label: "Laba Kotor Usaha (Gross Profit)", sub: "Margin Kotor: 64.4%", val: "Rp 31.250.000", bold: true },
        { label: "Setoran PPh Final 0.5% (PP 55)", sub: "Akumulasi Omzet < Rp 500 Juta", val: "Rp 0 (Bebas PTKP)" },
      ],
      summary: { label: "LABA BERSIH OPERASIONAL", val: "Rp 31.250.000", note: "Format laporan siap cetak untuk pengajuan perbankan & kepatuhan fiskal" },
    },
  },
  {
    id: "outlets",
    name: "Multi-Cabang",
    icon: Building2,
    badge: "Rantai Pasok",
    title: "Manajemen Multi-Outlet & Transfer Stok",
    subtitle: "Distribusi bahan baku dari Gudang Pusat ke gerai cabang/booth dengan surat jalan digital terenkripsi dan konfirmasi penerimaan 1-klik.",
    metrics: [
      { label: "Topologi Jaringan", value: "Hub & Spoke" },
      { label: "Surat Jalan", value: "Digital Otomatis" },
      { label: "Hak Akses Staf", value: "RBAC 6-Role" },
    ],
    content: {
      meta: { ref: "TRF-20261105-0014 • GUDANG HQ → BOOTH THAMRIN", status: "IN TRANSIT", statusClass: "bg-purple-100 text-purple-800 border-purple-300" },
      rows: [
        { label: "Biji Kopi Arabica Gayo (15 kg)", sub: "Batch #01 • Scoped HPP Rp 140.000", val: "Rp 2.100.000" },
        { label: "Susu Pasteurisasi Segar (30 liter)", sub: "Batch #04 • Scoped HPP Rp 20.000", val: "Rp 600.000" },
        { label: "Cup & Tutup Takeaway (500 pcs)", sub: "Kemasan Standar Minuman", val: "Rp 350.000" },
        { label: "Petugas Pengirim", sub: "Gudang Pusat (HQ)", val: "Ahmad Staff" },
      ],
      summary: { label: "TOTAL VALUASI TRANSFER", val: "Rp 3.050.000", note: "Stok asal otomatis terpotong; cabang tujuan menerima via tombol 1-klik" },
    },
  },
];

export function ProductShowcase() {
  const [activeTab, setActiveTab] = useState<string>("pos");

  const current = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <div id="produk" className="max-w-5xl mx-auto w-full space-y-4">
      {/* 5 Segmented Interactive Glass Tabs */}
      <div className="flex items-center justify-center overflow-x-auto pb-1 scrollbar-none">
        <div className="inline-flex p-1.5 rounded-2xl glass-surface-subtle shadow-xs border border-slate-200/80 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-white text-slate-950 shadow-xs ring-1 ring-slate-900/[0.08]"
                    : "text-slate-600 hover:text-slate-950 hover:bg-white/60"
                }`}
              >
                <Icon className={`size-3.5 shrink-0 ${isActive ? "text-primary" : "text-slate-500"}`} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Glass Showcase Window */}
      <div className="rounded-3xl glass-surface-card border border-white/90 shadow-2xl shadow-slate-900/[0.06] overflow-hidden">
        {/* Window Chrome Topbar */}
        <div className="bg-slate-950 text-slate-300 px-4 sm:px-5 py-3 flex items-center justify-between border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="size-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="size-2.5 rounded-full bg-emerald-500/80 inline-block" />
            <span className="font-mono text-slate-300 ml-2 text-[11px] font-semibold">
              kadai.preview // {current.id}-cockpit
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono border-slate-700 text-slate-300">
              {current.badge}
            </Badge>
          </div>
        </div>

        {/* Interior Live Artifact Content with Smooth Transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="p-5 sm:p-8 space-y-6"
          >
            {/* Header Description */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1 max-w-2xl">
                <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  {current.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {current.subtitle}
                </p>
              </div>

              {/* 3 Metric Pills */}
              <div className="grid grid-cols-3 sm:flex items-center gap-2 shrink-0">
                {current.metrics.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-center"
                  >
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">
                      {m.label}
                    </span>
                    <span className="text-xs font-black text-slate-900 font-mono mt-0.5 block whitespace-nowrap">
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Operational Card Replica */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <span className="font-mono text-xs font-bold text-slate-600">
                  {current.content.meta.ref}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${current.content.meta.statusClass} w-fit`}>
                  {current.content.meta.status}
                </span>
              </div>

              {/* Rows Table */}
              <div className="space-y-2 text-xs">
                {current.content.rows.map((row, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center py-1.5 border-b border-dashed border-slate-100"
                  >
                    <div>
                      <span className={`text-slate-900 ${row.bold ? "font-bold" : "font-medium"}`}>
                        {row.label}
                      </span>
                      {row.sub && (
                        <span className="text-[10px] text-slate-500 block font-mono">
                          {row.sub}
                        </span>
                      )}
                    </div>
                    <span className={`font-mono text-slate-900 ${row.bold ? "font-black text-sm" : "font-semibold"}`}>
                      {row.val}
                    </span>
                  </div>
                ))}

                {/* Total Row */}
                <div className="flex justify-between items-center text-sm font-black text-slate-950 pt-3 border-t border-slate-200">
                  <span>{current.content.summary.label}</span>
                  <span className="font-mono text-primary text-base sm:text-lg">
                    {current.content.summary.val}
                  </span>
                </div>
              </div>

              {/* Footer Audit Note */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <CheckCircle2 className="size-3.5 shrink-0" />
                  <span>{current.content.summary.note}</span>
                </div>
                <span className="font-mono font-bold text-slate-800">KADAI Engine Verified</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
