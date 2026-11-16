import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session";
import { hasRequiredRole, INVENTORY_ROLES } from "@/lib/rbac";
import { createTransferSchema, updateTransferStatusSchema } from "@/lib/validators/transfer";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { Decimal } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";
import { resolveTenantScope } from "@/lib/tenant-scope";

// GET /api/inventory/transfers
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return jsonError("Unauthorized", 401);
    }

    if (!hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return jsonError("Akses ditolak", 403);
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return jsonError(scope.message, scope.status);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const sourceOutletId = searchParams.get("sourceOutletId");
    const destinationOutletId = searchParams.get("destinationOutletId");

    // Isolasi tenant: hanya transfer yang melibatkan cabang tenant pemanggil
    const where: Prisma.StockTransferWhereInput = {
      AND: [
        { sourceOutlet: { storeId: scope.storeId } },
        { destinationOutlet: { storeId: scope.storeId } },
      ],
    };
    if (status && status !== "ALL") where.status = status as any;
    if (sourceOutletId && sourceOutletId !== "ALL") where.sourceOutletId = sourceOutletId;
    if (destinationOutletId && destinationOutletId !== "ALL") where.destinationOutletId = destinationOutletId;

    const transfers = await prisma.stockTransfer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        sourceOutlet: {
          select: { id: true, name: true, code: true, outletType: true },
        },
        destinationOutlet: {
          select: { id: true, name: true, code: true, outletType: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, unit: true },
            },
          },
        },
      },
    });

    return jsonOk(transfers);
  } catch (error) {
    return handleApiError(error, "GET /api/inventory/transfers", "Gagal memuat riwayat transfer stok");
  }
}

// POST /api/inventory/transfers
export async function POST(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return jsonError("Unauthorized", 401);
    }

    if (!hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return jsonError("Hanya Admin, Manager, atau Staf Gudang yang dapat membuat transfer stok", 403);
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return jsonError(scope.message, scope.status);
    }

    const body = await request.json();
    const validated = createTransferSchema.parse(body);

    // Kedua cabang wajib milik tenant pemanggil
    const ownedOutlets = await prisma.outlet.count({
      where: {
        storeId: scope.storeId,
        id: { in: [validated.sourceOutletId, validated.destinationOutletId] },
      },
    });
    if (ownedOutlets !== 2) {
      return jsonError("Cabang asal/tujuan bukan milik tenant Anda", 403);
    }

    // Produk yang dimutasi wajib milik tenant pemanggil
    const productIds = validated.items.map((item) => item.productId);
    const ownedProducts = await prisma.product.count({
      where: { id: { in: productIds }, storeId: scope.storeId },
    });
    if (ownedProducts !== new Set(productIds).size) {
      return jsonError("Ada produk yang bukan milik tenant Anda", 403);
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    // Nomor transfer unik global (definisi schema) → penomoran tetap memakai hitungan global
    const count = await prisma.stockTransfer.count();
    const transferNumber = `TRF-${dateStr}-${String(count + 1).padStart(4, "0")}`;

    const newTransfer = await prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.create({
        data: {
          transferNumber,
          sourceOutletId: validated.sourceOutletId,
          destinationOutletId: validated.destinationOutletId,
          status: "IN_TRANSIT",
          notes: validated.notes || null,
          createdById: sessionUser.id,
          shippedAt: new Date(),
          items: {
            create: validated.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              costPrice: new Decimal(item.costPrice || 0),
              notes: item.notes || null,
            })),
          },
        },
        include: {
          sourceOutlet: true,
          destinationOutlet: true,
          items: {
            include: { product: true },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          action: "STOCK_TRANSFERRED",
          entity: "StockTransfer",
          entityId: transfer.id,
          userId: sessionUser.id,
          details: {
            transferNumber,
            from: transfer.sourceOutlet.name,
            to: transfer.destinationOutlet.name,
            itemCount: validated.items.length,
          },
        },
      });

      return transfer;
    });

    return jsonOk(newTransfer, `Transfer ${transferNumber} berhasil dibuat`, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/inventory/transfers", "Gagal membuat transfer stok");
  }
}

