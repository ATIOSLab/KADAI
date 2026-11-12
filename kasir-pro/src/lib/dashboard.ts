import { PaymentType } from "@prisma/client";
import {
  eachDayOfInterval,
  endOfDay,
  format,
  isWithinInterval,
  startOfDay,
  subDays,
} from "date-fns";
import { id as indonesianLocale } from "date-fns/locale";
import { prisma } from "./prisma";
import type {
  CategorySalesData,
  DashboardOverview,
  DashboardSummary,
  HppRevenueData,
  RevenueChartData,
  TopProductData,
} from "@/types";

const PAYMENT_LABELS: Record<PaymentType, string> = {
  CASH: "Tunai",
  BANK_TRANSFER: "Transfer",
  QRIS: "QRIS",
  E_WALLET: "E-Wallet",
  TEMPO: "Tempo / Bon Mandor",
};

const PAYMENT_COLORS: Record<PaymentType, string> = {
  CASH: "#020617",         // Slate
  QRIS: "#EA580C",         // Ember
  BANK_TRANSFER: "#F59E0B",// Amber
  E_WALLET: "#FB923C",     // Glow
  TEMPO: "#64748B",        // Slate Slate-500
};

function toDayLabel(date: Date) {
  return format(date, "EEE", { locale: indonesianLocale });
}

function toHourLabel(hour: number) {
  return String(hour).padStart(2, "0");
}

interface DashboardOverviewOptions {
  startDate?: Date;
  endDate?: Date;
}

export async function getDashboardOverview(
  options: DashboardOverviewOptions = {}
): Promise<DashboardOverview> {
  const now = new Date();
  const startDate = options.startDate
    ? startOfDay(options.startDate)
    : startOfDay(subDays(now, 6));
  const endDate = options.endDate ? endOfDay(options.endDate) : endOfDay(now);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [sales, products, totalActiveProducts] = await Promise.all([
    prisma.sale.findMany({
      where: {
        isVoided: false,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        cashier: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: {
                  select: {
                    name: true,
                    color: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        batches: {
          where: {
            remainingQty: {
              gt: 0,
            },
          },
        },
      },
    }),
    prisma.product.count({
      where: {
        isActive: true,
      },
    }),
  ]);

  const dailyMap = new Map<string, RevenueChartData>();
  const hppRevenueMap = new Map<string, HppRevenueData>();
  for (const currentDate of eachDayOfInterval({ start: startDate, end: endDate })) {
    const key = format(currentDate, "yyyy-MM-dd");
    const label = toDayLabel(currentDate);

    dailyMap.set(key, {
      date: label,
      revenue: 0,
      profit: 0,
    });

    hppRevenueMap.set(key, {
      period: label,
      hpp: 0,
      revenue: 0,
    });
  }

  const hourlySalesMap = new Map<string, number>();
  for (let hour = 0; hour < 24; hour += 1) {
    hourlySalesMap.set(toHourLabel(hour), 0);
  }

  const paymentDistributionMap = new Map<PaymentType, number>(
    (Object.keys(PAYMENT_LABELS) as PaymentType[]).map((paymentType) => [
      paymentType,
      0,
    ])
  );
  const topProductMap = new Map<string, TopProductData>();
  const categorySalesMap = new Map<string, CategorySalesData>();

  let todaySales = 0;
  let todayProfit = 0;
  let todayTransactions = 0;

  for (const sale of sales) {
    const saleDateKey = format(sale.createdAt, "yyyy-MM-dd");
    const saleRevenue = Number(sale.totalAmount);
    const saleProfit = Number(sale.grossProfit);
    const saleCost = Number(sale.totalCost);

    const dailyEntry = dailyMap.get(saleDateKey);
    if (dailyEntry) {
      dailyEntry.revenue += saleRevenue;
      dailyEntry.profit += saleProfit;
    }

    const hppRevenueEntry = hppRevenueMap.get(saleDateKey);
    if (hppRevenueEntry) {
      hppRevenueEntry.revenue += saleRevenue;
      hppRevenueEntry.hpp += saleCost;
    }

    paymentDistributionMap.set(
      sale.paymentType,
      (paymentDistributionMap.get(sale.paymentType) ?? 0) + saleRevenue
    );

    if (
      sale.createdAt >= todayStart &&
      sale.createdAt <= todayEnd &&
      isWithinInterval(sale.createdAt, { start: startDate, end: endDate })
    ) {
      todaySales += saleRevenue;
      todayProfit += saleProfit;
      todayTransactions += 1;
    }

    const hourKey = toHourLabel(sale.createdAt.getHours());
    hourlySalesMap.set(
      hourKey,
      (hourlySalesMap.get(hourKey) ?? 0) + 1
    );

    for (const item of sale.items) {
      const currentProduct = topProductMap.get(item.product.id) ?? {
        name: item.product.name,
        qty: 0,
        revenue: 0,
      };
      currentProduct.qty += item.quantity;
      currentProduct.revenue += Number(item.totalPrice);
      topProductMap.set(item.product.id, currentProduct);

      const categoryName = item.product.category.name;
      const currentCategory = categorySalesMap.get(categoryName) ?? {
        name: categoryName,
        value: 0,
        color: item.product.category.color ?? "#EA580C",
      };
      currentCategory.value += Number(item.totalPrice);
      categorySalesMap.set(categoryName, currentCategory);
    }
  }

  const lowStockCount = products.filter((product) => {
    const totalStock = product.batches.reduce(
      (sum, batch) => sum + batch.remainingQty,
      0
    );
    return totalStock <= product.lowStockThreshold;
  }).length;

  const summary: DashboardSummary = {
    todaySales,
    todayTransactions,
    todayProfit,
    averageTransaction:
      todayTransactions > 0 ? todaySales / todayTransactions : 0,
    lowStockCount,
    totalActiveProducts,
  };

  return {
    summary,
    charts: {
      revenueTrend: Array.from(dailyMap.values()),
      paymentDistribution: (Object.keys(PAYMENT_LABELS) as PaymentType[]).map(
        (paymentType) => ({
          name: PAYMENT_LABELS[paymentType],
          value: paymentDistributionMap.get(paymentType) ?? 0,
          color: PAYMENT_COLORS[paymentType],
        })
      ),
      topProducts: Array.from(topProductMap.values())
        .sort((left, right) => right.qty - left.qty)
        .slice(0, 10),
      categorySales: Array.from(categorySalesMap.values())
        .sort((left, right) => right.value - left.value)
        .slice(0, 8),
      hppVsRevenue: Array.from(hppRevenueMap.values()),
      hourlySales: Array.from(hourlySalesMap.entries()).map(
        ([hour, transactionCount]) => ({
          hour,
          transactions: transactionCount,
        })
      ),
    },
  };
}
