import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session";
import { hasRequiredRole, INVENTORY_ROLES } from "@/lib/rbac";
import { createTransferSchema, updateTransferStatusSchema } from "@/lib/validators/transfer";
import {
  ApiBusinessError,
  jsonOk,
  jsonError,
  handleApiError,
} from "@/lib/api-response";
import { Decimal } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";
import { withUniqueNumberRetry } from "@/lib/unique-number-retry";
import { resolveTenantScope } from "@/lib/tenant-scope";
import { checkFeature } from "@/lib/plan-limits";
import { formatInTimeZone } from "date-fns-tz";
import { resolveBusinessTimezone } from "@/lib/business-timezone";

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

/**
 * `transferNumber` unik GLOBAL tetapi dihitung per-hari. Dua transfer bersamaan
 * bisa menghitung nomor yang sama dan menabrak constraint (P2002) - ulangi dengan
 * nomor segar; hitungan ulang otomatis memakai nomor berikutnya.
 */
function createTransferWithRetry<T>(run: () => Promise<T>): Promise<T> {
  return withUniqueNumberRetry(run, { uniqueFields: ["transferNumber"] });
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

    // Transfer stok adalah fitur paket: paket tanpa flag ini ditolak 403
    const featureCheck = await checkFeature(scope.storeId, "transferStock");
    if (!featureCheck.allowed) {
      return jsonError(featureCheck.message, 403);
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

    // Tanggal & urutan nomor transfer mengikuti zona bisnis toko, bukan jam server
    // (UTC), dan urutannya per-hari agar awal hari kembali ke 0001.
    const timezone = await resolveBusinessTimezone();
    const dateStr = formatInTimeZone(new Date(), timezone, "yyyyMMdd");

    const newTransfer = await createTransferWithRetry(async () => {
      const count = await prisma.stockTransfer.count({
        where: { transferNumber: { startsWith: `TRF-${dateStr}` } },
      });
      const transferNumber = `TRF-${dateStr}-${String(count + 1).padStart(4, "0")}`;

      return prisma.$transaction(async (tx) => {
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
    });

    return jsonOk(
      newTransfer,
      `Transfer ${newTransfer.transferNumber} berhasil dibuat`,
      201
    );
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
        // Klaim atomik: hanya SATU permintaan yang boleh mengubah IN_TRANSIT →
        // RECEIVED. Sebelumnya dua klik "Terima" bersamaan sama-sama lolos
        // pemeriksaan status di luar transaksi, dan satu-satunya pengaman adalah
        // unique batchNumber — pengguna melihat 409 "batchNumber tersebut sudah
        // digunakan", bukan penjelasan bahwa transfernya sudah diterima.
        const claim = await tx.stockTransfer.updateMany({
          where: { id: validated.id, status: { in: ["IN_TRANSIT", "DRAFT"] } },
          data: {
            status: "RECEIVED",
            receivedAt: new Date(),
            receivedById: sessionUser.id,
          },
        });
        if (claim.count !== 1) {
          throw new ApiBusinessError(
            `Transfer ${transfer.transferNumber} sudah diterima sebelumnya`,
            409,
            "TRANSFER_ALREADY_RECEIVED"
          );
        }

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
          // Harga pokok & harga jual tujuan = rata-rata TERTIMBANG batch sumber yang
          // benar-benar dipakai. Sebelumnya: cost diambil dari batch terakhir yang
          // dibaca, dan harga jual tujuan ditulis 0 (barang tak bisa dijual lagi).
          let costValue = new Decimal(0);
          let priceValue = new Decimal(0);

          for (const batch of sourceBatches) {
            if (remainingToDeduct <= 0) break;
            const takeQty = Math.min(remainingToDeduct, batch.remainingQty);
            await tx.productBatch.update({
              where: { id: batch.id },
              data: { remainingQty: { decrement: takeQty } },
            });
            costValue = costValue.add(new Decimal(batch.costPrice).mul(takeQty));
            priceValue = priceValue.add(new Decimal(batch.sellingPrice).mul(takeQty));
            remainingToDeduct -= takeQty;
          }

          // Stok sumber kurang: gagalkan SELURUH transaksi. Tanpa ini cabang tujuan
          // menerima barang yang tidak pernah keluar dari gudang sumber - stok
          // tercipta dari ketiadaan dan jejak audit tidak seimbang.
          if (remainingToDeduct > 0) {
            throw new ApiBusinessError(
              `Stok ${item.product.name} di cabang asal tidak mencukupi: dibutuhkan ${item.quantity}, tersedia ${item.quantity - remainingToDeduct}. Perbarui transfer sebelum menerima barang.`,
              409,
              "INSUFFICIENT_STOCK"
            );
          }

          const receivedQty = new Decimal(Math.max(1, item.quantity));
          const averageCost = costValue.div(receivedQty);
          let averagePrice = priceValue.div(receivedQty);

          if (averagePrice.lte(0)) {
            // Batch sumber tanpa harga jual (mis. hasil transfer lama): pakai harga
            // jual terakhir produk ini supaya barang tetap bisa dijual di tujuan.
            const reference = await tx.productBatch.findFirst({
              where: { productId: item.productId, sellingPrice: { gt: 0 } },
              orderBy: { createdAt: "desc" },
              select: { sellingPrice: true },
            });
            averagePrice = reference
              ? new Decimal(reference.sellingPrice)
              : new Decimal(0);
          }

          const destBatchNumber = `TRF-${transfer.transferNumber}-${item.product.sku}`;
          await tx.productBatch.create({
            data: {
              batchNumber: destBatchNumber,
              productId: item.productId,
              quantity: item.quantity,
              remainingQty: item.quantity,
              costPrice: averageCost,
              sellingPrice: averagePrice,
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
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

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
