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
import type { HourlySalesData } from "@/types";
import { KADAI_CHART_THEME } from "@/lib/chart-theme";

interface HourlyChartProps {
  data: HourlySalesData[];
  description: string;
  filter: ReactNode;
  loading?: boolean;
}

export function HourlyChart({
  data,
  description,
  filter,
  loading = false,
}: HourlyChartProps) {
  return (
    <ChartFrame
      title="Pola Jam Sibuk"
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
                  dataKey="hour"
                  {...KADAI_CHART_THEME.xAxisProps}
                />
                <YAxis
                  {...KADAI_CHART_THEME.yAxisProps}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={KADAI_CHART_THEME.tooltipStyle}
                  formatter={(value) => [
                    `${Number(value ?? 0)} transaksi`,
                    "Jumlah",
                  ]}
                  labelFormatter={(label) => `Jam ${label}:00`}
                />
                <Bar
                  dataKey="transactions"
                  fill="#020617"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
      </div>
    </ChartFrame>
  );
}
