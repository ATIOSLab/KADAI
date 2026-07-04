"use client";

import { useEffect, useMemo, useState } from "react";
import { Grid3X3, List, Search } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";
import { useCart } from "@/hooks/use-cart";
import { getRemainingPricingBatches } from "@/lib/pos-pricing";
import { ProductImage } from "@/components/shared/product-image";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";
import type { Category, ProductWithStock } from "@/types";

export function ProductSearch() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCart((state) => state.addItem);
  const cartItems = useCart((state) => state.items);
  const catalogVersion = useCart((state) => state.catalogVersion);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const response = await apiFetch<{ data: Category[] }>("/api/categories");
        if (!cancelled) {
          setCategories(response.data);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          limit: "100",
        });

        if (debouncedSearch) {
          params.set("search", debouncedSearch);
        }

        if (activeCategory) {
          params.set("categoryId", activeCategory);
        }

        const response = await apiFetch<{ data: ProductWithStock[] }>(
          `/api/products?${params.toString()}`
        );

        if (!cancelled) {
          setProducts(response.data);
        }
      } catch (caughtError) {
        if (!cancelled) {
          const message =
            caughtError instanceof ApiError
              ? caughtError.message
              : "Gagal memuat produk kasir";
          toast.error(message);
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [activeCategory, catalogVersion, debouncedSearch]);

  const filteredProducts = useMemo(
    () =>
      products.map((product) => {
        const relatedCartItems = cartItems.filter(
          (item) => item.productId === product.id
        );
        const displayPricingBatches = getRemainingPricingBatches(
          product.pricingBatches,
          relatedCartItems
        );
        const displayStock = displayPricingBatches.reduce(
          (sum, batch) => sum + batch.remainingQty,
          0
        );

        return {
          ...product,
          displayPricingBatches,
          displayStock,
          displayCurrentSellingPrice:
            displayPricingBatches.length > 0
              ? displayPricingBatches[0].sellingPrice
              : null,
        };
      }),
    [cartItems, products]
  );

  const handleAddToCart = (
    product: ProductWithStock,
    displayStock: number
  ) => {
    if (!product.currentSellingPrice || displayStock <= 0) {
      return;
    }

    addItem({
      lineId: "",
      productId: product.id,
      productName: product.name,
      image: product.image,
      sku: product.sku,
      unit: product.unit,
      quantity: 1,
      unitPrice: product.currentSellingPrice,
      discountAmount: 0,
      maxStock: product.totalStock,
      selectedBatchId: null,
      pricingBatches: product.pricingBatches,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Cari produk, SKU, atau barcode..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>
        <div className="flex gap-1 neo-border rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === "grid"
                ? "bg-accent-primary text-white"
                : "hover:bg-bg-main"
            )}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === "list"
                ? "bg-accent-primary text-white"
                : "hover:bg-bg-main"
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 neo-scrollbar">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            "neo-badge whitespace-nowrap transition-all",
            !activeCategory
              ? "bg-accent-primary text-white border-border-default"
              : "bg-bg-card text-text-secondary border-border-default hover:bg-bg-main"
          )}
        >
          Semua
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() =>
              setActiveCategory(
                activeCategory === category.id ? null : category.id
              )
            }
            className={cn(
              "neo-badge whitespace-nowrap transition-all",
              activeCategory === category.id
                ? "text-white border-border-default"
                : "bg-bg-card text-text-secondary border-border-default hover:bg-bg-main"
            )}
            style={
              activeCategory === category.id
                ? { backgroundColor: category.color || "#FF6B35" }
                : undefined
            }
          >
            {category.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
              : "space-y-2"
          }
        >
          {Array.from({ length: viewMode === "grid" ? 10 : 6 }).map((_, index) => (
            <div key={`product-skeleton-${index}`} className="neo-card p-3">
              <Skeleton className="mb-3 aspect-square w-full rounded-lg" />
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="mb-3 h-3 w-1/2" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="neo-card p-8 text-center">
          <p className="text-sm font-bold">Produk tidak ditemukan</p>
          <p className="mt-1 text-xs text-text-muted">
            Coba kata kunci lain atau pilih kategori berbeda.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => handleAddToCart(product, product.displayStock)}
              className="neo-card p-3 text-left neo-hover group cursor-pointer"
              disabled={product.displayStock <= 0}
            >
              <ProductImage
                src={product.image}
                alt={product.name}
                className="mb-2 aspect-square w-full rounded-lg"
                iconClassName="h-8 w-8"
              />
              <p className="text-xs font-bold truncate">{product.name}</p>
              <p className="text-[10px] text-text-muted font-medium">
                {product.sku}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-black text-accent-primary">
                  {formatCurrency(product.displayCurrentSellingPrice || 0)}
                </span>
                <Badge
                  variant={
                    product.displayStock <= product.lowStockThreshold
                      ? "danger"
                      : "muted"
                  }
                  className="text-[10px]"
                >
                  {product.displayStock}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => handleAddToCart(product, product.displayStock)}
              className="w-full neo-card p-3 flex items-center gap-3 neo-hover cursor-pointer"
              disabled={product.displayStock <= 0}
            >
              <ProductImage
                src={product.image}
                alt={product.name}
                className="h-12 w-12 shrink-0 rounded-lg"
                iconClassName="h-5 w-5"
              />
              <div className="flex-1 text-left">
                <p className="text-sm font-bold">{product.name}</p>
                <p className="text-xs text-text-muted">{product.sku}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-accent-primary">
                  {formatCurrency(product.displayCurrentSellingPrice || 0)}
                </p>
                <p className="text-xs text-text-muted">
                  Stok: {product.displayStock}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
