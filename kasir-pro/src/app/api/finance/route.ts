import {
  FinanceDirection,
  FinanceSource,
  Prisma,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { logActivity } from "@/lib/activity-logger";
import {
  assertFinanceAccess,
  ensureFinanceCategories,
  FINANCE_SOURCE_LABELS,
} from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session";
import { financeEntryPayloadSchema } from "@/lib/validators/finance";

const financeEntryInclude = {
  category: {
    select: {
      id: true,
      name: true,
      direction: true,
      isSystem: true,
    },
  },
  createdByUser: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
  sale: {
    select: {
      id: true,
      invoiceNumber: true,
    },
  },
  productBatch: {
    select: {
      id: true,
      batchNumber: true,
    },
  },
} satisfies Prisma.FinanceEntryInclude;

function getDefaultDateRange() {
  const now = new Date();
  return {
    startDate: new Date(now.getFullYear(), now.getMonth(), 1),
    endDate: new Date(now.setHours(23, 59, 59, 999)),
  };
}

function parseDateRange(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const defaults = getDefaultDateRange();

  return {
    startDate: searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : defaults.startDate,
    endDate: searchParams.get("endDate")
      ? new Date(`${searchParams.get("endDate")}T23:59:59.999Z`)
      : defaults.endDate,
  };
}

function getEnumParam<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  values: readonly T[]
) {
  const rawValue = searchParams.get(key);
  if (!rawValue) {
    return undefined;
  }

  if (!values.includes(rawValue as T)) {
    throw new Error(`INVALID_${key.toUpperCase()}`);
  }

  return rawValue as T;
}

function getFinanceForbiddenResponse() {
  return NextResponse.json(
    { error: "Anda tidak memiliki akses ke laporan keuangan" },
    { status: 403 }
  );
}

async function getActiveCategoryOrThrow(categoryId: string, direction: FinanceDirection) {
  const category = await prisma.financeCategory.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      name: true,
      direction: true,
      isActive: true,
    },
  });

  if (!category) {
    return { error: "Kategori keuangan tidak ditemukan", status: 404 as const };
  }

  if (!category.isActive) {
    return { error: "Kategori keuangan sudah nonaktif", status: 400 as const };
  }

  if (category.direction !== direction) {
    return {
      error: "Kategori tidak sesuai dengan arah transaksi",
      status: 400 as const,
    };
  }

  return { category };
}

