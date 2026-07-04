import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import { ADMIN_MANAGER_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { z } from "zod";

const adjustmentSchema = z.object({
  productId: z.string().min(1),
  quantityChange: z.number().int(),
  reason: z.enum(["DAMAGED", "LOST", "EXPIRED", "STOCK_OPNAME", "OTHER"]),
  notes: z.string().optional(),
});

// POST /api/inventory/adjustment
export async function POST(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat melakukan adjustment stok" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = adjustmentSchema.parse(body);

    // Create adjustment record
    const adjustment = await prisma.stockAdjustment.create({
      data: {
        productId: data.productId,
        quantityChange: data.quantityChange,
        reason: data.reason,
        notes: data.notes,
        userId: sessionUser.id,
      },
      include: { product: true, user: true },
    });

    // If negative adjustment, reduce from oldest batch (FIFO)
    if (data.quantityChange < 0) {
      let remaining = Math.abs(data.quantityChange);
      const batches = await prisma.productBatch.findMany({
        where: { productId: data.productId, remainingQty: { gt: 0 } },
        orderBy: { purchaseDate: "asc" },
      });

      for (const batch of batches) {
        if (remaining <= 0) break;
        const deduct = Math.min(remaining, batch.remainingQty);
        await prisma.productBatch.update({
          where: { id: batch.id },
          data: { remainingQty: { decrement: deduct } },
        });
        remaining -= deduct;
      }
    }

    await logActivity({
      userId: sessionUser.id,
      action: "STOCK_ADJUSTED",
      entity: "StockAdjustment",
      entityId: adjustment.id,
      details: {
        productName: adjustment.product.name,
        quantityChange: data.quantityChange,
        reason: data.reason,
      },
    });

    return NextResponse.json({ success: true, data: adjustment }, { status: 201 });
  } catch (error) {
    console.error("POST /api/inventory/adjustment error:", error);
    return NextResponse.json({ error: "Gagal adjustment stok" }, { status: 500 });
  }
}

// GET /api/inventory/adjustment — Adjustment history
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const [adjustments, total] = await Promise.all([
      prisma.stockAdjustment.findMany({
        include: {
          product: { select: { id: true, name: true, sku: true } },
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockAdjustment.count(),
    ]);

    return NextResponse.json({
      data: adjustments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/inventory/adjustment error:", error);
    return NextResponse.json({ error: "Gagal memuat riwayat adjustment" }, { status: 500 });
  }
}
