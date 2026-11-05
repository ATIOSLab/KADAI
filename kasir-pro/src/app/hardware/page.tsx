import { Metadata } from "next";
import Link from "next/link";
import {
  Printer,
  Smartphone,
  Laptop,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  SlidersHorizontal,
  Wifi,
} from "lucide-react";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Panduan Hardware & Kompatibilitas Printer | KADAI",
  description:
    "KADAI bebas perangkat keras (hardware-agnostic). Gunakan printer thermal Bluetooth/USB ESC/POS 58mm/80mm, scanner barcode USB, dan tablet Android/iPad yang telah Anda miliki tanpa biaya sewa tambahan.",
  alternates: {
    canonical: "https://kadai.asia/hardware",
  },
};

const hardwareCategories = [
  {
    title: "Printer Struk Thermal (58mm & 80mm)",
    desc: "KADAI mendukung protokol standar industri ESC/POS. Kompatibel dengan 99% printer kasir yang beredar di pasaran Indonesia, baik nirkabel (Bluetooth) maupun kabel (USB / LAN).",
    icon: Printer,
    badge: "Fleksibel ESC/POS",
    supportedBrands: ["Epson TM-T82 / TM-T20", "Panda PRJ-58 / PRJ-80", "VSC / Iware / Eppos", "Xprinter / Zjiang / Kassen"],
    tips: "Anda dapat mengatur lebar cetak (58mm untuk gerai kopi/booth atau 80mm untuk resto/minimarket) langsung dari panel pengaturan profil toko.",
  },
  {
    title: "Barcode Scanner (1D & 2D QR)",
    desc: "Cukup colokkan scanner barcode USB atau sambungkan via Bluetooth. KADAI membaca sinyal keystroke keyboard otomatis tanpa perlu driver tambahan.",
    icon: Zap,
    badge: "Plug & Play",
    supportedBrands: ["Honeywell / Zebra", "Datalogic / Minipos", "Eyoyo / Netum Wireless", "Scanner Kamera HP/Tablet"],
    tips: "Tekan tombol F2 di kasir untuk langsung memfokuskan kursor ke kolom pencarian barcode barang secara instan.",
  },
  {
    title: "Tablet, Smartphone & Laptop (Layar Kasir & KDS)",
    desc: "Karena KADAI berbasis Progressive Web Application (PWA) modern, aplikasi dapat dibuka mulus di sembarang sistem operasi tanpa perlu membeli POS terminal all-in-one mahal.",
    icon: Smartphone,
    badge: "Multi-Platform",
    supportedBrands: ["Tablet Android (Samsung, Xiaomi, Advan)", "iPad / iPad mini (iPadOS)", "Laptop Windows 10/11", "MacBook / Chromebook"],
    tips: "Gunakan fitur 'Tambahkan ke Layar Utama' (Add to Home Screen) untuk menjalankan KADAI dalam mode layar penuh (fullscreen standalone).",
  },
];

export default function HardwarePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased overflow-x-hidden w-full max-w-full">
      <SiteHeader dashboardPath={null} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12 sm:pb-16 space-y-16 overflow-hidden">
        {/* Header Breadcrumb & Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="outline" className="px-3 py-1 text-xs font-semibold rounded-full border-primary/30 text-primary bg-primary/5">
            BEBAS PERANGKAT KERAS (HARDWARE-AGNOSTIC)
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950">
            Gunakan Perangkat yang Sudah Anda Miliki
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed text-balance">
            KADAI tidak mengunci Anda dengan keharusan membeli atau menyewa perangkat keras mahal bermerek. Cukup gunakan printer thermal, scanner, atau tablet yang ada di meja kasir Anda hari ini.
          </p>
        </div>

        {/* Hardware Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {hardwareCategories.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card
                key={idx}
                className="flex flex-col h-full bg-white/90 backdrop-blur-md border-slate-200/90 shadow-xs hover:shadow-md transition-all rounded-3xl overflow-hidden"
              >
                <div className="p-6 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                  <span className="size-12 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-primary">
                    <Icon className="size-6" />
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-bold bg-white text-slate-700 border border-slate-200/60">
                    {item.badge}
                  </Badge>
                </div>

                <CardHeader className="pb-3 space-y-2">
                  <CardTitle className="text-xl font-bold text-slate-950">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.desc}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 space-y-4 pt-2">
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Merk & Model Teruji:
                    </span>
                    <ul className="space-y-1.5">
                      {item.supportedBrands.map((brand, bIdx) => (
                        <li key={bIdx} className="flex items-center gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                          <span>{brand}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-100/80 text-[11px] text-orange-950 mt-auto">
                    <strong className="block font-bold mb-0.5">Panduan Praktis:</strong>
                    {item.tips}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 3 Steps Setup Guide */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/90 p-8 sm:p-12 space-y-8 shadow-xs">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
              3 Langkah Mudah Menghubungkan Printer Thermal
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Tanpa instalasi rumit. Terhubung dalam hitungan menit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-3">
              <span className="size-8 rounded-full bg-slate-950 text-white font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="text-base font-bold text-slate-900">Nyalakan Bluetooth / Pasang USB</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sambungkan printer ke perangkat kasir (tablet Android, iPad, atau PC Windows). Lakukan pairing Bluetooth biasa melalui menu Settings OS.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-3">
              <span className="size-8 rounded-full bg-slate-950 text-white font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="text-base font-bold text-slate-900">Buka Menu Pengaturan Kasir</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Di dalam dashboard KADAI, buka halaman Pengaturan Toko. Pilih opsi lebar kertas struk Anda: 58mm (ringkas) atau 80mm (lengkap).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-3">
              <span className="size-8 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="text-base font-bold text-slate-900">Cetak Struk Kilat Otomatis</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Setiap transaksi yang dibayarkan di kasir dapat langsung mencetak struk belanja, tiket dapur KDS, atau rangkuman shift kasir secara otomatis.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="rounded-3xl bg-slate-950 text-white p-8 sm:p-12 text-center space-y-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hemat Anggaran Investasi Awal Bisnis Anda
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Tidak perlu membeli paket hardware jutaan rupiah. Mulai uji coba gratis 14 hari dengan perangkat apa pun yang ada di gerai Anda hari ini.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full font-bold bg-primary hover:bg-primary/90 text-white px-8">
              <Link href="/register">Coba Gratis 14 Hari</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full font-semibold bg-white/10 text-white border-white/20 hover:bg-white/20 px-8">
              <Link href="/harga">Lihat Pilihan Paket</Link>
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}