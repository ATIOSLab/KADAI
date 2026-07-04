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
                    <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                  contentStyle={{
                    border: "2.5px solid #1A1A1A",
                    borderRadius: "0.75rem",
                    boxShadow: "4px 4px 0px #1A1A1A",
                    fontWeight: 700,
                  }}
                  formatter={(value) => [formatCurrency(Number(value ?? 0))]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#FF6B35"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#2D6A4F"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                  name="Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
      </div>
    </ChartFrame>
  );
}
