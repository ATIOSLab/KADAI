"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Warehouse, Loader2, Calculator } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { ProductWithStock } from "@/types";

const DEFAULT_MARKUP_PERCENT = 30;
type PricingDriver = "markup" | "margin" | "sellingPrice";

function sanitizeIntegerInput(value: string) {
  return value.replace(/\D/g, "");
}

function sanitizeDecimalInput(value: string) {
  const normalized = value.replace(",", ".").replace(/[^0-9.]/g, "");
  const [integerPart, ...decimalParts] = normalized.split(".");

  if (decimalParts.length === 0) {
    return normalized;
  }

  return `${integerPart}.${decimalParts.join("")}`;
}

function parseInputNumber(value: string) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function calculateSellingPrice(cost: number, markupPercent: number) {
  return Math.ceil(cost * (1 + markupPercent / 100));
}

function calculateSellingPriceFromMargin(cost: number, marginPercent: number) {
  if (cost <= 0 || marginPercent >= 100) {
    return null;
  }

  return Math.ceil(cost / (1 - marginPercent / 100));
}

function calculateMarkupPercent(cost: number, sellingPrice: number) {
  if (cost <= 0) {
    return 0;
  }

  return Number((((sellingPrice - cost) / cost) * 100).toFixed(2));
}

function calculateMarginPercent(cost: number, sellingPrice: number) {
  if (sellingPrice <= 0) {
    return 0;
  }

  return Number((((sellingPrice - cost) / sellingPrice) * 100).toFixed(2));
}

