import { NextRequest, NextResponse } from "next/server";
import { ApiBusinessError, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { voidSaleSchema } from "@/lib/validators/sale";
import { restoreFIFODeductions } from "@/lib/fifo";
import { logActivity } from "@/lib/activity-logger";
import {
  FINANCE_SYSTEM_CATEGORY_KEYS,
  getSystemFinanceCategoryId,
} from "@/lib/finance";
import { getSessionUserFromRequest } from "@/lib/session";
import { resolveTenantScope } from "@/lib/tenant-scope";
import { ADMIN_MANAGER_ROLES, hasRequiredRole } from "@/lib/rbac";
import { verifySupervisorPin } from "@/lib/rbac/pin";

// POST /api/sales/[id]/void — Void a sale and restore stock
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ["ADMIN", "MANAGER", "CASHIER"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const { id } = await params;
    const body = await request.json();
    const { reason } = voidSaleSchema.parse(body);

    const isSupervisor = hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES);
    let approvedSupervisorName: string | null = null;

    if (!isSupervisor) {
      // Kasir memerlukan verifikasi PIN Supervisor
      const pin = body.supervisorPin;
      if (!pin) {
        return NextResponse.json(
          { error: "Pembatalan transaksi oleh kasir memerlukan PIN Supervisor" },
          { status: 403 }
        );
      }

      const clientIp =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const pinCheck = await verifySupervisorPin(pin, clientIp);
      if (!pinCheck.valid) {
        return NextResponse.json(
          { error: pinCheck.error || "PIN Supervisor tidak valid" },
          { status: 403 }
        );
      }
      approvedSupervisorName = `${pinCheck.supervisor?.name} (${pinCheck.supervisor?.role})`;
    }

    const sale = await prisma.sale.findFirst({
      where: {
        id,
        OR: [
          { storeId: scope.storeId },
          { storeId: null, outlet: { storeId: scope.storeId } },
        ],
      },
      include: {
        items: {
          include: { batchAllocations: true },
        },
      },
    });

    if (!sale) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    if (sessionUser.role === "CASHIER" && sale.cashierId !== sessionUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (sale.isVoided) {
      return NextResponse.json(
        {
          success: false,
          error: "Transaksi sudah di-void",
          code: "SALE_ALREADY_VOIDED",
        },
        { status: 409 }
      );
    }

    // Restore stock in transaction
    await prisma.$transaction(async (tx) => {
      // Atomic claim prevents concurrent requests from restoring stock twice.
      const claim = await tx.sale.updateMany({
        where: {
          id,
          isVoided: false,
          OR: [
            { storeId: scope.storeId },
            { storeId: null, outlet: { storeId: scope.storeId } },
          ],
        },
        data: { isVoided: true },
      });
      if (claim.count !== 1) {
        throw new ApiBusinessError(
          "Transaksi ini sudah dibatalkan sebelumnya",
          409,
          "SALE_ALREADY_VOIDED"
        );
      }
      // Mark sale as voided
      const voidedSale = await tx.sale.update({
        where: { id },
        data: {
          isVoided: true,
          voidedAt: new Date(),
          voidReason: reason,
        },
      });

      const saleVoidCategoryId = await getSystemFinanceCategoryId(
        tx,
        FINANCE_SYSTEM_CATEGORY_KEYS.SALE_VOID_OUTFLOW
      );

      await tx.financeEntry.create({
        data: {
          amount: voidedSale.totalAmount,
          direction: "OUT",
          source: "SALE_VOID",
          title: `Void ${sale.invoiceNumber}`,
          notes: reason,
          entryDate: voidedSale.voidedAt ?? new Date(),
          categoryId: saleVoidCategoryId,
          createdByUserId: sessionUser.id,
          saleId: id,
          storeId: scope.storeId,
        },
      });

      // Restore batch quantities
      const allocations = sale.items.flatMap((item) =>
        item.batchAllocations.map((alloc) => ({
          productBatchId: alloc.productBatchId,
          quantity: alloc.quantity,
        }))
      );

      await restoreFIFODeductions(tx, allocations);

      // Tiket dapur milik transaksi batal wajib ikut dibatalkan. Tanpa ini
      // layar KDS tetap menampilkan pesanan yang uangnya sudah dikembalikan,
      // sehingga dapur memasak hidangan yang tidak akan pernah dibayar.
      await tx.kDSOrder.updateMany({
        where: {
          saleId: id,
          status: { in: ["QUEUED", "COOKING", "READY"] },
        },
        data: { status: "CANCELED" },
      });
    });

    await logActivity({
      userId: sessionUser.id,
      action: "SALE_VOIDED",
      entity: "Sale",
      entityId: id,
      details: {
        invoiceNumber: sale.invoiceNumber,
        reason,
        approvedBy: approvedSupervisorName || `${sessionUser.name} (${sessionUser.role})`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Void ganda / transaksi bukan milik tenant = aturan bisnis (4xx), bukan 500
    return handleApiError(error, "POST /api/sales/[id]/void", "Gagal void transaksi");
  }
}
