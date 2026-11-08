"use client";

import {
  AlertTriangle,
  BarChart3,
  Receipt,
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
    icon: Receipt,
    color: "bg-orange-500/10 text-[#EA580C] border border-orange-500/20",
    badge: "Live Realtime",
    badgeColor: "bg-orange-50 text-[#EA580C] border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
  },
  {
    key: "todayTransactions" as const,
    title: "Jumlah Transaksi",
    format: "number" as const,
    suffix: " nota",
    icon: ShoppingCart,
    color: "bg-slate-900/10 text-slate-900 dark:text-slate-100 border border-slate-900/20",
    badge: "Hari Ini",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
  },
  {
    key: "todayProfit" as const,
    title: "Gross Profit",
    format: "currency" as const,
    icon: TrendingUp,
    color: "bg-amber-500/10 text-[#F59E0B] border border-amber-500/20",
    badge: "Laba Kotor",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  {
    key: "averageTransaction" as const,
    title: "Rata-rata Transaksi",
    format: "currency" as const,
    icon: BarChart3,
    color: "bg-orange-400/10 text-[#FB923C] border border-orange-400/20",
    badge: "Basket Size",
    badgeColor: "bg-orange-50/70 text-[#FB923C] border-orange-200 dark:bg-orange-950/30 dark:text-orange-300",
  },
  {
    key: "lowStockCount" as const,
    title: "Low Stock Alert",
    format: "number" as const,
    suffix: " item",
    icon: AlertTriangle,
    color: "bg-rose-500/10 text-rose-600 border border-rose-500/20",
    badge: "Restock",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  },
  {
    key: "totalActiveProducts" as const,
    title: "Total Produk Aktif",
    format: "number" as const,
    suffix: " SKU",
    icon: Package,
    color: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20",
    badge: "Katalog",
    badgeColor: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
  },
];

export function SummaryCards({ data, loading = false }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {cardConfig.map((item, index) => {
        const Icon = item.icon;
        const value = data?.[item.key] ?? 0;

        return (
          <div
            key={index}
            className="rounded-2xl p-4 transition-all duration-200 border bg-white dark:bg-[#161A18]/80 border-slate-200/90 dark:border-white/10 shadow-xs hover:shadow-md hover:border-primary/40 group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className={cn("size-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105", item.color)}>
                <Icon className="size-4" />
              </span>
              <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider", item.badgeColor)}>
                {item.badge}
              </span>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                {item.title}
              </p>
              {loading ? (
                <Skeleton className="h-7 w-24 rounded-lg" />
              ) : (
                <p className="text-xl font-black tabular-nums text-slate-950 dark:text-white tracking-tight">
                  {item.format === "currency"
                    ? formatCurrency(value)
                    : formatNumber(value)}
                  {item.suffix && (
                    <span className="text-xs font-semibold text-slate-400 ml-1">
                      {item.suffix}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
