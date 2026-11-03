"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Store,
  UtensilsCrossed,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();

  const [storeName, setStoreName] = useState("");
  const [businessType, setBusinessType] = useState("FNB_CAFE");
  const [tier, setTier] = useState("PRO_BUSINESS");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !ownerName.trim() || !email.trim() || !password) {
      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          businessType,
          tier,
          ownerName,
          phone,
          email,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal mendaftarkan akun");
        return;
      }

      toast.success("Pendaftaran UMKM berhasil! Silakan login.");
      router.push("/login");
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg my-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary neo-border neo-shadow flex items-center justify-center mb-3">
          <Store className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-black tracking-tight">Daftarkan Bisnis Anda di KADAI</h1>
        <p className="text-xs text-muted-foreground mt-1 font-medium">
          Mulai operasikan POS cerdas, inventori bahan baku, meja QR, dan pembukuan resmi Indonesia.
        </p>
      </div>

      <Card className="neo-border neo-shadow bg-card">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipe Usaha Selector */}
            <div className="space-y-2">
              <Label className="font-bold text-xs">Pilih Kategori Usaha Anda</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBusinessType("FNB_CAFE")}
                  className={`p-3 rounded-xl neo-border text-left transition-all ${
                    businessType === "FNB_CAFE"
                      ? "bg-primary/10 border-primary neo-shadow-sm"
                      : "bg-muted/40 hover:bg-muted"
                  }`}
                >
                  <UtensilsCrossed className="size-5 text-primary mb-1" />
                  <p className="font-black text-xs">Kuliner / Kafe / Dimsum</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Resep BOM, Meja QR, KDS Dapur</p>
                </button>

                <button
                  type="button"
                  onClick={() => setBusinessType("RETAIL")}
                  className={`p-3 rounded-xl neo-border text-left transition-all ${
                    businessType === "RETAIL"
                      ? "bg-primary/10 border-primary neo-shadow-sm"
                      : "bg-muted/40 hover:bg-muted"
                  }`}
                >
                  <ShoppingBag className="size-5 text-accent-secondary mb-1" />
                  <p className="font-black text-xs">Toko Ritel / Grosir</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Barcode Scan, Batch FIFO, Expired</p>
                </button>
              </div>
            </div>

            {/* Nama Toko & Pemilik */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-bold text-xs">Nama Usaha / Toko</Label>
                <Input
                  placeholder="Contoh: Kopi Kadai / Dimsum 88"
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

            {/* Password */}
            <div className="space-y-1">
              <Label className="font-bold text-xs">Password Akun</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="neo-border text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Paket Langganan Options */}
            <div className="space-y-2 pt-1">
              <Label className="font-bold text-xs flex items-center justify-between">
                <span>Pilih Paket Langganan</span>
                <span className="text-accent-success font-black text-[11px]">Free Trial 14 Hari</span>
              </Label>
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
              {loading ? "Mendaftarkan Usaha..." : "Daftar & Mulai Operasi KADAI"}
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
