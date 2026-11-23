"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { KadaiLockup } from "@/components/shared/kadai-logo";
import {
  BUSINESS_CATEGORIES,
  DEFAULT_BUSINESS_TYPE,
  getBusinessProfile,
  getModulesForType,
  getRolesForType,
  type BusinessTypeKey,
} from "@/lib/business-catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { getStoredReferralCode } from "@/lib/referral-client";

export default function RegisterPage() {

  const [storeName, setStoreName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessTypeKey>(DEFAULT_BUSINESS_TYPE);
  const [tier, setTier] = useState("PRO_BUSINESS");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<{ code: string; businessName: string } | null>(null);

  // Status Pajak & Legalitas Usaha
  const [taxStatus, setTaxStatus] = useState("NON_PKP");
  const [legalEntityType, setLegalEntityType] = useState("PERORANGAN");
  const [legalName, setLegalName] = useState("");
  const [nib, setNib] = useState("");
  const [npwp, setNpwp] = useState("");
  const [ownerNik, setOwnerNik] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !ownerName.trim() || phone.trim().length < 9) {
      toast.error("Mohon lengkapi nama usaha, nama pemilik, dan WhatsApp (min. 9 digit)");
      return;
    }

    try {
      setLoading(true);
      const activeRef = getStoredReferralCode() || undefined;
      const res = await fetch("/api/demo-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: ownerName.trim(),
          businessName: storeName.trim(),
          businessType,
          phone: phone.trim(),
          email: email.trim() || "",
          outletCount: 1,
          notes: `[Minat paket: ${tier}]`,
          referralCode: activeRef,
          taxStatus,
          legalEntityType,
          legalName: legalName.trim() || "",
          nib: nib.trim() || "",
          npwp: npwp.trim() || "",
          ownerNik: ownerNik.trim() || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal mengajukan uji coba");
        return;
      }

      setSubmitted({
        code: data.data?.accessCode || "",
        businessName: data.data?.businessName || storeName.trim(),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full max-w-lg my-8 animate-slide-up">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center justify-center mb-3 hover:opacity-90 transition-opacity">
            <KadaiLockup variant="on-light" height={40} />
          </Link>
        </div>
        <Card className="neo-border neo-shadow bg-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-success/15 neo-border">
                <Sparkles className="size-5 text-accent-success" />
              </span>
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-950">Permohonan diterima</h1>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  Tim KADAI akan menghubungi Anda via WhatsApp untuk aktivasi akun <span className="font-bold text-foreground">{submitted.businessName}</span>.
                </p>
              </div>
            </div>

            <div className="rounded-xl neo-border bg-muted/40 p-4 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Kode Akses Demo Anda</p>
              <p className="font-mono text-2xl font-black tracking-[0.2em] text-primary mt-1">{submitted.code || "—"}</p>
              <p className="text-[11px] text-muted-foreground mt-2">
                Simpan kode ini — masukkan di halaman demo untuk menjelajah aplikasi sekarang juga.
              </p>
            </div>

            <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside font-medium">
              <li>Buka halaman demo, lalu masukkan kode akses di atas.</li>
              <li>Jelajahi POS, inventori, dan laporan dengan data contoh.</li>
              <li>Tim kami menghubungi Anda untuk mengaktifkan uji coba 14 hari penuh.</li>
            </ol>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Link href="/demo" className="flex-1">
                <Button className="w-full neo-border neo-shadow font-black bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-sm">
                  Buka Halaman Demo <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/login" className="flex-1">
                <Button variant="outline" className="w-full neo-border font-black h-11 text-sm">
                  Masuk ke Aplikasi
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg my-8 animate-slide-up">
      {/* Header */}
      <div className="text-center mb-6">
        <Link href="/" className="inline-flex items-center justify-center mb-3 hover:opacity-90 transition-opacity">
          <KadaiLockup variant="on-light" height={40} />
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-slate-950">Mulai Uji Coba Gratis 14 Hari</h1>
        <p className="text-xs text-muted-foreground mt-1 font-medium">
          Isi data usaha Anda — kode akses demo terbit instan, dan tim KADAI menghubungi via WhatsApp untuk aktivasi akun.
        </p>
      </div>

      <Card className="neo-border neo-shadow bg-card">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipe Usaha Selector */}
            <div className="space-y-2">
              <Label className="font-bold text-xs">Pilih Kategori Usaha Anda</Label>
              <div className="space-y-3">
                {BUSINESS_CATEGORIES.map((category) => (
                  <div key={category.key} className="space-y-1.5">
                    <div className="flex items-baseline gap-2">
                      <p className="text-[11px] font-black uppercase tracking-wide text-foreground">
                        {category.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{category.tagline}</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {category.types.map((typeKey) => {
                        const profile = getBusinessProfile(typeKey);
                        const Icon = profile.icon;
                        const active = businessType === typeKey;
                        return (
                          <button
                            key={typeKey}
                            type="button"
                            onClick={() => setBusinessType(typeKey)}
                            aria-pressed={active}
                            className={`p-2.5 rounded-xl neo-border text-left transition-all ${
                              active
                                ? `${profile.accent.chip} ${profile.accent.border} neo-shadow-sm ring-1 ${profile.accent.ring}`
                                : "bg-muted/40 hover:bg-muted"
                            }`}
                          >
                            <Icon className={`size-4 ${profile.accent.text} mb-1`} />
                            <p className="font-black text-xs leading-tight">{profile.label}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{profile.tagline}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Preview: modul & peran yang langsung aktif untuk vertikal terpilih */}
              <div className="rounded-xl neo-border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-3.5 text-primary shrink-0" />
                  <p className="text-[11px] font-black">
                    Modul otomatis aktif: {getBusinessProfile(businessType).label}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {getModulesForType(businessType).map((m) => (
                    <span
                      key={m.key}
                      className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium"
                    >
                      {m.label}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Peran staf relevan: {getRolesForType(businessType).join(" · ")} — pajak usaha:{" "}
                  {getBusinessProfile(businessType).taxMode}
                </p>
              </div>
            </div>

            {/* Nama Toko & Pemilik */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-bold text-xs">Nama Usaha / Toko</Label>
                <Input
                  placeholder="Contoh: Kopi Senja / Resto Nusantara"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                  className="neo-border text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="font-bold text-xs">Nama Pemilik</Label>
                <Input
                  placeholder="Nama Lengkap Anda"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                  className="neo-border text-xs"
                />
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-bold text-xs">No. WhatsApp / HP</Label>
                <Input
                  placeholder="0812xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="neo-border text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="font-bold text-xs">Email Bisnis</Label>
                <Input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="neo-border text-xs"
                />
              </div>
            </div>

            {/* Profil Legalitas & Status Pajak UMKM (Opsional) */}
            <div className="p-3 rounded-xl border border-border bg-muted/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                  Status Pajak & Bentuk Usaha (Opsional)
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">Bisa Diisi Nanti</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold">Status Pajak</Label>
                  <select
                    value={taxStatus}
                    onChange={(e) => setTaxStatus(e.target.value)}
                    className="w-full text-xs p-1.5 rounded-lg border border-border bg-background"
                  >
                    <option value="NON_PKP">Non-PKP (Bebas PPN / Mikro)</option>
                    <option value="PKP">PKP (Wajib Pungut PPN)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold">Badan Usaha</Label>
                  <select
                    value={legalEntityType}
                    onChange={(e) => setLegalEntityType(e.target.value)}
                    className="w-full text-xs p-1.5 rounded-lg border border-border bg-background"
                  >
                    <option value="PERORANGAN">Perorangan (Toko / Warung)</option>
                    <option value="PT_PERORANGAN">PT Perorangan (PP 8/2021)</option>
                    <option value="CV">CV</option>
                    <option value="PT">PT</option>
                    <option value="UD">UD</option>
                    <option value="KOPERASI">Koperasi</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold">NIB OSS (Opsional)</Label>
                  <Input
                    value={nib}
                    onChange={(e) => setNib(e.target.value)}
                    placeholder="13 digit NIB OSS"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold">
                    {legalEntityType === "PERORANGAN" ? "NIK KTP Pemilik" : "NPWP Badan"}
                  </Label>
                  <Input
                    value={legalEntityType === "PERORANGAN" ? ownerNik : npwp}
                    onChange={(e) => {
                      if (legalEntityType === "PERORANGAN") {
                        setOwnerNik(e.target.value);
                      } else {
                        setNpwp(e.target.value);
                      }
                    }}
                    placeholder={legalEntityType === "PERORANGAN" ? "16 digit NIK KTP" : "15/16 digit NPWP"}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Paket yang diminati (opsional) */}
            <div className="space-y-2 pt-1">
              <Label className="font-bold text-xs flex items-center justify-between">
                <span>Paket yang diminati</span>
                <span className="text-accent-success font-black text-[11px]">Uji Coba Gratis 14 Hari</span>
              </Label>
              <p className="text-[10px] text-muted-foreground -mt-1">
                Dipilih saat aktivasi akun — bisa diubah kapan saja setelah tim menghubungi Anda.
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <button
                  type="button"
                  onClick={() => setTier("FREE")}
                  className={`p-2 rounded-xl neo-border text-xs transition-all ${
                    tier === "FREE" ? "bg-primary/20 border-primary font-bold" : "bg-muted/40 font-medium"
                  }`}
                >
                  <p className="font-black text-xs">Gratis</p>
                  <p className="text-[10px] text-muted-foreground">Rp 0 / bln</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTier("PRO_BUSINESS")}
                  className={`p-2 rounded-xl neo-border text-xs relative transition-all ${
                    tier === "PRO_BUSINESS" ? "bg-primary text-primary-foreground font-bold neo-shadow-sm" : "bg-muted/40 font-medium"
                  }`}
                >
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-accent-warning text-black text-[9px] px-1.5 py-0.2 rounded-full font-black neo-border">
                    Populer
                  </span>
                  <p className="font-black text-xs">Pro Bisnis</p>
                  <p className="text-[10px]">Rp 249rb</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTier("ENTERPRISE")}
                  className={`p-2 rounded-xl neo-border text-xs transition-all ${
                    tier === "ENTERPRISE" ? "bg-primary/20 border-primary font-bold" : "bg-muted/40 font-medium"
                  }`}
                >
                  <p className="font-black text-xs">Enterprise</p>
                  <p className="text-[10px] text-muted-foreground">Rp 599rb</p>
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full neo-border neo-shadow font-black bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-sm mt-3"
            >
              {loading ? "Mengirim Permohonan..." : "Ajukan Uji Coba Gratis 14 Hari"}
            </Button>
          </form>

          <div className="text-center mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
            Sudah memiliki akun toko?{" "}
            <Link href="/login" className="font-bold text-primary hover:underline">
              Masuk ke Aplikasi
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
