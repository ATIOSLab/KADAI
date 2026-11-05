import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionUser } from "@/lib/session";
import { hasRequiredRole, INVENTORY_ROLES } from "@/lib/rbac";
import { produceBatchSchema } from "@/lib/validators/produce";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { Decimal } from "@prisma/client/runtime/library";

// POST /api/products/[id]/produce
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) {
      return jsonError("Unauthorized", 401);
    }

    if (!hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return jsonError(
        "Hanya Admin, Manager, atau Staf Gudang yang dapat mengeksekusi produksi batch",
        403
      );
    }

    const { id: productId } = await params;
    const body = await req.json();
    const validated = produceBatchSchema.parse(body);

    const qty = validated.quantityToProduce;

    // 1. Fetch product, recipes, and existing batches to inherit selling price
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        batches: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        recipesAsParent: {
          include: {
            ingredient: {
              select: {
                id: true,
                name: true,
                sku: true,
                unit: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return jsonError("Produk tidak ditemukan", 404);
    }

    if (product.recipesAsParent.length === 0) {
      return jsonError(
        `Produk "${product.name}" belum memiliki resep Bill of Materials (BOM)`,
        400
      );
    }

    const fallbackSellingPrice = product.batches[0]?.sellingPrice || new Decimal(0);

    // 2. Resolve target outlet
    let effectiveOutletId = validated.outletId || null;
    if (!effectiveOutletId) {
      const defaultOutlet = await prisma.outlet.findFirst({
        where: { isMain: true },
      });
      effectiveOutletId = defaultOutlet?.id || null;
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const finalBatchNumber =
      validated.batchNumber?.trim() || `PROD-${product.sku}-${dateStr}-${randomSuffix}`;

    // 3. Execute atomic production transaction
    const result = await prisma.$transaction(async (tx) => {
      let totalBatchCost = new Decimal(0);

      for (const recipe of product.recipesAsParent) {
        const qtyPerPortion = Number(recipe.quantityNeeded);
        const wastage = Number(recipe.wastagePercent || 0);
        const totalNeeded = Math.ceil(qtyPerPortion * qty * (1 + wastage / 100));

        const availableBatches = await tx.productBatch.findMany({
          where: {
            productId: recipe.ingredientId,
            remainingQty: { gt: 0 },
            ...(effectiveOutletId
              ? { OR: [{ outletId: effectiveOutletId }, { outletId: null }] }
              : {}),
          },
          orderBy: { purchaseDate: "asc" },
        });

        const totalAvailable = availableBatches.reduce(
          (sum, b) => sum + b.remainingQty,
          0
        );

        if (totalAvailable < totalNeeded) {
          throw new Error(
            `Stok bahan baku "${recipe.ingredient.name}" tidak mencukupi. Dibutuhkan ${totalNeeded} ${recipe.ingredient.unit || "unit"}, tersedia hanya ${totalAvailable}`
          );
        }

        let remainingToDeduct = totalNeeded;
        for (const batch of availableBatches) {
          if (remainingToDeduct <= 0) break;
          const take = Math.min(remainingToDeduct, batch.remainingQty);

          await tx.productBatch.update({
            where: { id: batch.id },
            data: { remainingQty: { decrement: take } },
          });

          const costContribution = batch.costPrice.mul(take);
          totalBatchCost = totalBatchCost.add(costContribution);

          await tx.stockAdjustment.create({
            data: {
              productId: recipe.ingredientId,
              quantityChange: -take,
              reason: "OTHER",
              notes: `Konsumsi bahan baku untuk produksi ${qty} unit ${product.name} (Batch: ${finalBatchNumber})`,
              userId: sessionUser.id,
            },
          });

          remainingToDeduct -= take;
        }
      }

      const unitCost = totalBatchCost.div(qty);

      const newBatch = await tx.productBatch.create({
        data: {
          productId: product.id,
          batchNumber: finalBatchNumber,
          quantity: qty,
          remainingQty: qty,
          costPrice: unitCost,
          sellingPrice: fallbackSellingPrice,
          outletId: effectiveOutletId,
          purchaseDate: new Date(),
          expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
          notes: validated.notes || "Produksi batch mandiri dari resep BOM",
        },
      });

      await tx.stockAdjustment.create({
        data: {
          productId: product.id,
          quantityChange: qty,
          reason: "OTHER",
          notes: `Hasil produksi batch ${finalBatchNumber} (${qty} unit)`,
          userId: sessionUser.id,
        },
      });

      await tx.activityLog.create({
        data: {
          action: "BATCH_PRODUCED",
          entity: "ProductBatch",
          entityId: newBatch.id,
          userId: sessionUser.id,
          details: {
            productName: product.name,
            batchNumber: finalBatchNumber,
            quantityProduced: qty,
            unitCost: unitCost.toNumber(),
            totalCost: totalBatchCost.toNumber(),
            outletId: effectiveOutletId,
          },
        },
      });

      return {
        batch: newBatch,
        totalCost: totalBatchCost.toNumber(),
        unitCost: unitCost.toNumber(),
      };
    });

    return jsonOk(
      result,
      `Berhasil memproduksi ${qty} unit "${product.name}" dengan Batch #${finalBatchNumber}`,
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/products/[id]/produce", "Gagal memproses eksekusi produksi batch");
  }
}
