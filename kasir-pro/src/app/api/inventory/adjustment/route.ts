import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { withWriteConflictRetry } from "@/lib/write-conflict-retry";
import { prisma } from "@/lib/prisma";
import { ApiBusinessError, handleApiError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity-logger";
import { INVENTORY_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { resolveTenantScope } from "@/lib/tenant-scope";
import { z } from "zod";

const adjustmentSchema = z.object({
  productId: z.string().min(1),
  // Cabang tempat barang hilang/rusak. Tanpa ini potongan FIFO menyapu batch
  // seluruh cabang sehingga kerugian satu cabang menggerus stok cabang lain.
  outletId: z.string().optional().nullable(),
  // Penyesuaian tanpa perubahan jumlah hanya menambah baris di buku stok tanpa
  // mengubah apa pun; itu menyulitkan audit karena tidak ada kejadian nyata.
  quantityChange: z.number().int().refine((v) => v !== 0, {
    message: "Jumlah penyesuaian tidak boleh 0 — tidak ada stok yang berubah",
  }),
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

    // Cabang penyesuaian: permintaan -> cabang pengguna -> cabang utama.
    let effectiveOutletId = data.outletId || null;
    if (effectiveOutletId) {
      const outlet = await prisma.outlet.findFirst({
        where: { id: effectiveOutletId, storeId: scope.storeId },
        select: { id: true },
      });
      if (!outlet) {
        return NextResponse.json(
          { error: "Cabang tidak ditemukan pada tenant ini" },
          { status: 400 }
        );
      }
    } else {
      const userRec = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { outletId: true },
      });
      effectiveOutletId = userRec?.outletId ?? null;
      if (!effectiveOutletId) {
        // Tenant multi-cabang: jangan menebak. Dulu permintaan tanpa cabang
        // otomatis jatuh ke cabang utama, sehingga kerugian cabang PIK tercatat
        // menggerus stok Menteng tanpa satu pun pesan di layar.
        const activeOutlets = await prisma.outlet.count({
          where: { isActive: true, storeId: scope.storeId },
        });
        if (activeOutlets > 1) {
          throw new ApiBusinessError(
            "Pilih cabang terlebih dahulu: penyesuaian stok harus jelas cabangnya",
            400,
            "OUTLET_REQUIRED"
          );
        }

        const mainOutlet = await prisma.outlet.findFirst({
          where: { isMain: true, isActive: true, storeId: scope.storeId },
          select: { id: true },
        });
        effectiveOutletId = mainOutlet?.id ?? null;
      }
    }

    if (!effectiveOutletId) {
      throw new ApiBusinessError(
        "Pilih cabang terlebih dahulu: penyesuaian stok harus jelas cabangnya",
        400,
        "OUTLET_REQUIRED"
      );
    }

    // Catatan penyesuaian dan pemotongan batch harus satu transaksi: kalau
    // pemotongan gagal, catatan -N tanpa stok yang keluar akan menyesatkan opname.
    // Serializable + klaim batch: dua opname bersamaan tidak boleh memotong batch
    // yang sama sampai minus.
    const adjustment = await withWriteConflictRetry(() => prisma.$transaction(async (tx) => {
      const created = await tx.stockAdjustment.create({
        data: {
          productId: data.productId,
          quantityChange: data.quantityChange,
          reason: data.reason,
          notes: data.notes,
          userId: sessionUser.id,
          storeId: scope.storeId,
          outletId: effectiveOutletId,
        },
        include: { product: true, user: true },
      });

      // Penyesuaian negatif memotong batch tertua (FIFO)
      if (data.quantityChange < 0) {
        let remaining = Math.abs(data.quantityChange);
        // Hanya batch cabang ini (plus batch tanpa cabang sebagai jaring
        // pengaman data lama) yang boleh dipotong.
        const batches = await tx.productBatch.findMany({
          where: {
            productId: data.productId,
            remainingQty: { gt: 0 },
            OR: [{ outletId: effectiveOutletId }, { outletId: null }],
          },
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
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }), {
      context: "inventory.adjustment",
      exhaustedCode: "ADJUSTMENT_BUSY",
      exhaustedMessage:
        "Penyesuaian stok ini sedang diproses oleh permintaan lain. Muat ulang halaman lalu simpan ulang.",
    });

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

    const outletFilter = searchParams.get("outletId");
    const where = {
      storeId: scope.storeId,
      ...(outletFilter && outletFilter !== "ALL" ? { outletId: outletFilter } : {}),
    };

    const [adjustments, total] = await Promise.all([
      prisma.stockAdjustment.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          user: { select: { id: true, name: true } },
          outlet: { select: { id: true, name: true, code: true } },
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
