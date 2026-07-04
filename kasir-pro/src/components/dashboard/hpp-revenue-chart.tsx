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
                  stroke="#E5E5E5"
                  strokeWidth={1.5}
                />
                <XAxis
                  dataKey="period"
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
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                <Bar
                  dataKey="hpp"
                  name="HPP"
                  fill="#D62828"
                  radius={[4, 4, 0, 0]}
                  stroke="#1A1A1A"
                  strokeWidth={1.5}
                  stackId="a"
                />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#2D6A4F"
                  radius={[4, 4, 0, 0]}
                  stroke="#1A1A1A"
                  strokeWidth={1.5}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
      </div>
    </ChartFrame>
  );
}
