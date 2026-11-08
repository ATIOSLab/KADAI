"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductImage } from "@/components/shared/product-image";
import { TablePagination } from "@/components/shared/table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import {
  Package,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Loader2,
  UtensilsCrossed,
  PackageCheck,
} from "lucide-react";
import { RecipeDialog } from "@/components/products/recipe-dialog";
import { ProductionBatchDialog } from "@/components/products/production-batch-dialog";
import type { ProductWithStock, PaginatedResponse } from "@/types";

export default function ProductsPage() {
  const router = useRouter();
  const { user } = useSessionUser();
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
  });

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedRecipeProduct, setSelectedRecipeProduct] =
    useState<ProductWithStock | null>(null);
  const [producingProduct, setProducingProduct] =
    useState<ProductWithStock | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      if (!cancelled) {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        params.set("page", String(page));
        params.set("limit", String(pageSize));

        const res = await apiFetch<PaginatedResponse<ProductWithStock>>(
          `/api/products?${params.toString()}`
        );

        if (!cancelled) {
          setProducts(res.data);
          setPagination(res.pagination);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiError ? err.message : "Gagal memuat data produk";
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, page, pageSize]);

  // Delete handler
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/products/${deleteTarget.id}`, { method: "DELETE" });
      toast.success(`Produk "${deleteTarget.name}" berhasil dihapus`);
      setDeleteTarget(null);
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("page", String(page));
      params.set("limit", String(pageSize));
      const res = await apiFetch<PaginatedResponse<ProductWithStock>>(
        `/api/products?${params.toString()}`
      );
      setProducts(res.data);
      setPagination(res.pagination);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Gagal menghapus produk";
      toast.error(message);
    } finally {
      setLoading(false);
      setDeleting(false);
    }
  };

  const canDeleteProduct = user?.role === "ADMIN";

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Katalog Produk & Resep"
        eyebrow="Katalog & Rantai Pasok"
        description="Kelola katalog produk, varian, dan resep Bill of Materials (BOM)"
        icon={Package}
      >
        <Button asChild>
          <Link href="/products/new">
            <Plus className="w-4 h-4 mr-1" /> Tambah Produk
          </Link>
        </Button>
      </PageHeader>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <Input
          placeholder="Cari produk (nama, SKU, barcode)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Product Table */}
      {/* Responsive Product List: Cards on Mobile, Table on Desktop */}
      <div className="space-y-4 md:hidden">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={`skel-m-${i}`} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
              <Skeleton className="h-4 w-24" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-5 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            </Card>
          ))
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Belum Ada Produk"
            description="Mulai tambahkan produk untuk mengelola toko Anda"
            actionLabel="Tambah Produk"
            onAction={() => router.push("/products/new")}
          />
        ) : (
          products.map((product) => {
            const isLowStock = product.totalStock <= product.lowStockThreshold;
            return (
              <Card key={product.id} className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex min-w-0 items-start gap-3">
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      className="h-14 w-14 shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-sm">{product.name}</h3>
                      <p className="font-mono text-xs text-text-muted mt-0.5">
                        {product.sku}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-[10px]"
                    style={{
                      borderColor: product.category?.color || undefined,
                      color: product.category?.color || undefined,
                    }}
                  >
                    {product.category?.name || "-"}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-muted">Harga Jual</span>
                  <span className="font-bold">
                    {product.currentSellingPrice
                      ? formatCurrency(product.currentSellingPrice)
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-muted">Stok</span>
                  <Badge variant={isLowStock ? "danger" : "success"}>
                    {product.totalStock} {product.unit}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-default/10">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/products/${product.id}`}>
                      <Eye className="w-4 h-4 mr-1.5" /> Detail
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/products/${product.id}`}>
                      <Edit className="w-4 h-4 mr-1.5" /> Edit
                    </Link>
                  </Button>
                  {canDeleteProduct && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-accent-danger hover:text-accent-danger shrink-0 h-8 w-8"
                      onClick={() =>
                        setDeleteTarget({
                          id: product.id,
                          name: product.name,
                        })
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Card className="hidden md:block">
        <div className="neo-table overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-3">Produk</th>
                <th className="text-left p-3">SKU</th>
                <th className="text-left p-3">Kategori</th>
                <th className="text-right p-3">Harga Jual</th>
                <th className="text-right p-3">Stok</th>
                <th className="text-center p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-${i}`}>
                    <td className="p-3">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </td>
                    <td className="p-3">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="p-3">
                      <Skeleton className="h-5 w-24 rounded-md" />
                    </td>
                    <td className="p-3 text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </td>
                    <td className="p-3 text-right">
                      <Skeleton className="h-5 w-16 ml-auto rounded-md" />
                    </td>
                    <td className="p-3">
                      <Skeleton className="h-8 w-24 mx-auto" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={Package}
                      title="Belum Ada Produk"
                      description="Mulai tambahkan produk untuk mengelola toko Anda"
                      actionLabel="Tambah Produk"
                      onAction={() => router.push("/products/new")}
                    />
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isLowStock =
                    product.totalStock <= product.lowStockThreshold;
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-bg-main/50 transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <ProductImage
                            src={product.image}
                            alt={product.name}
                            className="h-12 w-12 shrink-0"
                            iconClassName="h-5 w-5"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-bold">{product.name}</p>
                            <p className="text-xs text-text-muted">{product.unit}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-xs font-bold">
                        {product.sku}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: product.category?.color || undefined,
                            color: product.category?.color || undefined,
                          }}
                        >
                          {product.category?.name || "-"}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-bold">
                        {product.currentSellingPrice
                          ? formatCurrency(product.currentSellingPrice)
                          : "-"}
                      </td>
                      <td className="p-3 text-right">
                        <Badge variant={isLowStock ? "danger" : "success"}>
                          {product.totalStock} {product.unit}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Resep Bahan Baku (BOM)"
                            className="text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => setSelectedRecipeProduct(product)}
                          >
                            <UtensilsCrossed className="w-4 h-4" />
                          </Button>
                          {product.productType === "MANUFACTURED" && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Eksekusi Produksi Batch"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => setProducingProduct(product)}
                            >
                              <PackageCheck className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            asChild
                          >
                            <Link href={`/products/${product.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            asChild
                          >
                            <Link href={`/products/${product.id}`}>
                              <Edit className="w-4 h-4" />
                            </Link>
                          </Button>
                          {canDeleteProduct && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-accent-danger hover:text-accent-danger"
                              onClick={() =>
                                setDeleteTarget({
                                  id: product.id,
                                  name: product.name,
                                })
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {!loading && pagination.total > 0 && (
        <TablePagination
          page={page}
          pageSize={pagination.limit}
          totalItems={pagination.total}
          totalPages={pagination.totalPages}
          itemLabel="produk"
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Produk</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-text-muted">
              Apakah Anda yakin ingin menghapus produk{" "}
              <strong>&ldquo;{deleteTarget?.name}&rdquo;</strong>? Produk akan
              dinonaktifkan dan tidak tampil di daftar.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" /> Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-1" /> Hapus
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bill of Materials (BOM) Recipe Modal */}
      {selectedRecipeProduct && (
        <RecipeDialog
          open={!!selectedRecipeProduct}
          onOpenChange={(open) => {
            if (!open) setSelectedRecipeProduct(null);
          }}
          productId={selectedRecipeProduct.id}
          productName={selectedRecipeProduct.name}
          onSaved={() => {
            // reload products
            fetch(`/api/products?page=${page}&limit=${pageSize}`)
              .then((r) => r.json())
              .then((d) => {
                if (d.data) setProducts(d.data);
              });
          }}
        />
      )}

      {/* Production Batch Modal */}
      {producingProduct && (
        <ProductionBatchDialog
          open={!!producingProduct}
          onOpenChange={(open) => {
            if (!open) setProducingProduct(null);
          }}
          productId={producingProduct.id}
          productName={producingProduct.name}
          onSuccess={() => {
            // reload products
            fetch(`/api/products?page=${page}&limit=${pageSize}`)
              .then((r) => r.json())
              .then((d) => {
                if (d.data) setProducts(d.data);
              });
          }}
        />
      )}
    </div>
  );
}
