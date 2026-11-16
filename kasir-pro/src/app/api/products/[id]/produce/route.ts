import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionUser } from "@/lib/session";
import { hasRequiredRole, INVENTORY_ROLES } from "@/lib/rbac";
import { produceBatchSchema } from "@/lib/validators/produce";
import {
  ApiBusinessError,
  jsonOk,
  jsonError,
  handleApiError,
} from "@/lib/api-response";
import { formatInTimeZone } from "date-fns-tz";
import { resolveBusinessTimezone } from "@/lib/business-timezone";
import { Decimal } from "@prisma/client/runtime/library";
import { resolveTenantScope } from "@/lib/tenant-scope";

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

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return jsonError(scope.message, scope.status);
    }

    const { id: productId } = await params;
    const body = await req.json();
    const validated = produceBatchSchema.parse(body);

    const qty = validated.quantityToProduce;

    // 1. Fetch product, recipes, and existing batches to inherit selling price
    const product = await prisma.product.findFirst({
      where: { id: productId, storeId: scope.storeId },
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

    // Harga jual hasil produksi: ikuti batch terakhir yang PUNYA harga jual. Batch
    // terakhir bisa bernilai 0 (mis. barang masuk lewat jalur lama), dan menyalin 0
    // membuat hasil produksi tidak bisa dijual.
    const priceReference = await prisma.productBatch.findFirst({
      where: { productId: product.id, sellingPrice: { gt: 0 } },
      orderBy: { createdAt: "desc" },
      select: { sellingPrice: true },
    });
    const fallbackSellingPrice =
      priceReference?.sellingPrice ?? product.batches[0]?.sellingPrice ?? new Decimal(0);

    // 2. Resolve target outlet (wajib milik tenant pemanggil)
    let effectiveOutletId = validated.outletId || null;
    if (effectiveOutletId) {
      const ownedOutlet = await prisma.outlet.findFirst({
        where: { id: effectiveOutletId, storeId: scope.storeId },
        select: { id: true },
      });
      if (!ownedOutlet) {
        return jsonError("Cabang bukan milik tenant Anda", 403);
      }
    } else {
      const defaultOutlet = await prisma.outlet.findFirst({
        where: { isMain: true, storeId: scope.storeId },
      });
      effectiveOutletId = defaultOutlet?.id || null;
    }

    // Segmen tanggal nomor batch mengikuti zona bisnis toko, bukan jam server (UTC)
    const timezone = await resolveBusinessTimezone();
    const dateStr = formatInTimeZone(new Date(), timezone, "yyyyMMdd");
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
          // Bahan baku kurang = aturan bisnis (409), bukan kegagalan server
          throw new ApiBusinessError(
            `Stok bahan baku "${recipe.ingredient.name}" tidak mencukupi. Dibutuhkan ${totalNeeded} ${recipe.ingredient.unit || "unit"}, tersedia hanya ${totalAvailable}`,
            409,
            "INSUFFICIENT_STOCK"
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
              storeId: scope.storeId,
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
          storeId: scope.storeId,
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
