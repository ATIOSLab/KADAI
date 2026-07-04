"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TablePagination } from "@/components/shared/table-pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { apiFetch, ApiError } from "@/lib/api";
import { paginateItems } from "@/lib/pagination";
import { useSessionUser } from "@/hooks/use-session-user";
import { Warehouse, Search, AlertTriangle, Plus, Package } from "lucide-react";
import Link from "next/link";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
  lowStockThreshold: number;
  category: { id: string; name: string; color: string | null };
  totalStock: number;
  currentPrice: number;
  totalValue: number;
  isLowStock: boolean;
  batchCount: number;
}

export default function InventoryPage() {
  const { user } = useSessionUser();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    async function loadInventory() {
      if (!cancelled) {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (showLowOnly) params.set("lowStock", "true");

        const res = await apiFetch<{ data: InventoryItem[] }>(
          `/api/inventory?${params.toString()}`
        );

        if (!cancelled) {
          setInventory(res.data);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiError ? err.message : "Gagal memuat data inventori";
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInventory();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, showLowOnly]);

  const paginatedInventory = useMemo(
    () => paginateItems(inventory, page, pageSize),
    [inventory, page, pageSize]
  );

  useEffect(() => {
    setPage((current) =>
      Math.min(current, paginatedInventory.pagination.totalPages)
    );
  }, [paginatedInventory.pagination.totalPages]);

  // Compute summaries from actual data
  const totalProducts = inventory.length;
  const totalValue = inventory.reduce((sum, p) => sum + p.totalValue, 0);
  const lowStockCount = inventory.filter((p) => p.isLowStock).length;

  const canManageInventory =
    user?.role === "ADMIN" || user?.role === "MANAGER";

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Inventori"
        description="Overview stok semua produk"
        icon={Warehouse}
      >
        {canManageInventory && (
          <Button asChild>
            <Link href="/inventory/restock">
              <Plus className="w-4 h-4 mr-1" /> Restock
            </Link>
          </Button>
        )}
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="neo-hover">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-bold text-text-muted uppercase">
              Total Produk
            </p>
            {loading ? (
              <Skeleton className="h-8 w-12 mx-auto mt-1" />
            ) : (
              <p className="text-2xl font-black">{totalProducts}</p>
            )}
          </CardContent>
        </Card>
        <Card className="neo-hover">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-bold text-text-muted uppercase">
              Nilai Stok
            </p>
            {loading ? (
              <Skeleton className="h-8 w-32 mx-auto mt-1" />
            ) : (
              <p className="text-2xl font-black text-accent-primary">
                {formatCurrency(totalValue)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card
          className="neo-hover cursor-pointer"
          onClick={() => setShowLowOnly(!showLowOnly)}
        >
          <CardContent className="p-4 text-center">
            <p className="text-xs font-bold text-text-muted uppercase">
              Low Stock
            </p>
            {loading ? (
              <Skeleton className="h-8 w-12 mx-auto mt-1" />
            ) : (
              <p className="text-2xl font-black text-accent-danger flex items-center justify-center gap-1">
                <AlertTriangle className="w-5 h-5" /> {lowStockCount}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showLowOnly ? "danger" : "outline"}
          onClick={() => {
            setShowLowOnly(!showLowOnly);
            setPage(1);
          }}
        >
          <AlertTriangle className="w-4 h-4 mr-1" /> Low Stock
        </Button>
      </div>

      {/* Inventory Table */}
      <Card>
        <div className="neo-table overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-3">Produk</th>
                <th className="text-left p-3">Kategori</th>
                <th className="text-right p-3">Stok</th>
                <th className="text-right p-3">Nilai Stok</th>
                <th className="text-right p-3">Batch</th>
                <th className="text-center p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-${i}`}>
                    <td className="p-3">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </td>
                    <td className="p-3">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                    <td className="p-3 text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </td>
                    <td className="p-3 text-right">
                      <Skeleton className="h-4 w-24 ml-auto" />
                    </td>
                    <td className="p-3 text-right">
                      <Skeleton className="h-4 w-8 ml-auto" />
                    </td>
                    <td className="p-3 text-center">
                      <Skeleton className="h-5 w-20 mx-auto rounded-full" />
                    </td>
                  </tr>
                ))
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={Package}
                      title={
                        showLowOnly
                          ? "Tidak ada produk low stock"
                          : "Belum Ada Data Inventori"
                      }
                      description={
                        showLowOnly
                          ? "Semua produk memiliki stok yang cukup"
                          : "Tambahkan produk dan lakukan restock untuk memulai"
                      }
                    />
                  </td>
                </tr>
              ) : (
                paginatedInventory.data.map((item) => (
                  <tr key={item.id} className="hover:bg-bg-main/50">
                    <td className="p-3">
                      {canManageInventory ? (
                        <Link
                          href={`/products/${item.id}`}
                          className="hover:underline"
                        >
                          <p className="font-bold">{item.name}</p>
                        </Link>
                      ) : (
                        <p className="font-bold">{item.name}</p>
                      )}
                      <p className="text-xs text-text-muted font-mono">
                        {item.sku}
                      </p>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: item.category?.color || undefined,
                          color: item.category?.color || undefined,
                        }}
                      >
                        {item.category?.name || "-"}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-bold">
                      {formatNumber(item.totalStock)} {item.unit}
                    </td>
                    <td className="p-3 text-right font-bold">
                      {formatCurrency(item.totalValue)}
                    </td>
                    <td className="p-3 text-right">{item.batchCount}</td>
                    <td className="p-3 text-center">
                      {item.isLowStock ? (
                        <Badge variant="danger">Low Stock</Badge>
                      ) : (
                        <Badge variant="success">Aman</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && inventory.length > 0 && (
          <CardContent>
            <TablePagination
              page={paginatedInventory.pagination.page}
              pageSize={paginatedInventory.pagination.limit}
              totalItems={paginatedInventory.pagination.total}
              totalPages={paginatedInventory.pagination.totalPages}
              itemLabel="produk"
              onPageChange={setPage}
              onPageSizeChange={(nextPageSize) => {
                setPageSize(nextPageSize);
                setPage(1);
              }}
            />
          </CardContent>
        )}
      </Card>
    </div>
  );
}
