import { PaymentType, Prisma } from "@prisma/client";
import { eachDayOfInterval, format } from "date-fns";
import { id as indonesianLocale } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import {
  DEFAULT_BUSINESS_TIMEZONE,
  type BusinessRange,
  type BotAnalyticsPeriod,
} from "@/lib/business-day";
import { prisma } from "@/lib/prisma";

export interface ReportDateRange {
  startDate: string;
  endDate: string;
}

export interface SalesSummaryResult {
  period: BotAnalyticsPeriod;
  label: string;
  revenue: number;
  transactions: number;
  averageTransaction: number;
  periodStart: string;
  periodEnd: string;
}

export interface ProfitSummaryResult {
  period: BotAnalyticsPeriod;
  label: string;
  revenue: number;
  /** PB1 yang dipungut dari tamu (titipan negara, bukan pendapatan usaha). */
  taxCollected: number;
  /** Service charge yang dipungut (pendapatan jasa usaha). */
  serviceChargeCollected: number;
  /** Omzet neto = revenue - taxCollected; basis margin laba kotor. */
  netRevenue: number;
  hpp: number;
  profit: number;
  margin: number;
  transactions: number;
  periodStart: string;
  periodEnd: string;
}

export interface TopProductResult {
  name: string;
  qty: number;
  revenue: number;
}

export interface PaymentMixResult {
  name: string;
  value: number;
  color: string;
}

export interface HourlySalesResult {
  hour: string;
  transactions: number;
}

export interface LowStockHighlightResult {
  productId: string;
  name: string;
  sku: string;
  remainingQty: number;
  threshold: number;
}

export interface ReportSnapshot {
  meta: {
    range: ReportDateRange;
    week: ReportDateRange;
  };
  kpi: {
    /** Uang yang benar-benar diterima dari tamu (termasuk PB1 & service charge). */
    totalRevenue: number;
    /** PB1 titipan negara: masuk kas, bukan pendapatan usaha. */
    taxCollected: number;
    /** Service charge: pendapatan jasa milik usaha. */
    serviceChargeCollected: number;
    /** Omzet neto = totalRevenue - pajak. Basis margin laba kotor. */
    netRevenue: number;
    totalHpp: number;
    totalProfit: number;
    margin: string;
  };
  revenueTrend: { date: string; rawDate: string; revenue: number; profit: number; hpp: number }[];
  categoryDistribution: { name: string; value: number; color: string }[];
  topProducts: TopProductResult[];
  paymentDistribution: PaymentMixResult[];
  hourlyDistribution: HourlySalesResult[];
}

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
  TEMPO: "#64748B",        // Slate-500
};

function formatRangeStart(dateValue: Date, timezone: string) {
  return formatInTimeZone(dateValue, timezone, "dd MMM yyyy HH:mm");
}

function formatRangeEnd(dateValue: Date, timezone: string) {
  return formatInTimeZone(dateValue, timezone, "dd MMM yyyy HH:mm");
}