export default function RestockPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [markupPercent, setMarkupPercent] = useState(
    String(DEFAULT_MARKUP_PERCENT)
  );
  const [marginPercent, setMarginPercent] = useState("");
  const [pricingDriver, setPricingDriver] = useState<PricingDriver>("markup");

  // Fetch products on mount
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await apiFetch<{ data: ProductWithStock[] }>(
          "/api/products?limit=100"
        );
        setProducts(res.data);
      } catch {
        toast.error("Gagal memuat daftar produk");
      } finally {
        setLoadingProducts(false);
      }
    }
    loadProducts();
  }, []);

  // Auto-calculate derived values while keeping the active field editable.
  const syncPricingState = (
    cost: number,
    selling: number,
    source: PricingDriver
  ) => {
    const nextMarkup = String(calculateMarkupPercent(cost, selling));
    const nextMargin = String(calculateMarginPercent(cost, selling));

    if (source !== "sellingPrice") {
      setSellingPrice(String(selling));
    }

    if (source !== "markup") {
      setMarkupPercent(nextMarkup);
    }

    if (source !== "margin") {
      setMarginPercent(nextMargin);
    }
  };

  const handleCostPriceChange = (value: string) => {
    const sanitizedValue = sanitizeIntegerInput(value);
    setCostPrice(sanitizedValue);

    const cost = parseInputNumber(sanitizedValue);
    const currentMarkup = parseInputNumber(markupPercent);
    const currentMargin = parseInputNumber(marginPercent);
    const currentSelling = parseInputNumber(sellingPrice);

    if (cost === null || cost <= 0) {
      return;
    }

    if (pricingDriver === "markup" && currentMarkup !== null) {
      syncPricingState(cost, calculateSellingPrice(cost, currentMarkup), "markup");
      return;
    }

    if (pricingDriver === "margin" && currentMargin !== null) {
      const nextSelling = calculateSellingPriceFromMargin(cost, currentMargin);
      if (nextSelling !== null) {
        syncPricingState(cost, nextSelling, "margin");
      }
      return;
    }

    if (currentSelling !== null && currentSelling > 0) {
      syncPricingState(cost, currentSelling, "sellingPrice");
      return;
    }

    if (currentMarkup !== null) {
      syncPricingState(cost, calculateSellingPrice(cost, currentMarkup), "markup");
    }
  };

  const handleMarkupChange = (value: string) => {
    const sanitizedValue = sanitizeDecimalInput(value);
    setPricingDriver("markup");
    setMarkupPercent(sanitizedValue);

    const cost = parseInputNumber(costPrice);
    const markup = parseInputNumber(sanitizedValue);

    if (cost !== null && cost > 0 && markup !== null) {
      const nextSelling = calculateSellingPrice(cost, markup);
      syncPricingState(cost, nextSelling, "markup");
    }
  };

  const handleMarginChange = (value: string) => {
    const sanitizedValue = sanitizeDecimalInput(value);
    setPricingDriver("margin");
    setMarginPercent(sanitizedValue);

    const cost = parseInputNumber(costPrice);
    const margin = parseInputNumber(sanitizedValue);

    if (cost !== null && cost > 0 && margin !== null) {
      const nextSelling = calculateSellingPriceFromMargin(cost, margin);

      if (nextSelling !== null) {
        syncPricingState(cost, nextSelling, "margin");
      }
    }
  };

  const handleSellingPriceChange = (value: string) => {
    const sanitizedValue = sanitizeIntegerInput(value);
    setPricingDriver("sellingPrice");
    setSellingPrice(sanitizedValue);

    const cost = parseInputNumber(costPrice);
    const selling = parseInputNumber(sanitizedValue);

    if (cost !== null && cost > 0 && selling !== null) {
      syncPricingState(cost, selling, "sellingPrice");
    }
  };

  // Get selected product info
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      await apiFetch("/api/batches", {
        method: "POST",
        body: {
          productId: selectedProductId,
          quantity: parseInt(formData.get("quantity") as string),
          costPrice: parseFloat(costPrice),
          sellingPrice: parseFloat(sellingPrice),
          purchaseDate: (formData.get("purchaseDate") as string) || null,
          expiryDate: (formData.get("expiryDate") as string) || null,
          notes: (formData.get("notes") as string)?.trim() || null,
        },
      });

      toast.success("Batch restock berhasil ditambahkan!");
      router.push("/inventory");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Gagal membuat batch baru";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate margin preview
  const cost = parseInputNumber(costPrice);
  const sell = parseInputNumber(sellingPrice);
  const margin =
    cost !== null && sell !== null && sell > 0
      ? (((sell - cost) / sell) * 100).toFixed(1)
      : null;
  const profitPerUnit =
    cost !== null && sell !== null ? sell - cost : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      <PageHeader
        title="Restock / Batch Baru"
        description="Tambah stok dengan batch baru (FIFO)"
        icon={Warehouse}
      />

      <Card>
        <CardHeader>
          <CardTitle>Detail Restock</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product Select */}
            <div className="space-y-2">
              <Label>Produk *</Label>
              {loadingProducts ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <SearchableSelect
                  value={selectedProductId}
                  onValueChange={setSelectedProductId}
                  placeholder="Pilih produk"
                  searchPlaceholder="Cari produk atau SKU..."
                  emptyMessage="Produk tidak ditemukan."
                  options={products.map((product) => ({
                    value: product.id,
                    label: product.name,
                    description: product.sku,
                    searchText: `${product.name} ${product.sku} ${product.unit}`,
                    triggerLabel: `${product.name} (${product.sku})`,
                  }))}
                />
              )}
              {/* Show current stock of selected product */}
              {selectedProduct && (
                <div className="flex gap-2 items-center text-xs">
                  <span className="text-text-muted font-medium">
                    Stok saat ini:
                  </span>
                  <Badge
                    variant={
                      selectedProduct.totalStock <=
                      selectedProduct.lowStockThreshold
                        ? "danger"
                        : "success"
                    }
                  >
                    {selectedProduct.totalStock} {selectedProduct.unit}
                  </Badge>
                  {selectedProduct.currentSellingPrice && (
                    <>
                      <span className="text-text-muted font-medium ml-2">
                        Harga jual terakhir:
                      </span>
                      <span className="font-bold">
                        {formatCurrency(selectedProduct.currentSellingPrice)}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label>Jumlah Unit *</Label>
              <Input
                name="quantity"
                type="number"
                min="1"
                placeholder="100"
                required
              />
            </div>

            {/* Pricing with Auto Markup */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Harga Modal / unit *</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="2.500"
                  value={costPrice ? formatNumber(costPrice) : ""}
                  onChange={(e) => handleCostPriceChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calculator className="w-3 h-3" /> Markup %
                </Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="30"
                  value={markupPercent}
                  onChange={(e) => handleMarkupChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calculator className="w-3 h-3" /> Margin %
                </Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="23.08"
                  value={marginPercent}
                  onChange={(e) => handleMarginChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Harga Jual / unit *</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="3.500"
                  value={sellingPrice ? formatNumber(sellingPrice) : ""}
                  onChange={(e) => handleSellingPriceChange(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Margin Preview */}
            {margin !== null && profitPerUnit !== null && (
              <div className="neo-card bg-bg-main p-3 flex items-center justify-between text-sm">
                <span className="font-bold text-text-muted">Preview:</span>
                <div className="flex gap-4">
                  <span>
                    Margin:{" "}
                    <Badge variant={parseFloat(margin) > 0 ? "success" : "danger"}>
                      {margin}%
                    </Badge>
                  </span>
                  <span>
                    Profit/unit:{" "}
                    <span
                      className={`font-bold ${
                        profitPerUnit >= 0
                          ? "text-accent-success"
                          : "text-accent-danger"
                      }`}
                    >
                      {formatCurrency(profitPerUnit)}
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Pembelian</Label>
                <Input name="purchaseDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Kedaluwarsa</Label>
                <Input name="expiryDate" type="date" />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea
                name="notes"
                placeholder="Catatan restock (opsional)"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading || !selectedProductId}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />{" "}
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Batch"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
