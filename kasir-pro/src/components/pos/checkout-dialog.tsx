"use client";

import { useState } from "react";
import {
  Banknote,
  Building2,
  CheckCircle2,
  Loader2,
  QrCode,
  Wallet,
  Printer,
  Sparkles,
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
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY">("DINE_IN");
  const [tableId, setTableId] = useState<string>("");
  const [tablesList, setTablesList] = useState<Array<{ id: string; tableNo: string; section: string }>>([]);
  const [paymentRef, setPaymentRef] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");

  useState(() => {
    fetch("/api/tables")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setTablesList(data.data);
      })
      .catch(() => {});
  });

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
          orderType,
          tableId: orderType === "DINE_IN" && tableId ? tableId : null,
          paymentType,
          paymentRef: paymentRef || null,
          customerName: customerName || null,
          discountAmount: 0,
          notes: notes || null,
        },
      });

      setInvoiceNumber(response.data.invoiceNumber);
      setSuccess(true);
      clearCart();
      bumpCatalogVersion();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Checkout gagal diproses";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setSuccess(false);
    setInvoiceNumber("");
    setPaymentType("CASH");
    setPaymentRef("");
    setCustomerName("");
    setCashAmount("");
    setNotes("");
    onOpenChange(false);
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm text-center">
          <div className="py-6 space-y-4">
            <div className="size-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="size-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Pembayaran Berhasil!</h3>
              <p className="text-2xl font-black text-primary tabular-nums mt-1">
                {formatCurrency(grandTotal)}
              </p>
              {invoiceNumber && (
                <p className="mt-1 text-xs font-mono font-bold text-muted-foreground">
                  Invoice: {invoiceNumber}
                </p>
              )}
            </div>

            {paymentType === "CASH" && changeAmount > 0 && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs">
                <span className="text-muted-foreground block">Uang Kembalian:</span>
                <span className="text-base font-black text-emerald-700 tabular-nums">
                  {formatCurrency(changeAmount)}
                </span>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="outline"
                className="w-full font-bold text-xs h-10"
                onClick={() => window.print()}
              >
                <Printer className="size-4 mr-2" /> Cetak Struk Kasir (Thermal)
              </Button>
              <Button
                className="w-full font-bold text-xs h-10 shadow-sm"
                onClick={handleResetForm}
              >
                Transaksi Baru (Selesai)
              </Button>
            </div>
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
            <Label className="font-bold text-xs">Tipe Pesanan</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderType("DINE_IN")}
                className={cn(
                  "p-2 rounded-lg neo-border-thin font-bold text-xs text-center transition-all",
                  orderType === "DINE_IN" ? "neo-border neo-shadow-sm bg-accent-primary text-white" : "hover:bg-bg-main"
                )}
              >
                🍽️ Makan di Tempat (Dine In)
              </button>
              <button
                type="button"
                onClick={() => setOrderType("TAKEAWAY")}
                className={cn(
                  "p-2 rounded-lg neo-border-thin font-bold text-xs text-center transition-all",
                  orderType === "TAKEAWAY" ? "neo-border neo-shadow-sm bg-accent-primary text-white" : "hover:bg-bg-main"
                )}
              >
                🥡 Bawa Pulang (Takeaway)
              </button>
            </div>
          </div>

          {orderType === "DINE_IN" && tablesList.length > 0 && (
            <div className="space-y-1">
              <Label className="font-bold text-xs">Pilih Meja</Label>
              <select
                value={tableId}
                onChange={(e: any) => setTableId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg neo-border bg-card text-xs font-bold"
              >
                <option value="">-- Pilih Meja Pelanggan --</option>
                {tablesList.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.tableNo} ({t.section})
                  </option>
                ))}
              </select>
            </div>
          )}

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
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold">Uang Tunai Diterima</Label>
                  <button
                    type="button"
                    onClick={() => setCashAmount(String(grandTotal))}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    Uang Pas
                  </button>
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Masukkan jumlah uang..."
                  value={cashAmount ? formatNumber(cashAmount) : ""}
                  onChange={(event) =>
                    setCashAmount(sanitizeAmountInput(event.target.value))
                  }
                  className="font-mono text-base font-bold tabular-nums"
                />

                {/* Quick Cash Chips for Tablets & Phones */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[10000, 20000, 50000, 100000, 200000, 500000]
                    .filter((nominal) => nominal >= grandTotal || nominal >= 50000)
                    .slice(0, 4)
                    .map((denom) => (
                      <button
                        key={denom}
                        type="button"
                        onClick={() => setCashAmount(String(denom))}
                        className="px-2.5 py-1 rounded-lg border border-border bg-muted/60 hover:bg-muted text-[11px] font-mono font-bold transition-colors cursor-pointer"
                      >
                        Rp {denom >= 1000 ? `${denom / 1000}k` : denom}
                      </button>
                    ))}
                </div>

                {cashAmount && changeAmount >= 0 && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-xs font-bold text-emerald-700 flex justify-between items-center">
                    <span>Kembalian:</span>
                    <span className="font-mono text-sm tabular-nums">{formatCurrency(changeAmount)}</span>
                  </div>
                )}
                {cashAmount && changeAmount < 0 && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200/80 text-xs font-bold text-destructive flex justify-between items-center">
                    <span>Kurang Bayar:</span>
                    <span className="font-mono text-sm tabular-nums">{formatCurrency(Math.abs(changeAmount))}</span>
                  </div>
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
