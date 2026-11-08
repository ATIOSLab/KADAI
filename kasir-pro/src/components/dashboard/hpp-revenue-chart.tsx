"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartFrame } from "@/components/dashboard/chart-frame";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { HppRevenueData } from "@/types";

interface HppRevenueChartProps {
  data: HppRevenueData[];
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

export function HppRevenueChart({
  data,
  description,
  filter,
  loading = false,
}: HppRevenueChartProps) {
  return (
    <ChartFrame
      title="HPP vs Revenue"
      description={description}
      filter={filter}
    >
      <div className="flex-1 min-h-[300px] w-full">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E2E8F0"
                  strokeWidth={1}
                />
                <XAxis
                  dataKey="period"
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
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                <Bar
                  dataKey="hpp"
                  name="HPP"
                  fill="#94A3B8"
                  radius={[4, 4, 0, 0]}
                  stackId="a"
                />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#EA580C"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
      </div>
    </ChartFrame>
  );
}
