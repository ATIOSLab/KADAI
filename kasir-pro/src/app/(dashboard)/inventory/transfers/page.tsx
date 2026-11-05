"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  Plus,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Building,
  Calendar,
  Eye,
  Check,
  X,
  Loader2,
  Layers,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";

interface TransferItem {
  id: string;
  productId: string;
  quantity: number;
  costPrice: string | number;
  notes: string | null;
  product: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
}

interface StockTransfer {
  id: string;
  transferNumber: string;
  sourceOutletId: string;
  destinationOutletId: string;
  status: "DRAFT" | "IN_TRANSIT" | "RECEIVED" | "CANCELLED";
  notes: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  sourceOutlet: {
    id: string;
    name: string;
    code: string;
    outletType?: string;
  };
  destinationOutlet: {
    id: string;
    name: string;
    code: string;
    outletType?: string;
  };
  items: TransferItem[];
}

export default function StockTransfersPage() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sourceOutletId, setSourceOutletId] = useState("");
  const [destinationOutletId, setDestinationOutletId] = useState("");
  const [notes, setNotes] = useState("");
  const [transferLines, setTransferLines] = useState<
    { productId: string; quantity: number; notes: string }[]
  >([]);

  // Detail Modal State
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(
    null
  );
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transfersRes, outletsRes, productsRes] = await Promise.all([
        fetch("/api/inventory/transfers"),
        fetch("/api/outlets"),
        fetch("/api/products?limit=100"),
      ]);

      const [transfersData, outletsData, productsData] = await Promise.all([
        transfersRes.json(),
        outletsRes.json(),
        productsRes.json(),
      ]);

      if (transfersRes.ok) setTransfers(transfersData.data || []);
      if (outletsRes.ok) {
        const outList = outletsData.data || [];
        setOutlets(outList);
        if (outList.length > 0 && !sourceOutletId) {
          // Default source: main outlet or warehouse
          const main = outList.find((o: any) => o.isMain) || outList[0];
          setSourceOutletId(main.id);
          const other = outList.find((o: any) => o.id !== main.id);
          if (other) setDestinationOutletId(other.id);
        }
      }
      if (productsRes.ok) setProducts(productsData.data || []);
    } catch {
      toast.error("Gagal memuat data mutasi transfer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    if (outlets.length < 2) {
      toast.error("Minimal harus memiliki 2 cabang untuk membuat transfer");
      return;
    }
    const firstProduct = products[0];
    setTransferLines([
      {
        productId: firstProduct?.id || "",
        quantity: 1,
        notes: "",
      },
    ]);
    setNotes("");
    setIsCreateOpen(true);
  };

  const addLine = () => {
    if (products.length === 0) return;
    setTransferLines([
      ...transferLines,
      { productId: products[0].id, quantity: 1, notes: "" },
    ]);
  };

  const removeLine = (idx: number) => {
    setTransferLines(transferLines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, patch: Partial<(typeof transferLines)[0]>) => {
    setTransferLines(
      transferLines.map((line, i) => (i === idx ? { ...line, ...patch } : line))
    );
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceOutletId || !destinationOutletId) {
      toast.error("Cabang asal dan tujuan wajib dipilih");
      return;
    }
    if (sourceOutletId === destinationOutletId) {
      toast.error("Cabang asal dan tujuan tidak boleh sama");
      return;
    }
    if (transferLines.length === 0) {
      toast.error("Minimal harus ada 1 barang dalam transfer");
      return;
    }
    for (const line of transferLines) {
      if (!line.productId || line.quantity <= 0) {
        toast.error("Pastikan semua produk dipilih dan jumlah > 0");
        return;
      }
    }

    try {
      setCreating(true);
      const res = await fetch("/api/inventory/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceOutletId,
          destinationOutletId,
          notes,
          items: transferLines.map((line) => {
            const p = products.find((prod) => prod.id === line.productId);
            return {
              productId: line.productId,
              quantity: line.quantity,
              costPrice: p?.costPrice || 0,
              notes: line.notes || null,
            };
          }),
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success(`Transfer ${json.data.transferNumber} berhasil dibuat`);
        setIsCreateOpen(false);
        fetchData();
      } else {
        toast.error(json.error || "Gagal membuat transfer");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setCreating(false);
    }
  };

  const handleAction = async (id: string, action: "RECEIVE" | "CANCEL") => {
    const actionLabel = action === "RECEIVE" ? "menerima" : "membatalkan";
    if (
      !confirm(
        `Apakah Anda yakin ingin ${actionLabel} pengiriman transfer stok ini?`
      )
    ) {
      return;
    }

    try {
      setProcessingId(id);
      const res = await fetch("/api/inventory/transfers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success(json.message || "Status transfer berhasil diperbarui");
        if (selectedTransfer?.id === id) {
          setSelectedTransfer(null);
        }
        fetchData();
      } else {
        toast.error(json.error || "Gagal memperbarui transfer");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredTransfers = transfers.filter((t) => {
    if (statusFilter === "ALL") return true;
    return t.status === statusFilter;
  });

  const countTotal = transfers.length;
  const countInTransit = transfers.filter((t) => t.status === "IN_TRANSIT").length;
  const countReceived = transfers.filter((t) => t.status === "RECEIVED").length;
  const countCancelled = transfers.filter((t) => t.status === "CANCELLED").length;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <ArrowLeftRight className="size-6 text-primary" />
            Transfer Stok Antar Cabang
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Distribusi stok dari Gudang/Dapur Pusat ke gerai cabang & booth kaki lima dengan pelacakan status transit.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="shadow-sm">
          <Plus className="size-4 mr-2" /> Buat Transfer Baru
        </Button>
      </div>

      {/* Telemetry KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border border-border shadow-xs bg-card p-4">
          <div className="text-[11px] font-bold text-muted-foreground">Total Transfer</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{countTotal}</div>
        </Card>
        <Card className="border border-border shadow-xs bg-amber-50/50 border-amber-200/60 p-4">
          <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
            <Truck className="size-3.5" /> Dalam Pengiriman
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">{countInTransit}</div>
        </Card>
        <Card className="border border-border shadow-xs bg-emerald-50/50 border-emerald-200/60 p-4">
          <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5" /> Selesai Diterima
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{countReceived}</div>
        </Card>
        <Card className="border border-border shadow-xs bg-slate-50 border-slate-200/60 p-4">
          <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
            <XCircle className="size-3.5" /> Dibatalkan
          </div>
          <div className="text-2xl font-black text-slate-700 mt-1">{countCancelled}</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-600 mr-2">Filter Status:</span>
        <Button
          size="sm"
          variant={statusFilter === "ALL" ? "default" : "outline"}
          onClick={() => setStatusFilter("ALL")}
          className="text-xs h-8"
        >
          Semua ({countTotal})
        </Button>
        <Button
          size="sm"
          variant={statusFilter === "IN_TRANSIT" ? "default" : "outline"}
          onClick={() => setStatusFilter("IN_TRANSIT")}
          className="text-xs h-8"
        >
          Dalam Pengiriman ({countInTransit})
        </Button>
        <Button
          size="sm"
          variant={statusFilter === "RECEIVED" ? "default" : "outline"}
          onClick={() => setStatusFilter("RECEIVED")}
          className="text-xs h-8"
        >
          Diterima ({countReceived})
        </Button>
        <Button
          size="sm"
          variant={statusFilter === "CANCELLED" ? "default" : "outline"}
          onClick={() => setStatusFilter("CANCELLED")}
          className="text-xs h-8"
        >
          Dibatalkan ({countCancelled})
        </Button>
      </div>

      {/* Transfers Table / Cards */}
      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : filteredTransfers.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Belum ada mutasi transfer stok"
          description="Gunakan tombol di atas untuk mendistribusikan bahan baku atau produk jadi dari Gudang/Dapur Pusat ke gerai cabang."
          actionLabel="Buat Transfer Sekarang"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-border text-slate-700 font-bold">
                <tr>
                  <th className="py-3 px-4">Nomor Transfer</th>
                  <th className="py-3 px-4">Tanggal Kirim</th>
                  <th className="py-3 px-4">Rute Distribusi</th>
                  <th className="py-3 px-4">Total Item</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransfers.map((t) => {
                  const totalUnits = t.items.reduce((acc, i) => acc + i.quantity, 0);
                  const isProcessing = processingId === t.id;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {t.transferNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(t.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className="font-bold text-slate-900">{t.sourceOutlet.name}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-bold text-primary">{t.destinationOutlet.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {t.items.length} macam ({totalUnits} unit)
                      </td>
                      <td className="py-3 px-4">
                        {t.status === "IN_TRANSIT" && (
                          <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold flex items-center gap-1 w-fit">
                            <Truck className="size-3" /> Dalam Pengiriman
                          </Badge>
                        )}
                        {t.status === "RECEIVED" && (
                          <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 font-bold flex items-center gap-1 w-fit">
                            <CheckCircle2 className="size-3" /> Selesai Diterima
                          </Badge>
                        )}
                        {t.status === "CANCELLED" && (
                          <Badge variant="secondary" className="font-bold flex items-center gap-1 w-fit">
                            <XCircle className="size-3" /> Dibatalkan
                          </Badge>
                        )}
                        {t.status === "DRAFT" && (
                          <Badge variant="outline" className="font-bold w-fit">
                            Draft
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => setSelectedTransfer(t)}
                          >
                            <Eye className="size-3.5 mr-1" /> Detail
                          </Button>

                          {t.status === "IN_TRANSIT" && (
                            <>
                              <Button
                                size="sm"
                                className="h-8 px-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={isProcessing}
                                onClick={() => handleAction(t.id, "RECEIVE")}
                              >
                                {isProcessing ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="size-3.5 mr-1" /> Terima
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                                disabled={isProcessing}
                                onClick={() => handleAction(t.id, "CANCEL")}
                              >
                                <X className="size-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedTransfer}
        onOpenChange={(open) => !open && setSelectedTransfer(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-4">
              <span>Detail Transfer {selectedTransfer?.transferNumber}</span>
              {selectedTransfer?.status === "IN_TRANSIT" && (
                <Badge className="bg-amber-100 text-amber-900 border-amber-300">
                  Dalam Pengiriman
                </Badge>
              )}
              {selectedTransfer?.status === "RECEIVED" && (
                <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300">
                  Selesai Diterima
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedTransfer && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Cabang Asal:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedTransfer.sourceOutlet.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground block font-mono">
                    Kode: {selectedTransfer.sourceOutlet.code}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Cabang Tujuan:</span>
                  <span className="font-bold text-primary text-sm">
                    {selectedTransfer.destinationOutlet.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground block font-mono">
                    Kode: {selectedTransfer.destinationOutlet.code}
                  </span>
                </div>
              </div>

              {selectedTransfer.notes && (
                <div className="p-2.5 rounded bg-slate-50 border text-slate-700">
                  <span className="font-bold block text-[11px]">Catatan Pengiriman:</span>
                  <p className="mt-0.5">{selectedTransfer.notes}</p>
                </div>
              )}

              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Layers className="size-4 text-primary" /> Daftar Barang yang Dimutasi
                </h4>
                <div className="border rounded-lg overflow-hidden divide-y">
                  {selectedTransfer.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 flex items-center justify-between hover:bg-slate-50"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{item.product.name}</span>
                        <span className="text-[10px] text-muted-foreground block font-mono">
                          SKU: {item.product.sku}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold font-mono text-sm text-slate-900">
                          {item.quantity} {item.product.unit || "unit"}
                        </span>
                        {item.costPrice && Number(item.costPrice) > 0 && (
                          <span className="text-[10px] text-muted-foreground block">
                            HPP: {formatCurrency(Number(item.costPrice))}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTransfer.status === "IN_TRANSIT" && (
                <div className="pt-2 flex gap-2">
                  <Button
                    className="w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={processingId === selectedTransfer.id}
                    onClick={() => handleAction(selectedTransfer.id, "RECEIVE")}
                  >
                    <Check className="size-4 mr-1.5" /> Konfirmasi Terima Barang di Tujuan
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive"
                    disabled={processingId === selectedTransfer.id}
                    onClick={() => handleAction(selectedTransfer.id, "CANCEL")}
                  >
                    Batalkan
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Transfer Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Transfer Stok Antar Cabang</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cabang Asal (Pengirim) *</Label>
                <Select value={sourceOutletId} onValueChange={setSourceOutletId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih cabang asal" />
                  </SelectTrigger>
                  <SelectContent>
                    {outlets.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name} {o.isMain ? "(Pusat/HQ)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Cabang Tujuan (Penerima) *</Label>
                <Select
                  value={destinationOutletId}
                  onValueChange={setDestinationOutletId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih cabang tujuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {outlets
                      .filter((o) => o.id !== sourceOutletId)
                      .map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Catatan Surat Jalan / Pengiriman</Label>
              <Input
                placeholder="Contoh: Pasokan stok mingguan via kurir operasional internal"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Transfer Items Lines */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label className="font-bold text-xs">Daftar Produk yang Dikirim</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLine}
                  className="h-7 text-xs"
                >
                  <Plus className="size-3 mr-1" /> Tambah Produk
                </Button>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {transferLines.map((line, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg border"
                  >
                    <div className="col-span-7">
                      <Select
                        value={line.productId}
                        onValueChange={(val) => updateLine(idx, { productId: val })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Pilih produk" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-4">
                      <Input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(idx, {
                            quantity: Math.max(1, parseInt(e.target.value) || 1),
                          })
                        }
                        className="h-8 text-xs font-mono font-bold"
                        placeholder="Jumlah"
                      />
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        disabled={transferLines.length === 1}
                        className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={creating} className="font-bold">
                {creating ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    <Truck className="size-4 mr-2" /> Kirim Transfer Stok
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}