"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      <div className="text-center mb-8">
        <div className="size-14 mx-auto rounded-2xl bg-slate-900 text-white shadow-sm flex items-center justify-center mb-4">
          <ShoppingCart className="size-7 text-amber-400" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-950">KADAI</h1>
        <p className="text-slate-600 font-medium text-xs mt-1">
          Masuk ke akun kasir & dashboard bisnis Anda
        </p>
      </div>

      {/* Login Form */}
      <Card className="border border-border shadow-sm bg-card rounded-2xl">
        <CardHeader className="pb-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-slate-950">Selamat Datang</h2>
            <p className="text-xs text-muted-foreground">
              Masukkan kredensial akun terdaftar
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-destructive text-xs font-bold">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@kadai.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
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
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? "Masuk..." : "Masuk"}
            </Button>

            {/* Quick Demo Switcher */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Coba Akun Demo Instan:
                </span>
                <span className="text-[10px] text-slate-400 font-medium">1-Klik Isi</span>
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
