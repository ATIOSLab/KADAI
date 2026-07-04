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

      router.push("/dashboard");
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
        <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary neo-border neo-shadow flex items-center justify-center mb-4">
          <ShoppingCart className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-black tracking-tight">KADAI</h1>
        <p className="text-text-muted font-medium mt-1">
          Masuk ke akun Anda untuk melanjutkan
        </p>
      </div>

      {/* Login Form */}
      <Card>
        <CardHeader>
          <div className="text-center">
            <h2 className="text-xl font-extrabold">Selamat Datang!</h2>
            <p className="text-sm text-text-muted font-medium">
              Masukkan email dan password Anda
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-accent-danger/10 neo-border-thin border-accent-danger text-accent-danger text-sm font-bold animate-shake">
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

            {/* Demo credentials hint */}
            <div className="p-3 rounded-lg bg-accent-secondary/10 neo-border-thin border-accent-secondary">
              <p className="text-xs font-bold text-accent-secondary mb-1">
                Demo Credentials:
              </p>
              <p className="text-xs text-text-secondary font-medium">
                Email: admin@kadai.com
                <br />
                Password: admin123
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
