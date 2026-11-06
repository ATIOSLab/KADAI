"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CircleDollarSign,
  Layers3,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, ApiError } from "@/lib/api";
import { paginateItems } from "@/lib/pagination";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { useSessionUser } from "@/hooks/use-session-user";
import type {
  FinanceBreakdownItem,
  FinanceCategoryRecord,
  FinanceEntryRecord,
  FinanceLedgerResponse,
} from "@/types";

type FinanceDirection = "IN" | "OUT";
type FinanceSource = "MANUAL" | "SALE" | "SALE_VOID" | "RESTOCK";
type BreakdownChartDatum = {
  id: string;
  label: string;
  direction: FinanceDirection;
  directionLabel: string;
  amount: number;
  fill: string;
};

const SOURCE_LABELS: Record<FinanceSource, string> = {
  MANUAL: "Manual",
  SALE: "Penjualan",
  SALE_VOID: "Pembatalan Penjualan",
  RESTOCK: "Restock",
};

const DIRECTION_LABELS: Record<FinanceDirection, string> = {
  IN: "Masuk",
  OUT: "Keluar",
};

const BREAKDOWN_COLORS: Record<FinanceDirection, string> = {
  IN: "#2D6A4F",
  OUT: "#D62828",
};

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  };
}

function sanitizeAmountInput(value: string) {
  return value.replace(/\D/g, "");
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000_000) {
    return `Rp${(value / 1_000_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000_000) {
    return `Rp${(value / 1_000_000).toFixed(1)}jt`;
  }

  if (value >= 1_000) {
    return `Rp${(value / 1_000).toFixed(0)}rb`;
  }

  return `Rp${value}`;
}

function buildBreakdownChartData(items: FinanceBreakdownItem[]): BreakdownChartDatum[] {
  return [...items]
    .sort((left, right) => right.totalAmount - left.totalAmount)
    .map((item) => ({
      id: `${item.key}-${item.direction}`,
      label: item.label,
      direction: item.direction as FinanceDirection,
      directionLabel: DIRECTION_LABELS[item.direction as FinanceDirection],
      amount: item.totalAmount,
      fill: BREAKDOWN_COLORS[item.direction as FinanceDirection],
    }));
}

function BreakdownChartCard({
  title,
  description,
  data,
  loading,
}: {
  title: string;
  description: string;
  data: BreakdownChartDatum[];
  loading: boolean;
}) {
  const chartHeight = Math.max(280, data.length * 58);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-black/10 bg-bg-main/30 p-3">
          {loading ? (
            <Skeleton className="h-[360px] w-full" />
          ) : data.length === 0 ? (
            <div className="flex h-[360px] items-center justify-center text-center text-sm font-medium text-text-muted">
              Belum ada transaksi dalam filter ini.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold text-text-secondary">
                  <span className="h-2.5 w-2.5 rounded-full bg-accent-success" />
                  Pemasukan
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold text-text-secondary">
                  <span className="h-2.5 w-2.5 rounded-full bg-accent-danger" />
                  Pengeluaran
                </div>
              </div>
              <div className="mt-3 max-h-[360px] overflow-y-auto pr-2">
                <div style={{ height: chartHeight }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data}
                      layout="vertical"
                      margin={{ top: 8, right: 18, bottom: 8, left: 8 }}
                      barCategoryGap={14}
                      barSize={24}
                    >
                      <CartesianGrid
                        horizontal={false}
                        stroke="#E5E5E5"
                        strokeDasharray="3 3"
                      />
                      <XAxis
                        type="number"
                        stroke="#1A1A1A"
                        strokeWidth={1.5}
                        tick={{ fontSize: 11, fontWeight: 700 }}
                        tickFormatter={(value) =>
                          formatCompactCurrency(Number(value))
                        }
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={170}
                        stroke="#1A1A1A"
                        strokeWidth={1.5}
                        tick={{ fontSize: 11, fontWeight: 700 }}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(255, 248, 220, 0.7)" }}
                        contentStyle={{
                          border: "2.5px solid #1A1A1A",
                          borderRadius: "0.75rem",
                          boxShadow: "4px 4px 0px #1A1A1A",
                          fontWeight: 700,
                        }}
                        formatter={(value) => [
                          formatCurrency(Number(value ?? 0)),
                          "Nominal",
                        ]}
                        labelFormatter={(_, payload) => {
                          const entry = payload?.[0]
                            ?.payload as BreakdownChartDatum | undefined;

                          return entry
                            ? `${entry.label} (${entry.directionLabel})`
                            : "";
                        }}
                      />
                      <Bar
                        dataKey="amount"
                        radius={[0, 10, 10, 0]}
                        stroke="#1A1A1A"
                        strokeWidth={2}
                      >
                        {data.map((entry) => (
                          <Cell key={entry.id} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getEntryFormDefaults() {
  return {
    direction: "IN" as FinanceDirection,
    categoryId: "",
    amount: "",
    entryDate: new Date().toISOString().slice(0, 10),
    title: "",
    notes: "",
  };
}

function getCategoryFormDefaults() {
  return {
    name: "",
    direction: "IN" as FinanceDirection,
  };
}

export default function FinancePage() {
  const defaultRange = getCurrentMonthRange();
  const { user, loading: loadingUser } = useSessionUser();
  const canAccessFinance =
    user?.role === "ADMIN" || user?.role === "MANAGER";

  const isInitialLoad = useRef(true);
  const [entries, setEntries] = useState<FinanceEntryRecord[]>([]);
  const [summary, setSummary] = useState<FinanceLedgerResponse["summary"] | null>(
    null
  );
  const [sourceBreakdown, setSourceBreakdown] = useState<FinanceBreakdownItem[]>(
    []
  );
  const [categoryBreakdown, setCategoryBreakdown] = useState<
    FinanceBreakdownItem[]
  >([]);
  const [categories, setCategories] = useState<FinanceCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [directionFilter, setDirectionFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
  });
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryPageSize, setCategoryPageSize] = useState(10);

  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [entryMode, setEntryMode] = useState<"create" | "edit">("create");
  const [selectedEntry, setSelectedEntry] = useState<FinanceEntryRecord | null>(
    null
  );
  const [entryForm, setEntryForm] = useState(getEntryFormDefaults());
  const [savingEntry, setSavingEntry] = useState(false);

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<FinanceCategoryRecord | null>(null);
  const [categoryForm, setCategoryForm] = useState(getCategoryFormDefaults());
  const [savingCategory, setSavingCategory] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const manualCategories = useMemo(
    () => categories.filter((category) => !category.isSystem && category.isActive),
    [categories]
  );

  const filteredEntryCategories = useMemo(
    () =>
      manualCategories.filter(
        (category) => category.direction === entryForm.direction
      ),
    [manualCategories, entryForm.direction]
  );

  const fetchCategories = useCallback(async () => {
    if (!canAccessFinance) {
      setLoadingCategories(false);
      return;
    }

    setLoadingCategories(true);
    try {
      const response = await apiFetch<{ data: FinanceCategoryRecord[] }>(
        "/api/finance/categories?includeInactive=true"
      );
      setCategories(response.data);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Gagal memuat kategori";
      toast.error(message);
    } finally {
      setLoadingCategories(false);
    }
  }, [canAccessFinance]);

  const fetchFinance = useCallback(async () => {
    if (!canAccessFinance) {
      setLoading(false);
      setLoadingTable(false);
      return;
    }

    setLoadingTable(true);
    setFetchError(false);

    if (isInitialLoad.current) {
      setLoading(true);
      isInitialLoad.current = false;
    }

    try {
      const params = new URLSearchParams();
      params.set("startDate", startDate);
      params.set("endDate", endDate);
      params.set("page", String(page));
      params.set("limit", String(pageSize));
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (directionFilter !== "ALL") params.set("direction", directionFilter);
      if (sourceFilter !== "ALL") params.set("source", sourceFilter);
      if (categoryFilter !== "ALL") params.set("categoryId", categoryFilter);

      const response = await apiFetch<{ data: FinanceLedgerResponse }>(
        `/api/finance?${params.toString()}`
      );

      setEntries(response.data.entries);
      setSummary(response.data.summary);
      setSourceBreakdown(response.data.sourceBreakdown);
      setCategoryBreakdown(response.data.categoryBreakdown);
      setPagination(response.data.pagination);
    } catch (error) {
      setFetchError(true);
      const message =
        error instanceof ApiError ? error.message : "Gagal memuat ledger keuangan";
      toast.error(message);
    } finally {
      setLoading(false);
      setLoadingTable(false);
    }
  }, [
    canAccessFinance,
    startDate,
    endDate,
    page,
    pageSize,
    debouncedSearch,
    directionFilter,
    sourceFilter,
    categoryFilter,
  ]);

  const paginatedCategories = useMemo(
    () => paginateItems(categories, categoryPage, categoryPageSize),
    [categories, categoryPage, categoryPageSize]
  );

  const sourceBreakdownChartData = useMemo(
    () => buildBreakdownChartData(sourceBreakdown),
    [sourceBreakdown]
  );

  const categoryBreakdownChartData = useMemo(
    () => buildBreakdownChartData(categoryBreakdown),
    [categoryBreakdown]
  );

  useEffect(() => {
    if (!loadingUser) {
      queueMicrotask(() => {
        void fetchCategories();
      });
    }
  }, [loadingUser, fetchCategories]);

  useEffect(() => {
    if (!loadingUser) {
      queueMicrotask(() => {
        void fetchFinance();
      });
    }
  }, [loadingUser, fetchFinance]);

  const openCreateEntryDialog = () => {
    setEntryMode("create");
    setSelectedEntry(null);
    setEntryForm(getEntryFormDefaults());
    setEntryDialogOpen(true);
  };

  const openEditEntryDialog = (entry: FinanceEntryRecord) => {
    setEntryMode("edit");
    setSelectedEntry(entry);
    setEntryForm({
      direction: entry.direction as FinanceDirection,
      categoryId: entry.category.id,
      amount: String(Number(entry.amount)),
      entryDate: new Date(entry.entryDate).toISOString().slice(0, 10),
      title: entry.title,
      notes: entry.notes ?? "",
    });
    setEntryDialogOpen(true);
  };

  const resetCategoryForm = () => {
    setSelectedCategory(null);
    setCategoryForm(getCategoryFormDefaults());
  };

  const openCategoryForEdit = (category: FinanceCategoryRecord) => {
    setSelectedCategory(category);
    setCategoryForm({
      name: category.name,
      direction: category.direction as FinanceDirection,
    });
  };

  const handleSaveEntry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingEntry(true);

    try {
      const payload = {
        direction: entryForm.direction,
        categoryId: entryForm.categoryId,
        amount: Number(entryForm.amount),
        entryDate: entryForm.entryDate,
        title: entryForm.title.trim(),
        notes: entryForm.notes.trim() || null,
        source: "MANUAL" as const,
      };

      if (entryMode === "create") {
        await apiFetch("/api/finance", {
          method: "POST",
          body: payload,
        });
        toast.success("Transaksi manual berhasil ditambahkan");
      } else if (selectedEntry) {
        await apiFetch(`/api/finance/${selectedEntry.id}`, {
          method: "PATCH",
          body: payload,
        });
        toast.success("Transaksi manual berhasil diperbarui");
      }

      setEntryDialogOpen(false);
      setEntryForm(getEntryFormDefaults());
      setSelectedEntry(null);
      await fetchFinance();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Gagal menyimpan transaksi";
      toast.error(message);
    } finally {
      setSavingEntry(false);
    }
  };

  const handleArchiveEntry = async (entry: FinanceEntryRecord) => {
    if (!window.confirm(`Arsipkan transaksi "${entry.title}"?`)) {
      return;
    }

    try {
      await apiFetch(`/api/finance/${entry.id}`, {
        method: "DELETE",
      });
      toast.success("Transaksi manual diarsipkan");
      await fetchFinance();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Gagal mengarsipkan transaksi";
      toast.error(message);
    }
  };

  const handleSaveCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingCategory(true);

    try {
      if (selectedCategory) {
        await apiFetch(`/api/finance/categories/${selectedCategory.id}`, {
          method: "PATCH",
          body: categoryForm,
        });
        toast.success("Kategori berhasil diperbarui");
      } else {
        await apiFetch("/api/finance/categories", {
          method: "POST",
          body: categoryForm,
        });
        toast.success("Kategori berhasil ditambahkan");
      }

      resetCategoryForm();
      await fetchCategories();
      await fetchFinance();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Gagal menyimpan kategori";
      toast.error(message);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeactivateCategory = async (category: FinanceCategoryRecord) => {
    if (!window.confirm(`Nonaktifkan kategori "${category.name}"?`)) {
      return;
    }

    try {
      await apiFetch(`/api/finance/categories/${category.id}`, {
        method: "DELETE",
      });
      toast.success("Kategori berhasil dinonaktifkan");
      if (selectedCategory?.id === category.id) {
        resetCategoryForm();
      }
      await fetchCategories();
      await fetchFinance();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Gagal menonaktifkan kategori";
      toast.error(message);
    }
  };

  if (loadingUser) {
    return (
      <div className="space-y-6 animate-slide-up">
        <PageHeader
          title="Laporan Keuangan"
          description="Menyusun ledger arus kas bisnis"
          icon={CircleDollarSign}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-5">
                <Skeleton className="mb-3 h-4 w-28" />
                <Skeleton className="h-8 w-36" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!canAccessFinance) {
    return (
      <div className="space-y-6 animate-slide-up">
        <PageHeader
          title="Laporan Keuangan"
          description="Akses halaman ini dibatasi untuk admin dan manager"
          icon={CircleDollarSign}
        />
        <Card>
          <EmptyState
            icon={ShieldAlert}
            title="Akses Dibatasi"
            description="Menu laporan keuangan hanya tersedia untuk role Admin dan Manager."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Laporan Keuangan"
        description="Ledger arus kas bisnis dari modal, penjualan, restock, dan biaya operasional"
        icon={CircleDollarSign}
      >
        <Button variant="outline" onClick={() => setCategoryDialogOpen(true)}>
          <Layers3 className="mr-1 h-4 w-4" /> Kelola Kategori
        </Button>
        <Button onClick={openCreateEntryDialog}>
          <Plus className="mr-1 h-4 w-4" /> Tambah Transaksi
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase text-text-muted">
              Saldo Bisnis
            </p>
            {loading || !summary ? (
              <Skeleton className="mt-2 h-8 w-32" />
            ) : (
              <p className="mt-2 text-2xl font-black text-accent-secondary">
                {formatCurrency(summary.businessBalance)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase text-text-muted">
              Total Pemasukan
            </p>
            {loading || !summary ? (
              <Skeleton className="mt-2 h-8 w-32" />
            ) : (
              <p className="mt-2 text-2xl font-black text-accent-success">
                {formatCurrency(summary.totalIncome)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase text-text-muted">
              Total Pengeluaran
            </p>
            {loading || !summary ? (
              <Skeleton className="mt-2 h-8 w-32" />
            ) : (
              <p className="mt-2 text-2xl font-black text-accent-danger">
                {formatCurrency(summary.totalExpense)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase text-text-muted">
              Arus Bersih
            </p>
            {loading || !summary ? (
              <Skeleton className="mt-2 h-8 w-32" />
            ) : (
              <p
                className={`mt-2 text-2xl font-black ${
                  summary.netCashflow >= 0
                    ? "text-accent-primary"
                    : "text-accent-danger"
                }`}
              >
                {formatCurrency(summary.netCashflow)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Ledger</CardTitle>
          <CardDescription>
            Saring periode, arah kas, kategori, dan sumber.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="space-y-1">
            <Label>Dari</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="space-y-1">
            <Label>Sampai</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(event) => {
                setEndDate(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="space-y-1">
            <Label>Arah</Label>
            <SearchableSelect
              value={directionFilter}
              onValueChange={(value) => {
                setDirectionFilter(value);
                setPage(1);
              }}
              placeholder="Semua arah"
              searchPlaceholder="Cari arah..."
              emptyMessage="Arah tidak ditemukan."
              options={[
                { value: "ALL", label: "Semua arah", searchText: "all semua arah" },
                { value: "IN", label: "Pemasukan" },
                { value: "OUT", label: "Pengeluaran" },
              ]}
            />
          </div>
          <div className="space-y-1">
            <Label>Sumber</Label>
            <SearchableSelect
              value={sourceFilter}
              onValueChange={(value) => {
                setSourceFilter(value);
                setPage(1);
              }}
              placeholder="Semua sumber"
              searchPlaceholder="Cari sumber..."
              emptyMessage="Sumber tidak ditemukan."
                options={[
                  { value: "ALL", label: "Semua sumber", searchText: "all semua sumber" },
                  { value: "MANUAL", label: "Manual" },
                  { value: "SALE", label: "Penjualan" },
                  { value: "SALE_VOID", label: "Pembatalan Penjualan" },
                  { value: "RESTOCK", label: "Restock" },
                ]}
              />
          </div>
          <div className="space-y-1">
            <Label>Kategori</Label>
            <SearchableSelect
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value);
                setPage(1);
              }}
              placeholder="Semua kategori"
              searchPlaceholder="Cari kategori..."
              emptyMessage="Kategori tidak ditemukan."
              options={[
                {
                  value: "ALL",
                  label: "Semua kategori",
                  searchText: "semua kategori all",
                },
                ...categories
                  .filter((category) => category.isActive)
                  .map((category) => ({
                    value: category.id,
                    label: category.name,
                  })),
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <BreakdownChartCard
          title="Breakdown Sumber"
          description="Agregasi arus kas berdasarkan sumber entry."
          data={sourceBreakdownChartData}
          loading={loading}
        />
        <BreakdownChartCard
          title="Breakdown Kategori"
          description="Agregasi arus kas berdasarkan kategori aktif."
          data={categoryBreakdownChartData}
          loading={loading}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between space-y-0 p-5 pb-4">
          <div className="space-y-1.5">
            <CardTitle>Ledger Keuangan</CardTitle>
            <CardDescription>
              Histori pemasukan dan pengeluaran bisnis yang sudah terhubung dengan
              penjualan, restock, dan transaksi manual.
            </CardDescription>
          </div>
          <div className="relative w-full lg:w-[360px] shrink-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Cari judul, catatan, invoice..."
              className="pl-10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </CardHeader>
        <div className="neo-table overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr>
                <th className="p-3 text-left">Tanggal</th>
                <th className="p-3 text-left">Judul / Referensi</th>
                <th className="p-3 text-left">Kategori</th>
                <th className="p-3 text-center">Sumber</th>
                <th className="p-3 text-center">Arah</th>
                <th className="p-3 text-right">Nominal</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loadingTable ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index}>
                    <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-56" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-28 rounded-md" /></td>
                    <td className="p-3"><Skeleton className="mx-auto h-5 w-20 rounded-md" /></td>
                    <td className="p-3"><Skeleton className="mx-auto h-5 w-16 rounded-md" /></td>
                    <td className="p-3"><Skeleton className="ml-auto h-4 w-28" /></td>
                    <td className="p-3"><Skeleton className="mx-auto h-5 w-16 rounded-md" /></td>
                    <td className="p-3"><Skeleton className="mx-auto h-8 w-20 rounded-md" /></td>
                  </tr>
                ))
              ) : fetchError ? (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center p-8 text-center text-text-muted">
                      <ShieldAlert className="h-10 w-10 mb-2 text-accent-danger" />
                      <p className="font-bold text-base text-accent-danger">Gagal memuat data ledger</p>
                      <p className="text-sm mt-1 mb-4">Coba lagi.</p>
                      <Button size="sm" variant="outline" onClick={() => void fetchFinance()}>
                        Coba Lagi
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    {debouncedSearch ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center text-text-muted">
                        <CircleDollarSign className="h-10 w-10 mb-2 text-text-muted/60 animate-pulse" />
                        <p className="font-bold text-base text-text-secondary">Tidak ada hasil pencarian</p>
                        <p className="text-sm mt-1">Tidak ada data ledger yang cocok dengan pencarian.</p>
                      </div>
                    ) : (
                      <EmptyState
                        icon={CircleDollarSign}
                        title="Belum Ada Transaksi Keuangan"
                        description="Coba longgarkan filter atau tambahkan transaksi manual untuk mulai mencatat arus kas."
                        actionLabel="Tambah Transaksi"
                        onAction={openCreateEntryDialog}
                      />
                    )}
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const isManual = entry.source === "MANUAL";
                  const direction = entry.direction as FinanceDirection;
                  return (
                    <tr key={entry.id} className="hover:bg-bg-main/50">
                      <td className="p-3 text-xs font-medium text-text-muted">
                        {new Date(entry.entryDate).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-3">
                        <p className="font-bold">{entry.title}</p>
                        <p className="text-xs font-medium text-text-muted">
                          {entry.sale?.invoiceNumber
                            ? `Invoice: ${entry.sale.invoiceNumber}`
                            : entry.productBatch?.batchNumber
                              ? `Batch: ${entry.productBatch.batchNumber}`
                              : entry.notes || "-"}
                        </p>
                      </td>
                      <td className="p-3">
                        <Badge variant={entry.category.isSystem ? "secondary" : "outline"}>
                          {entry.category.name}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={isManual ? "outline" : "warning"}>
                          {SOURCE_LABELS[entry.source as FinanceSource]}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={direction === "IN" ? "success" : "danger"}
                          className="justify-center"
                        >
                          {direction === "IN" ? (
                            <ArrowDownCircle className="mr-1 h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpCircle className="mr-1 h-3.5 w-3.5" />
                          )}
                          {DIRECTION_LABELS[direction]}
                        </Badge>
                      </td>
                      <td
                        className={`p-3 text-right font-black ${
                          direction === "IN"
                            ? "text-accent-success"
                            : "text-accent-danger"
                        }`}
                      >
                        {formatCurrency(Number(entry.amount))}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={isManual ? "outline" : "secondary"}>
                          {isManual ? "Manual" : "Sistem"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          {isManual ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openEditEntryDialog(entry)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleArchiveEntry(entry)}
                                className="text-accent-danger hover:text-accent-danger"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs font-medium text-text-muted">
                              Terkunci
                            </span>
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
        {!loading && pagination.total > 0 && (
          <CardContent>
            <TablePagination
              page={page}
              pageSize={pagination.limit}
              totalItems={pagination.total}
              totalPages={pagination.totalPages}
              itemLabel="entry"
              onPageChange={setPage}
              onPageSizeChange={(nextPageSize) => {
                setPageSize(nextPageSize);
                setPage(1);
              }}
            />
          </CardContent>
        )}
      </Card>

      <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {entryMode === "create"
                ? "Tambah Transaksi Manual"
                : "Edit Transaksi Manual"}
            </DialogTitle>
            <DialogDescription>
              Catat modal masuk, pendapatan lain, biaya operasional, atau pengeluaran lain.
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col h-full overflow-hidden" onSubmit={handleSaveEntry}>
            <DialogBody className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Arah Transaksi</Label>
                  <SearchableSelect
                    value={entryForm.direction}
                    onValueChange={(value) => {
                      const nextDirection = value as FinanceDirection;
                      setEntryForm((current) => ({
                        ...current,
                        direction: nextDirection,
                        categoryId:
                          current.categoryId &&
                          manualCategories.some(
                            (category) =>
                              category.id === current.categoryId &&
                              category.direction === nextDirection
                          )
                            ? current.categoryId
                            : "",
                      }));
                    }}
                    placeholder="Pilih arah transaksi"
                    searchPlaceholder="Cari arah transaksi..."
                    emptyMessage="Arah transaksi tidak ditemukan."
                    options={[
                      { value: "IN", label: "Pemasukan" },
                      { value: "OUT", label: "Pengeluaran" },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal</Label>
                  <Input
                    type="date"
                    value={entryForm.entryDate}
                    onChange={(event) =>
                      setEntryForm((current) => ({
                        ...current,
                        entryDate: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Kategori</Label>
                <SearchableSelect
                  value={entryForm.categoryId}
                  onValueChange={(value) =>
                    setEntryForm((current) => ({ ...current, categoryId: value }))
                  }
                  placeholder="Pilih kategori transaksi"
                  searchPlaceholder="Cari kategori transaksi..."
                  emptyMessage="Kategori transaksi tidak ditemukan."
                  options={filteredEntryCategories.map((category) => ({
                    value: category.id,
                    label: category.name,
                  }))}
                />
                {filteredEntryCategories.length === 0 && (
                  <p className="text-xs font-medium text-text-muted">
                    Belum ada kategori manual aktif untuk arah ini. Tambahkan dulu dari menu kategori.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Judul / Referensi</Label>
                <Input
                  placeholder="Contoh: Modal awal toko"
                  value={entryForm.title}
                  onChange={(event) =>
                    setEntryForm((current) => ({ ...current, title: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Nominal</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="250.000"
                  value={entryForm.amount ? formatNumber(entryForm.amount) : ""}
                  onChange={(event) =>
                    setEntryForm((current) => ({
                      ...current,
                      amount: sanitizeAmountInput(event.target.value),
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Catatan</Label>
                <Textarea
                  placeholder="Tambahkan catatan bila diperlukan"
                  value={entryForm.notes}
                  onChange={(event) =>
                    setEntryForm((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEntryDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={
                  savingEntry ||
                  !entryForm.categoryId ||
                  !entryForm.amount ||
                  !entryForm.title.trim()
                }
              >
                {savingEntry ? "Menyimpan..." : entryMode === "create" ? "Simpan" : "Perbarui"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Kelola Kategori Keuangan</DialogTitle>
            <DialogDescription>
              Kategori sistem terkunci. Tambahkan kategori manual baru sesuai kebutuhan operasional toko.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4 pb-4">

          <form className="space-y-4" onSubmit={handleSaveCategory}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_180px_auto]">
              <div className="space-y-2">
                <Label>Nama Kategori</Label>
                <Input
                  placeholder="Contoh: Biaya listrik"
                  value={categoryForm.name}
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Arah</Label>
                <SearchableSelect
                  value={categoryForm.direction}
                  onValueChange={(value) =>
                    setCategoryForm((current) => ({
                      ...current,
                      direction: value as FinanceDirection,
                    }))
                  }
                  placeholder="Pilih arah"
                  searchPlaceholder="Cari arah..."
                  emptyMessage="Arah tidak ditemukan."
                  options={[
                    { value: "IN", label: "Pemasukan" },
                    { value: "OUT", label: "Pengeluaran" },
                  ]}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  type="submit"
                  disabled={savingCategory || !categoryForm.name.trim()}
                >
                  {savingCategory
                    ? "Menyimpan..."
                    : selectedCategory
                      ? "Update"
                      : "Tambah"}
                </Button>
                {selectedCategory && (
                  <Button type="button" variant="outline" onClick={resetCategoryForm}>
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </form>

          <div className="max-h-[360px] overflow-y-auto rounded-2xl border border-black/10">
            <table className="w-full text-sm">
              <thead className="bg-bg-main/70">
                <tr>
                  <th className="p-3 text-left">Nama</th>
                  <th className="p-3 text-center">Arah</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Tipe</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loadingCategories ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td className="p-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="p-3"><Skeleton className="mx-auto h-5 w-20 rounded-full" /></td>
                      <td className="p-3"><Skeleton className="mx-auto h-5 w-16 rounded-full" /></td>
                      <td className="p-3"><Skeleton className="mx-auto h-5 w-14 rounded-full" /></td>
                      <td className="p-3"><Skeleton className="mx-auto h-8 w-20" /></td>
                    </tr>
                  ))
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-sm font-medium text-text-muted">
                      Belum ada kategori.
                    </td>
                  </tr>
                ) : (
                  paginatedCategories.data.map((category) => (
                    <tr key={category.id} className="border-t border-black/5">
                      <td className="p-3 font-bold">{category.name}</td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={category.direction === "IN" ? "success" : "danger"}
                          className="justify-center"
                        >
                          {category.direction === "IN" ? "Pemasukan" : "Pengeluaran"}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={category.isActive ? "success" : "muted"}>
                          {category.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={category.isSystem ? "secondary" : "outline"}>
                          {category.isSystem ? "Sistem" : "Manual"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          {!category.isSystem && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openCategoryForEdit(category)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {category.isActive && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-accent-danger hover:text-accent-danger"
                                  onClick={() => handleDeactivateCategory(category)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                          {category.isSystem && (
                            <span className="text-xs font-medium text-text-muted">
                              Terkunci
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loadingCategories && categories.length > 0 && (
            <TablePagination
              page={paginatedCategories.pagination.page}
              pageSize={paginatedCategories.pagination.limit}
              totalItems={paginatedCategories.pagination.total}
              totalPages={paginatedCategories.pagination.totalPages}
              itemLabel="kategori"
              className="pt-3"
              onPageChange={setCategoryPage}
              onPageSizeChange={(nextPageSize) => {
                setCategoryPageSize(nextPageSize);
                setCategoryPage(1);
              }}
            />
          )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
