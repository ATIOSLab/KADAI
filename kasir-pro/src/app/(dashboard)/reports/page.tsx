"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { ChartDateRangeFilter, ChartWeekFilter } from "@/components/dashboard/chart-date-filter";
import { ChartFrame } from "@/components/dashboard/chart-frame";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { apiFetch, ApiError } from "@/lib/api";
import {
  createDateRange,
  formatDashboardDateRange,
  getCurrentWeekRange,
  getDefaultDashboardRange,
  getWeekAnchorDate,
  getWeekRangeFromDate,
  type DashboardDateRange,
} from "@/lib/dashboard-periods";
import { BarChart3 } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const tooltipStyle = {
  border: "2.5px solid #1A1A1A",
  borderRadius: "0.75rem",
  boxShadow: "4px 4px 0px #1A1A1A",
  fontWeight: 700,
};

interface ReportData {
  meta: {
    range: DashboardDateRange;
    week: DashboardDateRange;
  };
  kpi: {
    totalRevenue: number;
    totalHpp: number;
    totalProfit: number;
    margin: string;
  };
  revenueTrend: { date: string; revenue: number; profit: number; hpp: number }[];
  categoryDistribution: { name: string; value: number; color: string }[];
  topProducts: { name: string; qty: number; revenue: number }[];
  paymentDistribution: { name: string; value: number; color: string }[];
  hourlyDistribution: { hour: string; transactions: number }[];
}

function KPILoading() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-4 text-center">
            <Skeleton className="mx-auto mb-2 h-3 w-20" />
            <Skeleton className="mx-auto h-7 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartLoading({ tall = false }: { tall?: boolean }) {
  return (
    <ChartFrame
      title=""
      description=""
      filter={null}
    >
      <Skeleton className={tall ? "h-[350px] w-full" : "h-[300px] w-full"} />
    </ChartFrame>
  );
}

function updateOpenRange(
  currentRange: DashboardDateRange,
  field: "startDate" | "endDate",
  value: string
) {
  const nextRange =
    field === "startDate"
      ? createDateRange(value, currentRange.endDate)
      : createDateRange(currentRange.startDate, value);

  if (nextRange.startDate > nextRange.endDate) {
    return createDateRange(value, value);
  }

  return nextRange;
}

