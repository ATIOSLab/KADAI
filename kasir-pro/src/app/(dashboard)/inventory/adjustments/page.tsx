"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { TablePagination } from "@/components/shared/table-pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from "@/components/ui/dialog";
import { apiFetch, ApiError } from "@/lib/api";
import { useSessionUser } from "@/hooks/use-session-user";
import { formatNumber } from "@/lib/utils";
import { Warehouse, AlertTriangle, Plus } from "lucide-react";

interface AdjustmentEntry {
  id: string;
  productId: string;
  quantityChange: number;
  reason: string;
  notes: string | null;
  createdAt: string;
  product: { id: string; name: string; sku: string };
  user: { id: string; name: string } | null;
}

interface InventoryProduct {
  id: string;
  name: string;
  sku: string;
  totalStock: number;
  currentPrice: number;
}

const REASON_LABELS: Record<string, string> = {
  DAMAGED: "Rusak",
  LOST: "Hilang",
  EXPIRED: "Kedaluwarsa",
  STOCK_OPNAME: "Stock Opname",
  OTHER: "Lainnya",
};

const REASON_VARIANTS: Record<string, "danger" | "secondary" | "default"> = {
  DAMAGED: "danger",
  LOST: "danger",
  EXPIRED: "danger",
  STOCK_OPNAME: "default",
  OTHER: "secondary",
};

export default function AdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<AdjustmentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    productId: "",
    quantityChange: "",
    reason: "STOCK_OPNAME",
    notes: "",
  });

  const loadAdjustments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{
        data: AdjustmentEntry[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/api/inventory/adjustment?page=${page}&limit=${pageSize}`);
      setAdjustments(res.data);
      setPagination(res.pagination);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Gagal memuat riwayat adjustment";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    loadAdjustments();
  }, [loadAdjustments]);

  useEffect(() => {
    if (!productSearch.trim()) {
      setProducts([]);
      return;
    }
    const timer = setTimeout(() => {
      apiFetch<{ data: InventoryProduct[] }>(
        `/api/products?search=${encodeURIComponent(productSearch)}&limit=10`
      )
        .then((res) => setProducts(res.data || []))
        .catch(() => setProducts([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const handleSubmit = async () => {
    if (!formData.productId) {
      toast.error("Pilih produk terlebih dahulu");
      return;
    }
    if (!formData.quantityChange || Number(formData.quantityChange) === 0) {
      toast.error("Jumlah perubahan tidak boleh 0");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/api/inventory/adjustment", {
        method: "POST",
        body: {
          productId: formData.productId,
          quantityChange: Number(formData.quantityChange),
          reason: formData.reason,
          notes: formData.notes || undefined,
        },
      });
      toast.success("Penyesuaian stok berhasil dicatat");
      setIsDialogOpen(false);
      setFormData({ productId: "", quantityChange: "", reason: "STOCK_OPNAME", notes: "" });
      setProductSearch("");
      setProducts([]);
      loadAdjustments();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Gagal mencatat penyesuaian stok";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && adjustments.length === 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
      <PageHeader
        title="Penyesuaian Stok"
        description="Catat stock opname, kerusakan, kehilangan, dan kedaluwarsa"
        icon={Warehouse}
      >
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Penyesuaian Baru
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border-default bg-accent-subtle">
                <tr>
                  <th className="text-left p-3 font-bold">Produk</th>
                  <th className="text-left p-3 font-bold">SKU</th>
                  <th className="text-right p-3 font-bold">Perubahan</th>
                  <th className="text-left p-3 font-bold">Alasan</th>
                  <th className="text-left p-3 font-bold">Catatan</th>
                  <th className="text-left p-3 font-bold">Oleh</th>
                  <th className="text-left p-3 font-bold">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-12 text-text-muted">
                      <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      Belum ada riwayat penyesuaian stok
                    </td>
                  </tr>
                ) : (
                  adjustments.map((adj) => (
                    <tr key={adj.id} className="border-b border-border-default last:border-0">
                      <td className="p-3 font-semibold">{adj.product.name}</td>
                      <td className="p-3 text-text-muted">{adj.product.sku}</td>
                      <td className="p-3 text-right">
                        <span
                          className={
                            adj.quantityChange > 0
                              ? "text-accent-success font-bold"
                              : "text-accent-danger font-bold"
                          }
                        >
                          {adj.quantityChange > 0 ? "+" : ""}
                          {formatNumber(adj.quantityChange)}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge variant={REASON_VARIANTS[adj.reason] || "secondary"}>
                          {REASON_LABELS[adj.reason] || adj.reason}
                        </Badge>
                      </td>
                      <td className="p-3 text-text-muted text-xs">{adj.notes || "-"}</td>
                      <td className="p-3 text-text-muted">{adj.user?.name || "-"}</td>
                      <td className="p-3 text-text-muted text-xs">
                        {new Date(adj.createdAt).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {pagination.total > 0 && (
        <TablePagination
          page={page}
          pageSize={pagination.limit}
          totalItems={pagination.total}
          totalPages={pagination.totalPages}
          itemLabel="penyesuaian"
          onPageChange={setPage}
          onPageSizeChange={(next) => {
            setPageSize(next);
            setPage(1);
          }}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Penyesuaian Stok</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Cari Produk</Label>
                <Input
                  placeholder="Ketik nama atau SKU produk..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                {products.length > 0 && (
                  <div className="space-y-1 max-h-40 overflow-auto">
                    {products.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={`w-full text-left rounded-md border px-3 py-2 text-sm transition-colors ${
                          formData.productId === p.id
                            ? "border-accent-primary bg-accent-primary/5"
                            : "border-border-default hover:bg-accent"
                        }`}
                        onClick={() => {
                          setFormData({ ...formData, productId: p.id });
                          setProductSearch(p.name);
                          setProducts([]);
                        }}
                      >
                        <span className="font-semibold">{p.name}</span>
                        <span className="text-muted-foreground ml-2">{p.sku}</span>
                        <span className="text-muted-foreground ml-2">
                          Stok: {formatNumber(p.totalStock)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Perubahan Jumlah (+/-)</Label>
                  <Input
                    type="number"
                    placeholder="Contoh: -5 atau +10"
                    value={formData.quantityChange}
                    onChange={(e) =>
                      setFormData({ ...formData, quantityChange: e.target.value })
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Gunakan angka negatif untuk pengurangan, positif untuk penambahan.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Alasan</Label>
                  <Select
                    value={formData.reason}
                    onValueChange={(val) => setFormData({ ...formData, reason: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STOCK_OPNAME">Stock Opname</SelectItem>
                      <SelectItem value="DAMAGED">Rusak</SelectItem>
                      <SelectItem value="LOST">Hilang</SelectItem>
                      <SelectItem value="EXPIRED">Kedaluwarsa</SelectItem>
                      <SelectItem value="OTHER">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Catatan (opsional)</Label>
                <Textarea
                  placeholder="Detail penyesuaian..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !formData.productId}>
              {submitting ? "Menyimpan..." : "Catat Penyesuaian"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
