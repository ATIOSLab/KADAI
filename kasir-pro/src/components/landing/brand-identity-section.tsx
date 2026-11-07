"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sparkles, CheckCircle2, Copy, Check, Palette, Type, Layers, ArrowUpRight, Monitor, Smartphone, Tablet, Printer, Tv } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { KadaiLogoMark, KadaiWordmark, KadaiPrimaryLogo, KadaiLockup } from "@/components/shared/kadai-logo";

const PALETTE_TOKENS = [
  {
    name: "Slate",
    hex: "#020617",
    rgb: "2, 6, 23",
    role: "Disiplin Pembukuan",
    anatomy: "Batang Tegak (Vertical Stem)",
    desc: "Melambangkan ketegasan, stabilitas keuangan, kepatuhan hukum pajak, serta pondasi usaha yang kokoh.",
    bgClass: "bg-[#020617]",
    textLight: true,
    borderClass: "border-slate-800",
  },
  {
    name: "Ember",
    hex: "#EA580C",
    rgb: "234, 88, 12",
    role: "Aktivitas Dapur & Energi",
    anatomy: "Lengkung Wajan (Wok Rim)",
    desc: "Busur lingkaran yang menyapu keluar, terinspirasi dari bibir wajan kuliner nusantara dan api memasak yang hidup.",
    bgClass: "bg-[#EA580C]",
    textLight: true,
    borderClass: "border-orange-600",
  },
  {
    name: "Glow",
    hex: "#FB923C",
    rgb: "251, 146, 60",
    role: "Pertumbuhan & Kehangatan",
    anatomy: "Lengan Diagonal Atas",
    desc: "Kapsul diagonal 45 derajat menanjak ke atas sebagai simbol pertumbuhan omzet dan ekspansi multi-cabang.",
    bgClass: "bg-[#FB923C]",
    textLight: false,
    borderClass: "border-orange-400",
  },
  {
    name: "Amber",
    hex: "#F59E0B",
    rgb: "245, 158, 11",
    role: "Percikan Bara Api (Spark)",
    anatomy: "Titik Bara & Titik 'i'",
    desc: "Titik api yang menyalakan semangat wirausaha, sekaligus aksen unik titik huruf 'i' pada wordmark kadai.",
    bgClass: "bg-[#F59E0B]",
    textLight: false,
    borderClass: "border-amber-400",
  },
];

