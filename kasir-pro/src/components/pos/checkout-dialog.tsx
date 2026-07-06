"use client";

import { useState } from "react";
import {
  Banknote,
  Building2,
  CheckCircle2,
  Loader2,
  QrCode,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";
import { useCart } from "@/hooks/use-cart";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

const paymentMethods = [
  { id: "CASH", label: "Tunai", icon: Banknote, color: "bg-accent-success" },
  {
    id: "BANK_TRANSFER",
    label: "Transfer",
    icon: Building2,
    color: "bg-accent-secondary",
  },
  { id: "QRIS", label: "QRIS", icon: QrCode, color: "bg-accent-primary" },
  {
    id: "E_WALLET",
    label: "E-Wallet",
    icon: Wallet,
    color: "bg-accent-purple",
  },
];

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function sanitizeAmountInput(value: string) {
  return value.replace(/\D/g, "");
}

export function CheckoutDialog({ open, onOpenChange }: CheckoutDialogProps) {
  const items = useCart((state) => state.items);
  const getGrandTotal = useCart((state) => state.getGrandTotal);
  const clearCart = useCart((state) => state.clearCart);
  const bumpCatalogVersion = useCart((state) => state.bumpCatalogVersion);

  const [paymentType, setPaymentType] = useState("CASH");
  const [paymentRef, setPaymentRef] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");

  const grandTotal = getGrandTotal();
  const changeAmount =
    paymentType === "CASH" && cashAmount
      ? Number(cashAmount) - grandTotal
      : 0;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await apiFetch<{
        success: true;
        data: { invoiceNumber: string };
      }>("/api/sales", {
        method: "POST",
        body: {
          items: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: item.discountAmount,
            selectedBatchId: item.selectedBatchId,
          })),
          paymentType,
          paymentRef: paymentRef || null,
          customerName: customerName || null,
          discountAmount: 0,
          notes: notes || null,
        },
      });

      setInvoiceNumber(response.data.invoiceNumber);
      setSuccess(true);

      setTimeout(() => {
        clearCart();
        bumpCatalogVersion();
        setSuccess(false);
        setInvoiceNumber("");
        setPaymentType("CASH");
        setPaymentRef("");
        setCustomerName("");
        setCashAmount("");
        setNotes("");
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Checkout gagal diproses";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm text-center">
          <div className="py-8 animate-scale-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-accent-success/10 flex items-center justify-center mb-4 neo-border border-accent-success">
              <CheckCircle2 className="w-10 h-10 text-accent-success" />
            </div>
            <h3 className="text-2xl font-black mb-2">Pembayaran Berhasil!</h3>
            <p className="text-lg font-bold text-accent-primary">
              {formatCurrency(grandTotal)}
            </p>
            {invoiceNumber && (
              <p className="mt-2 text-xs font-bold text-text-muted">
                Invoice: {invoiceNumber}
              </p>
            )}
            {paymentType === "CASH" && changeAmount > 0 && (
              <p className="text-sm text-text-muted mt-2">
                Kembalian:{" "}
                <span className="font-bold text-accent-success">
                  {formatCurrency(changeAmount)}
                </span>
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4">
            <div className="text-center py-3 neo-card bg-bg-main">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Total Pembayaran
            </p>
            <p className="text-3xl font-black text-accent-primary">
              {formatCurrency(grandTotal)}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Metode Pembayaran</Label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;

                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentType(method.id)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg neo-border-thin transition-all font-bold text-sm",
                      paymentType === method.id
                        ? "neo-border neo-shadow-sm bg-bg-main"
                        : "hover:bg-bg-main"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-md flex items-center justify-center",
                        method.color
                      )}
                    >
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    {method.label}
                  </button>
                );
              })}
            </div>
          </div>

            {paymentType === "CASH" && (
              <div className="space-y-2">
                <Label>Jumlah Uang Diterima</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Masukkan jumlah uang..."
                  value={cashAmount ? formatNumber(cashAmount) : ""}
                  onChange={(event) =>
                    setCashAmount(sanitizeAmountInput(event.target.value))
                  }
                />
                {cashAmount && changeAmount >= 0 && (
                  <p className="text-sm font-bold text-accent-success">
                    Kembalian: {formatCurrency(changeAmount)}
                  </p>
                )}
                {cashAmount && changeAmount < 0 && (
                  <p className="text-sm font-bold text-accent-danger">
                    Kurang: {formatCurrency(Math.abs(changeAmount))}
                  </p>
                )}
              </div>
            )}

            {paymentType !== "CASH" && (
              <div className="space-y-2">
                <Label>No. Referensi (opsional)</Label>
                <Input
                  placeholder="Nomor transfer / referensi"
                  value={paymentRef}
                  onChange={(event) => setPaymentRef(event.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Nama Pelanggan (opsional)</Label>
              <Input
                placeholder="Nama pelanggan"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Catatan (opsional)</Label>
              <Textarea
                placeholder="Catatan tambahan..."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
              />
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            onClick={handleCheckout}
            disabled={
              loading ||
              (paymentType === "CASH" &&
                cashAmount !== "" &&
                changeAmount < 0)
            }
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                Memproses...
              </>
            ) : (
              `Bayar ${formatCurrency(grandTotal)}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
