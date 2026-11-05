import Link from "next/link";
import { Store, ArrowRight, Home, ShoppingCart, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xl space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center justify-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-white shadow-xs">
            <Store className="size-5 text-primary" />
          </span>
          <div className="text-left">
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl font-black tracking-tight text-slate-950 leading-none">
                KADAI
              </span>
              <span className="text-primary font-black text-2xl leading-none">.</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 block">
              Enterprise POS & ERP
            </span>
          </div>
        </div>

        {/* 404 Badge & Error Text */}
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-orange-50 border border-orange-200/90 font-mono text-xs font-bold text-primary">
            ERROR 404 // HALAMAN TIDAK DITEMUKAN
          </span>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">
            Tautan Tidak Tersedia
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Halaman yang Anda tuju mungkin telah dipindahkan, diubah alamatnya, atau sesi akses telah berakhir.
          </p>
        </div>

        {/* Direct Action Links */}
        <div className="flex flex-col gap-2.5 pt-2">
          <Button
            asChild
            className="w-full font-bold text-xs h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
          >
            <Link href="/pos" className="flex items-center justify-center gap-2">
              <ShoppingCart className="size-4" />
              <span>Buka Terminal Kasir POS</span>
              <ArrowRight className="size-3.5" />
            </Link>
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
              <span>Halaman Utama KADAI</span>
            </Link>
          </Button>
        </div>

        <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
          KADAI Operating System • SAK EMKM & POS Hub
        </div>
      </div>
    </div>
  );
}
