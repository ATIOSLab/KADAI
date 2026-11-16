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
  DialogBody,
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
      <DialogContent className="max-w-lg">
        <DialogHeader className="pr-14">
          <div className="flex items-start gap-3">
            <div
              className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                direction === "IN"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {direction === "IN" ? (
                <ArrowDownCircle className="size-4.5" />
              ) : (
                <ArrowUpCircle className="size-4.5" />
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-base font-bold leading-snug">
                Pencatatan Kas Modal &amp; Belanja
              </DialogTitle>
              <DialogDescription className="text-xs leading-relaxed">
                Kelola setoran modal kasir dan pengeluaran belanja operasional gerai.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <DialogBody className="space-y-5">
            {/* Arah Kas Toggle */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setDirection("IN");
                  if (!title) setTitle("Setoran Modal Kasir / Belanja");
                }}
                className={`py-2.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                direction === "IN"
                  ? "bg-card text-emerald-700 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
                }`}
                >
                <ArrowDownCircle className="size-3.5 shrink-0" />
                <span className="truncate">Kas Masuk (Modal)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDirection("OUT");
                  if (title.includes("Modal")) setTitle("");
                }}
                className={`py-2.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                direction === "OUT"
                  ? "bg-card text-red-700 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
                }`}
                >
                <ArrowUpCircle className="size-3.5 shrink-0" />
                <span className="truncate">Kas Keluar (Belanja)</span>
              </button>
            </div>

            {/* Pemegang / Kantong Kas Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">
                Kantong / Alokasi Dana
              </Label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setWalletType("CASHIER")}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    walletType === "CASHIER"
                      ? "border-primary bg-primary/5 text-foreground font-bold shadow-2xs"
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <div className="font-bold flex items-center justify-between gap-2">
                    <span className="truncate">💵 Kas Laci Kasir</span>
                    {walletType === "CASHIER" && (
                      <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] leading-snug text-muted-foreground font-normal mt-1">
                    Uang kembalian shift & transaksi depan
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setWalletType("PURCHASING")}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    walletType === "PURCHASING"
                      ? "border-primary bg-primary/5 text-foreground font-bold shadow-2xs"
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <div className="font-bold flex items-center justify-between gap-2">
                    <span className="truncate">🛒 Kas Dapur / Belanja</span>
                    {walletType === "PURCHASING" && (
                      <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] leading-snug text-muted-foreground font-normal mt-1">
                    Uang modal pasar, es batu & bumbu
                  </p>
                </button>
              </div>
            </div>

            {/* Nominal Input */}
            <div className="space-y-2">
              <Label htmlFor="cashAmount" className="text-xs font-bold">
                Nominal Uang (Rp)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                  Rp
                </span>
                <Input
                  id="cashAmount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Contoh: 2000000"
                  className="pl-10 font-mono text-sm font-bold"
                  required
                  min={1000}
                />
              </div>
            </div>

            {/* Keterangan */}
            <div className="space-y-2">
              <Label htmlFor="cashTitle" className="text-xs font-bold">
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
            <div className="space-y-2">
              <Label htmlFor="cashNotes" className="text-xs font-bold">
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

          </DialogBody>

          <DialogFooter className="gap-2">
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
