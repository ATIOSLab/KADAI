import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionUser } from "@/lib/session";
import { KDS_ROLES, hasRequiredRole } from "@/lib/rbac";
import { Prisma } from "@prisma/client";
import { resolveTenantScope } from "@/lib/tenant-scope";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, KDS_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat mengakses KDS" },
        { status: 403 }
      );
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const { searchParams } = new URL(req.url);
    const station = searchParams.get("station"); // KITCHEN, BAR, or null for ALL
    const outletId = searchParams.get("outletId");

    const whereClause: Prisma.KDSOrderWhereInput = {
      status: { in: ["QUEUED", "COOKING", "READY"] },
      // Isolasi tenant: hanya tiket dari outlet milik tenant pemanggil
      sale: { outlet: { storeId: scope.storeId } },
    };

    if (station && station !== "ALL") {
      whereClause.station = station as any;
    }

    if (outletId && outletId !== "ALL") {
      whereClause.sale = { outletId, outlet: { storeId: scope.storeId } };
    }

    const orders = await prisma.kDSOrder.findMany({
      where: whereClause,
      orderBy: { queuedAt: "asc" },
      include: {
        sale: {
          select: {
            id: true,
            invoiceNumber: true,
            orderType: true,
            customerName: true,
            totalAmount: true,
            createdAt: true,
            outletId: true,
            outlet: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ data: orders });
  } catch (error) {
    console.error("GET /api/kds error:", error);
    return NextResponse.json(
      { error: "Gagal memuat antrean pesanan dapur" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, KDS_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat memperbarui tiket dapur" },
        { status: 403 }
      );
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID dan status wajib disertakan" },
        { status: 400 }
      );
    }

    const now = new Date();
    const updateData: any = { status };

    if (status === "COOKING") {
      updateData.startedAt = now;
    } else if (status === "READY") {
      updateData.readyAt = now;
    } else if (status === "SERVED") {
      updateData.servedAt = now;
    }

    const owned = await prisma.kDSOrder.findFirst({
      where: { id, sale: { outlet: { storeId: scope.storeId } } },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json(
        { error: "Tiket dapur tidak ditemukan" },
        { status: 404 }
      );
    }

    const updated = await prisma.kDSOrder.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PUT /api/kds error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui status tiket dapur" },
      { status: 500 }
    );
  }
}
