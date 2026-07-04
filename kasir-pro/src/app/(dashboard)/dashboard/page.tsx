"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
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
import { CategoryChart } from "@/components/dashboard/category-chart";
import {
  ChartDateRangeFilter,
  ChartWeekFilter,
} from "@/components/dashboard/chart-date-filter";
import { HourlyChart } from "@/components/dashboard/hourly-chart";
import { HppRevenueChart } from "@/components/dashboard/hpp-revenue-chart";
import { PaymentChart } from "@/components/dashboard/payment-chart";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TopProductsChart } from "@/components/dashboard/top-products-chart";
import { Button } from "@/components/ui/button";
import { PackagePlus, ScanLine, Warehouse } from "lucide-react";
import type { DashboardOverview, DashboardSummary } from "@/types";

type OverviewCharts = DashboardOverview["charts"];
type ChartKey = keyof OverviewCharts;

function useDashboardChart<K extends ChartKey>(
  chartKey: K,
  range: DashboardDateRange
) {
  const [data, setData] = useState<OverviewCharts[K]>([] as OverviewCharts[K]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadChart() {
      if (!range.startDate || !range.endDate) {
        setData([] as OverviewCharts[K]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const params = new URLSearchParams({
          startDate: range.startDate,
          endDate: range.endDate,
        });

        const response = await apiFetch<{ data: DashboardOverview }>(
          `/api/dashboard/overview?${params.toString()}`
        );

        if (!cancelled) {
          setData(response.data.charts[chartKey]);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof ApiError
              ? error.message
              : "Gagal memuat chart dashboard";
          toast.error(message);
          setData([] as OverviewCharts[K]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadChart();

    return () => {
      cancelled = true;
    };
  }, [chartKey, range.endDate, range.startDate]);

  return { data, loading };
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [revenueRange, setRevenueRange] = useState<DashboardDateRange>(
    getCurrentWeekRange()
  );
  const [paymentRange, setPaymentRange] = useState<DashboardDateRange>(
    getDefaultDashboardRange()
  );
  const [topProductsRange, setTopProductsRange] = useState<DashboardDateRange>(
    getDefaultDashboardRange()
  );
  const [categoryRange, setCategoryRange] = useState<DashboardDateRange>(
    getDefaultDashboardRange()
  );
  const [hppRange, setHppRange] = useState<DashboardDateRange>(
    getCurrentWeekRange()
  );
  const [hourlyRange, setHourlyRange] = useState<DashboardDateRange>(
    getDefaultDashboardRange()
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      setSummaryLoading(true);

      try {
        const response = await apiFetch<{ data: DashboardSummary }>(
          "/api/dashboard/summary"
        );

        if (!cancelled) {
          setSummary(response.data);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof ApiError
              ? error.message
              : "Gagal memuat ringkasan dashboard";
          toast.error(message);
          setSummary(null);
        }
      } finally {
        if (!cancelled) {
          setSummaryLoading(false);
        }
      }
    }

    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  const revenueChart = useDashboardChart("revenueTrend", revenueRange);
  const paymentChart = useDashboardChart("paymentDistribution", paymentRange);
  const topProductsChart = useDashboardChart("topProducts", topProductsRange);
  const categoryChart = useDashboardChart("categorySales", categoryRange);
  const hppChart = useDashboardChart("hppVsRevenue", hppRange);
  const hourlyChart = useDashboardChart("hourlySales", hourlyRange);

  const updateOpenRange = (
    currentRange: DashboardDateRange,
    field: "startDate" | "endDate",
    value: string,
    setter: (value: DashboardDateRange) => void
  ) => {
    const nextRange =
      field === "startDate"
        ? createDateRange(value, currentRange.endDate)
        : createDateRange(currentRange.startDate, value);

    if (nextRange.startDate > nextRange.endDate) {
      setter(
        field === "startDate"
          ? createDateRange(value, value)
          : createDateRange(value, value)
      );
      return;
    }

    setter(nextRange);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ringkasan transaksi, stok, dan performa penjualan hari ini.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/products/new">
              <PackagePlus className="mr-1 size-4" />
              Produk
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/inventory/restock">
              <Warehouse className="mr-1 size-4" />
              Restock
            </Link>
          </Button>
          <Button asChild>
            <Link href="/pos">
              <ScanLine className="mr-1 size-4" />
              Kasir
            </Link>
          </Button>
        </div>
      </div>

      <SummaryCards data={summary ?? undefined} loading={summaryLoading} />

      <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <RevenueChart
            data={revenueChart.data}
            description={`Trend penjualan mingguan untuk periode ${formatDashboardDateRange(
              revenueRange
            )}. Pilihan tanggal otomatis mengikuti minggu Senin-Minggu.`}
            filter={
              <ChartWeekFilter
                anchorDate={getWeekAnchorDate(revenueRange)}
                startDate={revenueRange.startDate}
                endDate={revenueRange.endDate}
                onAnchorDateChange={(value) => setRevenueRange(getWeekRangeFromDate(value))}
              />
            }
            loading={revenueChart.loading}
          />
        </div>
        <div className="xl:col-span-4">
          <PaymentChart
            data={paymentChart.data}
            description={`Distribusi metode pembayaran berdasarkan transaksi dari ${formatDashboardDateRange(
              paymentRange
            )}.`}
            filter={
              <ChartDateRangeFilter
                startDate={paymentRange.startDate}
                endDate={paymentRange.endDate}
                onStartDateChange={(value) =>
                  updateOpenRange(paymentRange, "startDate", value, setPaymentRange)
                }
                onEndDateChange={(value) =>
                  updateOpenRange(paymentRange, "endDate", value, setPaymentRange)
                }
              />
            }
            loading={paymentChart.loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
        <TopProductsChart
          data={topProductsChart.data}
          description={`Top 10 produk berdasarkan jumlah unit terjual pada periode ${formatDashboardDateRange(
            topProductsRange
          )}.`}
          filter={
            <ChartDateRangeFilter
              startDate={topProductsRange.startDate}
              endDate={topProductsRange.endDate}
              onStartDateChange={(value) =>
                updateOpenRange(
                  topProductsRange,
                  "startDate",
                  value,
                  setTopProductsRange
                )
              }
              onEndDateChange={(value) =>
                updateOpenRange(
                  topProductsRange,
                  "endDate",
                  value,
                  setTopProductsRange
                )
              }
            />
          }
          loading={topProductsChart.loading}
        />
        <CategoryChart
          data={categoryChart.data}
          description={`Akumulasi penjualan per kategori berdasarkan data ${formatDashboardDateRange(
            categoryRange
          )}.`}
          filter={
            <ChartDateRangeFilter
              startDate={categoryRange.startDate}
              endDate={categoryRange.endDate}
              onStartDateChange={(value) =>
                updateOpenRange(categoryRange, "startDate", value, setCategoryRange)
              }
              onEndDateChange={(value) =>
                updateOpenRange(categoryRange, "endDate", value, setCategoryRange)
              }
            />
          }
          loading={categoryChart.loading}
        />
      </div>

      <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <HppRevenueChart
            data={hppChart.data}
            description={`Perbandingan HPP dan revenue mingguan untuk periode ${formatDashboardDateRange(
              hppRange
            )}. Pilihan tanggal otomatis mengikuti minggu Senin-Minggu.`}
            filter={
              <ChartWeekFilter
                anchorDate={getWeekAnchorDate(hppRange)}
                startDate={hppRange.startDate}
                endDate={hppRange.endDate}
                onAnchorDateChange={(value) => setHppRange(getWeekRangeFromDate(value))}
              />
            }
            loading={hppChart.loading}
          />
        </div>
        <div className="xl:col-span-4">
          <HourlyChart
            data={hourlyChart.data}
            description={`Sebaran transaksi per jam berdasarkan data ${formatDashboardDateRange(
              hourlyRange
            )}.`}
            filter={
              <ChartDateRangeFilter
                startDate={hourlyRange.startDate}
                endDate={hourlyRange.endDate}
                onStartDateChange={(value) =>
                  updateOpenRange(hourlyRange, "startDate", value, setHourlyRange)
                }
                onEndDateChange={(value) =>
                  updateOpenRange(hourlyRange, "endDate", value, setHourlyRange)
                }
              />
            }
            loading={hourlyChart.loading}
          />
        </div>
      </div>
    </div>
  );
}
