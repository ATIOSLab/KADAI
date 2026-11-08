"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartFrame } from "@/components/dashboard/chart-frame";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { RevenueChartData } from "@/types";
import { KADAI_CHART_THEME } from "@/lib/chart-theme";

interface RevenueChartProps {
  data: RevenueChartData[];
  description: string;
  filter: ReactNode;
  loading?: boolean;
}

const formatAxisCurrency = KADAI_CHART_THEME.formatAxisCurrency;

export function RevenueChart({
  data,
  description,
  filter,
  loading = false,
}: RevenueChartProps) {
  return (
    <ChartFrame
      title="Trend Penjualan"
      description={description}
      filter={filter}
    >
      <div className="flex-1 min-h-[300px] w-full">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EA580C" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#EA580C" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FB923C" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#FB923C" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...KADAI_CHART_THEME.gridProps} />
                <XAxis
                  dataKey="date"
                  {...KADAI_CHART_THEME.xAxisProps}
                />
                <YAxis
                  {...KADAI_CHART_THEME.yAxisProps}
                  tickFormatter={formatAxisCurrency}
                />
                <Tooltip
                  contentStyle={KADAI_CHART_THEME.tooltipStyle}
                  formatter={(value) => [formatCurrency(Number(value ?? 0))]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#EA580C"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#FB923C"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                  name="Gross Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
      </div>
    </ChartFrame>
  );
}
