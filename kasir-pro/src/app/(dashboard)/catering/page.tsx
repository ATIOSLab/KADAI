"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCheck,
  ExternalLink,
  Loader2,
  PackageSearch,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CATERING_STATUS_LABELS,
  CATERING_STATUS_STYLES,
  canTransitionCateringStatus,
  cateringRemaining,
} from "@/lib/catering";
import type { CateringStatus } from "@prisma/client";
import { apiFetch, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

/** Baris penjualan bertanda catering dari GET /api/sales?catering=true. */
interface CateringSale {
  id: string;
  invoiceNumber: string;
  customerName: string | null;
  totalAmount: string;
  paymentType: string;
  orderType: string;
  cateringEventDate: string | null;
  cateringDeliveryAt: string | null;
  cateringDeposit: string | null;
  cateringPaidAmount: string | null;
  cateringStatus: string | null;
  cateringNote: string | null;
  createdAt: string;
  isVoided: boolean;
  outlet: { id: string; name: string } | null;
  cashier: { id: string; name: string } | null;
  items: {
    id: string;
    quantity: number;
    unitPrice: string;
    product: { id: string; name: string; unit: string | null } | null;
  }[];
}

interface CateringPaymentRow {
  id: string;
  amount: string;
  method: string;
  paidAt: string;
  note: string | null;
  createdBy: { id: string; name: string } | null;
}

interface ProductOption {
  id: string;
  name: string;
  price: string | number;
  unit: string | null;
  currentStock?: number | null;
  isActive?: boolean;
}

interface CartLine {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  unit: string | null;
}

const STATUS_FILTERS = ["ALL", "BOOKED", "CONFIRMED", "IN_PRODUCTION", "DELIVERED", "COMPLETED", "CANCELLED"] as const;

const PAYMENT_METHODS = [
  { value: "CASH", label: "Tunai" },
  { value: "BANK_TRANSFER", label: "Transfer Bank" },
  { value: "QRIS", label: "QRIS" },
  { value: "E_WALLET", label: "E-Wallet" },
] as const;

function fmtDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Tahap maju yang sah dari status sekarang (dihitung dari matriks transisi). */
const FORWARD_CANDIDATES = ["CONFIRMED", "IN_PRODUCTION", "DELIVERED", "COMPLETED"] as const;

function nextStatuses(current: string | null): string[] {
  if (!current) return [];
  return FORWARD_CANDIDATES.filter((candidate) =>
    canTransitionCateringStatus(current as CateringStatus, candidate)
  );
}

function StatusChip({ status }: { status: string | null }) {
  if (!status) return <Badge variant="outline">-</Badge>;
  const style = CATERING_STATUS_STYLES[status as keyof typeof CATERING_STATUS_STYLES] ?? "bg-slate-100 text-slate-700 border-slate-200";
  const label = CATERING_STATUS_LABELS[status as keyof typeof CATERING_STATUS_LABELS] ?? status;
  return <Badge variant="outline" className={style}>{label}</Badge>;
}

function MethodLabel({ method }: { method: string }) {
  const found = PAYMENT_METHODS.find((m) => m.value === method);
  return found?.label ?? method;
}

export default function CateringPage() {
  const [sales, setSales] = useState<CateringSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<CateringSale | null>(null);
  const [payTarget, setPayTarget] = useState<CateringSale | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ catering: "true", limit: "100" });
      if (statusFilter !== "ALL") params.set("cateringStatus", statusFilter);
      const res = await apiFetch<{ data: CateringSale[] }>(`/api/sales?${params.toString()}`);
      setSales(res.data);
    } catch (caught) {
      const message =
        caught instanceof ApiError ? caught.message : "Gagal memuat pesanan catering";
      setError(message);
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter(
      (s) =>
        s.customerName?.toLowerCase().includes(q) ||
        s.invoiceNumber.toLowerCase().includes(q)
    );
  }, [sales, search]);

  const stats = useMemo(() => {
    const active = sales.filter(
      (s) =>
        !s.isVoided &&
        s.cateringStatus !== "COMPLETED" &&
        s.cateringStatus !== "CANCELLED"
    );
    const sisa = active.reduce(
      (acc, s) => acc + cateringRemaining(s.totalAmount, s.cateringPaidAmount),
      0
    );
    const upcoming = sales.filter((s) => {
      if (s.isVoided || s.cateringStatus === "CANCELLED" || !s.cateringEventDate) return false;
      const diff = new Date(s.cateringEventDate).getTime() - Date.now();
      return diff > -24 * 3600 * 1000 && diff < 7 * 24 * 3600 * 1000;
    }).length;
    const aktifTotal = active.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
    return { count: active.length, sisa, upcoming, aktifTotal };
  }, [sales]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pesanan Catering"
        description="Booking acara berjadwal: tanggal, uang muka, sisa tagihan, dan tahap produksi."
      >
        <Button onClick={() => setCreateOpen(true)} disabled={loading}>
          <Plus className="h-4 w-4" /> Buat Pesanan
        </Button>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Muat Ulang
        </Button>
      </PageHeader>

      {/* Ringkasan */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Booking Aktif</p>
            <p className="text-2xl font-semibold">{stats.count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Nilai Booking Aktif</p>
            <p className="text-2xl font-semibold">{formatCurrency(stats.aktifTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Sisa Tagihan (Piutang)</p>
            <p className="text-2xl font-semibold text-amber-600">
              {formatCurrency(stats.sisa)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Acara 7 Hari ke Depan</p>
            <p className="text-2xl font-semibold">{stats.upcoming}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama pemesan atau nomor invoice…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s)}
            >
              {s === "ALL" ? "Semua" : CATERING_STATUS_LABELS[s as keyof typeof CATERING_STATUS_LABELS]}
            </Button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-destructive/40">
          <CardContent className="flex items-center gap-3 py-6 text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Gagal memuat data</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" onClick={load}>
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <CalendarClock className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">
              {sales.length === 0 ? "Belum ada pesanan catering" : "Tidak ada pesanan yang cocok"}
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              {sales.length === 0
                ? "Buat pesanan pertama untuk acara berjadwal: pilih menu, tanggal acara, dan uang muka."
                : "Coba ubah kata kunci atau filter status."}
            </p>
            {sales.length === 0 && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" /> Buat Pesanan Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabel */}
      {!loading && !error && filtered.length > 0 && (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Invoice / Pemesan</th>
                  <th className="px-4 py-3 font-medium">Menu</th>
                  <th className="px-4 py-3 font-medium">Acara</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium text-right">DP</th>
                  <th className="px-4 py-3 font-medium text-right">Sisa</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const remaining = cateringRemaining(s.totalAmount, s.cateringPaidAmount);
                  return (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium">{s.invoiceNumber}</p>
                        <p className="text-muted-foreground">{s.customerName ?? "Tanpa nama"}</p>
                        {s.isVoided && (
                          <Badge variant="outline" className="mt-1 border-rose-200 bg-rose-50 text-rose-600">
                            Dibatalkan (void)
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[220px] truncate text-muted-foreground">
                          {s.items.map((it) => it.product?.name ?? "Produk").join(", ") || "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">{s.items.length} menu</p>
                      </td>
                      <td className="px-4 py-3">
                        <p>{fmtDateTime(s.cateringEventDate)}</p>
                        {s.cateringDeliveryAt && (
                          <p className="text-xs text-muted-foreground">
                            Kirim {fmtDateTime(s.cateringDeliveryAt)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(s.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(s.cateringDeposit)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={remaining > 0 ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                          {formatCurrency(remaining)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip status={s.cateringStatus} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {!s.isVoided && remaining > 0 && s.cateringStatus !== "CANCELLED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPayTarget(s)}
                            >
                              <Wallet className="h-3.5 w-3.5" /> Bayar
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => setDetail(s)}>
                            Detail
                          </Button>
                          <Link href={`/sales/${s.id}`} className="inline-flex">
                            <Button size="sm" variant="ghost">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <CreateBookingDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={load} />
      <PaymentDialog
        sale={payTarget}
        onClose={() => setPayTarget(null)}
        onPaid={async () => {
          setPayTarget(null);
          await load();
        }}
      />
      <DetailDialog sale={detail} onClose={() => setDetail(null)} onChanged={load} />
    </div>
  );
}

/* =====================================================================
 * Dialog: Buat Pesanan Catering
 * ===================================================================== */
function CreateBookingDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productQuery, setProductQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [deliveryAt, setDeliveryAt] = useState("");
  const [deposit, setDeposit] = useState("");
  const [depositMethod, setDepositMethod] = useState("CASH");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setCatalogError(null);
    apiFetch<{ data: ProductOption[] }>("/api/products?limit=200")
      .then((res) => {
        if (!cancelled) setProducts(res.data);
      })
      .catch((caught) => {
        if (!cancelled) {
          setCatalogError(
            caught instanceof ApiError ? caught.message : "Gagal memuat katalog"
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setCart([]);
      setCustomerName("");
      setEventDate("");
      setDeliveryAt("");
      setDeposit("");
      setDepositMethod("CASH");
      setNote("");
      setProductQuery("");
    }
  }, [open]);

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products.slice(0, 12);
    return products
      .filter(
        (p) => p.name.toLowerCase().includes(q) || (p.id.toLowerCase().includes(q))
      )
      .slice(0, 12);
  }, [products, productQuery]);

  const inCart = (productId: string) => cart.find((c) => c.productId === productId);

  const addToCart = (p: ProductOption) => {
    const existing = inCart(p.id);
    if (existing) {
      setCart(
        cart.map((c) =>
          c.productId === p.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: p.id,
          productName: p.name,
          unitPrice: Number(p.price) || 0,
          quantity: 1,
          unit: p.unit,
        },
      ]);
    }
  };

  const changeQty = (productId: string, delta: number) => {
    setCart(
      cart
        .map((c) =>
          c.productId === productId ? { ...c, quantity: c.quantity + delta } : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const removeLine = (productId: string) =>
    setCart(cart.filter((c) => c.productId !== productId));

  const subtotal = cart.reduce((acc, c) => acc + c.unitPrice * c.quantity, 0);
  const depositValue = Number(deposit) || 0;

  const submit = async () => {
    if (cart.length === 0) {
      toast.error("Pilih minimal satu menu");
      return;
    }
    if (customerName.trim().length < 2) {
      toast.error("Nama pemesan wajib diisi");
      return;
    }
    if (!eventDate) {
      toast.error("Tanggal dan jam acara wajib diisi");
      return;
    }
    if (depositValue > 0 && depositValue > subtotal) {
      toast.error("Uang muka tidak boleh melebihi total pesanan");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        items: cart.map((c) => ({
          productId: c.productId,
          productName: c.productName,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
        })),
        paymentType: "TEMPO",
        orderType: "DELIVERY",
        customerName: customerName.trim(),
        cateringEventDate: new Date(eventDate).toISOString(),
        cateringDeliveryAt: deliveryAt ? new Date(deliveryAt).toISOString() : null,
        cateringDeposit: depositValue,
        cateringDepositMethod: depositValue > 0 ? depositMethod : null,
        cateringNote: note.trim() || null,
        notes: note.trim() || null,
      };
      await apiFetch<{ success: boolean }>("/api/sales", {
        method: "POST",
        body: payload,
      });
      toast.success(`Pesanan catering dicatat${depositValue > 0 ? `, DP ${formatCurrency(depositValue)} diterima` : ""}`);
      onOpenChange(false);
      onCreated();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Gagal membuat pesanan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Pesanan Catering</DialogTitle>
          <DialogDescription>
            Pilih menu, jadwal acara, dan uang muka. Sisa tagihan otomatis
            dihitung dari total dikurangi uang yang diterima.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Pemesan & jadwal */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="catering-customer">Nama Pemesan *</Label>
              <Input
                id="catering-customer"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama klien / acara"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="catering-event">Tanggal & Jam Acara *</Label>
              <Input
                id="catering-event"
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="catering-delivery">Jadwal Kirim (opsional)</Label>
              <Input
                id="catering-delivery"
                type="datetime-local"
                value={deliveryAt}
                onChange={(e) => setDeliveryAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="catering-note">Catatan Acara</Label>
              <Input
                id="catering-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Porsi, lokasi, permintaan khusus…"
              />
            </div>
          </div>

          {/* Pilih menu */}
          <div className="space-y-2">
            <Label>Pilih Menu</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari menu…"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {catalogError && (
              <p className="text-sm text-destructive">{catalogError}</p>
            )}
            <div className="grid max-h-44 gap-1.5 overflow-y-auto rounded-lg border p-2">
              {filteredProducts.length === 0 && !catalogError && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Tidak ada menu ditemukan
                </p>
              )}
              {filteredProducts.map((p) => {
                const inLine = inCart(p.id);
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(p.price)} / {p.unit ?? "unit"}
                      </p>
                    </div>
                    {inLine ? (
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => changeQty(p.id, -1)}>
                          −
                        </Button>
                        <span className="w-6 text-center text-sm">{inLine.quantity}</span>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => changeQty(p.id, 1)}>
                          +
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => addToCart(p)}>
                        Tambah
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Keranjang */}
          {cart.length > 0 && (
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-sm font-medium">Ringkasan Pesanan</p>
              {cart.map((c) => (
                <div key={c.productId} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate">{c.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.quantity} × {formatCurrency(c.unitPrice)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatCurrency(c.unitPrice * c.quantity)}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeLine(c.productId)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between border-t pt-2 text-sm font-semibold">
                <span>Total Pesanan</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </div>
          )}

          {/* Uang muka */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="catering-deposit">Uang Muka (DP)</Label>
              <Input
                id="catering-deposit"
                type="number"
                min={0}
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                placeholder="0"
              />
              {depositValue > 0 && (
                <p className="text-xs text-muted-foreground">
                  Sisa tagihan: {formatCurrency(subtotal - depositValue)}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="catering-deposit-method">Metode Uang Muka</Label>
              <select
                id="catering-deposit-method"
                value={depositMethod}
                onChange={(e) => setDepositMethod(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={submit} disabled={submitting || cart.length === 0}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Catat Pesanan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* =====================================================================
 * Dialog: Catat Pembayaran (cicilan / pelunasan)
 * ===================================================================== */
function PaymentDialog({
  sale,
  onClose,
  onPaid,
}: {
  sale: CateringSale | null;
  onClose: () => void;
  onPaid: () => Promise<void>;
}) {
  const remaining = sale ? cateringRemaining(sale.totalAmount, sale.cateringPaidAmount) : 0;
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (sale) {
      setAmount(String(remaining));
      setMethod("CASH");
      setNote("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sale]);

  if (!sale) return null;

  const submit = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Nominal pembayaran harus lebih dari 0");
      return;
    }
    if (value > remaining) {
      toast.error(`Pembayaran melebihi sisa tagihan (sisa ${formatCurrency(remaining)})`);
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch(`/api/sales/${sale.id}/catering-payment`, {
        method: "POST",
        body: { amount: value, method, note: note.trim() || null },
      });
      const isLunas = remaining - value <= 0;
      toast.success(isLunas ? "Tagihan lunas 🎉" : "Pembayaran dicatat");
      await onPaid();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Gagal mencatat pembayaran");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Catat Pembayaran — {sale.invoiceNumber}</DialogTitle>
          <DialogDescription>
            {sale.customerName ?? "Tanpa nama"} · Total {formatCurrency(sale.totalAmount)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Sisa tagihan</span>
            <span className="font-semibold">{formatCurrency(remaining)}</span>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pay-amount">Nominal Dibayar</Label>
            <Input
              id="pay-amount"
              type="number"
              min={0}
              max={remaining}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pay-method">Metode</Label>
            <select
              id="pay-method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pay-note">Catatan (opsional)</Label>
            <Textarea
              id="pay-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Mis. cicilan 2 dari 3"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={submit} disabled={submitting || remaining <= 0}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Pembayaran
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* =====================================================================
 * Dialog: Detail booking + buku kas + aksi tahap
 * ===================================================================== */
function DetailDialog({
  sale,
  onClose,
  onChanged,
}: {
  sale: CateringSale | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<CateringSale & { cateringPayments?: CateringPaymentRow[] } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [busyStatus, setBusyStatus] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);

  useEffect(() => {
    if (!sale) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    apiFetch<{ data: CateringSale & { cateringPayments?: CateringPaymentRow[] } }>(
      `/api/sales/${sale.id}`
    )
      .then((res) => {
        if (!cancelled) setDetail(res.data);
      })
      .catch((caught) => {
        if (!cancelled) {
          toast.error(
            caught instanceof ApiError ? caught.message : "Gagal memuat detail"
          );
          setDetail(sale);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sale]);

  if (!sale) return null;

  const shown = (detail ??
    { ...sale, cateringPayments: [] as CateringPaymentRow[] }) as CateringSale & {
    cateringPayments?: CateringPaymentRow[];
  };
  const remaining = cateringRemaining(shown.totalAmount, shown.cateringPaidAmount);
  const payments = shown.cateringPayments ?? [];
  const status = shown.cateringStatus ?? "";
  const cancellable = ["BOOKED", "CONFIRMED", "IN_PRODUCTION"].includes(status);
  const next = nextStatuses(status);

  const advance = async (to: string) => {
    setBusyStatus(to);
    try {
      await apiFetch(`/api/sales/${shown.id}/catering-status`, {
        method: "POST",
        body: { status: to },
      });
      toast.success(`Status menjadi ${CATERING_STATUS_LABELS[to as keyof typeof CATERING_STATUS_LABELS]}`);
      await onChanged();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Gagal mengubah status");
    } finally {
      setBusyStatus(null);
    }
  };

  const cancel = async () => {
    if (!window.confirm(`Batalkan pesanan ${shown.invoiceNumber}?`)) return;
    setBusyStatus("CANCELLED");
    try {
      await apiFetch(`/api/sales/${shown.id}/catering-status`, {
        method: "POST",
        body: { status: "CANCELLED" },
      });
      toast.success("Pesanan dibatalkan");
      await onChanged();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Gagal membatalkan pesanan");
    } finally {
      setBusyStatus(null);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {shown.invoiceNumber} · <StatusChip status={status} />
          </DialogTitle>
          <DialogDescription>
            {shown.customerName ?? "Tanpa nama"} — dibuat {fmtDateTime(shown.createdAt)}
          </DialogDescription>
        </DialogHeader>

        {loadingDetail && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        <div className="space-y-5">
          {/* Jadwal */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" /> Tanggal Acara
              </p>
              <p className="mt-1 font-medium">{fmtDateTime(shown.cateringEventDate)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <PackageSearch className="h-3.5 w-3.5" /> Jadwal Kirim
              </p>
              <p className="mt-1 font-medium">{fmtDateTime(shown.cateringDeliveryAt)}</p>
            </div>
          </div>

          {shown.cateringNote && (
            <p className="text-sm text-muted-foreground">Catatan: {shown.cateringNote}</p>
          )}

          {/* Keuangan */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-semibold">{formatCurrency(shown.totalAmount)}</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Sudah Diterima</p>
              <p className="font-semibold text-emerald-600">
                {formatCurrency(shown.cateringPaidAmount)}
              </p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Sisa</p>
              <p className={`font-semibold ${remaining > 0 ? "text-amber-600" : ""}`}>
                {formatCurrency(remaining)}
              </p>
            </div>
          </div>

          {/* Buku kas */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Buku Kas Pembayaran</p>
            {payments.length === 0 && (
              <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                Belum ada pembayaran tercatat.
              </p>
            )}
            {payments.length > 0 && (
              <div className="space-y-1.5">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {formatCurrency(p.amount)}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          {MethodLabel({ method: p.method })}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fmtDateTime(p.paidAt)}
                        {p.note ? ` · ${p.note}` : ""}
                        {p.createdBy ? ` · ${p.createdBy.name}` : ""}
                      </p>
                    </div>
                    <CheckCheck className="h-4 w-4 text-emerald-600" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Menu */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Menu ({shown.items.length})</p>
            {shown.items.map((it) => (
              <div
                key={it.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate">{it.product?.name ?? "Produk"}</p>
                  <p className="text-xs text-muted-foreground">
                    {it.quantity} × {formatCurrency(it.unitPrice)}
                  </p>
                </div>
                <span className="font-medium">{formatCurrency(Number(it.unitPrice) * it.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Aksi */}
          {!shown.isVoided && (
            <div className="flex flex-wrap gap-2 border-t pt-4">
              {remaining > 0 && status !== "CANCELLED" && (
                <Button variant="outline" onClick={() => setPayOpen(true)}>
                  <Wallet className="h-4 w-4" /> Catat Pembayaran
                </Button>
              )}
              {next.map((s) => (
                <Button
                  key={s}
                  disabled={busyStatus !== null}
                  onClick={() => advance(s)}
                >
                  {busyStatus === s && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  → {CATERING_STATUS_LABELS[s as keyof typeof CATERING_STATUS_LABELS]}
                </Button>
              ))}
              {cancellable && (
                <Button
                  variant="destructive"
                  disabled={busyStatus !== null}
                  onClick={cancel}
                >
                  Batalkan Pesanan
                </Button>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
          <Link href={`/sales/${shown.id}`}>
            <Button variant="ghost">
              Buka Transaksi <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
      {payOpen && (
        <PaymentDialog
          sale={shown}
          onClose={() => setPayOpen(false)}
          onPaid={async () => {
            setPayOpen(false);
            await onChanged();
          }}
        />
      )}
    </Dialog>
  );
}
