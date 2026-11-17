import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiBusinessError, handleApiError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity-logger";
import { INVENTORY_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { resolveTenantScope } from "@/lib/tenant-scope";
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

    if (!hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat melakukan adjustment stok" },
        { status: 403 }
      );
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const body = await request.json();
    const data = adjustmentSchema.parse(body);

    // Pastikan produk milik tenant pemanggil
    const product = await prisma.product.findFirst({
      where: { id: data.productId, storeId: scope.storeId },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    // Catatan penyesuaian dan pemotongan batch harus satu transaksi: kalau
    // pemotongan gagal, catatan -N tanpa stok yang keluar akan menyesatkan opname.
    // Serializable + klaim batch: dua opname bersamaan tidak boleh memotong batch
    // yang sama sampai minus.
    const adjustment = await prisma.$transaction(async (tx) => {
      const created = await tx.stockAdjustment.create({
        data: {
          productId: data.productId,
          quantityChange: data.quantityChange,
          reason: data.reason,
          notes: data.notes,
          userId: sessionUser.id,
          storeId: scope.storeId,
        },
        include: { product: true, user: true },
      });

      // Penyesuaian negatif memotong batch tertua (FIFO)
      if (data.quantityChange < 0) {
        let remaining = Math.abs(data.quantityChange);
        const batches = await tx.productBatch.findMany({
          where: { productId: data.productId, remainingQty: { gt: 0 } },
          orderBy: { purchaseDate: "asc" },
        });

        for (const batch of batches) {
          if (remaining <= 0) break;
          const deduct = Math.min(remaining, batch.remainingQty);
          const claim = await tx.productBatch.updateMany({
            where: { id: batch.id, remainingQty: { gte: deduct } },
            data: { remainingQty: { decrement: deduct } },
          });
          if (claim.count !== 1) {
            throw new ApiBusinessError(
              "Stok berubah saat penyesuaian diproses. Silakan ulangi.",
              409,
              "STOCK_ALREADY_TAKEN"
            );
          }
          remaining -= deduct;
        }

        // Stok fisik kurang dari yang dicatat: tolak, jangan catat angka yang
        // tidak pernah keluar dari gudang (stok sistem jadi menggelembung).
        if (remaining > 0) {
          throw new ApiBusinessError(
            `Stok ${created.product.name} tidak mencukupi untuk penyesuaian ${Math.abs(data.quantityChange)}: hanya tersedia ${Math.abs(data.quantityChange) - remaining}.`,
            409,
            "INSUFFICIENT_STOCK"
          );
        }
      }

      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

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
    // Aturan bisnis (mis. stok kurang) harus 4xx, bukan 500
    return handleApiError(error, "POST /api/inventory/adjustment", "Gagal adjustment stok");
  }
}

// GET /api/inventory/adjustment — Adjustment history
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat melihat riwayat adjustment stok" },
        { status: 403 }
      );
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where = { storeId: scope.storeId };

    const [adjustments, total] = await Promise.all([
      prisma.stockAdjustment.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockAdjustment.count({ where }),
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
