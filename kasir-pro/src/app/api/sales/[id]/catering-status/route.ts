import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_CASHIER_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { resolveTenantScope } from "@/lib/tenant-scope";
import { cateringStatusSchema } from "@/lib/validators/sale";
import {
  canTransitionCateringStatus,
  CATERING_STATUS_LABELS,
  cateringRemaining,
} from "@/lib/catering";
import { ApiBusinessError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity-logger";
import type { CateringStatus } from "@prisma/client";
import { ZodError } from "zod";

// POST /api/sales/[id]/catering-status
// Memajukan tahap booking catering (Dipesan → Disetujui → Diproduksi →
// Terkirim → Selesai) atau membatalkannya. Perpindahan divalidasi terhadap
// matriks transisi; status Selesai menuntut tagihan sudah lunas.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasRequiredRole(sessionUser.role, ADMIN_CASHIER_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat mengubah status booking" },
        { status: 403 }
      );
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const { id } = await params;
    const body = await request.json();
    const data = cateringStatusSchema.parse(body);

    const sale = await prisma.sale.findFirst({
      where: {
        id,
        OR: [
          { storeId: scope.storeId },
          { storeId: null, outlet: { storeId: scope.storeId } },
        ],
      },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        cateringStatus: true,
        cateringPaidAmount: true,
      },
    });
    if (!sale) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }
    if (!sale.cateringStatus) {
      return NextResponse.json(
        { error: "Transaksi ini bukan booking catering" },
        { status: 400 }
      );
    }

    const from = sale.cateringStatus as CateringStatus;
    const to = data.status as CateringStatus;
    if (!canTransitionCateringStatus(from, to)) {
      return NextResponse.json(
        {
          error: `Status tidak bisa berpindah dari ${CATERING_STATUS_LABELS[from]} ke ${CATERING_STATUS_LABELS[to]}`,
        },
        { status: 400 }
      );
    }
    if (to === "COMPLETED") {
      const remaining = cateringRemaining(
        sale.totalAmount.toString(),
        sale.cateringPaidAmount?.toString() ?? "0"
      );
      if (remaining > 0) {
        return NextResponse.json(
          {
            error: `Booking belum lunas, sisa Rp ${remaining.toLocaleString("id-ID")} harus diterima dulu`,
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Penulisan kondisi: status hanya berpindah bila masih seperti yang dibaca,
      // supaya dua pengubah bersamaan tidak saling menimpa.
      const pushed = await tx.sale.updateMany({
        where: { id: sale.id, cateringStatus: from },
        data: { cateringStatus: to },
      });
      if (pushed.count !== 1) {
        throw new ApiBusinessError(
          "Status booking berubah oleh pengguna lain, muat ulang dan coba lagi",
          409,
          "CATERING_STATUS_CONFLICT"
        );
      }
      return tx.sale.findFirst({
        where: { id: sale.id },
        include: {
          cashier: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, unit: true } },
            },
          },
          cateringPayments: {
            orderBy: { paidAt: "asc" },
            select: {
              id: true,
              amount: true,
              method: true,
              paidAt: true,
              note: true,
              createdBy: { select: { id: true, name: true } },
            },
          },
        },
      });
    });

    await logActivity({
      userId: sessionUser.id,
      action: "CATERING_STATUS_CHANGED",
      entity: "Sale",
      entityId: sale.id,
      details: {
        invoiceNumber: sale.invoiceNumber,
        from,
        to,
        note: data.note?.trim() || null,
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      const first = error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? "Input tidak valid" },
        { status: 400 }
      );
    }
    if (error instanceof ApiBusinessError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error("POST catering-status error:", error);
    return NextResponse.json(
      { error: "Gagal mengubah status booking" },
      { status: 500 }
    );
  }
}
