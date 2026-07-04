"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ApiError } from "@/lib/api";
import {
  formatActivityAction,
  formatActivityDescription,
  getActivityActionStyle,
} from "@/lib/activity-log-presenter";
import {
  ScrollText,
} from "lucide-react";

interface LogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: Record<string, unknown>;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string } | null;
}

interface PaginatedLogs {
  data: LogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const ACTION_OPTIONS = [
  { value: "ALL", label: "Semua Aksi" },
  { value: "SALE_CREATED", label: "Transaksi Dibuat" },
  { value: "SALE_VOIDED", label: "Transaksi Dibatalkan" },
  { value: "PRODUCT_CREATED", label: "Produk Ditambahkan" },
  { value: "PRODUCT_UPDATED", label: "Produk Diperbarui" },
  { value: "PRODUCT_DELETED", label: "Produk Dihapus" },
  { value: "BATCH_CREATED", label: "Batch Ditambahkan" },
  { value: "STOCK_ADJUSTED", label: "Stok Disesuaikan" },
  { value: "USER_CREATED", label: "Pengguna Ditambahkan" },
  { value: "USER_UPDATED", label: "Pengguna Diperbarui" },
  { value: "USER_DELETED", label: "Pengguna Dihapus" },
];

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(pageSize));
      if (actionFilter !== "ALL") params.set("action", actionFilter);

      const res = await apiFetch<PaginatedLogs>(
        `/api/activity-log?${params.toString()}`
      );
      setLogs(res.data);
      setPagination(res.pagination);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Gagal memuat activity log";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (val: string) => {
    setActionFilter(val);
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Activity Log"
        description="Riwayat semua aktivitas sistem"
        icon={ScrollText}
      />

      {/* Filter */}
      <div className="max-w-xs">
        <SearchableSelect
          value={actionFilter}
          onValueChange={handleFilterChange}
          placeholder="Semua Aksi"
          searchPlaceholder="Cari aksi..."
          emptyMessage="Aksi tidak ditemukan."
          options={ACTION_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
            searchText: `${option.label} ${option.value}`,
          }))}
        />
      </div>

      <Card>
        <div className="divide-y divide-border-default">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={`skel-${i}`}
                className="flex items-start gap-3 p-4"
              >
                <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-3 w-28 shrink-0" />
              </div>
            ))
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <ScrollText className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="font-bold text-text-muted">
                Belum ada aktivitas
              </p>
              <p className="text-sm text-text-muted">
                Aktivitas akan muncul seiring penggunaan sistem
              </p>
            </div>
          ) : (
            logs.map((log) => {
              const actionInfo = getActivityActionStyle(log.action);
              const Icon = actionInfo.icon;

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-4 hover:bg-bg-main/50 transition-colors"
                >
                  <div
                    className={`w-9 h-9 rounded-lg ${actionInfo.color} flex items-center justify-center shrink-0 neo-border-thin`}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">
                        {log.user?.name || "Sistem"}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {formatActivityAction(log.action)}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 truncate">
                      {formatActivityDescription(log)}
                    </p>
                  </div>
                  <span className="text-xs text-text-muted whitespace-nowrap shrink-0">
                    {new Date(log.createdAt).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Pagination */}
      {!loading && pagination.total > 0 && (
        <TablePagination
          page={page}
          pageSize={pagination.limit}
          totalItems={pagination.total}
          totalPages={pagination.totalPages}
          itemLabel="log"
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
