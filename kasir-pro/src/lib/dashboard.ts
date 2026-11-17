import { PaymentType } from "@prisma/client";
import { format, isWithinInterval } from "date-fns";
import { id as indonesianLocale } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { shiftIsoDate, toLocalDate } from "./business-day";
import { prisma } from "./prisma";
import { resolveBusinessTimezone } from "./business-timezone";
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

function toDayLabel(calendarDate: string) {
  // Tengah hari UTC: nama hari tidak bergeser oleh perbedaan zona waktu.
  return format(new Date(`${calendarDate}T12:00:00.000Z`), "EEE", {
    locale: indonesianLocale,
  });
}

function toHourLabel(hour: number) {
  return String(hour).padStart(2, "0");
}

interface DashboardOverviewOptions {
  /** Tanggal kalender awal rentang (YYYY-MM-DD) pada zona waktu toko. */
  startDateLocal?: string;
  /** Tanggal kalender akhir rentang (YYYY-MM-DD), inklusif. */
  endDateLocal?: string;
  // Isolasi tenant: bila diisi, seluruh agregasi dibatasi ke store ini
  storeId?: string | null;
  /** Override zona waktu; default mengikuti pengaturan toko. */
  timezone?: string | null;
}

export async function getDashboardOverview(
  options: DashboardOverviewOptions = {}
): Promise<DashboardOverview> {
  // Batas hari mengikuti zona waktu toko, bukan jam server: kontainer produksi
  // berjalan di UTC sehingga "Penjualan Hari Ini", bucket harian, dan grafik per
  // jam akan bergeser 7 jam untuk toko WIB (dan berbeda dari modul laporan).
  const timezone = options.timezone || (await resolveBusinessTimezone());
  const now = new Date();
  const localToday = toLocalDate(now, timezone);
  const startLocal = options.startDateLocal ?? shiftIsoDate(localToday, -6);
  const endLocal = options.endDateLocal ?? localToday;
  const startDate = fromZonedTime(`${startLocal}T00:00:00.000`, timezone);
  const endDate = new Date(
    fromZonedTime(`${shiftIsoDate(endLocal, 1)}T00:00:00.000`, timezone).getTime() - 1
  );
  const todayStart = fromZonedTime(`${localToday}T00:00:00.000`, timezone);
  const todayEnd = new Date(
    fromZonedTime(`${shiftIsoDate(localToday, 1)}T00:00:00.000`, timezone).getTime() - 1
  );

  const [sales, products, totalActiveProducts] = await Promise.all([
    prisma.sale.findMany({
      where: {
        isVoided: false,
        ...(options.storeId ? { outlet: { storeId: options.storeId } } : {}),
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
        ...(options.storeId ? { storeId: options.storeId } : {}),
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
        ...(options.storeId ? { storeId: options.storeId } : {}),
      },
    }),
  ]);

  const dailyMap = new Map<string, RevenueChartData>();
  const hppRevenueMap = new Map<string, HppRevenueData>();
  for (let day = startLocal; day <= endLocal; day = shiftIsoDate(day, 1)) {
    const key = day;
    const label = toDayLabel(day);

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
    const saleDateKey = toLocalDate(sale.createdAt, timezone);
    const saleRevenue = Number(sale.totalAmount);
    const saleCost = Number(sale.totalCost);
    // Laba kotor = yang dibayar pembeli - PB1 (titipan) - HPP; identitas yang
    // sama dengan laporan agar kartu dashboard tidak berbeda angka.
    const saleProfit = saleRevenue - Number(sale.taxAmount) - saleCost;

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

    const hourKey = toHourLabel(
      Number(formatInTimeZone(sale.createdAt, timezone, "HH"))
    );
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
