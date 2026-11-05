"use client";

import { Store } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs py-8 px-4 sm:px-6 border-t border-slate-800">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Store className="size-3.5" />
          </span>
          <span className="font-semibold text-slate-300">
            KADAI
          </span>
          <span>•</span>
          <span>Platform Operasi Bisnis Terpadu UMKM Indonesia</span>
        </div>

        <div className="text-slate-500 text-[11px]">
          Dikembangkan secara berdaulat oleh <strong className="text-slate-400">ATIOSLab</strong> untuk kemajuan ekonomi nasional.
        </div>
      </div>
    </footer>
  );
}