function parseCalendarDate(
  value: string | null,
  timezone: string,
  endOfDay = false
) {
  if (!value) {
    return undefined;
  }

  const timeFragment = endOfDay ? "23:59:59.999" : "00:00:00.000";
  const parsed = fromZonedTime(`${value}T${timeFragment}`, timezone);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDayLabel(dateValue: Date, timezone: string) {
  return formatInTimeZone(dateValue, timezone, "dd MMM", {
    locale: indonesianLocale,
  });
}

function getSaleWhereInput(
  range: { start: Date; endExclusive: Date },
  storeId?: string | null
) {
  return {
    isVoided: false,
    // Isolasi tenant: hanya penjualan dari outlet milik store pemanggil
    ...(storeId ? { outlet: { storeId } } : {}),
    createdAt: {
      gte: range.start,
      lt: range.endExclusive,
    },
  } satisfies Prisma.SaleWhereInput;
}

export async function getSalesSummary(
  range: BusinessRange,
  timezone: string,
  storeId?: string | null
) {
  const [aggregate, transactions] = await Promise.all([
    prisma.sale.aggregate({
      where: getSaleWhereInput(range, storeId),
      _sum: {
        totalAmount: true,
      },
    }),
    prisma.sale.count({
      where: getSaleWhereInput(range, storeId),
    }),
  ]);

  const revenue = Number(aggregate._sum.totalAmount ?? 0);

  return {
    period: range.period,
    label: range.label,
    revenue,
    transactions,
    averageTransaction: transactions > 0 ? revenue / transactions : 0,
    periodStart: formatRangeStart(range.start, timezone),
    periodEnd: formatRangeEnd(range.endExclusive, timezone),
  } satisfies SalesSummaryResult;
}

export async function getProfitSummary(
  range: BusinessRange,
  timezone: string,
  storeId?: string | null
) {
  const aggregate = await prisma.sale.aggregate({
    where: getSaleWhereInput(range, storeId),
    _sum: {
      totalAmount: true,
      taxAmount: true,
      serviceCharge: true,
      totalCost: true,
      grossProfit: true,
    },
    _count: {
      _all: true,
    },
  });

  const revenue = Number(aggregate._sum.totalAmount ?? 0);
  const taxCollected = Number(aggregate._sum.taxAmount ?? 0);
  const serviceChargeCollected = Number(aggregate._sum.serviceCharge ?? 0);
  const netRevenue = revenue - taxCollected;
  const hpp = Number(aggregate._sum.totalCost ?? 0);
  // Laba kotor diturunkan dari omzet neto - HPP agar identitas laporan selalu
  // berlaku (pembulatan tunai sudah masuk omzet neto).
  const profit = netRevenue - hpp;

  return {
    period: range.period,
    label: range.label,
    revenue,
    taxCollected,
    serviceChargeCollected,
    netRevenue,
    hpp,
    profit,
    // Margin laba kotor selalu dihitung dari omzet neto (tanpa PB1 titipan negara)
    margin: netRevenue > 0 ? Number(((profit / netRevenue) * 100).toFixed(1)) : 0,
    transactions: aggregate._count._all,
    periodStart: formatRangeStart(range.start, timezone),
    periodEnd: formatRangeEnd(range.endExclusive, timezone),
  } satisfies ProfitSummaryResult;
}

export async function getTopProducts(
  range: BusinessRange,
  limit = 5,
  storeId?: string | null
) {
  const sales = await prisma.sale.findMany({
    where: getSaleWhereInput(range, storeId),
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const productMap = new Map<string, TopProductResult>();

  for (const sale of sales) {
    for (const item of sale.items) {
      const current = productMap.get(item.productId) ?? {
        name: item.product.name,
        qty: 0,
        revenue: 0,
      };
      current.qty += item.quantity;
      current.revenue += Number(item.totalPrice);
      productMap.set(item.productId, current);
    }
  }

  return Array.from(productMap.values())
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, Math.max(1, limit));
}

export async function getPaymentMix(range: BusinessRange, storeId?: string | null) {
  const grouped = await prisma.sale.groupBy({
    by: ["paymentType"],
    where: getSaleWhereInput(range, storeId),
    _sum: {
      totalAmount: true,
    },
  });

  return grouped.map((entry) => ({
    name: PAYMENT_LABELS[entry.paymentType],
    value: Number(entry._sum.totalAmount ?? 0),
    color: PAYMENT_COLORS[entry.paymentType],
  })) satisfies PaymentMixResult[];
}

export async function getHourlySales(range: BusinessRange, timezone: string) {
  const sales = await prisma.sale.findMany({
    where: getSaleWhereInput(range),
    select: {
      createdAt: true,
    },
  });

  const hourlyMap = new Map<string, number>();
  for (let hour = 0; hour < 24; hour += 1) {
    hourlyMap.set(`${String(hour).padStart(2, "0")}:00`, 0);
  }

  for (const sale of sales) {
    const hour = `${formatInTimeZone(sale.createdAt, timezone, "HH")}:00`;
    hourlyMap.set(hour, (hourlyMap.get(hour) ?? 0) + 1);
  }

  return Array.from(hourlyMap.entries())
    .map(([hour, transactions]) => ({ hour, transactions }))
    .filter(
      (entry) =>
        entry.transactions > 0 || (entry.hour >= "06:00" && entry.hour <= "22:00")
    );
}

export async function getLowStockHighlights(limit = 5, storeId?: string | null) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(storeId ? { storeId } : {}),
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
  });

  return products
    .map((product) => ({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      threshold: product.lowStockThreshold,
      remainingQty: product.batches.reduce(
        (sum, batch) => sum + batch.remainingQty,
        0
      ),
    }))
    .filter((product) => product.remainingQty <= product.threshold)
    .sort((left, right) => left.remainingQty - right.remainingQty)
    .slice(0, Math.max(1, limit)) satisfies LowStockHighlightResult[];
}

