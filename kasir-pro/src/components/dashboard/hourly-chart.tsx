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
                  stroke="#E2E8F0"
                  strokeWidth={1}
                />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11, fontWeight: 600, fill: "#64748B" }}
                  stroke="#CBD5E1"
                  strokeWidth={1}
                />
                <YAxis
                  tick={{ fontSize: 10, fontWeight: 600, fill: "#64748B" }}
                  stroke="#CBD5E1"
                  strokeWidth={1}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    border: "1px solid #E2E8F0",
                    borderRadius: "0.75rem",
                    boxShadow: "0 10px 25px -5px rgba(2, 6, 23, 0.08)",
                    fontWeight: 600,
                    backgroundColor: "#FFFFFF",
                  }}
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
