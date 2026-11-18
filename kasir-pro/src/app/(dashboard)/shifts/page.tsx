"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Printer, RefreshCw, Wallet } from "lucide-react";

interface ShiftRow {
  id: string;
  number: string | null;
  cashier: { id: string; name: string } | null;
  openedAt: string;
  closedAt: string | null;
  openingCash: number;
  closingCash: number | null;
  expectedCash: number | null;
  variance: number | null;
  varianceStatus: "BALANCED" | "SHORT" | "OVER" | "OPEN";
  totalSales: number;
  totalVoided: number;
  totalRevenue: number;
  totalCashSales: number;
  totalRefunds: number;
  totalDiscount: number;
}

interface HistoryPayload {
  data: {
    shifts: ShiftRow[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    summary: {
      shiftCount: number;
      varianceTotal: number;
      revenueTotal: number;
      cashSalesTotal: number;
      refundsTotal: number;
      discountTotal: number;
      transactionCount: number;
    };
  };
}

const STATUS_LABEL: Record<ShiftRow["varianceStatus"], string> = {
  BALANCED: "Kas sesuai",
  SHORT: "Kas kurang",
  OVER: "Kas lebih",
  OPEN: "Masih buka",
};

const STATUS_CLASS: Record<ShiftRow["varianceStatus"], string> = {
  BALANCED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  SHORT: "bg-rose-100 text-rose-800 border-rose-200",
  OVER: "bg-amber-100 text-amber-800 border-amber-200",
  OPEN: "bg-slate-100 text-slate-700 border-slate-200",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonthIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ShiftHistoryPage() {
  const [rows, setRows] = useState<ShiftRow[]>([]);
  const [summary, setSummary] = useState<HistoryPayload["data"]["summary"] | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [from, setFrom] = useState(firstOfMonthIso());
  const [to, setTo] = useState(todayIso());
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          from,
          to,
          page: String(page),
          limit: String(pagination.limit),
        });
        const res = await apiFetch<HistoryPayload>(`/api/pos/shifts/history?${params}`);
        setRows(res.data.shifts);
        setSummary(res.data.summary);
        setPagination(res.data.pagination);
      } catch {
        toast.error("Gagal memuat riwayat shift kasir");
      } finally {
        setLoading(false);
      }
    },
    [from, to, pagination.limit]
  );

  useEffect(() => {
    void fetchHistory(1);
    // Rentang tanggal berubah → kembali ke halaman pertama.
  }, [from, to]); // eslint-disable-line react-hooks/exhaustive-deps

  const printReport = async (shiftId: string) => {
    try {
      const res = await apiFetch<{ data: Record<string, unknown> }>(`/api/pos/shifts/${shiftId}`);
      const report = res.data as {
        store?: { name?: string };
        cashier?: { name?: string };
        shift?: { openedAt?: string; closedAt?: string; number?: string | null; openingCash?: number; closingCash?: number; variance?: number };
        expectedCash?: number;
        totalTransactions?: number;
        totalVoided?: number;
        totalRevenue?: number;
        totalCashSales?: number;
        totalCashRefunds?: number;
        totalDiscount?: number;
        salesByPayment?: Record<string, { count: number; total: number }>;
      };

      const win = window.open("", "_blank", "width=420,height=640");
      if (!win) {
        toast.error("Popup diblokir browser. Izinkan popup untuk mencetak.");
        return;
      }
      const line = (label: string, value: string) =>
        `<div class="row"><span>${label}</span><span>${value}</span></div>`;
      win.document.write(`<!doctype html><html><head><meta charset="utf-8">
        <title>Z-Report</title>
        <style>
          body{font-family:ui-monospace,Menlo,monospace;font-size:12px;padding:16px;color:#111}
          h1{font-size:14px;text-align:center;margin:0 0 2px}
          .sub{text-align:center;font-size:11px;color:#555;margin-bottom:10px}
          .row{display:flex;justify-content:space-between;padding:2px 0}
          .sep{border-top:1px dashed #999;margin:8px 0}
          .total{font-weight:700}
        </style></head><body>
        <h1>Z-REPORT ${report.shift?.number ? `— ${report.shift.number}` : ""}</h1>
        <div class="sub">${report.store?.name ?? "KADAI"} · ${report.cashier?.name ?? "-"}</div>
        ${line("Buka shift", formatDateTime(report.shift?.openedAt ?? null))}
        ${line("Tutup shift", formatDateTime(report.shift?.closedAt ?? null))}
        <div class="sep"></div>
        ${line("Transaksi", String(report.totalTransactions ?? 0))}
        ${line("Dibatalkan", String(report.totalVoided ?? 0))}
        ${line("Diskon", formatCurrency(Number(report.totalDiscount ?? 0)))}
        <div class="sep"></div>
        ${line("Omzet", formatCurrency(Number(report.totalRevenue ?? 0)))}
        ${line("Tunai masuk", formatCurrency(Number(report.totalCashSales ?? 0)))}
        ${line("Refund tunai", formatCurrency(Number(report.totalCashRefunds ?? 0)))}
        <div class="sep"></div>
        ${line("Modal awal", formatCurrency(Number(report.shift?.openingCash ?? 0)))}
        ${line("Kas diharapkan", formatCurrency(Number(report.expectedCash ?? 0)))}
        ${line("Kas fisik", formatCurrency(Number(report.shift?.closingCash ?? 0)))}
        ${line("Selisih", formatCurrency(Number(report.shift?.variance ?? 0)))}
        <div class="sep"></div>
        ${Object.entries(report.salesByPayment ?? {})
          .map(([type, value]) => line(type, `${value.count}x · ${formatCurrency(value.total)}`))
          .join("")}
        <script>window.onload=()=>window.print()</script>
        </body></html>`);
      win.document.close();
    } catch {
      toast.error("Gagal memuat Z-Report");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Shift & Rekonsiliasi Kas"
        description="Riwayat laci kasir: modal awal, kas fisik saat tutup, selisih, dan Z-Report yang bisa dicetak ulang."
      />

      <Card className="p-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Dari tanggal</Label>
            <Input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="h-9 w-40"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Sampai tanggal</Label>
            <Input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="h-9 w-40"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => void fetchHistory(pagination.page)}
            disabled={loading}
          >
            <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
            Muat ulang
          </Button>
        </div>
      </Card>

      {summary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Shift ditutup
            </p>
            <p className="text-xl font-black tabular-nums">{summary.shiftCount}</p>
          </Card>
          <Card className="p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Total transaksi
            </p>
            <p className="text-xl font-black tabular-nums">{summary.transactionCount}</p>
          </Card>
          <Card className="p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Omzet tercatat
            </p>
            <p className="text-xl font-black tabular-nums">
              {formatCurrency(summary.revenueTotal)}
            </p>
          </Card>
          <Card className="p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Akumulasi selisih kas
            </p>
            <p
              className={
                summary.varianceTotal === 0
                  ? "text-xl font-black tabular-nums text-emerald-600"
                  : summary.varianceTotal < 0
                    ? "text-xl font-black tabular-nums text-rose-600"
                    : "text-xl font-black tabular-nums text-amber-600"
              }
            >
              {summary.varianceTotal > 0 ? "+" : ""}
              {formatCurrency(summary.varianceTotal)}
            </p>
          </Card>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-bold">No. Z</th>
                <th className="px-3 py-2 font-bold">Kasir</th>
                <th className="px-3 py-2 font-bold">Buka</th>
                <th className="px-3 py-2 font-bold">Tutup</th>
                <th className="px-3 py-2 text-right font-bold">Trx</th>
                <th className="px-3 py-2 text-right font-bold">Omzet</th>
                <th className="px-3 py-2 text-right font-bold">Modal</th>
                <th className="px-3 py-2 text-right font-bold">Diharapkan</th>
                <th className="px-3 py-2 text-right font-bold">Fisik</th>
                <th className="px-3 py-2 text-right font-bold">Selisih</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-6">
                    <Skeleton className="h-6 w-full" />
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-10 text-center text-muted-foreground">
                    <Wallet className="mx-auto mb-2 size-6 opacity-40" />
                    Belum ada shift tertutup pada rentang ini.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono text-[11px] whitespace-nowrap">
                    {row.number ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-semibold">{row.cashier?.name ?? "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                    {formatDateTime(row.openedAt)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                    {formatDateTime(row.closedAt)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.totalSales}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatCurrency(row.totalRevenue)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatCurrency(row.openingCash)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatCurrency(row.expectedCash ?? 0)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatCurrency(row.closingCash ?? 0)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Badge variant="outline" className={STATUS_CLASS[row.varianceStatus]}>
                      {row.variance === null ? "—" : formatCurrency(row.variance)} ·{" "}
                      {STATUS_LABEL[row.varianceStatus]}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => void printReport(row.id)}
                      title="Cetak ulang Z-Report"
                    >
                      <Printer className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-xs">
            <span className="text-muted-foreground">
              Halaman {pagination.page} dari {pagination.totalPages} · {pagination.total} shift
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                disabled={pagination.page <= 1 || loading}
                onClick={() => void fetchHistory(pagination.page - 1)}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => void fetchHistory(pagination.page + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}