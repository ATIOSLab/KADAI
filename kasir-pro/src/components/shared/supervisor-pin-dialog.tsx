"use client";

import { useState } from "react";
import { ShieldCheck, KeyRound, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface SupervisorPinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onAuthorized: (
    supervisor: { id: string; name: string; role: string },
    pin: string
  ) => void;
}

export function SupervisorPinDialog({
  open,
  onOpenChange,
  title = "Otorisasi Supervisor Diperlukan",
  description = "Aksi ini memerlukan persetujuan Manager atau Pemilik Toko. Masukkan 6-digit PIN Supervisor.",
  onAuthorized,
}: SupervisorPinDialogProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      toast.error("PIN wajib diisi");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "PIN Supervisor tidak valid");
        setPin("");
        return;
      }

      toast.success(data.message || "Otorisasi berhasil");
      const verifiedPin = pin;
      onAuthorized(data.supervisor, verifiedPin);
      setPin("");
      onOpenChange(false);
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm neo-border neo-shadow text-center">
        <DialogHeader>
          <div className="size-12 rounded-2xl bg-primary/10 neo-border mx-auto flex items-center justify-center text-primary mb-2">
            <KeyRound className="size-6" />
          </div>
          <DialogTitle className="text-lg font-black">{title}</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </DialogHeader>

        <form onSubmit={handleVerify} className="space-y-4 pt-3">
          <div className="space-y-2">
            <Label htmlFor="pin" className="sr-only">PIN Supervisor</Label>
            <Input
              id="pin"
              type="password"
              maxLength={8}
              autoFocus
              placeholder="••••••"
              value={pin}
              onChange={(e: any) => setPin(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl tracking-[0.5em] font-mono neo-border h-12"
            />
            <p className="text-[10px] text-muted-foreground">
              (PIN Default Manager jika belum disetel: <strong>123456</strong>)
            </p>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPin("");
                onOpenChange(false);
              }}
              className="w-full neo-border font-bold text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full neo-border neo-shadow font-black bg-primary text-primary-foreground text-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" /> Verifikasi...
                </>
              ) : (
                <>
                  <ShieldCheck className="size-3.5 mr-1.5" /> Setujui Aksi
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