export async function getReportSnapshot(params: {
  startDate: string;
  endDate: string;
  weekDate: string;
  timezone?: string;
  outletId?: string | null;
  storeId?: string | null;
}) {
  const timezone = params.timezone || DEFAULT_BUSINESS_TIMEZONE;
  const startDate = parseCalendarDate(params.startDate, timezone);
  const endDate = parseCalendarDate(params.endDate, timezone, true);
  const weekStartDate = parseCalendarDate(params.weekDate, timezone);

  if (!startDate || !endDate || !weekStartDate) {
    throw new Error("INVALID_REPORT_DATE");
  }

  const weekEndDate = parseCalendarDate(
    format(new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    timezone,
    true
  );

  if (!weekEndDate) {
    throw new Error("INVALID_REPORT_DATE");
  }

  const saleInclude = {
    items: {
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            categoryId: true,
            category: { select: { id: true, name: true, color: true } },
          },
        },
      },
    },
  } satisfies Prisma.SaleInclude;

  const outletFilter =
    params.outletId && params.outletId !== "ALL"
      ? { outletId: params.outletId }
      : {};

  // Isolasi tenant: laporan hanya mencakup outlet milik store pemanggil
  const storeFilter = params.storeId ? { outlet: { storeId: params.storeId } } : {};

  const [rangeSales, weekSales] = await Promise.all([
    prisma.sale.findMany({
      where: {
        isVoided: false,
        ...outletFilter,
        ...storeFilter,
        createdAt: { gte: startDate, lte: endDate },
      },
      include: saleInclude,
      orderBy: { createdAt: "asc" },
    }),
    prisma.sale.findMany({
      where: {
        isVoided: false,
        ...outletFilter,
        ...storeFilter,
        createdAt: { gte: weekStartDate, lte: weekEndDate },
      },
      include: saleInclude,
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const revenueMap = new Map<string, { revenue: number; profit: number; hpp: number }>();
  // Kunci grafik diisi memakai ZONA BISNIS. format() memakai jam server (UTC di
  // kontainer) sehingga label hari bergeser satu hari dari tanggal operasional toko.
  for (const dateValue of eachDayOfInterval({ start: weekStartDate, end: weekEndDate })) {
    const key = formatInTimeZone(dateValue, timezone, "yyyy-MM-dd");
    revenueMap.set(key, { revenue: 0, profit: 0, hpp: 0 });
  }

  for (const sale of weekSales) {
    const dateKey = formatInTimeZone(sale.createdAt, timezone, "yyyy-MM-dd");
    const current = revenueMap.get(dateKey) ?? { revenue: 0, profit: 0, hpp: 0 };
    current.revenue += Number(sale.totalAmount);
    current.profit += Number(sale.grossProfit);
    current.hpp += Number(sale.totalCost);
    revenueMap.set(dateKey, current);
  }

  const categoryMap = new Map<string, { name: string; value: number; color: string }>();
  const productMap = new Map<string, TopProductResult>();
  const paymentMap = new Map<PaymentType, number>();
  const hourlyMap = new Map<string, number>();

  for (const sale of rangeSales) {
    const hour = `${formatInTimeZone(sale.createdAt, timezone, "HH")}:00`;
    hourlyMap.set(hour, (hourlyMap.get(hour) ?? 0) + 1);
    paymentMap.set(
      sale.paymentType,
      (paymentMap.get(sale.paymentType) ?? 0) + Number(sale.totalAmount)
    );

    for (const item of sale.items) {
      const category = item.product.category;
      const currentCategory = categoryMap.get(category.id) ?? {
        name: category.name,
        value: 0,
        color: category.color || "#EA580C",
      };
      currentCategory.value += Number(item.totalPrice);
      categoryMap.set(category.id, currentCategory);

      const currentProduct = productMap.get(item.productId) ?? {
        name: item.product.name,
        qty: 0,
        revenue: 0,
      };
      currentProduct.qty += item.quantity;
      currentProduct.revenue += Number(item.totalPrice);
      productMap.set(item.productId, currentProduct);
    }
  }

  const totalRevenue = rangeSales.reduce(
    (sum, sale) => sum + Number(sale.totalAmount),
    0
  );
  // PB1 adalah titipan ke negara dan service charge pendapatan jasa: keduanya
  // harus terlihat terpisah, kalau tidak omzet tampak lebih besar dari
  // pendapatan usaha dan margin laba kotor ikut tertekan.
  const taxCollected = rangeSales.reduce((sum, sale) => sum + Number(sale.taxAmount), 0);
  const serviceChargeCollected = rangeSales.reduce(
    (sum, sale) => sum + Number(sale.serviceCharge),
    0
  );
  const netRevenue = totalRevenue - taxCollected;
  const totalHpp = rangeSales.reduce((sum, sale) => sum + Number(sale.totalCost), 0);
  // Omzet neto - HPP: angka di laporan harus bisa dijumlahkan sendiri oleh
  // pemilik tanpa selisih pembulatan.
  const totalProfit = netRevenue - totalHpp;

  return {
    meta: {
      range: {
        startDate: params.startDate,
        endDate: params.endDate,
      },
      week: {
        startDate: params.weekDate,
        endDate: formatInTimeZone(weekEndDate, timezone, "yyyy-MM-dd"),
      },
    },
    kpi: {
      totalRevenue,
      taxCollected,
      serviceChargeCollected,
      netRevenue,
      totalHpp,
      totalProfit,
      margin: netRevenue > 0 ? ((totalProfit / netRevenue) * 100).toFixed(1) : "0",
    },
    revenueTrend: Array.from(revenueMap.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([rawDate, data]) => ({
        rawDate,
        date: formatDayLabel(new Date(`${rawDate}T12:00:00.000Z`), timezone),
        ...data,
      })),
    categoryDistribution: Array.from(categoryMap.values()).sort(
      (left, right) => right.value - left.value
    ),
    topProducts: Array.from(productMap.values())
      .sort((left, right) => right.revenue - left.revenue)
      .slice(0, 5),
    paymentDistribution: Array.from(paymentMap.entries()).map(([paymentType, value]) => ({
      name: PAYMENT_LABELS[paymentType],
      value,
      color: PAYMENT_COLORS[paymentType],
    })),
    hourlyDistribution: Array.from({ length: 24 }, (_, hour) => {
      const label = `${String(hour).padStart(2, "0")}:00`;

      return {
        hour: label,
        transactions: hourlyMap.get(label) || 0,
      };
    }).filter(
      (entry) =>
        entry.transactions > 0 || (entry.hour >= "06:00" && entry.hour <= "22:00")
    ),
  } satisfies ReportSnapshot;
}
