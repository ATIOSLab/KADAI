"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Store,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  Zap,
  Building2,
  Clock,
  Sparkles,
  Layers,
  ChefHat,
  Receipt,
  Gift,
} from "lucide-react";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStoredReferralCode } from "@/lib/referral-client";

function RequestDemoForm() {
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("FNB_RESTO");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [outletCount, setOutletCount] = useState(1);
  const [notes, setNotes] = useState("");
  const [referralCode, setReferralCode] = useState("");

  // Legalitas Usaha & Status Perpajakan RI (Opsional)
  const [taxStatus, setTaxStatus] = useState<"NON_PKP" | "PKP">("NON_PKP");
  const [legalEntityType, setLegalEntityType] = useState("PERORANGAN");
  const [legalName, setLegalName] = useState("");
  const [nib, setNib] = useState("");
  const [npwp, setNpwp] = useState("");
  const [ownerNik, setOwnerNik] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    accessCode: string;
    businessName: string;
  } | null>(null);

  useEffect(() => {
    // Membaca kode referral baik dari URL saat ini maupun riwayat kunjungan 30 hari terakhir
    const code = getStoredReferralCode();
    if (code) {
      setReferralCode(code);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Ambil kode referral dari input atau memori persistent
    const activeRefCode = referralCode.trim() || getStoredReferralCode() || undefined;

    try {
      const res = await fetch("/api/demo-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          businessName,
          businessType,
          phone,
          email: email || undefined,
          outletCount: Number(outletCount),
          notes: notes || undefined,
          referralCode: activeRefCode,
          taxStatus,
          legalEntityType,
          legalName: legalName.trim() || undefined,
          nib: nib.trim() || undefined,
          npwp: npwp.trim() || undefined,
          ownerNik: ownerNik.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal mengajukan permohonan demo");
      }

      setSuccessData({
        accessCode: json.data.accessCode,
        businessName: json.data.businessName,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan jaringan.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased overflow-x-hidden w-full max-w-full">
      <SiteHeader dashboardPath={null} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12 sm:pb-16 space-y-12 overflow-hidden">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="outline" className="px-3.5 py-1 text-xs font-semibold rounded-full border-primary/30 text-primary bg-primary/5">
            JADWALKAN DEMO EKSKLUSIF & KONSULTASI
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950">
            Coba Langsung KADAI untuk Bisnis Anda
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed text-balance">
            Isi formulir singkat berikut untuk mendapatkan kode akses demo instan dan pendampingan implementasi dari tim ahli PT Netkrida.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form (7 cols) */}
          <div className="lg:col-span-7">
            <Card className="rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-xs p-6 sm:p-8">
              {successData ? (
                <div className="space-y-6 text-center py-4">
                  <div className="size-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="size-8" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-extrabold text-slate-950">
                      Permohonan Demo Diterima!
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                      Terima kasih <strong className="text-slate-900">{fullName}</strong> dari <strong className="text-slate-900">{successData.businessName}</strong>. Kode akses demo interaktif Anda telah dibuat:
                    </p>
                  </div>

                  {/* Access Code Box */}
                  <div className="p-5 rounded-2xl bg-orange-50 border border-orange-200 text-center space-y-1 max-w-sm mx-auto">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Kode Akses Demo Anda
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-primary tracking-widest font-mono block select-all">
                      {successData.accessCode}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Simpan kode ini untuk membuka antarmuka peran demo di halaman login.
                    </span>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-white">
                      <Link href={`/login?code=${successData.accessCode}`}>
                        Buka Halaman Login Demo
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-xl font-semibold border-[#25D366] text-[#25D366] hover:bg-emerald-50"
                    >
                      <a
                        href={`https://wa.me/6285159081119?text=${encodeURIComponent(
                          `Halo Tim KADAI (PT Netkrida), saya baru saja mengajukan demo untuk ${successData.businessName} dengan Kode Akses: ${successData.accessCode}. Mohon panduannya.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <MessageCircle className="size-4" />
                        <span>Konfirmasi via WhatsApp</span>
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-slate-950">Formulir Permohonan Demo</h2>
                    <p className="text-xs text-slate-500">
                      Seluruh informasi digunakan untuk menyesuaikan simulasi jenis usaha Anda.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Contoh: Hendro Wijaya"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Nama Usaha / Gerai <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Contoh: Kopi Ruang Temu"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Nomor WhatsApp / HP <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0812xxxxxxxx"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Alamat Email (Opsional)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@bisnis.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Kategori Sektor Usaha
                      </label>
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      >
                        <option value="FNB_RESTO">Kafe, Resto & Kuliner (F&B)</option>
                        <option value="RETAIL">Toko Ritel & Minimarket</option>
                        <option value="CENTRAL_KITCHEN">Dapur Pusat & Multi-Gudang</option>
                        <option value="SERVICE">Jasa, Salon & Barbershop</option>
                        <option value="OTHER">Sektor Lainnya</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Jumlah Gerai / Cabang
                      </label>
                      <select
                        value={outletCount}
                        onChange={(e) => setOutletCount(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      >
                        <option value={1}>1 Gerai (Outlet Baru/Rintisan)</option>
                        <option value={2}>2 - 3 Gerai (Bisnis Berkembang)</option>
                        <option value={5}>4 - 10 Gerai (Multi-Cabang)</option>
                        <option value={15}>Lebih dari 10 Gerai (Franchise/Grup)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Kebutuhan Spesifik / Catatan
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Contoh: Butuh integrasi printer Bluetooth dan resep BOM bahan baku..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Bagian Legalitas Usaha & Status Pajak RI (Opsional untuk UMKM) */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="size-4 text-primary" />
                        <span className="text-xs font-bold text-slate-900">
                          Profil Legalitas & Pajak RI (Opsional)
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-white text-slate-600 border-slate-200 font-semibold">
                        Bisa Dilengkapi Nanti
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      KADAI mendukung usaha <strong>Non-PKP</strong> (bebas pungutan PPN) maupun <strong>PKP</strong>. Anda dapat mengisi NIB OSS atau NIK pemilik jika berbentuk perseorangan.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700">
                          Status Pajak Usaha
                        </label>
                        <select
                          value={taxStatus}
                          onChange={(e) => setTaxStatus(e.target.value as "NON_PKP" | "PKP")}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                          <option value="NON_PKP">Non-PKP (Bebas PPN / Usaha Mikro)</option>
                          <option value="PKP">PKP (Pengusaha Kena Pajak / Wajib PPN)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700">
                          Bentuk Badan Usaha
                        </label>
                        <select
                          value={legalEntityType}
                          onChange={(e) => setLegalEntityType(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                          <option value="PERORANGAN">Usaha Perorangan (Warung / Toko)</option>
                          <option value="PT_PERORANGAN">PT Perorangan (UMK PP 8/2021)</option>
                          <option value="CV">CV (Persekutuan Komanditer)</option>
                          <option value="PT">PT (Perseroan Terbatas)</option>
                          <option value="UD">UD (Usaha Dagang)</option>
                          <option value="KOPERASI">Koperasi Indonesia</option>
                          <option value="FIRMA">Firma</option>
                          <option value="LAINNYA">Lainnya / Informal</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700">
                          NIB (Nomor Induk Berusaha OSS)
                        </label>
                        <input
                          type="text"
                          value={nib}
                          onChange={(e) => setNib(e.target.value)}
                          placeholder="13 digit NIB (jika ada)"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700">
                          {legalEntityType === "PERORANGAN" ? "NIK KTP Pemilik (16 Digit)" : "NPWP Badan Usaha"}
                        </label>
                        <input
                          type="text"
                          value={legalEntityType === "PERORANGAN" ? ownerNik : npwp}
                          onChange={(e) => {
                            if (legalEntityType === "PERORANGAN") {
                              setOwnerNik(e.target.value);
                            } else {
                              setNpwp(e.target.value);
                            }
                          }}
                          placeholder={legalEntityType === "PERORANGAN" ? "16 digit NIK Pemilik" : "15/16 digit NPWP"}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Gift className="size-3.5 text-primary" />
                        Kode Referral Mitra (Opsional)
                      </span>
                      <Link href="/referral" className="text-[10px] text-primary hover:underline font-normal">
                        Ingin Jadi Mitra Referral?
                      </Link>
                    </label>
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="Contoh: REF-88A2B"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-xs"
                  >
                    {loading ? "Memproses Permohonan..." : "Dapatkan Kode Akses Demo"}
                  </Button>
                </form>
              )}
            </Card>
          </div>

          {/* Right Direct WhatsApp & Consultation Box (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Direct WhatsApp Callout */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="size-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <MessageCircle className="size-6" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-950">
                    Konsultasi Cepat via WhatsApp
                  </h3>
                  <span className="text-xs text-slate-500">PT Netkrida Solusi Digital</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ingin konsultasi langsung dengan konsultan sistem bisnis kami tanpa harus mengisi formulir? Tim kami siap menjawab pertanyaan teknis Anda.
              </p>
              <Button
                asChild
                className="w-full h-11 rounded-xl font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xs"
              >
                <a
                  href={`https://wa.me/6285159081119?text=${encodeURIComponent(
                    "Halo Tim KADAI (PT Netkrida), saya ingin konsultasi dan melihat demo langsung sistem operasional KADAI."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <MessageCircle className="size-4" />
                  <span>Chat WhatsApp Tim Netkrida</span>
                </a>
              </Button>
            </div>

            {/* What you see in demo */}
            <div className="rounded-3xl bg-slate-950 text-white p-6 sm:p-7 space-y-4 shadow-xs">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                Apa Yang Anda Coba di Sesi Demo:
              </span>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                  <span><strong>Terminal Kasir POS:</strong> Hotkeys F2/F4, scanner barcode, dan cetak struk thermal 58/80mm.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                  <span><strong>Layar Dapur & Bar KDS:</strong> Alur pesanan real-time tanpa kertas tiket hilang dengan audio bel lonceng.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                  <span><strong>Radar Multi-Batch FIFO:</strong> Pelacakan batch kadaluwarsa berstandar PSAK 14.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                  <span><strong>Rekonsiliasi Pajak:</strong> Otomatisasi pajak daerah PB1 10% dan PPh Final UMKM 0.5% (PP 55/2022).</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default function RequestDemoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-slate-400">Memuat...</div>}>
      <RequestDemoForm />
    </Suspense>
  );
}