// PUT /api/inventory/transfers
export async function PUT(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return jsonError("Unauthorized", 401);
    }

    if (!hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return jsonError("Akses ditolak", 403);
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return jsonError(scope.message, scope.status);
    }

    const body = await request.json();
    const validated = updateTransferStatusSchema.parse(body);

    const transfer = await prisma.stockTransfer.findFirst({
      where: {
        id: validated.id,
        OR: [
          { sourceOutlet: { storeId: scope.storeId } },
          { destinationOutlet: { storeId: scope.storeId } },
        ],
      },
      include: {
        items: { include: { product: true } },
        sourceOutlet: true,
        destinationOutlet: true,
      },
    });

    if (!transfer) {
      return jsonError("Transfer tidak ditemukan pada tenant Anda", 404);
    }

    if (transfer.status !== "IN_TRANSIT" && transfer.status !== "DRAFT") {
      return jsonError(`Transfer ini sudah berstatus ${transfer.status}`, 400);
    }

    if (validated.action === "RECEIVE") {
      await prisma.$transaction(async (tx) => {
        for (const item of transfer.items) {
          const sourceBatches = await tx.productBatch.findMany({
            where: {
              productId: item.productId,
              remainingQty: { gt: 0 },
              OR: [{ outletId: transfer.sourceOutletId }, { outletId: null }],
            },
            orderBy: { purchaseDate: "asc" },
          });

          let remainingToDeduct = item.quantity;
          let calculatedCostPrice = new Decimal(item.costPrice || 0);

          for (const batch of sourceBatches) {
            if (remainingToDeduct <= 0) break;
            const takeQty = Math.min(remainingToDeduct, batch.remainingQty);
            await tx.productBatch.update({
              where: { id: batch.id },
              data: { remainingQty: { decrement: takeQty } },
            });
            calculatedCostPrice = batch.costPrice;
            remainingToDeduct -= takeQty;
          }

          const destBatchNumber = `TRF-${transfer.transferNumber}-${item.product.sku}`;
          await tx.productBatch.create({
            data: {
              batchNumber: destBatchNumber,
              productId: item.productId,
              quantity: item.quantity,
              remainingQty: item.quantity,
              costPrice: calculatedCostPrice,
              sellingPrice: new Decimal(0),
              outletId: transfer.destinationOutletId,
              notes: `Diterima dari mutasi transfer ${transfer.transferNumber} (${transfer.sourceOutlet.name})`,
              purchaseDate: new Date(),
            },
          });

          await tx.stockAdjustment.create({
            data: {
              productId: item.productId,
              quantityChange: -item.quantity,
              reason: "OTHER",
              notes: `Mutasi transfer keluar ke ${transfer.destinationOutlet.name} (${transfer.transferNumber})`,
              userId: sessionUser.id,
              storeId: scope.storeId,
            },
          });

          await tx.stockAdjustment.create({
            data: {
              productId: item.productId,
              quantityChange: item.quantity,
              reason: "OTHER",
              notes: `Penerimaan transfer stok dari ${transfer.sourceOutlet.name} (${transfer.transferNumber})`,
              userId: sessionUser.id,
              storeId: scope.storeId,
            },
          });
        }

        await tx.stockTransfer.update({
          where: { id: validated.id },
          data: {
            status: "RECEIVED",
            receivedAt: new Date(),
            receivedById: sessionUser.id,
          },
        });

        await tx.activityLog.create({
          data: {
            action: "STOCK_TRANSFERRED",
            entity: "StockTransfer",
            entityId: transfer.id,
            userId: sessionUser.id,
            details: {
              status: "RECEIVED",
              transferNumber: transfer.transferNumber,
              destination: transfer.destinationOutlet.name,
            },
          },
        });
      });

      return jsonOk(
        null,
        `Stok transfer ${transfer.transferNumber} berhasil diterima di ${transfer.destinationOutlet.name}`
      );
    }

    if (validated.action === "CANCEL") {
      await prisma.stockTransfer.update({
        where: { id: validated.id },
        data: { status: "CANCELLED" },
      });
      return jsonOk(null, `Transfer ${transfer.transferNumber} dibatalkan`);
    }

    return jsonError("Aksi tidak dikenali", 400);
  } catch (error) {
    return handleApiError(error, "PUT /api/inventory/transfers", "Gagal memperbarui status transfer");
  }
}
