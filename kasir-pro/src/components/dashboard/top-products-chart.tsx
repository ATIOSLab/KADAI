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
                  stroke="#E5E5E5"
                  strokeWidth={1.5}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fontWeight: 600 }}
                  stroke="#1A1A1A"
                  strokeWidth={2}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11, fontWeight: 700 }}
                  stroke="#1A1A1A"
                  strokeWidth={2}
                  width={170}
                  tickFormatter={(value: string) =>
                    value.length > 26 ? `${value.slice(0, 26)}...` : value
                  }
                />
                <Tooltip
                  contentStyle={{
                    border: "2.5px solid #1A1A1A",
                    borderRadius: "0.75rem",
                    boxShadow: "4px 4px 0px #1A1A1A",
                    fontWeight: 700,
                  }}
                  formatter={(value, name) => [
                    name === "revenue"
                      ? formatCurrency(Number(value ?? 0))
                      : `${Number(value ?? 0)} unit`,
                    name === "revenue" ? "Revenue" : "Qty",
                  ]}
                />
                <Bar
                  dataKey="qty"
                  fill="#FF6B35"
                  radius={[0, 6, 6, 0]}
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