// GET /api/finance
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      assertFinanceAccess(sessionUser);
    } catch {
      return getFinanceForbiddenResponse();
    }

    await ensureFinanceCategories();

    const { searchParams } = new URL(request.url);
    const { startDate, endDate } = parseDateRange(request);
    const direction = getEnumParam(
      searchParams,
      "direction",
      Object.values(FinanceDirection)
    );
    const source = getEnumParam(
      searchParams,
      "source",
      Object.values(FinanceSource)
    );
    const categoryId = searchParams.get("categoryId") || undefined;
    const search = searchParams.get("search")?.trim() || undefined;
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");

    const rangeWhere: Prisma.FinanceEntryWhereInput = {
      isArchived: false,
      entryDate: {
        gte: startDate,
        lte: endDate,
      },
      ...(direction ? { direction } : {}),
      ...(source ? { source } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { notes: { contains: search, mode: "insensitive" } },
              {
                category: {
                  name: { contains: search, mode: "insensitive" },
                },
              },
              {
                sale: {
                  invoiceNumber: { contains: search, mode: "insensitive" },
                },
              },
              {
                productBatch: {
                  batchNumber: { contains: search, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    };

    const balanceWhere: Prisma.FinanceEntryWhereInput = {
      isArchived: false,
      entryDate: {
        lte: endDate,
      },
    };

    const [
      entries,
      total,
      rangeIncome,
      rangeExpense,
      balanceIncome,
      balanceExpense,
      sourceGroups,
      categoryGroups,
      categories,
    ] = await Promise.all([
      prisma.financeEntry.findMany({
        where: rangeWhere,
        include: financeEntryInclude,
        orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.financeEntry.count({ where: rangeWhere }),
      prisma.financeEntry.aggregate({
        where: { ...rangeWhere, direction: FinanceDirection.IN },
        _sum: { amount: true },
      }),
      prisma.financeEntry.aggregate({
        where: { ...rangeWhere, direction: FinanceDirection.OUT },
        _sum: { amount: true },
      }),
      prisma.financeEntry.aggregate({
        where: { ...balanceWhere, direction: FinanceDirection.IN },
        _sum: { amount: true },
      }),
      prisma.financeEntry.aggregate({
        where: { ...balanceWhere, direction: FinanceDirection.OUT },
        _sum: { amount: true },
      }),
      prisma.financeEntry.groupBy({
        by: ["source", "direction"],
        where: rangeWhere,
        _sum: { amount: true },
        orderBy: {
          source: "asc",
        },
      }),
      prisma.financeEntry.groupBy({
        by: ["categoryId", "direction"],
        where: rangeWhere,
        _sum: { amount: true },
        orderBy: {
          categoryId: "asc",
        },
      }),
      prisma.financeCategory.findMany({
        select: {
          id: true,
          name: true,
          direction: true,
        },
      }),
    ]);

    const categoryMap = new Map(
      categories.map((category) => [category.id, category])
    );
    const totalIncome = Number(rangeIncome._sum.amount ?? 0);
    const totalExpense = Number(rangeExpense._sum.amount ?? 0);
    const businessBalance =
      Number(balanceIncome._sum.amount ?? 0) -
      Number(balanceExpense._sum.amount ?? 0);

    return NextResponse.json({
      data: {
        summary: {
          businessBalance,
          totalIncome,
          totalExpense,
          netCashflow: totalIncome - totalExpense,
        },
        sourceBreakdown: sourceGroups.map((group) => ({
          key: group.source,
          label: FINANCE_SOURCE_LABELS[group.source],
          direction: group.direction,
          totalAmount: Number(group._sum.amount ?? 0),
        })),
        categoryBreakdown: categoryGroups
          .map((group) => {
            const category = categoryMap.get(group.categoryId);
            if (!category) {
              return null;
            }

            return {
              key: category.id,
              label: category.name,
              direction: group.direction,
              totalAmount: Number(group._sum.amount ?? 0),
            };
          })
          .filter(Boolean),
        entries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("GET /api/finance error:", error);
    if (error instanceof Error && error.message.startsWith("INVALID_")) {
      return NextResponse.json(
        { error: "Filter finance tidak valid" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Gagal memuat data keuangan" },
      { status: 500 }
    );
  }
}

// POST /api/finance
export async function POST(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      assertFinanceAccess(sessionUser);
    } catch {
      return getFinanceForbiddenResponse();
    }

    await ensureFinanceCategories();

    const body = await request.json();
    const data = financeEntryPayloadSchema.parse(body);
    const categoryResult = await getActiveCategoryOrThrow(
      data.categoryId,
      data.direction
    );

    if ("error" in categoryResult) {
      return NextResponse.json(
        { error: categoryResult.error },
        { status: categoryResult.status }
      );
    }

    const entry = await prisma.financeEntry.create({
      data: {
        amount: data.amount,
        direction: data.direction,
        source: FinanceSource.MANUAL,
        title: data.title,
        notes: data.notes,
        entryDate: new Date(data.entryDate),
        categoryId: categoryResult.category.id,
        createdByUserId: sessionUser.id,
      },
      include: financeEntryInclude,
    });

    await logActivity({
      userId: sessionUser.id,
      action: "FINANCE_ENTRY_CREATED",
      entity: "FinanceEntry",
      entityId: entry.id,
      details: {
        title: entry.title,
        amount: entry.amount.toString(),
        direction: entry.direction,
        categoryName: entry.category.name,
      },
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    console.error("POST /api/finance error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Data keuangan tidak valid" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Gagal membuat transaksi keuangan" },
      { status: 500 }
    );
  }
}
