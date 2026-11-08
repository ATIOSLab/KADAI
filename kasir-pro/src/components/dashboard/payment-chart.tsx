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
import type { PaymentDistributionData } from "@/types";

interface PaymentChartProps {
  data: PaymentDistributionData[];
  description: string;
  filter: ReactNode;
  loading?: boolean;
}

export function PaymentChart({
  data,
  description,
  filter,
  loading = false,
}: PaymentChartProps) {
  return (
    <ChartFrame
      title="Metode Pembayaran"
      description={description}
      filter={filter}
    >
      <div className="flex-1 min-h-[300px] w-full">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    border: "1px solid #E2E8F0",
                    borderRadius: "0.75rem",
                    boxShadow: "0 10px 25px -5px rgba(2, 6, 23, 0.08)",
                    fontWeight: 600,
                    backgroundColor: "#FFFFFF",
                  }}
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
