"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Store, Eye, EyeOff, KeyRound, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
        <Link href="/" className="size-14 mx-auto rounded-2xl bg-slate-950 text-white shadow-sm flex items-center justify-center mb-3 group hover:scale-105 transition-transform">
          <Store className="size-7 text-primary" />
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-slate-950">KADAI</h1>
        <p className="text-slate-600 font-medium text-xs mt-1">
          Masuk ke akun kasir & dashboard operasional Anda
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

            {/* Gated Demo Access Panel (Not Open Vulgar) */}
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
                </div>
              ) : (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                      Akses Demo Terbuka: {demoBusinessName}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDemoUnlocked(false)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                    >
                      Kunci Kembali
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail("kasir.cafe@kadai.com");
                        setPassword("password123");
                      }}
                      className="p-2 text-left rounded-xl bg-slate-50 hover:bg-orange-50/80 hover:text-primary border border-slate-200/70 transition-all group cursor-pointer"
                    >
                      <div className="text-[11px] font-bold text-slate-900 group-hover:text-primary">
                        ☕ Kasir Kafe
                      </div>
                      <div className="text-[9px] text-slate-500">Akses Cepat POS</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail("dapur.dimsum@kadai.com");
                        setPassword("password123");
                      }}
                      className="p-2 text-left rounded-xl bg-slate-50 hover:bg-orange-50/80 hover:text-primary border border-slate-200/70 transition-all group cursor-pointer"
                    >
                      <div className="text-[11px] font-bold text-slate-900 group-hover:text-primary">
                        🍳 Chef Dapur
                      </div>
                      <div className="text-[9px] text-slate-500">Layar Display KDS</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail("gudang.sembako@kadai.com");
                        setPassword("password123");
                      }}
                      className="p-2 text-left rounded-xl bg-slate-50 hover:bg-orange-50/80 hover:text-primary border border-slate-200/70 transition-all group cursor-pointer"
                    >
                      <div className="text-[11px] font-bold text-slate-900 group-hover:text-primary">
                        📦 Gudang FIFO
                      </div>
                      <div className="text-[9px] text-slate-500">Stok & Kadaluwarsa</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail("owner.dimsum@kadai.com");
                        setPassword("password123");
                      }}
                      className="p-2 text-left rounded-xl bg-slate-50 hover:bg-orange-50/80 hover:text-primary border border-slate-200/70 transition-all group cursor-pointer"
                    >
                      <div className="text-[11px] font-bold text-slate-900 group-hover:text-primary">
                        👑 Owner Bisnis
                      </div>
                      <div className="text-[9px] text-slate-500">Dashboard & Finansial</div>
                    </button>
                  </div>
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
