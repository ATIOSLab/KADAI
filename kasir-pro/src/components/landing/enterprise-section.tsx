"use client";

import {
  ShieldCheck,
  Lock,
  Building2,
  Layers,
  KeyRound,
  Cloud,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function EnterpriseSection() {
  const capabilities = [
    {
      title: "Visibilitas Multi-Cabang Terpusat",
      desc: "Pantau performa penjualan, pergerakan stok, dan arus kas seluruh cabang, booth kaki lima, hingga gudang utama dalam satu cockpit pemilik.",
      icon: Building2,
      accent: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Hak Akses 6-Role Granular (RBAC)",
      desc: "Pemisahan tugas ketat (Admin, Manager, Kasir, Kitchen, Inventory, Accountant). Nilai HPP modal pembelian secara rekursif disembunyikan dari staf kasir.",
      icon: Lock,
      accent: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Otorisasi Supervisor PIN",
      desc: "Tindakan sensitif di kasir (pembatalan nota/void, diskon khusus manual, dan penyesuaian stok darurat) wajib diotorisasi PIN Supervisor.",
      icon: KeyRound,
      accent: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    },
    {
      title: "Immutable Activity Audit Trail",
      desc: "Setiap mutasi inventori, transfer antar-cabang, dan penutupan shift kasir dicatat permanen lengkap dengan identitas aktor, waktu, dan riwayat perubahan.",
      icon: Layers,
      accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Cloud Infrastructure & Edge Proxy",
      desc: "Didukung infrastruktur container terisolasi, enkripsi transmisi TLS 1.3, proteksi header keamanan OWASP ketat, dan jaringan Cloudflare.",
      icon: Cloud,
      accent: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      title: "Resiliensi Kasir & PWA Ready",
      desc: "Aplikasi dapat diinstal langsung di layar desktop atau tablet kasir (PWA) dengan service worker offline shell caching untuk kelancaran operasional.",
      icon: ShieldCheck,
      accent: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 bg-[#101828] text-white w-full border-y border-slate-800">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="outline" className="border-slate-700 bg-slate-900/80 text-slate-300 font-semibold text-xs py-1 px-3">
            Fondasi Skalabilitas
          </Badge>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
            Dirancang untuk Bisnis yang Terus Berkembang.
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-400 leading-relaxed text-balance">
            KADAI dibangun dengan fondasi arsitektur multi-tenant, kontrol akses ketat, dan auditibilitas penuh untuk mendukung ekspansi puluhan gerai bisnis Anda.
          </p>
        </div>

        {/* 6 Dark Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div
                key={idx}
                className="rounded-3xl liquid-glass-dark p-6 sm:p-7 flex flex-col justify-between space-y-4 hover:border-white/30 transition-all duration-300"
              >
                <div className="space-y-3">
                  <div className={`size-11 rounded-2xl flex items-center justify-center border shadow-xs ${cap.accent}`}>
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">{cap.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {cap.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
