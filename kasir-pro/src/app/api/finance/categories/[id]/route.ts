import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { logActivity } from "@/lib/activity-logger";
import { assertFinanceAccess } from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session";
import { financeCategoryPayloadSchema } from "@/lib/validators/finance";

function getFinanceForbiddenResponse(message = "Anda tidak memiliki akses ke laporan keuangan") {
  return NextResponse.json({ error: message }, { status: 403 });
}

async function getEditableCategory(id: string) {
  const category = await prisma.financeCategory.findUnique({
    where: { id },
  });

  if (!category) {
    return { error: "Kategori keuangan tidak ditemukan", status: 404 as const };
  }

  if (category.isSystem) {
    return {
      error: "Kategori sistem tidak dapat diubah",
      status: 403 as const,
    };
  }

  return { category };
}

// PATCH /api/finance/categories/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const editable = await getEditableCategory(id);
    if ("error" in editable) {
      return NextResponse.json(
        { error: editable.error },
        { status: editable.status }
      );
    }

    const body = await request.json();
    const data = financeCategoryPayloadSchema.parse(body);

    const duplicate = await prisma.financeCategory.findFirst({
      where: {
        id: { not: id },
        name: data.name,
        direction: data.direction,
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "Kategori dengan nama dan arah yang sama sudah ada" },
        { status: 400 }
      );
    }

    const category = await prisma.financeCategory.update({
      where: { id },
      data: {
        name: data.name,
        direction: data.direction,
      },
    });

    await logActivity({
      userId: sessionUser.id,
      action: "FINANCE_CATEGORY_UPDATED",
      entity: "FinanceCategory",
      entityId: id,
      details: {
        name: category.name,
        direction: category.direction,
      },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("PATCH /api/finance/categories/[id] error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Data kategori tidak valid" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Gagal memperbarui kategori keuangan" },
      { status: 500 }
    );
  }
}

// DELETE /api/finance/categories/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const editable = await getEditableCategory(id);
    if ("error" in editable) {
      return NextResponse.json(
        { error: editable.error },
        { status: editable.status }
      );
    }

    const category = await prisma.financeCategory.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    await logActivity({
      userId: sessionUser.id,
      action: "FINANCE_CATEGORY_DEACTIVATED",
      entity: "FinanceCategory",
      entityId: id,
      details: {
        name: category.name,
        direction: category.direction,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/finance/categories/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal menonaktifkan kategori keuangan" },
      { status: 500 }
    );
  }
}
