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
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E5E5"
                  strokeWidth={1.5}
                />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11, fontWeight: 700 }}
                  stroke="#1A1A1A"
                  strokeWidth={2}
                />
                <YAxis
                  tick={{ fontSize: 10, fontWeight: 600 }}
                  stroke="#1A1A1A"
                  strokeWidth={2}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    border: "2.5px solid #1A1A1A",
                    borderRadius: "0.75rem",
                    boxShadow: "4px 4px 0px #1A1A1A",
                    fontWeight: 700,
                  }}
                  formatter={(value) => [
                    `${Number(value ?? 0)} transaksi`,
                    "Jumlah",
                  ]}
                  labelFormatter={(label) => `Jam ${label}:00`}
                />
                <Bar
                  dataKey="transactions"
                  fill="#004E89"
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
