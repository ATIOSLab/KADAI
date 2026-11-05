import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session";
import { hasRequiredRole, INVENTORY_ROLES } from "@/lib/rbac";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const sourceOutletId = searchParams.get("sourceOutletId");
    const destinationOutletId = searchParams.get("destinationOutletId");

    const transfers = await prisma.stockTransfer.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(sourceOutletId && { sourceOutletId }),
        ...(destinationOutletId && { destinationOutletId }),
      },
      include: {
        sourceOutlet: { select: { id: true, name: true, code: true, outletType: true } },
        destinationOutlet: { select: { id: true, name: true, code: true, outletType: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: transfers });
  } catch (error) {
    console.error("GET /api/inventory/transfers error:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar transfer stok" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return NextResponse.json(
        { error: "Hanya Admin, Manager, atau Staf Gudang yang dapat membuat transfer stok" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { sourceOutletId, destinationOutletId, notes, items } = body;

    if (!sourceOutletId || !destinationOutletId) {
      return NextResponse.json(
        { error: "Cabang asal dan cabang tujuan wajib dipilih" },
        { status: 400 }
      );
    }

    if (sourceOutletId === destinationOutletId) {
      return NextResponse.json(
        { error: "Cabang asal dan tujuan tidak boleh sama" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Daftar barang transfer tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Generate unique Transfer Number TRF-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const countToday = await prisma.stockTransfer.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });
    const transferNumber = `TRF-${dateStr}-${String(countToday + 1).padStart(4, "0")}`;

    const newTransfer = await prisma.$transaction(async (tx) => {
      // Create transfer record
      const transfer = await tx.stockTransfer.create({
        data: {
          transferNumber,
          sourceOutletId,
          destinationOutletId,
          status: "IN_TRANSIT",
          notes: notes || null,
          createdById: sessionUser.id,
          shippedAt: new Date(),
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: Number(item.quantity),
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

      // Log activity
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
            itemCount: items.length,
          },
        },
      });

      return transfer;
    });

    return NextResponse.json({ success: true, data: newTransfer });
  } catch (error: any) {
    console.error("POST /api/inventory/transfers error:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal membuat transfer stok" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return NextResponse.json(
        { error: "Akses ditolak" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json(
        { error: "ID transfer dan aksi wajib disertakan" },
        { status: 400 }
      );
    }

    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        sourceOutlet: true,
        destinationOutlet: true,
      },
    });

    if (!transfer) {
      return NextResponse.json({ error: "Transfer tidak ditemukan" }, { status: 404 });
    }

    if (transfer.status !== "IN_TRANSIT" && transfer.status !== "DRAFT") {
      return NextResponse.json(
        { error: `Transfer ini sudah berstatus ${transfer.status}` },
        { status: 400 }
      );
    }

    if (action === "RECEIVE") {
      // Execute physical stock transfer between outlets
      await prisma.$transaction(async (tx) => {
        for (const item of transfer.items) {
          // 1. Deduct from source outlet batch
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

          // 2. Add / Upsert batch into destination outlet
          const destBatchNumber = `TRF-${transfer.transferNumber}-${item.product.sku}`;
          await tx.productBatch.create({
            data: {
              batchNumber: destBatchNumber,
              productId: item.productId,
              outletId: transfer.destinationOutletId,
              quantity: item.quantity,
              remainingQty: item.quantity,
              costPrice: calculatedCostPrice,
              sellingPrice: calculatedCostPrice.mul(1.3), // default 30% markup or preserve
              purchaseDate: new Date(),
              notes: `Transfer dari ${transfer.sourceOutlet.name} (${transfer.transferNumber})`,
            },
          });
        }

        // Update transfer status
        await tx.stockTransfer.update({
          where: { id },
          data: {
            status: "RECEIVED",
            receivedAt: new Date(),
            receivedById: sessionUser.id,
          },
        });

        // Audit log
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

      return NextResponse.json({
        success: true,
        message: `Stok transfer ${transfer.transferNumber} berhasil diterima di ${transfer.destinationOutlet.name}`,
      });
    }

    if (action === "CANCEL") {
      await prisma.stockTransfer.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
      return NextResponse.json({
        success: true,
        message: `Transfer ${transfer.transferNumber} dibatalkan`,
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
  } catch (error: any) {
    console.error("PUT /api/inventory/transfers error:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal memperbarui status transfer" },
      { status: 500 }
    );
  }
}
