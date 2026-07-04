import { FinanceSource } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { logActivity } from "@/lib/activity-logger";
import { assertFinanceAccess } from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session";
import { updateFinanceEntryPayloadSchema } from "@/lib/validators/finance";

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
};

function getFinanceForbiddenResponse(message = "Anda tidak memiliki akses ke laporan keuangan") {
  return NextResponse.json({ error: message }, { status: 403 });
}

async function getEditableEntry(id: string) {
  const entry = await prisma.financeEntry.findUnique({
    where: { id },
    include: {
      category: true,
    },
  });

  if (!entry) {
    return { error: "Transaksi keuangan tidak ditemukan", status: 404 as const };
  }

  if (entry.source !== FinanceSource.MANUAL) {
    return {
      error: "Transaksi sistem tidak dapat diubah dari menu keuangan",
      status: 403 as const,
    };
  }

  if (entry.isArchived) {
    return {
      error: "Transaksi manual ini sudah diarsipkan",
      status: 400 as const,
    };
  }

  return { entry };
}

// PATCH /api/finance/[id]
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
    const editable = await getEditableEntry(id);
    if ("error" in editable) {
      return NextResponse.json(
        { error: editable.error },
        { status: editable.status }
      );
    }

    const body = await request.json();
    const data = updateFinanceEntryPayloadSchema.parse(body);

    const category = await prisma.financeCategory.findUnique({
      where: { id: data.categoryId },
      select: {
        id: true,
        name: true,
        direction: true,
        isActive: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Kategori keuangan tidak ditemukan" },
        { status: 404 }
      );
    }

    if (!category.isActive) {
      return NextResponse.json(
        { error: "Kategori keuangan sudah nonaktif" },
        { status: 400 }
      );
    }

    if (category.direction !== data.direction) {
      return NextResponse.json(
        { error: "Kategori tidak sesuai dengan arah transaksi" },
        { status: 400 }
      );
    }

    const entry = await prisma.financeEntry.update({
      where: { id },
      data: {
        amount: data.amount,
        direction: data.direction,
        title: data.title,
        notes: data.notes,
        entryDate: new Date(data.entryDate),
        categoryId: category.id,
      },
      include: financeEntryInclude,
    });

    await logActivity({
      userId: sessionUser.id,
      action: "FINANCE_ENTRY_UPDATED",
      entity: "FinanceEntry",
      entityId: entry.id,
      details: {
        title: entry.title,
        amount: entry.amount.toString(),
        direction: entry.direction,
        categoryName: entry.category.name,
      },
    });

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    console.error("PATCH /api/finance/[id] error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Data keuangan tidak valid" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Gagal memperbarui transaksi keuangan" },
      { status: 500 }
    );
  }
}

// DELETE /api/finance/[id]
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
    const editable = await getEditableEntry(id);
    if ("error" in editable) {
      return NextResponse.json(
        { error: editable.error },
        { status: editable.status }
      );
    }

    await prisma.financeEntry.update({
      where: { id },
      data: {
        isArchived: true,
      },
    });

    await logActivity({
      userId: sessionUser.id,
      action: "FINANCE_ENTRY_ARCHIVED",
      entity: "FinanceEntry",
      entityId: id,
      details: {
        title: editable.entry.title,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/finance/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal mengarsipkan transaksi keuangan" },
      { status: 500 }
    );
  }
}
