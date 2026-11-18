import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session";
import { jsonError, jsonOk, handleApiError } from "@/lib/api-response";
import { resolveTenantScope } from "@/lib/tenant-scope";
import { resolveBusinessTimezone } from "@/lib/business-timezone";
import { ADMIN_MANAGER_ROLES, POS_ROLES, hasRequiredRole } from "@/lib/rbac";
import { varianceStatus } from "@/lib/shift";
import { fromZonedTime } from "date-fns-tz";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_LIMIT = 100;

function parseDay(value: string | null): Date | null {
  if (!value || !DATE_PATTERN.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Riwayat laci kasir (shift) untuk audit pemilik.
 *
 * Owner butuh melihat SESI, bukan hanya total harian: siapa yang memegang laci,
 * berapa modal awalnya, dan berapa selisih saat dihitung fisik. Kasir hanya
 * boleh melihat riwayatnya sendiri.
 */
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) return jsonError("Unauthorized", 401);

    if (!hasRequiredRole(sessionUser.role, POS_ROLES)) {
      return jsonError("Role Anda tidak dapat melihat riwayat shift", 403);
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) return jsonError(scope.message, scope.status);

    const { searchParams } = new URL(request.url);
    const timezone = await resolveBusinessTimezone();

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const fromDay = parseDay(fromParam);
    const toDay = parseDay(toParam);

    if (fromParam && !fromDay) {
      return jsonError("Tanggal awal harus berformat YYYY-MM-DD", 400);
    }
    if (toParam && !toDay) {
      return jsonError("Tanggal akhir harus berformat YYYY-MM-DD", 400);
    }
    if (fromDay && toDay && fromDay > toDay) {
      return jsonError("Tanggal awal tidak boleh melewati tanggal akhir", 400);
    }

    const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(searchParams.get("limit") ?? 20) || 20)
    );

    const bolehLihatOrangLain = hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES);
    const requestedCashier = searchParams.get("cashierId");
    const cashierId = bolehLihatOrangLain
      ? requestedCashier || undefined
      : sessionUser.id;

    const closedRange: { gte?: Date; lt?: Date } = {};
    if (fromDay) {
      closedRange.gte = fromZonedTime(`${fromParam}T00:00:00`, timezone);
    }
    if (toDay) {
      // Hari akhir inklusif: batas atasnya tengah malam hari berikutnya.
      const next = new Date(toDay);
      next.setUTCDate(next.getUTCDate() + 1);
      closedRange.lt = fromZonedTime(
        `${next.toISOString().slice(0, 10)}T00:00:00`,
        timezone
      );
    }

    const where = {
      storeId: scope.storeId,
      status: "CLOSED" as const,
      ...(cashierId ? { cashierId } : {}),
      ...(Object.keys(closedRange).length > 0 ? { closedAt: closedRange } : {}),
    };

    const [rows, total, aggregate] = await Promise.all([
      prisma.cashShift.findMany({
        where,
        orderBy: { closedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          openedAt: true,
          closedAt: true,
          openingCash: true,
          closingCash: true,
          expectedCash: true,
          variance: true,
          totalSales: true,
          totalVoided: true,
          totalRevenue: true,
          totalCashSales: true,
          totalRefunds: true,
          totalDiscount: true,
          cashier: { select: { id: true, name: true } },
        },
      }),
      prisma.cashShift.count({ where }),
      prisma.cashShift.aggregate({
        where,
        _sum: {
          variance: true,
          totalRevenue: true,
          totalCashSales: true,
          totalRefunds: true,
          totalDiscount: true,
          totalSales: true,
        },
        _count: { _all: true },
      }),
    ]);

    const shifts = rows.map((row) => {
      const variance = row.variance === null ? null : Number(row.variance);
      return {
        id: row.id,
        cashier: row.cashier,
        openedAt: row.openedAt,
        closedAt: row.closedAt,
        openingCash: Number(row.openingCash),
        closingCash: row.closingCash === null ? null : Number(row.closingCash),
        expectedCash: row.expectedCash === null ? null : Number(row.expectedCash),
        variance,
        varianceStatus: varianceStatus(variance),
        totalSales: row.totalSales,
        totalVoided: row.totalVoided,
        totalRevenue: Number(row.totalRevenue),
        totalCashSales: Number(row.totalCashSales),
        totalRefunds: Number(row.totalRefunds),
        totalDiscount: Number(row.totalDiscount),
      };
    });

    const sum = (value: unknown) => (value === null || value === undefined ? 0 : Number(value));

    return jsonOk({
      shifts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      summary: {
        shiftCount: aggregate._count._all,
        varianceTotal: sum(aggregate._sum.variance),
        revenueTotal: sum(aggregate._sum.totalRevenue),
        cashSalesTotal: sum(aggregate._sum.totalCashSales),
        refundsTotal: sum(aggregate._sum.totalRefunds),
        discountTotal: sum(aggregate._sum.totalDiscount),
        transactionCount: sum(aggregate._sum.totalSales),
      },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/pos/shifts/history", "Gagal memuat riwayat shift kasir");
  }
}