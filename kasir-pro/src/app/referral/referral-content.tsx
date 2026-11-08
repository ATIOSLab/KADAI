"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Gift,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  Copy,
  Check,
  TrendingUp,
  Percent,
  Wallet,
  Users,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ReferralContent() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bankName, setBankName] = useState("BCA");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partnerResult, setPartnerResult] = useState<{
    referralCode: string;
    referralLink: string;
    commissionRate: number;
    fullName: string;
    isExisting: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Kalkulator komisi simulasi (paket Business Pro Rp 249.000 komisi 20% = Rp 49.800/outlet/bulan)
  const [clientCount, setClientCount] = useState(10);
  const monthlyEarnings = clientCount * 249000 * 0.2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/referrals/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          bankName,
          bankAccountNumber,
          bankAccountName,
          notes: notes || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal mendaftarkan mitra referral");
      }

      setPartnerResult({
        referralCode: json.data.referralCode,
        referralLink: json.data.referralLink,
        commissionRate: json.data.commissionRate,
        fullName: json.data.fullName,
        isExisting: json.isExisting || false,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi gangguan jaringan");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased overflow-x-hidden w-full max-w-full">
      <SiteHeader dashboardPath={null} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12 sm:pb-16 space-y-16 overflow-hidden">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="outline" className="px-3.5 py-1 text-xs font-semibold rounded-full border-primary/30 text-primary bg-primary/5">
            PROGRAM MITRA MARKETING & REFERRAL RESMI
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950">
            Rekomendasikan KADAI, Dapatkan Komisi Berkelanjutan 20%
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed text-balance">
            Ajak rekan pemilik bisnis, kafe, resto, atau toko ritel menggunakan Sistem Operasi KADAI. Dapatkan bagi hasil komisi rutin yang langsung ditransfer ke rekening bank Anda setiap awal bulan.
          </p>
        </div>

        {/* 3 Step Process Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <span className="size-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-primary font-bold text-sm">
              1
            </span>
            <h3 className="text-base font-bold text-slate-950">Daftar Jadi Mitra</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pendaftaran gratis 1 menit tanpa modal. Anda akan menerima Kode Referral unik dan link promosi personal Anda.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <span className="size-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-primary font-bold text-sm">
              2
            </span>
            <h3 className="text-base font-bold text-slate-950">Bagikan Tautan ke Klien</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Rekomendasikan KADAI ke jaringan UMKM, komunitas kuliner, atau klien Anda untuk mencoba demo gratis 14 hari.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <span className="size-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
              3
            </span>
            <h3 className="text-base font-bold text-slate-950">Terima Komisi Rutin</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dapatkan komisi 20% dari setiap pembayaran paket langganan klien. Ditransfer setiap tanggal 5 ke rekening bank / e-wallet Anda.
            </p>
          </div>
        </div>

        {/* Interactive Calculator Section */}
        <div className="rounded-3xl bg-slate-950 text-white p-8 sm:p-12 space-y-8 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-lg">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                Simulasi Potensi Penghasilan Pasif
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Berapa Komisi yang Bisa Anda Peroleh?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Dihitung berdasarkan langganan paket paling populer (Business Pro Rp 249.000/bln) dengan komisi 20%.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/10 border border-white/15 text-center min-w-[260px] space-y-1">
              <span className="text-xs text-slate-300 block">Estimasi Komisi Bulanan:</span>
              <span className="text-3xl sm:text-4xl font-black text-primary block">
                Rp {monthlyEarnings.toLocaleString("id-ID")}
              </span>
              <span className="text-[10px] text-slate-400 block">
                atau ~Rp {(monthlyEarnings * 12).toLocaleString("id-ID")}/tahun
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Jumlah Bisnis / Gerai yang Anda Ajak:</span>
              <span className="text-primary font-bold text-sm">{clientCount} Bisnis Aktif</span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              value={clientCount}
              onChange={(e) => setClientCount(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>1 Klien</span>
              <span>10 Klien</span>
              <span>25 Klien</span>
              <span>50 Klien</span>
            </div>
          </div>
        </div>

        {/* Registration Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form (7 cols) */}
          <div className="lg:col-span-7">
            <Card className="rounded-3xl bg-white/95 border border-slate-200/90 shadow-xs p-6 sm:p-8">
              {partnerResult ? (
                <div className="space-y-6 text-center py-4">
                  <div className="size-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="size-8" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-extrabold text-slate-950">
                      Selamat Bergabung, {partnerResult.fullName}!
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                      Akun kemitraan Anda telah aktif dengan tingkat bagi hasil komisi{" "}
                      <strong className="text-primary font-bold">{partnerResult.commissionRate}%</strong>.
                    </p>
                  </div>

                  {/* Code Card */}
                  <div className="p-5 rounded-2xl bg-orange-50 border border-orange-200 text-center space-y-2 max-w-md mx-auto">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Kode Referral Unik Anda
                    </span>
                    <span className="text-3xl font-black text-primary tracking-widest font-mono block select-all">
                      {partnerResult.referralCode}
                    </span>
                    <div className="pt-2 flex items-center gap-2 bg-white p-2 rounded-xl border border-orange-200/80">
                      <input
                        type="text"
                        readOnly
                        value={partnerResult.referralLink}
                        className="flex-1 text-xs text-slate-700 bg-transparent outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(partnerResult.referralLink)}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0"
                      >
                        {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                        <span>{copied ? "Tersalin!" : "Salin"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild className="rounded-xl font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `Halo rekan-rekan pengusaha! Saya merekomendasikan KADAI POS untuk operasional kasir kilat, stok FIFO, dan otomatisasi pajak restoran. Coba demo gratisnya di sini: ${partnerResult.referralLink}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <MessageCircle className="size-4" />
                        <span>Bagikan ke WhatsApp Rekan</span>
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="rounded-xl font-semibold">
                      <Link href="/demo">Coba Formulir Demo</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-slate-950">
                      Formulir Pendaftaran Mitra KADAI
                    </h2>
                    <p className="text-xs text-slate-500">
                      Lengkapi data rekening Anda untuk pencairan komisi bulanan otomatis.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Nama Lengkap</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Contoh: Rian Pratama"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Nomor WhatsApp</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0812xxxxxxxx"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Alamat Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Nama Bank / E-Wallet</label>
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      >
                        <option value="BCA">BCA</option>
                        <option value="Mandiri">Bank Mandiri</option>
                        <option value="BRI">BRI</option>
                        <option value="BNI">BNI</option>
                        <option value="BSI">BSI (Syariah)</option>
                        <option value="GoPay">GoPay</option>
                        <option value="OVO">OVO</option>
                        <option value="DANA">DANA</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Nomor Rekening / Akun</label>
                      <input
                        type="text"
                        required
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        placeholder="Contoh: 1234567890"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Atas Nama Rekening</label>
                      <input
                        type="text"
                        required
                        value={bankAccountName}
                        onChange={(e) => setBankAccountName(e.target.value)}
                        placeholder="Sesuai buku tabungan"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Kanal Promosi (Opsional)</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Contoh: Memiliki komunitas pemilik kafe di Bandung, konsultan akuntansi UMKM..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-xs"
                  >
                    {loading ? "Mendaftarkan..." : "Daftar Jadi Mitra & Terima Kode"}
                  </Button>
                </form>
              )}
            </Card>
          </div>

          {/* FAQ & Information (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 space-y-4 shadow-xs">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                Pertanyaan Umum (FAQ Referral)
              </span>
              <div className="space-y-3.5 text-xs text-slate-700">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900">Kapan komisi saya dibayarkan?</h4>
                  <p className="text-slate-500 leading-relaxed">
                    Komisi dihitung setiap akhir bulan dan ditransfer langsung ke rekening bank atau e-wallet Anda setiap tanggal 5 awal bulan berikutnya.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900">Apakah komisi bersifat berulang?</h4>
                  <p className="text-slate-500 leading-relaxed">
                    Ya! Selama klien yang Anda rekomendasikan aktif memperpanjang langganan KADAI, Anda tetap menerima bagi hasil 20% setiap bulannya.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900">Bagaimana sistem mencatat referral saya?</h4>
                  <p className="text-slate-500 leading-relaxed">
                    Calon klien dapat mengklik tautan promosi Anda (menggunakan pelacakan cookie) atau memasukkan kode referral Anda saat mengajukan demo atau registrasi.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Support */}
            <div className="rounded-3xl bg-slate-100 p-6 space-y-3 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Butuh Bantuan Pemasaran?</h4>
                <p className="text-xs text-slate-500">
                  Konsultasikan program kemitraan dengan koordinator kemitraan NEW ASIA TECH.
                </p>
              </div>
              <Button asChild size="sm" variant="outline" className="rounded-xl border-[#25D366] text-[#25D366] hover:bg-emerald-50 shrink-0">
                <a
                  href={`https://wa.me/6285159081119?text=${encodeURIComponent(
                    "Halo Tim KADAI (NEW ASIA TECH), saya ingin bertanya seputar Program Mitra Referral & Afiliasi."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5"
                >
                  <MessageCircle className="size-3.5" />
                  <span>WhatsApp Admin</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
