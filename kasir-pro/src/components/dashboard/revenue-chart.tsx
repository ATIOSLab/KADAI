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

interface RevenueChartProps {
  data: RevenueChartData[];
  description: string;
  filter: ReactNode;
  loading?: boolean;
}

function formatAxisCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000_000) {
    const val = value / 1_000_000;
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}jt`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1000)}rb`;
  }
  return String(value);
}

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
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E2E8F0"
                  strokeWidth={1}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fontWeight: 600, fill: "#64748B" }}
                  stroke="#CBD5E1"
                  strokeWidth={1}
                />
                <YAxis
                  tick={{ fontSize: 11, fontWeight: 600, fill: "#64748B" }}
                  stroke="#CBD5E1"
                  strokeWidth={1}
                  tickFormatter={formatAxisCurrency}
                />
                <Tooltip
                  contentStyle={{
                    border: "1px solid #E2E8F0",
                    borderRadius: "0.75rem",
                    boxShadow: "0 10px 25px -5px rgba(2, 6, 23, 0.08)",
                    fontWeight: 600,
                    backgroundColor: "#FFFFFF",
                  }}
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
