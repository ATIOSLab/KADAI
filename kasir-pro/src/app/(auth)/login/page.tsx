"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, KeyRound, CheckCircle2, Sparkles, Building2 } from "lucide-react";
import { KadaiLockup } from "@/components/shared/kadai-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const DEMO_VERTICALS = [
  {
    id: "bangunan",
    label: "Toko Bangunan",
    brand: "TB Surya Abadi Material & Teknik",
    icon: "🏗️",
    badge: "Hardware & Material",
    tagline: "Gudang Semen/Besi, HPP FIFO & Barcode Cepat",
    roles: [
      { label: "Owner (Admin)", desc: "Laba Rugi & Multi-Gudang", email: "owner.bangunan@kadai.asia" },
      { label: "Kasir POS", desc: "Scan Barcode & Struk Cepat", email: "kasir.bangunan@kadai.asia" },
      { label: "Gudang Material", desc: "Stok Semen, Besi & Cat", email: "gudang.bangunan@kadai.asia" },
      { label: "Akuntan Piutang", desc: "Bon Mandor & Pembukuan", email: "akuntan.bangunan@kadai.asia" },
    ],
  },
  {
    id: "sembako",
    label: "Sembako & Ritel",
    brand: "Toko Sembako Berkah Jaya",
    icon: "🛒",
    badge: "FMCG Grocery",
    tagline: "Scan Barcode Cepat, Multi-Batch & Diskon",
    roles: [
      { label: "Owner (Admin)", desc: "Omzet & Finansial Toko", email: "owner.sembako@kadai.asia" },
      { label: "Kasir Barcode", desc: "Terminal Kasir Cepat", email: "kasir.sembako@kadai.asia" },
      { label: "Gudang FIFO", desc: "Kontrol Stok & Kadaluwarsa", email: "gudang.sembako@kadai.asia" },
      { label: "Akuntan Toko", desc: "Audit Harian Kasir", email: "akuntan.sembako@kadai.asia" },
    ],
  },
  {
    id: "cafe",
    label: "Kafe & Roastery",
    brand: "Ruang Temu Coffee & Roastery",
    icon: "☕",
    badge: "Third Wave Coffee",
    tagline: "Resep BOM Kopi Otomatis, KDS Barista & QR Meja",
    roles: [
      { label: "Owner (Admin)", desc: "Margin Resep & BOM", email: "owner.cafe@kadai.asia" },
      { label: "Head Barista / Kasir", desc: "Terminal Kasir Kafe", email: "kasir.cafe@kadai.asia" },
      { label: "Barista Bar (KDS)", desc: "Layar Tiket Barista", email: "barista.cafe@kadai.asia" },
      { label: "Dapur Pastry", desc: "Layar Pesanan Dapur", email: "dapur.cafe@kadai.asia" },
    ],
  },
  {
    id: "resto",
    label: "Resto Nusantara",
    brand: "Resto Rasa Nusantara Multi-Cabang",
    icon: "🍲",
    badge: "Full-Service F&B",
    tagline: "3 Cabang Terpadu, Denah Meja & Multi-Station Dapur",
    roles: [
      { label: "Owner (Admin)", desc: "Konsolidasi 3 Cabang", email: "owner.resto@kadai.asia" },
      { label: "Manager Outlet", desc: "Denah Meja & Split Bill", email: "manager.resto@kadai.asia" },
      { label: "Kasir Frontdesk", desc: "Terminal Kasir Resto", email: "kasir.resto@kadai.asia" },
      { label: "Chef Dapur (KDS)", desc: "Layar Dapur Masak", email: "dapur.resto@kadai.asia" },
    ],
  },
  {
    id: "apotek",
    label: "Apotek & Alkes",
    brand: "Apotek Sehat Medika & Alkes",
    icon: "💊",
    badge: "Pharmacy Retail",
    tagline: "Pelacakan Batch Obat FEFO, Resep & Alat Medis",
    roles: [
      { label: "Apoteker (Owner)", desc: "Audit Batch & Omzet", email: "owner.apotek@kadai.asia" },
      { label: "Kasir Pelayanan", desc: "Obat Bebas & Resep", email: "kasir.apotek@kadai.asia" },
      { label: "Gudang Farmasi", desc: "Stok FEFO & Expired Alert", email: "gudang.apotek@kadai.asia" },
      { label: "Akuntan Pajak", desc: "Faktur Pajak & Laba", email: "akuntan.apotek@kadai.asia" },
    ],
  },
  {
    id: "barber",
    label: "Barbershop",
    brand: "Gentlemen & Co. Barbershop",
    icon: "✂️",
    badge: "Lifestyle & Salon",
    tagline: "Komisi Kapster Otomatis & Penjualan Pomade Ritel",
    roles: [
      { label: "Owner (Admin)", desc: "Laporan Omzet & Komisi", email: "owner.barber@kadai.asia" },
      { label: "Kasir Frontdesk", desc: "Tiket Cukur & Cross-Sell", email: "kasir.barber@kadai.asia" },
      { label: "Manager Barber", desc: "Jadwal Kursi & Terapis", email: "manager.barber@kadai.asia" },
    ],
  },
  {
    id: "laundry",
    label: "Laundry Engine",
    brand: "KADAI Clean & Fresh Laundry",
    icon: "🧺",
    badge: "Work Order Laundry",
    tagline: "Tiket Cuci Kiloan/Satuan & Rak Simpan Siap Ambil",
    roles: [
      { label: "Owner (Admin)", desc: "Laporan Berat & Omzet", email: "owner.laundry@kadai.asia" },
      { label: "Kasir Penerimaan", desc: "Timbangan & Cetak Bon", email: "kasir.laundry@kadai.asia" },
      { label: "Operator Mesin", desc: "Update Status Cuci/Setrika", email: "operator.laundry@kadai.asia" },
    ],
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Demo access gate states
  const [demoCodeInput, setDemoCodeInput] = useState("");
  const [demoUnlocked, setDemoUnlocked] = useState(false);
  const [demoBusinessName, setDemoBusinessName] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [demoCodeError, setDemoCodeError] = useState("");
  const [selectedVertical, setSelectedVertical] = useState("bangunan");
  const [selectedAccountInfo, setSelectedAccountInfo] = useState<string | null>(null);

  const verifyCode = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;
    setVerifyingCode(true);
    setDemoCodeError("");

    try {
      const res = await fetch("/api/auth/verify-demo-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToVerify }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setDemoUnlocked(true);
        setDemoBusinessName(data.businessName || "Toko Demo");
      } else {
        setDemoCodeError(data.error || "Kode akses demo tidak valid");
      }
    } catch {
      setDemoCodeError("Gagal memeriksa kode demo.");
    } finally {
      setVerifyingCode(false);
    }
  };

  // Auto verify if ?code= is present in URL
  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setDemoCodeInput(codeFromUrl);
      verifyCode(codeFromUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login gagal");
        return;
      }

      const role = data.data?.role;
      const homePath =
        role === "CASHIER"
          ? "/pos"
          : role === "KITCHEN"
            ? "/kds"
            : role === "INVENTORY"
              ? "/inventory"
              : role === "ACCOUNTANT"
                ? "/finance"
                : "/dashboard";
      router.push(homePath);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-slide-up">
      {/* Logo */}
      <div className="text-center mb-6">
        <Link href="/" className="inline-flex items-center justify-center mb-2 hover:opacity-90 transition-opacity">
          <KadaiLockup variant="on-light" height={42} />
        </Link>
        <p className="text-slate-600 font-medium text-xs mt-1">
          Masuk ke portal kasir &amp; dashboard operasional Anda
        </p>
      </div>

      {/* Login Card */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-3xl">
        <CardHeader className="pb-3 pt-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-slate-950">Selamat Datang</h2>
            <p className="text-xs text-muted-foreground">
              Masukkan kredensial akun terdaftar
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-destructive text-xs font-bold">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-slate-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@bisnis.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="h-10 text-xs sm:text-sm rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold text-slate-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10 h-10 text-xs sm:text-sm rounded-xl border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-xs"
              size="lg"
              disabled={loading}
            >
              {loading ? "Masuk..." : "Masuk ke Akun"}
            </Button>

            {/* Gated Demo Access Panel */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              {!demoUnlocked ? (
                <div className="rounded-2xl bg-slate-50/80 border border-slate-200/80 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <KeyRound className="size-3.5 text-primary" />
                      Punya Kode Akses Demo?
                    </span>
                    <Link
                      href="/demo"
                      className="text-[10px] text-primary font-bold hover:underline"
                    >
                      Minta Akses Demo
                    </Link>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={demoCodeInput}
                      onChange={(e) => setDemoCodeInput(e.target.value)}
                      placeholder="Masukkan kode demo..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs uppercase tracking-wider font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => verifyCode(demoCodeInput)}
                      disabled={verifyingCode || !demoCodeInput.trim()}
                      className="h-8 text-xs font-bold px-3.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                    >
                      {verifyingCode ? "Cek..." : "Buka Demo"}
                    </Button>
                  </div>
                  {demoCodeError && (
                    <p className="text-[10px] text-red-600 font-semibold">{demoCodeError}</p>
                  )}
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setDemoCodeInput("KADAI2026");
                        verifyCode("KADAI2026");
                      }}
                      className="text-[10px] text-primary/80 hover:text-primary font-medium hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="size-3 text-amber-500" />
                      Uji coba instan dengan kode: <strong className="font-mono text-slate-800">KADAI2026</strong>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                      Akses Demo Terbuka ({DEMO_VERTICALS.length} Vertikal Bisnis)
                    </span>
                    <button
                      type="button"
                      onClick={() => setDemoUnlocked(false)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                    >
                      Kunci Kembali
                    </button>
                  </div>

                  {/* Verticals Tab Selector */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {DEMO_VERTICALS.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSelectedVertical(v.id);
                          setSelectedAccountInfo(null);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border flex items-center gap-1 ${
                          selectedVertical === v.id
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span>{v.icon}</span>
                        <span>{v.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Active Vertical Details & Role Cards */}
                  {(() => {
                    const activeV = DEMO_VERTICALS.find((v) => v.id === selectedVertical) || DEMO_VERTICALS[0];
                    return (
                      <div className="p-2.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="text-[11px] font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{activeV.icon}</span>
                              {activeV.brand}
                            </p>
                            <p className="text-[9px] text-slate-500 leading-tight mt-0.5">{activeV.tagline}</p>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 shrink-0">
                            {activeV.badge}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          {activeV.roles.map((r, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setEmail(r.email);
                                setPassword("password123");
                                setSelectedAccountInfo(`${r.label} • ${r.email}`);
                              }}
                              className={`p-2 text-left rounded-xl border transition-all cursor-pointer group ${
                                email === r.email
                                  ? "bg-primary/10 border-primary ring-1 ring-primary/40 shadow-xs"
                                  : "bg-white hover:bg-orange-50/50 hover:border-orange-200 border-slate-200/80"
                              }`}
                            >
                              <div className="text-[10px] font-bold text-slate-900 group-hover:text-primary flex items-center justify-between">
                                <span className="truncate">{r.label}</span>
                                {email === r.email && (
                                  <span className="size-1.5 rounded-full bg-primary shrink-0" />
                                )}
                              </div>
                              <div className="text-[9px] text-slate-500 leading-tight truncate mt-0.5">{r.desc}</div>
                            </button>
                          ))}
                        </div>

                        {selectedAccountInfo && (
                          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-emerald-800 truncate">
                              ✓ {selectedAccountInfo}
                            </span>
                            <span className="text-[9px] text-emerald-600 font-bold shrink-0 ml-1">
                              Password siap
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="pt-2 text-center text-xs text-slate-500">
              Belum punya akun resmi?{" "}
              <Link href="/register" className="font-bold text-primary hover:underline">
                Daftar Uji Coba 14 Hari
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md text-center text-xs text-slate-400">Memuat...</div>}>
      <LoginForm />
    </Suspense>
  );
}
