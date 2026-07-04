import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createBatchSchema } from "@/lib/validators/batch";
import { generateBatchNumber } from "@/lib/utils";
import { logActivity } from "@/lib/activity-logger";
import { getSessionUserFromRequest } from "@/lib/session";
import {
  FINANCE_SYSTEM_CATEGORY_KEYS,
  getSystemFinanceCategoryId,
} from "@/lib/finance";
import { ADMIN_MANAGER_ROLES, hasRequiredRole } from "@/lib/rbac";
import { ZodError } from "zod";

// POST /api/batches — Create new batch (restock)
export async function POST(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat melakukan restock" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createBatchSchema.parse(body);

    // Check product exists
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      select: { id: true, sku: true, name: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    const batch = await prisma.$transaction(async (tx) => {
      const todayBatchCount = await tx.productBatch.count({
        where: {
          productId: data.productId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      });
      const batchNumber = generateBatchNumber(product.sku, todayBatchCount + 1);
      const purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : new Date();

      const createdBatch = await tx.productBatch.create({
        data: {
          batchNumber,
          productId: data.productId,
          quantity: data.quantity,
          remainingQty: data.quantity,
          costPrice: data.costPrice,
          sellingPrice: data.sellingPrice,
          supplierId: data.supplierId,
          purchaseDate,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
          notes: data.notes,
        },
        include: { product: true, supplier: true },
      });

      const restockCategoryId = await getSystemFinanceCategoryId(
        tx,
        FINANCE_SYSTEM_CATEGORY_KEYS.RESTOCK_EXPENSE
      );

      await tx.financeEntry.create({
        data: {
          amount: new Prisma.Decimal(data.costPrice).mul(data.quantity),
          direction: "OUT",
          source: "RESTOCK",
          title: `Restock ${product.name} (${batchNumber})`,
          notes: data.notes,
          entryDate: purchaseDate,
          categoryId: restockCategoryId,
          createdByUserId: sessionUser.id,
          productBatchId: createdBatch.id,
        },
      });

      return createdBatch;
    });

    await logActivity({
      userId: sessionUser.id,
      action: "BATCH_CREATED",
      entity: "ProductBatch",
      entityId: batch.id,
      details: {
        productName: product.name,
        batchNumber: batch.batchNumber,
        quantity: data.quantity,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
      },
    });

    return NextResponse.json({ success: true, data: batch }, { status: 201 });
  } catch (error) {
    console.error("POST /api/batches error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Data batch tidak valid" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Gagal membuat batch baru" }, { status: 500 });
  }
}

// GET /api/batches — List batches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId") || undefined;
    const hasRemaining = searchParams.get("hasRemaining");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where = {
      ...(productId && { productId }),
      ...(hasRemaining === "true" && { remainingQty: { gt: 0 } }),
    };

    const [batches, total] = await Promise.all([
      prisma.productBatch.findMany({
        where,
        include: { product: true, supplier: true },
        orderBy: { purchaseDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.productBatch.count({ where }),
    ]);

    return NextResponse.json({
      data: batches,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/batches error:", error);
    return NextResponse.json({ error: "Gagal memuat data batch" }, { status: 500 });
  }
}
