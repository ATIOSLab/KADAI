"use client";

import { useEffect, useState, use } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogBody,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { apiFetch, ApiError } from "@/lib/api";
import { useSessionUser } from "@/hooks/use-session-user";
import { SupervisorPinDialog } from "@/components/shared/supervisor-pin-dialog";
import { Receipt, ArrowLeft, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

const paymentLabels: Record<string, string> = {
  CASH: "Tunai",
  QRIS: "QRIS",
  BANK_TRANSFER: "Transfer",
  E_WALLET: "E-Wallet",
};

interface BatchAllocation {
  id: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  productBatch: { batchNumber: string };
}

interface SaleItemDetail {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  totalCost: number;
  discountAmount: number;
  product: { id: string; name: string; sku: string; unit: string };
  batchAllocations: BatchAllocation[];
}

interface SaleDetail {
  id: string;
  invoiceNumber: string;
  customerName: string | null;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  totalCost: number;
  grossProfit: number;
  paymentType: string;
  paymentRef: string | null;
  isVoided: boolean;
  voidReason: string | null;
  voidedAt: string | null;
  createdAt: string;
  cashier: { id: string; name: string; email: string; role: string } | null;
  items: SaleItemDetail[];
}

export default function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useSessionUser();

  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showVoid, setShowVoid] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [supervisorPin, setSupervisorPin] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSale() {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }

      try {
        const res = await apiFetch<{ data: SaleDetail }>(`/api/sales/${id}`);

        if (!cancelled) {
          setSale(res.data);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 404) {
            setError("Transaksi tidak ditemukan");
          } else {
            setError("Gagal memuat detail transaksi");
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSale();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleVoid = async () => {
    if (!voidReason.trim()) {
      toast.error("Alasan pembatalan wajib diisi");
      return;
    }
    setVoiding(true);
    try {
      await apiFetch(`/api/sales/${id}/void`, {
        method: "POST",
        body: {
          reason: voidReason,
          supervisorPin: supervisorPin || undefined,
        },
      });
      toast.success("Transaksi berhasil dibatalkan");
      setShowVoid(false);
      setVoidReason("");
      setSupervisorPin(null);
      setLoading(true);
      setError(null);
      const res = await apiFetch<{ data: SaleDetail }>(`/api/sales/${id}`);
      setSale(res.data);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Gagal membatalkan transaksi";
      toast.error(message);
    } finally {
      setLoading(false);
      setVoiding(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div>
            <Skeleton className="h-6 w-56 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
            <CardContent>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between p-3 border-b">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><Skeleton className="h-6 w-24" /></CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
        <Card className="p-12 text-center">
          <Receipt className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-extrabold mb-2">
            {error || "Transaksi tidak ditemukan"}
          </h2>
          <Button asChild className="mt-4">
            <Link href="/sales">
              <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const totalAmount = Number(sale.totalAmount);
  const grossProfit = Number(sale.grossProfit);
  const marginPercent =
    totalAmount > 0 ? ((grossProfit / totalAmount) * 100).toFixed(1) : "0";
  const canVoidSale =
    user?.role === "ADMIN" ||
    user?.role === "MANAGER" ||
    user?.role === "CASHIER";

  const handleStartVoid = () => {
    if (user?.role === "CASHIER") {
      setShowPinModal(true);
    } else {
      setShowVoid(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      <PageHeader
        title={sale.invoiceNumber}
        description={`Transaksi pada ${new Date(sale.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`}
        icon={Receipt}
      >
        <Button variant="outline" asChild>
          <Link href="/sales">
            <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
          </Link>
        </Button>
        {!sale.isVoided && canVoidSale && (
          <Button variant="danger" onClick={handleStartVoid}>
            <XCircle className="w-4 h-4 mr-1" /> Batalkan
          </Button>
        )}
      </PageHeader>

      {sale.isVoided && (
        <Card className="border-accent-danger bg-accent-danger/5">
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-accent-danger shrink-0" />
            <div>
              <p className="font-bold text-accent-danger">Transaksi Dibatalkan</p>
              <p className="text-xs text-text-muted">
                Alasan: {sale.voidReason || "-"} | Dibatalkan pada:{" "}
                {sale.voidedAt
                  ? new Date(sale.voidedAt).toLocaleString("id-ID")
                  : "-"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Item Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="neo-table overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-3">Produk</th>
                    <th className="text-right p-3">Qty</th>
                    <th className="text-right p-3">Harga</th>
                    <th className="text-right p-3">Subtotal</th>
                    <th className="text-left p-3">Batch</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item) => (
                    <tr key={item.id} className="hover:bg-bg-main/50">
                      <td className="p-3">
                        <p className="font-bold">{item.product.name}</p>
                        <p className="text-xs text-text-muted font-mono">
                          {item.product.sku}
                        </p>
                      </td>
                      <td className="p-3 text-right font-bold">
                        {item.quantity}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(Number(item.unitPrice))}
                      </td>
                      <td className="p-3 text-right font-bold">
                        {formatCurrency(Number(item.totalPrice))}
                      </td>
                      <td className="p-3">
                        {item.batchAllocations.map((allocation) => (
                          <p
                            key={allocation.id}
                            className="text-[10px] font-mono text-text-muted"
                          >
                            {allocation.productBatch.batchNumber} ({allocation.quantity}x @{" "}
                            {formatCurrency(Number(allocation.costPrice))})
                          </p>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Kasir</span>
              <span className="font-bold">{sale.cashier?.name || "-"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Pelanggan</span>
              <span className="font-bold">{sale.customerName || "Umum"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Pembayaran</span>
              <Badge variant="outline">
                {paymentLabels[sale.paymentType] || sale.paymentType}
              </Badge>
            </div>
            {sale.paymentRef && (
              <div className="flex justify-between text-sm">
                <span>Ref</span>
                <span className="font-mono text-xs">{sale.paymentRef}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Status</span>
              {sale.isVoided ? (
                <Badge variant="danger">Dibatalkan</Badge>
              ) : (
                <Badge variant="success">Selesai</Badge>
              )}
            </div>
            <hr className="border-border-default" />
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-bold">
                {formatCurrency(Number(sale.subtotal))}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Diskon</span>
              <span>-{formatCurrency(Number(sale.discountAmount))}</span>
            </div>
            <div className="flex justify-between text-lg font-extrabold border-t-[2px] border-border-default pt-2">
              <span>Total</span>
              <span className="text-accent-primary">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <hr className="border-border-default" />
            <div className="flex justify-between text-sm text-text-muted">
              <span>HPP</span>
              <span>{formatCurrency(Number(sale.totalCost))}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-accent-success">
              <span>Gross Profit</span>
              <span>{formatCurrency(grossProfit)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-accent-success">
              <span>Margin</span>
              <span>{marginPercent}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showVoid && canVoidSale} onOpenChange={setShowVoid}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan Transaksi</DialogTitle>
            <DialogDescription>
              Pembatalan akan mengembalikan stok yang terdeduksi ke batch
              asalnya. Berikan alasan pembatalan transaksi.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-2 py-2">
              <Label>Alasan Pembatalan *</Label>
              <Input
                placeholder="Contoh: Kesalahan input, pelanggan batal"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowVoid(false)}
              disabled={voiding}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={handleVoid}
              disabled={voiding || !voidReason.trim()}
            >
              {voiding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" /> Memproses...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-1" /> Batalkan Transaksi
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supervisor PIN Authorization Modal for Cashiers */}
      <SupervisorPinDialog
        open={showPinModal}
        onOpenChange={setShowPinModal}
        title="Otorisasi Void Transaksi"
        description="Kasir memerlukan otorisasi Manager atau Pemilik Toko untuk membatalkan transaksi ini."
        onAuthorized={(supervisor: any) => {
          setSupervisorPin("SUPERVISOR_APPROVED");
          setShowVoid(true);
        }}
      />
    </div>
  );
}
