"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected runtime error
    console.error("[KADAI_RUNTIME_ERROR]:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xl space-y-6">
        {/* Error Icon */}
        <div className="mx-auto size-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-2xs">
          <AlertCircle className="size-6" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-rose-50 border border-rose-200/90 font-mono text-xs font-bold text-rose-700">
            SISTEM MENEMUKAN KENDALA
          </span>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">
            Terjadi Kesalahan Operasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Permintaan tidak dapat diproses secara normal. Coba muat ulang halaman ini atau kembali ke menu navigasi aman.
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-slate-500 pt-1">
              Error Digest ID: {error.digest}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full font-bold text-xs h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
          >
            <RotateCcw className="size-3.5 mr-2" />
            <span>Muat Ulang Halaman (Coba Lagi)</span>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full font-semibold text-xs h-10 rounded-xl border-slate-300 text-slate-800 hover:bg-slate-50"
          >
            <Link href="/dashboard" className="flex items-center justify-center gap-2">
              <LayoutDashboard className="size-4 text-slate-500" />
              <span>Kembali ke Dashboard Utama</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            className="w-full font-semibold text-xs h-9 text-slate-600 hover:text-slate-950"
          >
            <Link href="/" className="flex items-center justify-center gap-1.5">
              <Home className="size-3.5" />
              <span>Ke Halaman Depan</span>
            </Link>
          </Button>
        </div>

        <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
          KADAI Resilient Core • Automated Recovery
        </div>
      </div>
    </div>
  );
}
