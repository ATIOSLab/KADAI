import { FinanceDirection } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { logActivity } from "@/lib/activity-logger";
import { assertFinanceAccess, ensureFinanceCategories } from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session";
import { financeCategoryPayloadSchema } from "@/lib/validators/finance";

function getFinanceForbiddenResponse() {
  return NextResponse.json(
    { error: "Anda tidak memiliki akses ke laporan keuangan" },
    { status: 403 }
  );
}

// GET /api/finance/categories
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
    const direction = searchParams.get("direction");
    const includeInactive = searchParams.get("includeInactive") === "true";
    const where = {
      ...(direction && Object.values(FinanceDirection).includes(direction as FinanceDirection)
        ? { direction: direction as FinanceDirection }
        : {}),
      ...(includeInactive ? {} : { isActive: true }),
    };

    const categories = await prisma.financeCategory.findMany({
      where,
      orderBy: [{ isSystem: "desc" }, { direction: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ data: categories });
  } catch (error) {
    console.error("GET /api/finance/categories error:", error);
    return NextResponse.json(
      { error: "Gagal memuat kategori keuangan" },
      { status: 500 }
    );
  }
}

// POST /api/finance/categories
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
    const data = financeCategoryPayloadSchema.parse(body);

    const existing = await prisma.financeCategory.findFirst({
      where: {
        name: data.name,
        direction: data.direction,
      },
    });

    if (existing?.isSystem) {
      return NextResponse.json(
        { error: "Kategori sistem tidak boleh diduplikasi" },
        { status: 400 }
      );
    }

    let category;
    let action: "FINANCE_CATEGORY_CREATED" | "FINANCE_CATEGORY_UPDATED";

    if (existing) {
      category = await prisma.financeCategory.update({
        where: { id: existing.id },
        data: { isActive: true, name: data.name, direction: data.direction },
      });
      action = "FINANCE_CATEGORY_UPDATED";
    } else {
      category = await prisma.financeCategory.create({
        data: {
          name: data.name,
          direction: data.direction,
          isSystem: false,
          isActive: true,
        },
      });
      action = "FINANCE_CATEGORY_CREATED";
    }

    await logActivity({
      userId: sessionUser.id,
      action,
      entity: "FinanceCategory",
      entityId: category.id,
      details: {
        name: category.name,
        direction: category.direction,
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
    }, {
      status: existing ? 200 : 201,
    });
  } catch (error) {
    console.error("POST /api/finance/categories error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Data kategori tidak valid" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Gagal membuat kategori keuangan" },
      { status: 500 }
    );
  }
}
