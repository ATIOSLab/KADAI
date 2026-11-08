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
import { KADAI_CHART_THEME } from "@/lib/chart-theme";

interface HppRevenueChartProps {
  data: HppRevenueData[];
  description: string;
  filter: ReactNode;
  loading?: boolean;
}

const formatAxisCurrency = KADAI_CHART_THEME.formatAxisCurrency;

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
                <CartesianGrid {...KADAI_CHART_THEME.gridProps} />
                <XAxis
                  dataKey="period"
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
