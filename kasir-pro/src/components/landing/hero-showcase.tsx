"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ShoppingCart,
  ChefHat,
  Warehouse,
  Receipt,
  Printer,
  Clock,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PREVIEW_TABS = [
  {
    id: "pos",
    label: "Kasir POS & Struk PB1",
    icon: ShoppingCart,
    tag: "Point of Sale",
  },
  {
    id: "kds",
    label: "Kitchen Display (KDS)",
    icon: ChefHat,
    tag: "Cockpit Dapur",
  },
  {
    id: "fifo",
    label: "Inventori Batch FIFO & BOM",
    icon: Warehouse,
    tag: "HPP SAK EMKM",
  },
] as const;

export function HeroShowcase({
  dashboardPath,
}: {
  dashboardPath: string | null;
}) {
  const [activeTab, setActiveTab] =
    useState<(typeof PREVIEW_TABS)[number]["id"]>("pos");

  return (
    <section className="relative overflow-hidden py-12 sm:py-20 px-4 sm:px-6 border-b border-border bg-gradient-to-b from-card via-card to-background w-full">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/90 text-slate-800 text-xs font-semibold shadow-xs"
        >
          <Sparkles className="size-3.5 text-primary shrink-0" />
          <span>Sistem Operasi Bisnis & POS Multi-Cabang Indonesia</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight sm:leading-tight text-slate-950 text-balance"
        >
          Kelola Penjualan, Rantai Pasok, & Pembukuan dengan Akurasi Enterprise.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="text-sm sm:text-base md:text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed text-balance"
        >
          KADAI menyatukan kasir POS kilat, inventori multi-batch FIFO, resep
          Bill of Materials (BOM), Kitchen Display System (KDS), hingga pelaporan
          pajak resmi PPN 11% & PB1 10%.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-sm sm:max-w-none mx-auto w-full"
        >
          {dashboardPath ? (
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto font-bold text-sm h-12 px-7 shadow-sm rounded-xl"
            >
              <Link href={dashboardPath} className="flex items-center gap-2">
                <span>Buka Dashboard Operasional</span>
                <ArrowRight className="size-4 shrink-0" />
              </Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto font-bold text-sm h-12 px-7 shadow-sm rounded-xl"
              >
                <Link href="/register" className="flex items-center gap-2">
                  <span>Mulai Uji Coba Gratis 14 Hari</span>
                  <ArrowRight className="size-4 shrink-0" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full sm:w-auto font-semibold text-sm h-12 px-6 rounded-xl border-slate-300 hover:bg-slate-50"
              >
                <Link href="/login">Masuk ke Toko Anda</Link>
              </Button>
            </>
          )}
        </motion.div>

        {/* Value Props Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl mx-auto text-left w-full"
        >
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-700">
              Kepatuhan Standar SAK EMKM RI & PPh Final 0.5%
            </span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-700">
              Otomatisasi Pajak Restoran PB1 10% & PPN 11%
            </span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-700">
              Self-Order QR Mandiri & Layar Dapur KDS Real-time
            </span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-700">
              Multi-Cabang, Transfer Stok & Hak Akses 6-Role RBAC
            </span>
          </div>
        </motion.div>

        {/* Interactive Live UI Preview Window */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          className="pt-8 max-w-4xl mx-auto w-full"
        >
          <div className="rounded-2xl border border-slate-300/80 bg-card shadow-lg overflow-hidden text-left">
            {/* Window Topbar */}
            <div className="bg-slate-900 text-slate-200 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-red-500/80 inline-block" />
                <span className="size-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="size-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-xs font-mono font-bold text-slate-300 ml-2">
                  kadai.preview // live-cockpit
                </span>
              </div>

              {/* Tab Selector Buttons */}
              <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
                {PREVIEW_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                        isSelected
                          ? "text-white font-bold bg-slate-950 shadow-xs"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Icon className="size-3.5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview Content Area */}
            <div className="p-4 sm:p-6 bg-slate-50/70 min-h-[320px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {activeTab === "pos" && (
                  <motion.div
                    key="pos"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-xs p-4 sm:p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <div className="text-xs font-mono text-muted-foreground">
                          INV-20261105-0042 • DINE-IN
                        </div>
                        <h4 className="text-base font-bold text-slate-900">
                          Meja 04 • Kopi Kenangan & Nasi Goreng Spesial
                        </h4>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs">
                        Kasir Aktif
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-dashed">
                        <span>2x Nasi Goreng Spesial (BOM: Ayam, Telur, Beras)</span>
                        <span className="font-mono font-bold">Rp 64.000</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-dashed">
                        <span>2x Es Kopi Susu Aren Gula Asli</span>
                        <span className="font-mono font-bold">Rp 36.000</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500 pt-1">
                        <span>Pajak Restoran PB1 (10%)</span>
                        <span className="font-mono font-semibold">Rp 10.000</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Service Charge (5%)</span>
                        <span className="font-mono font-semibold">Rp 5.000</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-black text-slate-950 pt-2 border-t">
                        <span>TOTAL BAYAR</span>
                        <span className="font-mono text-primary text-base">
                          Rp 115.000
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                        <Printer className="size-4" />
                        <span>Thermal 58/80mm Ready</span>
                      </div>
                      <Badge variant="outline" className="text-[11px] font-mono">
                        FIFO Costing: HPP Rp 42.500
                      </Badge>
                    </div>
                  </motion.div>
                )}

                {activeTab === "kds" && (
                  <motion.div
                    key="kds"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-2xl bg-slate-900 border border-slate-800 text-white rounded-xl shadow-xs p-4 sm:p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground font-mono font-bold text-xs">
                          STASIUN: DAPUR
                        </span>
                        <span className="text-xs font-bold text-slate-200">
                          Meja 07 • Dine In
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono font-bold">
                        <Clock className="size-3.5 animate-spin" />
                        <span>04:18 (Sedang Dimasak)</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm text-white">
                            2x Ayam Bakar Madu Pedas
                          </p>
                          <p className="text-[11px] text-amber-300">
                            Catatan: Sambal dipisah, ekstra lalapan
                          </p>
                        </div>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                          COOKING
                        </Badge>
                      </div>

                      <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm text-white">
                            1x Sup Iga Sapi Kuah Rempah
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Standar porsi meja
                          </p>
                        </div>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                          COOKING
                        </Badge>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between items-center text-xs text-slate-400 border-t border-slate-800">
                      <span>Bypass Otomatis untuk Outlet Booth Langsung Saji</span>
                      <span className="text-emerald-400 font-bold">
                        Tombol Dapur: Siap Saji →
                      </span>
                    </div>
                  </motion.div>
                )}

                {activeTab === "fifo" && (
                  <motion.div
                    key="fifo"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-xs p-4 sm:p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <div className="text-xs font-mono text-muted-foreground">
                          SKU: BMF-ARABICA-01 • GUDANG PUSAT
                        </div>
                        <h4 className="text-base font-bold text-slate-950">
                          Biji Kopi Arabica Gayo Premium (Batch Multi-Layer)
                        </h4>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-bold text-xs">
                        FIFO Tracked
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-4 gap-2 font-mono font-bold text-slate-500 pb-1 border-b">
                        <span>Batch #</span>
                        <span>Tgl Beli</span>
                        <span>Sisa Stok</span>
                        <span className="text-right">HPP / Unit</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 font-mono py-1 border-b border-dashed items-center text-emerald-800 bg-emerald-50/60 px-1 rounded">
                        <span className="font-bold">BATCH-01 (Next Out)</span>
                        <span>01 Nov 2026</span>
                        <span className="font-bold">12 kg</span>
                        <span className="text-right font-bold">Rp 140.000</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 font-mono py-1 border-b border-dashed items-center text-slate-600 px-1">
                        <span>BATCH-02</span>
                        <span>04 Nov 2026</span>
                        <span>25 kg</span>
                        <span className="text-right">Rp 145.000</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Layers className="size-4 text-primary" />
                        <span>Transfer Antar Cabang: Gudang → Booth 01/02</span>
                      </div>
                      <span className="font-bold text-slate-900">
                        Sesuai Ketentuan PSAK 14 / SAK EMKM
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}