export function BrandIdentitySection() {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  return (
    <section id="identitas-brand" className="py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-16">
      {/* 1. Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50/80 border border-orange-200/90 text-primary text-xs font-semibold shadow-2xs">
          <Palette className="size-3.5 text-primary" />
          <span className="uppercase tracking-widest text-[11px] font-bold">Identitas & Standar Visual</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950">
          Dibangun dengan Presisi. Digerakkan oleh Semangat Usaha.
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed text-balance">
          Identitas visual KADAI dirancang dengan disiplin geometris murni: menyatukan ketegasan pembukuan modern, kehangatan dapur kuliner nusantara, dan energi pertumbuhan wirausaha Indonesia.
        </p>
      </div>

      {/* 1.5. Logo Utama KADAI (Primary Lockup: Simbol K + Wordmark kadaı) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
            <span className="size-2 rounded-full bg-primary" />
            <span>Logo Utama Resmi (Primary Unified Lockup)</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Mandat: Simbol K + Wordmark kadaı wajib tampil bersama
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Lockup A: Horizontal (Latar Terang & Gelap) */}
          <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">
                Format Utama (Horizontal)
              </span>
              <h4 className="text-lg font-bold text-slate-950">Lockup Horizontal Resmi</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Digunakan pada header website, faktur kasir, surat jalan, dan kop resmi. Simbol K dan wordmark <span className="font-bold text-slate-900">kadaı</span> sejajar horizontal.
              </p>
            </div>

            <div className="space-y-3">
              {/* On Light Preview */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <KadaiPrimaryLogo layout="horizontal" showTagline={true} size="md" variant="on-light" />
                <span className="text-[10px] font-mono text-slate-400">On Light</span>
              </div>
              {/* On Dark Preview */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <KadaiPrimaryLogo layout="horizontal" showTagline={true} size="md" variant="on-dark" />
                <span className="text-[10px] font-mono text-slate-400">On Dark</span>
              </div>
            </div>
          </div>

          {/* Lockup B: Stacked (Vertikal / Display) */}
          <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#EA580C] uppercase tracking-widest block">
                Format Vertikal (Stacked)
              </span>
              <h4 className="text-lg font-bold text-slate-950">Lockup Stacked Resmi</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Digunakan pada kartu nama, splash screen aplikasi tablet, backdrop stan pameran, dan merchandise resmi.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* On Light Preview */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col items-center justify-center space-y-2">
                <KadaiPrimaryLogo layout="stacked" showTagline={true} size="md" variant="on-light" />
                <span className="text-[10px] font-mono text-slate-400 pt-1">On Light</span>
              </div>
              {/* On Dark Preview */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center space-y-2">
                <KadaiPrimaryLogo layout="stacked" showTagline={true} size="md" variant="on-dark" />
                <span className="text-[10px] font-mono text-slate-400 pt-1">On Dark</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Official 4-Color Palette Swatches with Interactive Copy */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <span className="size-2 rounded-full bg-primary" />
            <span>Palet Warna Resmi (Official Palette)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Klik kode HEX untuk menyalin</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PALETTE_TOKENS.map((token) => {
            const isCopied = copiedHex === token.hex;
            return (
              <div
                key={token.name}
                className="group relative rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Color Swatch Block */}
                  <div
                    className={`h-24 sm:h-28 rounded-xl ${token.bgClass} flex items-end justify-between p-3.5 relative overflow-hidden shadow-inner`}
                  >
                    <div className="absolute top-2.5 right-2.5">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(token.hex)}
                        className={`size-8 rounded-lg flex items-center justify-center transition-all ${
                          token.textLight
                            ? "bg-white/10 hover:bg-white/20 text-white"
                            : "bg-slate-950/10 hover:bg-slate-950/20 text-slate-950"
                        }`}
                        title="Salin HEX"
                        aria-label={`Salin kode ${token.hex}`}
                      >
                        {isCopied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-3.5" />}
                      </button>
                    </div>
                    <span
                      className={`text-lg font-black tracking-tight ${
                        token.textLight ? "text-white" : "text-slate-950"
                      }`}
                    >
                      {token.name}
                    </span>
                  </div>

                  {/* Metadata Specs */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-900">{token.hex}</span>
                      <span className="font-mono text-[11px] text-slate-500">RGB: {token.rgb}</span>
                    </div>
                    <span className="text-[11px] font-bold text-primary block">{token.role}</span>
                    <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">
                      Anatomi: {token.anatomy}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{token.desc}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>TOKEN RESMI</span>
                  <span>100% INVIOLABLE</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Brand Identity Application Showcase (Persis Seperti Sheet Desain) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <span className="size-2 rounded-full bg-primary" />
          <span>Implementasi Touchpoint Brand</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Card A: Dark Luxury Brand Hero Card (Span 7) */}
          <div className="lg:col-span-7 rounded-3xl bg-[#020617] text-white p-7 sm:p-10 flex flex-col justify-between space-y-8 relative overflow-hidden border border-slate-800 shadow-2xl">
            {/* Subtle radial glow background */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#EA580C]/20 via-[#F59E0B]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Header Lockup (Official Lockup from /png/lockup/) */}
              <KadaiLockup variant="on-dark" height={44} className="h-10 sm:h-11 w-auto" />

              {/* Core Slogan Headline */}
              <div className="space-y-3 pt-4">
                <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#FB923C] bg-[#FB923C]/10 border border-[#FB923C]/20 px-3 py-1 rounded-full">
                  Slogan Utama
                </span>
                <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  &ldquo;Satu sistem untuk gerai, dapur, dan pembukuan.&rdquo;
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg font-normal">
                  Satu antarmuka terintegrasi yang menghapuskan friksi operasional antara kasir gerai depan, stasiun juru masak dapur, dan kepatuhan perpajakan di meja pemilik.
                </p>
              </div>
            </div>

            {/* Bottom App Icon & Security Pillars */}
            <div className="relative z-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-[#020617] border border-slate-700 flex items-center justify-center p-2 shadow-inner">
                  <KadaiLogoMark size={30} />
                </div>
                <div className="size-12 rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#FB923C] flex items-center justify-center p-2 shadow-md">
                  <KadaiLogoMark size={30} variant="white" />
                </div>
                <div className="size-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center p-2">
                  <KadaiLogoMark size={28} />
                </div>
                <span className="text-xs text-slate-400 font-medium pl-1">Varian Ikon Aplikasi</span>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 justify-end">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Sistem Operasional Aktif
                </span>
                <span className="text-[10px] text-slate-500 font-mono">kadai.asia</span>
              </div>
            </div>
          </div>

          {/* Card B: Real Thermal POS Receipt Mockup (Span 5) */}
          <div className="lg:col-span-5 rounded-3xl bg-slate-100 p-6 sm:p-8 flex flex-col justify-center border border-slate-200/90 shadow-lg relative overflow-hidden">
            {/* Thermal Receipt Paper Card with Perforated Shadow */}
            <div className="relative mx-auto w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl border border-slate-200/80 font-mono text-xs space-y-4">
              {/* Receipt Header with Logo and Brand Lockup */}
              <div className="text-center space-y-1.5 pb-4 border-b border-dashed border-slate-300">
                <div className="flex justify-center">
                  <KadaiLogoMark size={28} variant="mono-black" />
                </div>
                <div className="flex justify-center">
                  <KadaiWordmark size="text-2xl" textColor="text-slate-950" />
                </div>
                <div className="text-[9px] font-bold text-slate-600 tracking-[0.18em] uppercase">
                  SISTEM OPERASI BISNIS
                </div>
                <div className="text-[10px] text-slate-500 pt-1">
                  KADAI Resto &amp; Kopi Nusantara
                </div>
              </div>

              {/* Receipt Metadata */}
              <div className="flex justify-between items-center text-[11px] text-slate-600 pb-2 border-b border-dashed border-slate-200">
                <span className="font-bold text-slate-900">Meja 04 · Dine In</span>
                <span>Kasir: Budi</span>
              </div>

              {/* Order Items matching the Official Brand Guide Sheet */}
              <div className="space-y-2 py-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-900">2x Nasi Goreng</span>
                  <span className="font-bold tabular-nums text-slate-900">64.000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-900">2x Es Kopi Aren</span>
                  <span className="font-bold tabular-nums text-slate-900">36.000</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 pt-1">
                  <span>PB1 10% (Pajak Resto)</span>
                  <span className="tabular-nums">10.000</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center text-base font-black text-slate-950 pt-3 border-t-2 border-slate-900">
                <span>TOTAL</span>
                <span className="text-[#EA580C] tabular-nums font-black text-lg">110.000</span>
              </div>

              {/* Receipt Thermal Footer */}
              <div className="text-center pt-3 border-t border-dashed border-slate-300 space-y-1">
                <div className="text-[11px] font-semibold text-slate-700">Terima kasih atas kunjungan Anda</div>
                <div className="text-[9px] text-slate-400">
                  Struk Resmi KADAI Cloud POS • www.kadai.asia
                </div>
              </div>

              {/* Perforated Sawtooth Bottom Edge Simulation */}
              <div className="absolute -bottom-2 left-0 right-0 h-2 bg-radial-dots opacity-40 pointer-events-none" />
            </div>

            <div className="text-center mt-3 text-[11px] text-slate-500 font-medium">
              Standar Struk Thermal 58mm / 80mm
            </div>
          </div>
        </div>
      </div>

      {/* 4. Typography System Guide Card */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Type className="size-4 text-primary" />
          <span>Sistem Tipografi Resmi KADAI</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {/* Typo 1: Wordmark */}
          <div className="space-y-2 lg:pr-3">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">
              1. Wordmark kadaı
            </span>
            <h4
              className="text-xl font-bold text-slate-950"
              style={{
                fontFamily: "'Bahnschrift', var(--font-saira), 'Segoe UI', sans-serif",
                letterSpacing: "-0.045em",
                fontWeight: 700,
              }}
            >
              Bahnschrift Bold
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              DIN geometris modern, bobot 700 (bold), tracking −4.5%, huruf kecil dengan aksen titik lingkaran amber pada huruf <span className="font-mono font-bold">ı</span>. Fallback: <span className="font-medium text-slate-900">Saira Bold</span> / <span className="font-medium text-slate-900">Segoe UI</span>.
            </p>
            <div className="pt-2 text-[10px] font-mono text-slate-400">CSS: --font-wordmark</div>
          </div>

          {/* Typo 2: Headings */}
          <div className="space-y-2 sm:px-3 pt-4 sm:pt-0">
            <span className="text-[10px] font-bold text-[#EA580C] uppercase tracking-widest block">
              2. Judul &amp; Headline
            </span>
            <h4 className="text-xl font-black text-slate-950" style={{ fontFamily: "var(--font-heading)" }}>
              Quicksand
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Geometris bulat (*rounded*), kurva lembut yang selaras dengan kapsul silindris dan lengkung wajan logo K.
            </p>
            <div className="pt-2 text-[10px] font-mono text-slate-400">CSS: --font-heading</div>
          </div>

          {/* Typo 3: Body */}
          <div className="space-y-2 sm:px-3 pt-4 sm:pt-0">
            <span className="text-[10px] font-bold text-[#FB923C] uppercase tracking-widest block">
              3. Antarmuka &amp; Body
            </span>
            <h4 className="text-xl font-bold text-slate-950 font-sans">
              Poppins
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Jernih, modern, dan ergonomis untuk layar kasir POS, tablet kasir, maupun mobile display di segala kondisi pencahayaan.
            </p>
            <div className="pt-2 text-[10px] font-mono text-slate-400">CSS: --font-sans</div>
          </div>

          {/* Typo 4: Financial & Monospace */}
          <div className="space-y-2 lg:pl-3 pt-4 sm:pt-0">
            <span className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-widest block">
              4. Kasir &amp; Finansial
            </span>
            <h4 className="text-xl font-bold text-slate-950 font-mono">
              Geist Mono
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Presisi monospace tinggi untuk struk thermal kasir, nominal rupiah, kalkulasi FIFO, dan laporan laba rugi.
            </p>
            <div className="pt-2 text-[10px] font-mono text-slate-400">CSS: --font-mono</div>
          </div>
        </div>
      </div>

      {/* 4.5. Panduan Penggunaan Logo Adaptif per Perangkat (Device-Specific Guidelines) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Layers className="size-4 text-primary" />
          <span>Matriks Penggunaan Logo Adaptif per Perangkat (Device-Adaptive Guidelines)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Device 1: Desktop Web */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800">
                <Monitor className="size-4" />
              </span>
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase">Desktop / Layar Lebar</span>
            </div>
            <div>
              <h5 className="text-sm font-bold text-slate-900">Horizontal Lockup Lengkap</h5>
              <p className="text-xs text-slate-500 font-mono mt-0.5">svg/kadai-lockup-horizontal-*.svg</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Digunakan pada bilah navigasi atas (header), footer, dan surat jalan faktur resmi. Menampilkan logo mark K + wordmark kadaı + tagline <span className="font-semibold text-slate-800">SISTEM OPERASI BISNIS</span>.
            </p>
          </div>

          {/* Device 2: Mobile Smartphone */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="size-8 rounded-lg bg-orange-50 flex items-center justify-center text-primary">
                <Smartphone className="size-4" />
              </span>
              <span className="text-[10px] font-bold font-mono text-primary uppercase">Smartphone (iOS / Android)</span>
            </div>
            <div>
              <h5 className="text-sm font-bold text-slate-900">Compact Adaptive Lockup</h5>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Mark 32px + Wordmark kadaı</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tagline disembunyikan secara otomatis pada layar &lt;640px agar header tetap lega dan tombol aksi utama (*CTA*) tidak terdesak. Ikon aplikasi menggunakan <span className="font-semibold text-slate-800">ic_launcher</span> adaptif 432px.
            </p>
          </div>

          {/* Device 3: Tablet POS */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="size-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                <Tablet className="size-4" />
              </span>
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase">Tablet Kasir (iPad / Sunmi)</span>
            </div>
            <div>
              <h5 className="text-sm font-bold text-slate-900">App Icon Squircle Dark</h5>
              <p className="text-xs text-slate-500 font-mono mt-0.5">png/app-icon/kadai-app-icon-dark-512.png</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Digunakan sebagai ikon *Add to Home Screen* (PWA) dan tombol cepat kasir. Di dalam aplikasi, sidebar mengadopsi logo mark 32px saat mode ciut (*collapsed*) untuk memaksimalkan area daftar menu kasir.
            </p>
          </div>

          {/* Device 4: Kitchen Display System (KDS) */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="size-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-[#EA580C]">
                <Tv className="size-4" />
              </span>
              <span className="text-[10px] font-bold font-mono text-[#EA580C] uppercase">Layar Dapur &amp; Bar (KDS)</span>
            </div>
            <div>
              <h5 className="text-sm font-bold text-slate-900">High-Contrast Glow on Dark</h5>
              <p className="text-xs text-slate-500 font-mono mt-0.5">svg/kadai-mark-on-dark.svg</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Di lingkungan dapur beruap dan pencahayaan dinamis, logo berlatar gelap Slate `#020617` dengan lengan Glow `#FB923C` memberikan visibilitas kontras tinggi dari jarak pandang 2–4 meter.
            </p>
          </div>

          {/* Device 5: Thermal POS Printer */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900">
                <Printer className="size-4" />
              </span>
              <span className="text-[10px] font-bold font-mono text-slate-900 uppercase">Printer Struk 58mm / 80mm</span>
            </div>
            <div>
              <h5 className="text-sm font-bold text-slate-900">Pure Mono-Black 1-Bit</h5>
              <p className="text-xs text-slate-500 font-mono mt-0.5">svg/kadai-mark-mono-black.svg</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dilarang keras memakai gradasi warna di atas kertas struk thermal. Gunakan vektor <span className="font-semibold text-slate-900">Mono-Black</span> murni agar cetakan head thermal tajam, tanpa bintik *dithering*, dan hemat kertas.
            </p>
          </div>

          {/* Device 6: Favicon & PWA Browser Tab */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="size-8 rounded-lg bg-amber-50 flex items-center justify-center text-[#F59E0B]">
                <Sparkles className="size-4" />
              </span>
              <span className="text-[10px] font-bold font-mono text-[#F59E0B] uppercase">Tab Browser &amp; Bookmark</span>
            </div>
            <div>
              <h5 className="text-sm font-bold text-slate-900">Favicon Multi-Resolusi</h5>
              <p className="text-xs text-slate-500 font-mono mt-0.5">favicon/favicon.ico &amp; favicon.svg</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Browser modern memakai vektor SVG tak terdistorsi, sedangkan browser legacy dan bookmark toolbar memakai format paket multi-ukuran (16px, 32px, 48px) dengan apple-touch-icon 180px.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
