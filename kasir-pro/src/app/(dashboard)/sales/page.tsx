"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TablePagination } from "@/components/shared/table-pagination";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { apiFetch, ApiError } from "@/lib/api";
import { useSessionUser } from "@/hooks/use-session-user";
import {
  Receipt,
  Search,
  Eye,
} from "lucide-react";
import Link from "next/link";

const paymentLabels: Record<string, string> = {
  CASH: "Tunai",
  QRIS: "QRIS",
  BANK_TRANSFER: "Transfer",
  E_WALLET: "E-Wallet",
};

interface SaleItem {
  id: string;
  invoiceNumber: string;
  customerName: string | null;
  totalAmount: number;
  paymentType: string;
  isVoided: boolean;
  createdAt: string;
  cashier: { name: string } | null;
  items: { id: string }[];
}

interface PaginatedSales {
  data: SaleItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function SalesPage() {
  const { user } = useSessionUser();
  const [sales, setSales] = useState<SaleItem[]>([]);
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    async function loadSales() {
      if (!cancelled) {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        params.set("page", String(page));
        params.set("limit", String(pageSize));

        const res = await apiFetch<PaginatedSales>(
          `/api/sales?${params.toString()}`
        );

        if (!cancelled) {
          setSales(res.data);
          setPagination(res.pagination);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiError ? err.message : "Gagal memuat data penjualan";
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSales();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, page, pageSize]);

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Penjualan"
        description={
          user?.role === "CASHIER"
            ? "Riwayat transaksi Anda"
            : "Riwayat semua transaksi"
        }
        icon={Receipt}
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <Input
          placeholder="Cari invoice atau pelanggan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <div className="neo-table overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-3">Invoice</th>
                <th className="text-left p-3">Pelanggan</th>
                <th className="text-right p-3">Total</th>
                <th className="text-center p-3">Item</th>
                <th className="text-center p-3">Pembayaran</th>
                <th className="text-center p-3">Status</th>
                <th className="text-left p-3">Waktu</th>
                <th className="text-center p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-${i}`}>
                    <td className="p-3"><Skeleton className="h-4 w-36" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="p-3 text-right"><Skeleton className="h-4 w-24 ml-auto" /></td>
                    <td className="p-3 text-center"><Skeleton className="h-4 w-8 mx-auto" /></td>
                    <td className="p-3 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-md" /></td>
                    <td className="p-3 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-md" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="p-3 text-center"><Skeleton className="h-8 w-8 mx-auto" /></td>
                  </tr>
                ))
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={Receipt}
                      title="Belum Ada Transaksi"
                      description="Buat transaksi pertama melalui menu Kasir"
                    />
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-bg-main/50 transition-colors">
                    <td className="p-3 font-mono text-xs font-bold">
                      {sale.invoiceNumber}
                    </td>
                    <td className="p-3">
                      {sale.customerName || (
                        <span className="text-text-muted">Umum</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-bold">
                      {formatCurrency(Number(sale.totalAmount))}
                    </td>
                    <td className="p-3 text-center">{sale.items.length}</td>
                    <td className="p-3 text-center">
                      <Badge variant="outline">
                        {paymentLabels[sale.paymentType] || sale.paymentType}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      {sale.isVoided ? (
                        <Badge variant="danger">Dibatalkan</Badge>
                      ) : (
                        <Badge variant="success">Selesai</Badge>
                      )}
                    </td>
                    <td className="p-3 text-xs text-text-muted">
                      {new Date(sale.createdAt).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        asChild
                      >
                        <Link href={`/sales/${sale.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
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
          itemLabel="transaksi"
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