export default function ReportsPage() {
  const [reportRange, setReportRange] = useState<DashboardDateRange>(
    getDefaultDashboardRange()
  );
  const [weekRange, setWeekRange] = useState<DashboardDateRange>(
    getCurrentWeekRange()
  );
  const [report, setReport] = useState<ReportData | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    startTransition(async () => {
      try {
        const params = new URLSearchParams();
        params.set("startDate", reportRange.startDate);
        params.set("endDate", reportRange.endDate);
        params.set("weekDate", getWeekAnchorDate(weekRange));

        const response = await apiFetch<{ data: ReportData }>(
          `/api/reports?${params.toString()}`
        );

        if (!cancelled) {
          setReport(response.data);
          setReportRange(response.data.meta.range);
          setWeekRange(response.data.meta.week);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof ApiError ? error.message : "Gagal memuat data laporan";
          toast.error(message);
          setReport(null);
        }
      } finally {
        if (!cancelled) {
          setHasLoaded(true);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [reportRange.endDate, reportRange.startDate, weekRange.startDate]);

  const loading = isPending || !hasLoaded;
  const rangeLabel = useMemo(
    () => formatDashboardDateRange(report?.meta.range ?? reportRange),
    [report?.meta.range, reportRange]
  );
  const weekLabel = useMemo(
    () => formatDashboardDateRange(report?.meta.week ?? weekRange),
    [report?.meta.week, weekRange]
  );

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Laporan"
        description="Analisis penjualan & profitabilitas"
        icon={BarChart3}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-text-muted">
              Periode Laporan
            </p>
            <p className="mt-1 text-sm font-medium text-text-muted">
              Mengatur KPI, distribusi kategori, top produk, metode pembayaran, dan pola jam sibuk.
            </p>
            <div className="mt-4">
              <ChartDateRangeFilter
                startDate={reportRange.startDate}
                endDate={reportRange.endDate}
                onStartDateChange={(value) =>
                  setReportRange(updateOpenRange(reportRange, "startDate", value))
                }
                onEndDateChange={(value) =>
                  setReportRange(updateOpenRange(reportRange, "endDate", value))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-text-muted">
              Periode Mingguan
            </p>
            <p className="mt-1 text-sm font-medium text-text-muted">
              Mengatur chart mingguan Revenue vs HPP vs Profit dengan rentang otomatis Senin-Minggu.
            </p>
            <div className="mt-4">
              <ChartWeekFilter
                anchorDate={getWeekAnchorDate(weekRange)}
                startDate={weekRange.startDate}
                endDate={weekRange.endDate}
                onAnchorDateChange={(value) => setWeekRange(getWeekRangeFromDate(value))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <>
          <KPILoading />
          <ChartLoading />
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
            <ChartLoading tall />
            <ChartLoading tall />
          </div>
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
            <ChartLoading />
            <ChartLoading />
          </div>
        </>
      ) : !report ? (
        <Card className="p-12 text-center">
          <p className="font-bold text-text-muted">Gagal memuat laporan</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs font-bold uppercase text-text-muted">
                  Total Revenue
                </p>
                <p className="text-xl font-black text-accent-primary">
                  {formatCurrency(report.kpi.totalRevenue)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs font-bold uppercase text-text-muted">
                  Total HPP
                </p>
                <p className="text-xl font-black text-accent-danger">
                  {formatCurrency(report.kpi.totalHpp)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs font-bold uppercase text-text-muted">
                  Gross Profit
                </p>
                <p className="text-xl font-black text-accent-success">
                  {formatCurrency(report.kpi.totalProfit)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs font-bold uppercase text-text-muted">
                  Margin
                </p>
                <p className="text-xl font-black">{report.kpi.margin}%</p>
              </CardContent>
            </Card>
          </div>

          <ChartFrame
            title="Revenue vs HPP vs Profit"
            description={`Trend mingguan untuk periode ${weekLabel}. Pilihan tanggal minggu otomatis mengikuti rentang Senin-Minggu.`}
          >
            <div className="h-[300px]">
              {report.revenueTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.revenueTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#E5E5E5"
                      strokeWidth={1.5}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fontWeight: 700 }}
                      stroke="#1A1A1A"
                      strokeWidth={2}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fontWeight: 600 }}
                      stroke="#1A1A1A"
                      strokeWidth={2}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => [formatCurrency(Number(value ?? 0))]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#FF6B35"
                      strokeWidth={3}
                      fill="#FF6B3520"
                    />
                    <Area
                      type="monotone"
                      dataKey="hpp"
                      name="HPP"
                      stroke="#D62828"
                      strokeWidth={2}
                      fill="#D6282810"
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      name="Profit"
                      stroke="#2D6A4F"
                      strokeWidth={2}
                      fill="#2D6A4F10"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-text-muted">
                  <p className="font-bold">Tidak ada data penjualan dalam minggu ini</p>
                </div>
              )}
            </div>
          </ChartFrame>

          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
            <ChartFrame
              title="Distribusi Kategori"
              description={`Distribusi penjualan kategori berdasarkan data ${rangeLabel}.`}
            >
              <div className="h-[300px]">
                {report.categoryDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={report.categoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="#1A1A1A"
                        strokeWidth={2.5}
                      >
                        {report.categoryDistribution.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value) => [formatCurrency(Number(value ?? 0))]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 12, fontWeight: 700 }}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-text-muted">
                    <p className="font-bold">Tidak ada data</p>
                  </div>
                )}
              </div>
            </ChartFrame>

            <ChartFrame
              title="Top 5 Produk"
              description={`Produk terlaris berdasarkan performa penjualan pada periode ${rangeLabel}.`}
            >
              <div className="h-[300px]">
                {report.topProducts.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={report.topProducts}
                      layout="vertical"
                      margin={{ left: 8, right: 16 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#E5E5E5"
                        strokeWidth={1.5}
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fontWeight: 600 }}
                        stroke="#1A1A1A"
                        strokeWidth={2}
                        tickFormatter={(value) =>
                          `${(Number(value ?? 0) / 1000000).toFixed(1)}jt`
                        }
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 11, fontWeight: 700 }}
                        stroke="#1A1A1A"
                        strokeWidth={2}
                        width={150}
                        tickFormatter={(value: string) =>
                          value.length > 22 ? `${value.slice(0, 22)}...` : value
                        }
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value) => [formatCurrency(Number(value ?? 0))]}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="#004E89"
                        radius={[0, 6, 6, 0]}
                        stroke="#1A1A1A"
                        strokeWidth={1.5}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-text-muted">
                    <p className="font-bold">Tidak ada data</p>
                  </div>
                )}
              </div>
            </ChartFrame>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
            <ChartFrame
              title="Metode Pembayaran"
              description={`Distribusi metode pembayaran berdasarkan transaksi dari ${rangeLabel}.`}
            >
              <div className="h-[300px]">
                {report.paymentDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={report.paymentDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="#1A1A1A"
                        strokeWidth={2.5}
                      >
                        {report.paymentDistribution.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value) => [formatCurrency(Number(value ?? 0))]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 12, fontWeight: 700 }}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-text-muted">
                    <p className="font-bold">Tidak ada data</p>
                  </div>
                )}
              </div>
            </ChartFrame>

            <ChartFrame
              title="Distribusi Per Jam"
              description={`Sebaran transaksi per jam berdasarkan data ${rangeLabel}.`}
            >
              <div className="h-[300px]">
                {report.hourlyDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.hourlyDistribution}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#E5E5E5"
                        strokeWidth={1.5}
                      />
                      <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 10, fontWeight: 600 }}
                        stroke="#1A1A1A"
                        strokeWidth={2}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fontWeight: 600 }}
                        stroke="#1A1A1A"
                        strokeWidth={2}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value) => [`${Number(value ?? 0)} transaksi`]}
                      />
                      <Bar
                        dataKey="transactions"
                        fill="#FF6B35"
                        radius={[6, 6, 0, 0]}
                        stroke="#1A1A1A"
                        strokeWidth={1.5}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-text-muted">
                    <p className="font-bold">Tidak ada data</p>
                  </div>
                )}
              </div>
            </ChartFrame>
          </div>
        </>
      )}
    </div>
  );
}
