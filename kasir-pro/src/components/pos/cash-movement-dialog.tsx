"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Receipt,
  Loader2,
  DollarSign,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface CashMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CashMovementDialog({
  open,
  onOpenChange,
  onSuccess,
}: CashMovementDialogProps) {
  const [direction, setDirection] = useState<"IN" | "OUT">("IN");
  const [walletType, setWalletType] = useState<"CASHIER" | "PURCHASING">("CASHIER");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount.replace(/[^0-9]/g, ""));
    if (!numAmount || numAmount <= 0) {
      toast.error("Masukkan nominal uang kas yang valid");
      return;
    }

    if (!title.trim()) {
      toast.error("Keterangan transaksi kas wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      // Ambil daftar kategori finance untuk memetakan kategori sistem
      const catsRes = await apiFetch<{
        data: Array<{ id: string; name: string; direction: string }>;
      }>("/api/finance/categories");

      // Cari kategori yang cocok: "Modal Masuk" jika IN, atau "Biaya Operasional" / "Pembelian Stok" jika OUT
      const targetCategory = catsRes.data.find((c) =>
        direction === "IN"
          ? c.name.toLowerCase().includes("modal") && c.direction === "IN"
          : c.name.toLowerCase().includes("operasional") && c.direction === "OUT"
      ) || catsRes.data.find((c) => c.direction === direction);

      if (!targetCategory) {
        throw new Error("Kategori akun kas belum siap di sistem.");
      }

      const walletLabel =
        walletType === "CASHIER" ? "[Kas Laci Kasir]" : "[Kas Belanja & Dapur]";
      const fullTitle = `${walletLabel} ${title.trim()}`;

      await apiFetch("/api/finance", {
        method: "POST",
        body: JSON.stringify({
          amount: numAmount,
          direction,
          categoryId: targetCategory.id,
          title: fullTitle,
          notes: notes ? `${notes} (Pemegang: ${walletLabel})` : `Pencatatan kasir via ${walletLabel}`,
          entryDate: new Date().toISOString(),
        }),
      });

      toast.success(
        direction === "IN"
          ? `Setoran Modal Kerja ${formatCurrency(numAmount)} berhasil dicatat!`
          : `Pengeluaran Kas Belanja ${formatCurrency(numAmount)} berhasil dibukukan!`
      );

      // Reset form
      setAmount("");
      setTitle("");
      setNotes("");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal mencatat transaksi kas";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className={`size-8 rounded-lg flex items-center justify-center ${
              direction === "IN" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            }`}>
              {direction === "IN" ? <ArrowDownCircle className="size-4" /> : <ArrowUpCircle className="size-4" />}
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Pencatatan Kas Modal & Belanja
              </DialogTitle>
              <DialogDescription className="text-xs">
                Kelola setoran modal kasir dan pengeluaran belanja operasional gerai.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Arah Kas Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setDirection("IN");
                if (!title) setTitle("Setoran Modal Kasir / Belanja");
              }}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                direction === "IN"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              <ArrowDownCircle className="size-3.5" />
              <span>Kas Masuk (Modal)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDirection("OUT");
                if (title.includes("Modal")) setTitle("");
              }}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                direction === "OUT"
                  ? "bg-white text-red-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              <ArrowUpCircle className="size-3.5" />
              <span>Kas Keluar (Belanja)</span>
            </button>
          </div>

          {/* Pemegang / Kantong Kas Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">
              Kantong / Alokasi Dana
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWalletType("CASHIER")}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                  walletType === "CASHIER"
                    ? "border-primary bg-primary/5 text-slate-950 font-bold shadow-2xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>💵 Kas Laci Kasir</span>
                  {walletType === "CASHIER" && <CheckCircle2 className="size-3.5 text-primary" />}
                </div>
                <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                  Uang kembalian shift & transaksi depan
                </p>
              </button>

              <button
                type="button"
                onClick={() => setWalletType("PURCHASING")}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                  walletType === "PURCHASING"
                    ? "border-primary bg-primary/5 text-slate-950 font-bold shadow-2xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>🛒 Kas Dapur / Belanja</span>
                  {walletType === "PURCHASING" && <CheckCircle2 className="size-3.5 text-primary" />}
                </div>
                <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                  Uang modal pasar, es batu & bumbu
                </p>
              </button>
            </div>
          </div>

          {/* Nominal Input */}
          <div className="space-y-1.5">
            <Label htmlFor="cashAmount" className="text-xs font-bold text-slate-700">
              Nominal Uang (Rp)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Rp
              </span>
              <Input
                id="cashAmount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Contoh: 2000000"
                className="pl-9 font-mono text-sm font-bold text-slate-900"
                required
                min={1000}
              />
            </div>
          </div>

          {/* Keterangan */}
          <div className="space-y-1.5">
            <Label htmlFor="cashTitle" className="text-xs font-bold text-slate-700">
              Keterangan Transaksi
            </Label>
            <Input
              id="cashTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                direction === "IN"
                  ? "Contoh: Setoran modal operasional hari ini dari Owner"
                  : "Contoh: Belanja es batu kristal 2 bal & isi ulang galon"
              }
              className="text-xs"
              required
            />
          </div>

          {/* Catatan / Penerima */}
          <div className="space-y-1.5">
            <Label htmlFor="cashNotes" className="text-xs font-bold text-slate-700">
              Catatan / Nama Staf Pelaksana (Opsional)
            </Label>
            <Textarea
              id="cashNotes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Diserahkan ke Koki Dapur / Kasir Shift Pagi"
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className={`font-bold text-white ${
                direction === "IN" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  Mencatat Kas...
                </>
              ) : direction === "IN" ? (
                "Simpan Modal Masuk"
              ) : (
                "Simpan Pengeluaran Kas"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
