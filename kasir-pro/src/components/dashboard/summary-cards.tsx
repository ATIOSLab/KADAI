"use client";

import {
  AlertTriangle,
  BarChart3,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import type { DashboardSummary } from "@/types";

interface SummaryCardsProps {
  data?: DashboardSummary;
  loading?: boolean;
}

const cardConfig = [
  {
    key: "todaySales" as const,
    title: "Penjualan Hari Ini",
    format: "currency" as const,
    icon: DollarSign,
    color: "bg-accent-success",
  },
  {
    key: "todayTransactions" as const,
    title: "Jumlah Transaksi",
    format: "number" as const,
    suffix: " transaksi",
    icon: ShoppingCart,
    color: "bg-accent-secondary",
  },
  {
    key: "todayProfit" as const,
    title: "Gross Profit",
    format: "currency" as const,
    icon: TrendingUp,
    color: "bg-accent-warning",
  },
  {
    key: "averageTransaction" as const,
    title: "Rata-rata Transaksi",
    format: "currency" as const,
    icon: BarChart3,
    color: "bg-accent-purple",
  },
  {
    key: "lowStockCount" as const,
    title: "Low Stock Alert",
    format: "number" as const,
    suffix: " produk",
    icon: AlertTriangle,
    color: "bg-accent-danger",
  },
  {
    key: "totalActiveProducts" as const,
    title: "Total Produk Aktif",
    format: "number" as const,
    suffix: " produk",
    icon: Package,
    color: "bg-accent-orange",
  },
];

export function SummaryCards({ data, loading = false }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cardConfig.map((item, index) => {
        const Icon = item.icon;
        const value = data?.[item.key] ?? 0;

        return (
          <Card
            key={index}
            className="neo-hover cursor-pointer"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center neo-border",
                    item.color
                  )}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                {item.title}
              </p>
              {loading ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <p className="text-xl font-black tabular-nums">
                  {item.format === "currency"
                    ? formatCurrency(value)
                    : formatNumber(value)}
                  {item.suffix && (
                    <span className="text-sm font-bold text-text-muted">
                      {item.suffix}
                    </span>
                  )}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
