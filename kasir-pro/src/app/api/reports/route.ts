import { NextRequest, NextResponse } from "next/server";
import { eachDayOfInterval, format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { ADMIN_MANAGER_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { getDefaultDashboardRange, getCurrentWeekRange, getWeekRangeFromDate } from "@/lib/dashboard-periods";

function parseDateParam(value: string | null, endOfDay = false) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDayLabel(value: Date) {
  return value.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
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
} as const;

// GET /api/reports?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&weekDate=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat mengakses laporan" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const defaultRange = getDefaultDashboardRange();
    const defaultWeek = getCurrentWeekRange();

    const startDateParam = searchParams.get("startDate") ?? defaultRange.startDate;
    const endDateParam = searchParams.get("endDate") ?? defaultRange.endDate;
    const weekDateParam = searchParams.get("weekDate") ?? defaultWeek.startDate;

    const startDate = parseDateParam(startDateParam);
    const endDate = parseDateParam(endDateParam, true);
    const weekAnchorDate = parseDateParam(weekDateParam);

    if (startDate === null || endDate === null || weekAnchorDate === null) {
      return NextResponse.json(
        { error: "Format tanggal laporan tidak valid" },
        { status: 400 }
      );
    }

    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        { error: "Tanggal mulai tidak boleh melebihi tanggal akhir" },
        { status: 400 }
      );
    }

    const normalizedRange = {
      startDate: startDateParam,
      endDate: endDateParam,
    };
    const normalizedWeek = getWeekRangeFromDate(weekDateParam);
    const weekStartDate = parseDateParam(normalizedWeek.startDate);
    const weekEndDate = parseDateParam(normalizedWeek.endDate, true);

    const [rangeSales, weekSales] = await Promise.all([
      prisma.sale.findMany({
        where: {
          isVoided: false,
          createdAt: { gte: startDate!, lte: endDate! },
        },
        include: saleInclude,
        orderBy: { createdAt: "asc" },
      }),
      prisma.sale.findMany({
        where: {
          isVoided: false,
          createdAt: { gte: weekStartDate!, lte: weekEndDate! },
        },
        include: saleInclude,
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const revenueMap = new Map<
      string,
      { revenue: number; profit: number; hpp: number }
    >();

    for (const date of eachDayOfInterval({
      start: weekStartDate!,
      end: weekEndDate!,
    })) {
      const key = format(date, "yyyy-MM-dd");
      revenueMap.set(key, { revenue: 0, profit: 0, hpp: 0 });
    }

    for (const sale of weekSales) {
      const dateKey = sale.createdAt.toISOString().slice(0, 10);
      const existing = revenueMap.get(dateKey) ?? {
        revenue: 0,
        profit: 0,
        hpp: 0,
      };
      existing.revenue += Number(sale.totalAmount);
      existing.profit += Number(sale.grossProfit);
      existing.hpp += Number(sale.totalCost);
      revenueMap.set(dateKey, existing);
    }

    const revenueTrend = Array.from(revenueMap.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, data]) => ({
        date: formatDayLabel(new Date(`${date}T00:00:00.000Z`)),
        rawDate: date,
        ...data,
      }));

    const categoryMap = new Map<
      string,
      { name: string; value: number; color: string }
    >();
    for (const sale of rangeSales) {
      for (const item of sale.items) {
        const category = item.product.category;
        if (!category) {
          continue;
        }

        const existing = categoryMap.get(category.id) ?? {
          name: category.name,
          value: 0,
          color: category.color || "#888",
        };
        existing.value += Number(item.totalPrice);
        categoryMap.set(category.id, existing);
      }
    }
    const categoryDistribution = Array.from(categoryMap.values()).sort(
      (left, right) => right.value - left.value
    );

    const productMap = new Map<
      string,
      { name: string; qty: number; revenue: number }
    >();
    for (const sale of rangeSales) {
      for (const item of sale.items) {
        const existing = productMap.get(item.productId) ?? {
          name: item.product.name,
          qty: 0,
          revenue: 0,
        };
        existing.qty += item.quantity;
        existing.revenue += Number(item.totalPrice);
        productMap.set(item.productId, existing);
      }
    }
    const topProducts = Array.from(productMap.values())
      .sort((left, right) => right.revenue - left.revenue)
      .slice(0, 5);

    const paymentMap = new Map<string, number>();
    for (const sale of rangeSales) {
      paymentMap.set(
        sale.paymentType,
        (paymentMap.get(sale.paymentType) ?? 0) + Number(sale.totalAmount)
      );
    }
    const paymentColors: Record<string, string> = {
      CASH: "#2D6A4F",
      QRIS: "#004E89",
      BANK_TRANSFER: "#7209B7",
      E_WALLET: "#FF6B35",
    };
    const paymentDistribution = Array.from(paymentMap.entries()).map(
      ([type, value]) => ({
        name:
          type === "CASH"
            ? "Tunai"
            : type === "QRIS"
              ? "QRIS"
              : type === "BANK_TRANSFER"
                ? "Transfer"
                : "E-Wallet",
        value,
        color: paymentColors[type] || "#888",
      })
    );

    const hourlyMap = new Map<number, number>();
    for (const sale of rangeSales) {
      const hour = sale.createdAt.getHours();
      hourlyMap.set(hour, (hourlyMap.get(hour) ?? 0) + 1);
    }
    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${String(hour).padStart(2, "0")}:00`,
      transactions: hourlyMap.get(hour) || 0,
    })).filter(
      (entry) => entry.transactions > 0 || (entry.hour >= "06:00" && entry.hour <= "22:00")
    );

    const totalRevenue = rangeSales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0
    );
    const totalHpp = rangeSales.reduce(
      (sum, sale) => sum + Number(sale.totalCost),
      0
    );
    const totalProfit = rangeSales.reduce(
      (sum, sale) => sum + Number(sale.grossProfit),
      0
    );
    const margin =
      totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0";

    return NextResponse.json({
      data: {
        meta: {
          range: normalizedRange,
          week: normalizedWeek,
        },
        kpi: { totalRevenue, totalHpp, totalProfit, margin },
        revenueTrend,
        categoryDistribution,
        topProducts,
        paymentDistribution,
        hourlyDistribution,
      },
    });
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json(
      { error: "Gagal memuat data laporan" },
      { status: 500 }
    );
  }
}
