import { NextRequest, NextResponse } from "next/server";
import { redactCosts, SALES_READ_ROLES } from "@/app/api/_lib/access";
import { prisma } from "@/lib/prisma";
import { hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";

// GET /api/sales/[id] — Sale detail with batch allocations
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = getSessionUserFromRequest(_request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, SALES_READ_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat melihat transaksi" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        cashier: { select: { id: true, name: true, email: true, role: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit: true } },
            batchAllocations: {
              include: {
                productBatch: { select: { batchNumber: true } },
              },
            },
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    if (sessionUser.role === "CASHIER" && sale.cashierId !== sessionUser.id) {
      return NextResponse.json(
        { error: "Anda hanya dapat melihat transaksi milik Anda sendiri" },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: redactCosts(sale, sessionUser.role) });
  } catch (error) {
    console.error("GET /api/sales/[id] error:", error);
    return NextResponse.json({ error: "Gagal memuat detail transaksi" }, { status: 500 });
  }
}
