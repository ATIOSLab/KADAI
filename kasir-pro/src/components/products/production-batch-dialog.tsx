"use client";

import { useEffect, useState } from "react";
import {
  UtensilsCrossed,
  PackageCheck,
  Building,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Layers,
  Sparkles,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface ProductionBatchDialogProps {
  productId: string;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ProductionBatchDialog({
  productId,
  productName,
  open,
  onOpenChange,
  onSuccess,
}: ProductionBatchDialogProps) {
  const [loading, setLoading] = useState(true);
  const [producing, setProducing] = useState(false);
  const [recipe, setRecipe] = useState<any[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState("");
  const [quantityToProduce, setQuantityToProduce] = useState(10);
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [totalHPP, setTotalHPP] = useState(0);

  useEffect(() => {
    if (!open || !productId) return;

    async function fetchData() {
      try {
        setLoading(true);
        const [recipeRes, outletsRes] = await Promise.all([
          fetch(`/api/products/${productId}/recipe`).then((r) => r.json()),
          fetch("/api/outlets").then((r) => r.json()),
        ]);

        if (recipeRes.recipes) {
          setRecipe(recipeRes.recipes);
          setTotalHPP(recipeRes.totalCalculatedHPP || 0);
        }
        if (outletsRes.data) {
          const list = outletsRes.data;
          setOutlets(list);
          const defaultOutlet =
            list.find(
              (o: any) =>
                o.outletType === "CENTRAL_KITCHEN" ||
                o.outletType === "CENTRAL_WAREHOUSE"
            ) ||
            list.find((o: any) => o.isMain) ||
            list[0];
          if (defaultOutlet) setSelectedOutletId(defaultOutlet.id);
        }
      } catch {
        toast.error("Gagal memuat resep atau data cabang");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [open, productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantityToProduce <= 0) {
      toast.error("Jumlah produksi harus lebih dari 0");
      return;
    }
    if (!selectedOutletId) {
      toast.error("Pilih lokasi cabang / dapur produksi");
      return;
    }

    try {
      setProducing(true);
      const res = await fetch(`/api/products/${productId}/produce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantityToProduce,
          outletId: selectedOutletId,
          expiryDate: expiryDate || null,
          notes: notes || null,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success(
          json.message ||
            `Berhasil memproduksi ${quantityToProduce} unit "${productName}"`
        );
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(json.error || "Gagal memproses produksi");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setProducing(false);
    }
  };

  const estimatedTotalCost = totalHPP * quantityToProduce;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="size-5 text-primary" />
            <span>Eksekusi Produksi Batch (BOM)</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <Loader2 className="size-6 animate-spin mx-auto mb-2 text-primary" />
            Menyiapkan formula resep bahan baku...
          </div>
        ) : recipe.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <AlertCircle className="size-8 text-amber-500 mx-auto" />
            <h4 className="font-bold text-slate-900">
              Formula Resep Belum Terdaftar
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Produk &quot;{productName}&quot; belum memiliki komposisi Bill of
              Materials. Silakan atur komponen bahan baku terlebih dahulu di dialog Resep (BOM).
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-xs">
            {/* Target Product Banner */}
            <div className="p-3 rounded-xl bg-slate-50 border flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Produk Jadi (Finished Good)
                </span>
                <h3 className="font-black text-slate-900 text-sm">{productName}</h3>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20 font-bold">
                BOM Active ({recipe.length} Bahan)
              </Badge>
            </div>

            {/* Inputs: Outlet & Quantity */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Lokasi Dapur / Gudang *</Label>
                <Select
                  value={selectedOutletId}
                  onValueChange={setSelectedOutletId}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Pilih cabang produksi" />
                  </SelectTrigger>
                  <SelectContent>
                    {outlets.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}{" "}
                        {o.outletType === "CENTRAL_KITCHEN"
                          ? "(Dapur Pusat)"
                          : o.outletType === "CENTRAL_WAREHOUSE"
                          ? "(Gudang Pusat)"
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Jumlah Porsi / Unit *</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantityToProduce}
                  onChange={(e) =>
                    setQuantityToProduce(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="h-9 font-bold font-mono text-sm"
                />
              </div>
            </div>

            {/* Ingredients Deduction Breakdown */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="size-3.5 text-primary" /> Rincian Debit Bahan Baku
                </Label>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Otomatis potong stok via FIFO
                </span>
              </div>

              <div className="border rounded-lg overflow-hidden divide-y bg-white">
                <div className="grid grid-cols-12 gap-2 p-2 bg-slate-50 font-bold text-[10px] text-slate-500 uppercase">
                  <div className="col-span-6">Nama Bahan Baku</div>
                  <div className="col-span-3 text-right">Debit Total</div>
                  <div className="col-span-3 text-right">Estimasi Biaya</div>
                </div>
                {recipe.map((r, idx) => {
                  const qtyPer = Number(r.quantityNeeded);
                  const wastage = Number(r.wastagePercent || 0);
                  const totalNeed = qtyPer * quantityToProduce * (1 + wastage / 100);
                  const costPortion = Number(r.costPerPortion || 0);
                  const totalCostLine = costPortion * quantityToProduce;

                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 p-2 items-center hover:bg-slate-50"
                    >
                      <div className="col-span-6">
                        <span className="font-bold text-slate-900 block truncate">
                          {r.ingredientName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {qtyPer} {r.unit}/porsi {wastage > 0 ? `(+${wastage}% susut)` : ""}
                        </span>
                      </div>
                      <div className="col-span-3 text-right font-mono font-bold text-slate-800">
                        {totalNeed.toFixed(1)} {r.unit}
                      </div>
                      <div className="col-span-3 text-right font-mono text-muted-foreground">
                        {costPortion > 0 ? formatCurrency(totalCostLine) : "Rp 0"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Production Financial Summary */}
            <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-200/80 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Estimasi HPP per Porsi:</span>
                <span className="font-bold font-mono text-slate-900">
                  {formatCurrency(totalHPP)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-black border-t border-orange-200/60 pt-1">
                <span className="text-slate-900">Total Biaya Bahan Batch:</span>
                <span className="text-primary font-mono">
                  {formatCurrency(estimatedTotalCost)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs">Tanggal Kedaluwarsa (Opsional)</Label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Catatan Produksi</Label>
                <Input
                  placeholder="Contoh: Batch pagi - siap distribusi ke booth"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={producing} className="font-bold">
                {producing ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" /> Memproses Batch...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4 mr-2" /> Eksekusi & Tambah Stok
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}