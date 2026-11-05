"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroShowcase({
  dashboardPath,
}: {
  dashboardPath: string | null;
}) {
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
      </div>
    </section>
  );
}
