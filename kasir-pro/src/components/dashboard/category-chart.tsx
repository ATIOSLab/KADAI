"use client";

import type { ReactNode } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartFrame } from "@/components/dashboard/chart-frame";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { CategorySalesData } from "@/types";
import { KADAI_CHART_THEME } from "@/lib/chart-theme";

interface CategoryChartProps {
  data: CategorySalesData[];
  description: string;
  filter: ReactNode;
  loading?: boolean;
}

export function CategoryChart({
  data,
  description,
  filter,
  loading = false,
}: CategoryChartProps) {
  return (
    <ChartFrame
      title="Penjualan per Kategori"
      description={description}
      filter={filter}
    >
      <div className="flex-1 min-h-[350px] w-full">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={KADAI_CHART_THEME.tooltipStyle}
                  formatter={(value) => [
                    formatCurrency(Number(value ?? 0)),
                    "Penjualan",
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, fontWeight: 600 }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
      </div>
    </ChartFrame>
  );
}
