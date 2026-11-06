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
import { Warehouse, Search, AlertTriangle, Plus, Package, Clock } from "lucide-react";
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
  hasExpiringBatch?: boolean;
  criticalExpiringCount?: number;
  warningExpiringCount?: number;
  nearestExpiryDate?: string | null;
}

export default function InventoryPage() {
  const { user } = useSessionUser();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
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
        if (showExpiringOnly) params.set("expiring", "true");

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
  }, [debouncedSearch, showLowOnly, showExpiringOnly]);

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
  const expiringCount = inventory.filter((p) => p.hasExpiringBatch).length;

  const canManageInventory =
    user?.role === "ADMIN" ||
    user?.role === "MANAGER" ||
    user?.role === "INVENTORY";

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Inventori"
        description="Overview stok & radar kadaluwarsa semua produk"
        icon={Warehouse}
      >
        {canManageInventory && (
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/inventory/restock">
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /> Restock
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/inventory/adjustments">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /> Penyesuaian
              </Link>
            </Button>
          </div>
        )}
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <Card className="neo-hover">
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider">
              Total Produk
            </p>
            {loading ? (
              <Skeleton className="h-6 sm:h-8 w-12 mx-auto mt-1" />
            ) : (
              <p className="text-lg sm:text-2xl font-black mt-0.5">{totalProducts}</p>
            )}
          </CardContent>
        </Card>
        <Card className="neo-hover">
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider">
              Nilai Stok
            </p>
            {loading ? (
              <Skeleton className="h-6 sm:h-8 w-24 sm:w-32 mx-auto mt-1" />
            ) : (
              <p className="text-base sm:text-2xl font-black text-accent-primary truncate mt-0.5">
                {formatCurrency(totalValue)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card
          className="neo-hover cursor-pointer"
          onClick={() => {
            setShowLowOnly(!showLowOnly);
            setShowExpiringOnly(false);
          }}
        >
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider">
              Low Stock
            </p>
            {loading ? (
              <Skeleton className="h-6 sm:h-8 w-12 mx-auto mt-1" />
            ) : (
              <p className="text-lg sm:text-2xl font-black text-accent-danger flex items-center justify-center gap-1 mt-0.5">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" /> {lowStockCount}
              </p>
            )}
          </CardContent>
        </Card>
        <Card
          className="neo-hover cursor-pointer"
          onClick={() => {
            setShowExpiringOnly(!showExpiringOnly);
            setShowLowOnly(false);
          }}
        >
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider">
              Mendekati Expired
            </p>
            {loading ? (
              <Skeleton className="h-6 sm:h-8 w-12 mx-auto mt-1" />
            ) : (
              <p className="text-lg sm:text-2xl font-black text-amber-600 flex items-center justify-center gap-1 mt-0.5">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" /> {expiringCount}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] sm:min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-text-muted" />
          <Input
            placeholder="Cari nama produk, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 sm:pl-10 text-xs sm:text-sm h-9 sm:h-10"
          />
        </div>
        <Button
          size="sm"
          variant={showLowOnly ? "danger" : "outline"}
          onClick={() => {
            setShowLowOnly(!showLowOnly);
            setShowExpiringOnly(false);
            setPage(1);
          }}
        >
          <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /> Low Stock
        </Button>
        <Button
          size="sm"
          variant={showExpiringOnly ? "danger" : "outline"}
          onClick={() => {
            setShowExpiringOnly(!showExpiringOnly);
            setShowLowOnly(false);
            setPage(1);
          }}
        >
          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /> Mendekati Expired
        </Button>
      </div>

      {/* Inventory Table */}
      <Card>
        <div className="neo-table overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr>
                <th className="text-left p-2.5 sm:p-3 text-[11px] sm:text-xs">Produk</th>
                <th className="text-left p-2.5 sm:p-3 text-[11px] sm:text-xs">Kategori</th>
                <th className="text-right p-2.5 sm:p-3 text-[11px] sm:text-xs">Stok</th>
                <th className="text-right p-2.5 sm:p-3 text-[11px] sm:text-xs">Nilai Stok</th>
                <th className="text-right p-2.5 sm:p-3 text-[11px] sm:text-xs">Batch</th>
                <th className="text-center p-2.5 sm:p-3 text-[11px] sm:text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-${i}`}>
                    <td className="p-2.5 sm:p-3">
                      <Skeleton className="h-4 w-28 sm:w-36 mb-1" />
                      <Skeleton className="h-3 w-16 sm:w-20" />
                    </td>
                    <td className="p-2.5 sm:p-3">
                      <Skeleton className="h-5 w-16 sm:w-20 rounded-md" />
                    </td>
                    <td className="p-2.5 sm:p-3 text-right">
                      <Skeleton className="h-4 w-12 sm:w-16 ml-auto" />
                    </td>
                    <td className="p-2.5 sm:p-3 text-right">
                      <Skeleton className="h-4 w-20 sm:w-24 ml-auto" />
                    </td>
                    <td className="p-2.5 sm:p-3 text-right">
                      <Skeleton className="h-4 w-6 sm:w-8 ml-auto" />
                    </td>
                    <td className="p-2.5 sm:p-3 text-center">
                      <Skeleton className="h-5 w-16 sm:w-20 mx-auto rounded-md" />
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
                  <tr key={item.id} className="hover:bg-bg-main/50 transition-colors">
                    <td className="p-2.5 sm:p-3">
                      {canManageInventory ? (
                        <Link
                          href={`/products/${item.id}`}
                          className="hover:underline"
                        >
                          <p className="font-bold text-xs sm:text-sm text-text-primary">{item.name}</p>
                        </Link>
                      ) : (
                        <p className="font-bold text-xs sm:text-sm text-text-primary">{item.name}</p>
                      )}
                      <p className="text-[10px] sm:text-xs text-text-muted font-mono">
                        {item.sku}
                      </p>
                    </td>
                    <td className="p-2.5 sm:p-3">
                      <Badge
                        variant="outline"
                        className="text-[10px] sm:text-xs px-2 py-0.5 rounded-md"
                        style={{
                          borderColor: item.category?.color || undefined,
                          color: item.category?.color || undefined,
                        }}
                      >
                        {item.category?.name || "-"}
                      </Badge>
                    </td>
                    <td className="p-2.5 sm:p-3 text-right font-bold text-xs sm:text-sm tabular-nums">
                      {formatNumber(item.totalStock)} <span className="text-[10px] sm:text-xs font-normal text-text-muted">{item.unit}</span>
                    </td>
                    <td className="p-2.5 sm:p-3 text-right font-bold text-xs sm:text-sm tabular-nums">
                      {formatCurrency(item.totalValue)}
                    </td>
                    <td className="p-2.5 sm:p-3 text-right text-xs sm:text-sm tabular-nums text-text-secondary">{item.batchCount}</td>
                    <td className="p-2.5 sm:p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {item.isLowStock ? (
                          <Badge variant="danger" className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-md">
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-md">
                            Aman
                          </Badge>
                        )}
                        {item.criticalExpiringCount && item.criticalExpiringCount > 0 ? (
                          <Badge variant="danger" className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md">
                            Exp &lt; 7 Hari ({item.criticalExpiringCount})
                          </Badge>
                        ) : item.warningExpiringCount && item.warningExpiringCount > 0 ? (
                          <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md">
                            Exp &lt; 30 Hari ({item.warningExpiringCount})
                          </Badge>
                        ) : null}
                      </div>
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
