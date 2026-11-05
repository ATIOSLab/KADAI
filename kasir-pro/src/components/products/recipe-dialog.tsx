"use client";

import { useEffect, useState } from "react";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Loader2,
  PackageCheck,
} from "lucide-react";
import { ProductionBatchDialog } from "./production-batch-dialog";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface RecipeLine {
  ingredientId: string;
  ingredientName?: string;
  quantityNeeded: number;
  unit: string;
  wastagePercent: number;
  costPerPortion?: number;
}

interface RecipeDialogProps {
  productId: string;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function RecipeDialog({
  productId,
  productName,
  open,
  onOpenChange,
  onSaved,
}: RecipeDialogProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [recipeLines, setRecipeLines] = useState<RecipeLine[]>([]);
  const [calculatedHPP, setCalculatedHPP] = useState(0);
  const [isProduceOpen, setIsProduceOpen] = useState(false);

  useEffect(() => {
    if (!open || !productId) return;

    async function fetchData() {
      try {
        setLoading(true);
        const [recipeRes, productsRes] = await Promise.all([
          fetch(`/api/products/${productId}/recipe`).then((r) => r.json()),
          fetch(`/api/products?limit=100`).then((r) => r.json()),
        ]);

        if (recipeRes.recipes) {
          setRecipeLines(
            recipeRes.recipes.map((r: any) => ({
              ingredientId: r.ingredientId,
              ingredientName: r.ingredientName,
              quantityNeeded: r.quantityNeeded,
              unit: r.unit,
              wastagePercent: r.wastagePercent,
              costPerPortion: r.costPerPortion,
            }))
          );
          setCalculatedHPP(recipeRes.totalCalculatedHPP || 0);
        }

        // Candidates for ingredients: exclude the product itself
        const candidates = (productsRes.data || []).filter(
          (p: any) => p.id !== productId
        );
        setRawMaterials(candidates);
      } catch {
        toast.error("Gagal memuat resep bahan baku");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [open, productId]);

  const addIngredientLine = () => {
    if (rawMaterials.length === 0) {
      toast.error("Belum ada produk/bahan baku terdaftar.");
      return;
    }

    const first = rawMaterials[0];
    setRecipeLines([
      ...recipeLines,
      {
        ingredientId: first.id,
        ingredientName: first.name,
        quantityNeeded: 1,
        unit: first.unit || "gram",
        wastagePercent: 0,
      },
    ]);
  };

  const removeLine = (idx: number) => {
    setRecipeLines(recipeLines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, patch: Partial<RecipeLine>) => {
    setRecipeLines(
      recipeLines.map((line, i) => {
        if (i !== idx) return line;
        const updated = { ...line, ...patch };
        if (patch.ingredientId) {
          const match = rawMaterials.find((m) => m.id === patch.ingredientId);
          if (match) {
            updated.ingredientName = match.name;
            updated.unit = match.unit || "gram";
          }
        }
        return updated;
      })
    );
  };

  const handleSaveRecipe = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/products/${productId}/recipe`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: recipeLines.map((r) => ({
            ingredientId: r.ingredientId,
            quantityNeeded: Number(r.quantityNeeded) || 1,
            unit: r.unit,
            wastagePercent: Number(r.wastagePercent) || 0,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan resep");
        return;
      }

      toast.success(data.message || "Resep berhasil disimpan!");
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl neo-border neo-shadow">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary neo-border">
              <UtensilsCrossed className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-xl font-black">
                Resep Bahan Baku (BOM): {productName}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tentukan gramatur bahan pokok mentah yang dipotong otomatis saat menu ini terjual.
              </p>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-muted-foreground animate-pulse">
            Memuat data resep & bahan baku...
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Header info / HPP Estimation */}
            <div className="p-3 bg-muted/40 rounded-xl neo-border flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase">
                  Estimasi Modal (HPP FIFO per Porsi)
                </span>
                <p className="text-lg font-black text-primary">
                  Rp {calculatedHPP.toLocaleString("id-ID")}
                </p>
              </div>
              <Badge className="font-bold neo-border bg-accent-success text-white">
                Auto-Deduct FIFO
              </Badge>
            </div>

            {/* List of Ingredients */}
            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {recipeLines.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-border rounded-xl">
                  <p className="text-xs text-muted-foreground font-semibold">
                    Belum ada bahan mentah yang diracik pada produk ini.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={addIngredientLine}
                    className="mt-3 neo-border font-bold text-xs"
                  >
                    <Plus className="size-3.5 mr-1" /> Tambah Bahan Pertama
                  </Button>
                </div>
              ) : (
                recipeLines.map((line, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-card rounded-xl neo-border space-y-2"
                  >
                    <div className="grid grid-cols-12 gap-2 items-center">
                      {/* Ingredient selector */}
                      <div className="col-span-5">
                        <Label className="text-[10px] font-bold text-muted-foreground">
                          Bahan Baku
                        </Label>
                        <select
                          value={line.ingredientId}
                          onChange={(e: any) =>
                            updateLine(idx, { ingredientId: e.target.value })
                          }
                          className="w-full h-9 px-2 rounded-lg neo-border bg-background text-xs font-bold"
                        >
                          {rawMaterials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity needed */}
                      <div className="col-span-3">
                        <Label className="text-[10px] font-bold text-muted-foreground">
                          Jumlah / Porsi
                        </Label>
                        <Input
                          type="number"
                          step="0.001"
                          min="0.001"
                          value={line.quantityNeeded}
                          onChange={(e: any) =>
                            updateLine(idx, {
                              quantityNeeded: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="h-9 neo-border text-xs font-bold"
                        />
                      </div>

                      {/* Unit */}
                      <div className="col-span-2">
                        <Label className="text-[10px] font-bold text-muted-foreground">
                          Satuan
                        </Label>
                        <Input
                          value={line.unit}
                          onChange={(e: any) =>
                            updateLine(idx, { unit: e.target.value })
                          }
                          className="h-9 neo-border text-xs font-medium"
                        />
                      </div>

                      {/* Remove button */}
                      <div className="col-span-2 flex items-end justify-center pt-4">
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                          title="Hapus Bahan"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {recipeLines.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addIngredientLine}
                className="w-full neo-border font-bold text-xs"
              >
                <Plus className="size-3.5 mr-1" /> Tambah Bahan Lain
              </Button>
            )}
          </div>
        )}

        <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
          {recipeLines.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsProduceOpen(true)}
              className="w-full neo-border font-bold text-xs text-primary border-primary/40 hover:bg-primary/10"
            >
              <PackageCheck className="size-3.5 mr-1.5" /> Eksekusi Produksi Batch
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full neo-border font-bold text-xs"
          >
            Batal
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={handleSaveRecipe}
            className="w-full neo-border neo-shadow font-black bg-primary text-primary-foreground text-xs"
          >
            {saving ? (
              <>
                <Loader2 className="size-3.5 mr-1.5 animate-spin" /> Menyimpan Resep...
              </>
            ) : (
              "Simpan Resep (BOM)"
            )}
          </Button>
        </DialogFooter>

        <ProductionBatchDialog
          productId={productId}
          productName={productName}
          open={isProduceOpen}
          onOpenChange={setIsProduceOpen}
          onSuccess={() => {
            if (onSaved) onSaved();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
