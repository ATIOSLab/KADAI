"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartFrame } from "@/components/dashboard/chart-frame";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { TopProductData } from "@/types";
import { KADAI_CHART_THEME } from "@/lib/chart-theme";

interface TopProductsChartProps {
  data: TopProductData[];
  description: string;
  filter: ReactNode;
  loading?: boolean;
}

export function TopProductsChart({
  data,
  description,
  filter,
  loading = false,
}: TopProductsChartProps) {
  return (
    <ChartFrame
      title="Top 10 Produk Terlaris"
      description={description}
      filter={filter}
    >
      <div className="flex-1 min-h-[350px] w-full">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E2E8F0"
                  strokeWidth={1}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fontWeight: 600, fill: "#64748B" }}
                  stroke="#CBD5E1"
                  strokeWidth={1}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11, fontWeight: 600, fill: "#334155" }}
                  stroke="#CBD5E1"
                  strokeWidth={1}
                  width={170}
                  tickFormatter={(value: string) =>
                    value.length > 26 ? `${value.slice(0, 26)}...` : value
                  }
                />
                <Tooltip
                  contentStyle={KADAI_CHART_THEME.tooltipStyle}
                  formatter={(value: any, name: any) => [
                    name === "totalRevenue"
                      ? formatCurrency(Number(value) || 0)
                      : `${Number(value) || 0} unit`,
                    name === "totalRevenue" ? "Pendapatan" : "Terjual",
                  ]}
                />
                <Bar
                  dataKey="qty"
                  fill="#EA580C"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
      </div>
    </ChartFrame>
  );
}
