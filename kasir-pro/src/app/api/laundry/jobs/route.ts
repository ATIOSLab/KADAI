import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session";
import { LaundryStatus, JobPaymentStatus, PaymentType } from "@prisma/client";
import { resolveTenantScope } from "@/lib/tenant-scope";
import { z } from "zod";
import { ADMIN_CASHIER_ROLES, hasRequiredRole } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Gerbang role: antrean laundry = operasional kasir, bukan seluruh staf.
    if (!hasRequiredRole(sessionUser.role, ADMIN_CASHIER_ROLES)) {
      return NextResponse.json(
        { error: "Forbidden: peran Anda tidak diizinkan mengakses antrean laundry" },
        { status: 403 }
      );
    }

    // Isolasi tenant: SUPER_ADMIN (operator platform) ditolak 403, akun tanpa store 403.
    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as LaundryStatus | null;
    const search = searchParams.get("search");

    // Scope tenant lewat relasi: LaundryJobOrder -> Outlet -> Store
    const where: any = { outlet: { storeId: scope.storeId } };
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { jobCode: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search } },
      ];
    }

    const jobs = await prisma.laundryJobOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        outlet: { select: { name: true } },
        handledBy: { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, data: jobs });
  } catch (error: any) {
    console.error("GET /api/laundry/jobs error:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar antrean laundry" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Gerbang role: hanya kasir/manajer/ADMIN yang boleh mengubah status job.
    if (!hasRequiredRole(sessionUser.role, ADMIN_CASHIER_ROLES)) {
      return NextResponse.json(
        { error: "Forbidden: peran Anda tidak diizinkan mengubah status laundry" },
        { status: 403 }
      );
    }

    // Isolasi tenant: SUPER_ADMIN (operator platform) ditolak 403, akun tanpa store 403.
    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    // Input tak terpercaya divalidasi di boundary: status & metode bayar wajib
    // berasal dari enum resmi, bukan string bebas.
    const updateJobSchema = z.object({
      id: z.string().min(1, "Job ID diperlukan"),
      status: z.nativeEnum(LaundryStatus).optional(),
      rackLocation: z.string().max(120).nullable().optional(),
      pickupPaymentMethod: z.nativeEnum(PaymentType).nullable().optional(),
      pickupPaymentRef: z.string().max(120).nullable().optional(),
    });

    const body = updateJobSchema.parse(await req.json());
    const { id, status, rackLocation, pickupPaymentMethod, pickupPaymentRef } = body;

    // Guard kepemilikan: job hanya boleh disentuh bila outlet-nya milik tenant pemanggil.
    const existing = await prisma.laundryJobOrder.findFirst({
      where: { id, outlet: { storeId: scope.storeId } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Job order tidak ditemukan" }, { status: 404 });
    }

    const updateData: any = {};
    const now = new Date();

    if (rackLocation !== undefined) {
      updateData.rackLocation = rackLocation;
    }

    if (status) {
      updateData.status = status;
      if (status === "WASHING" && !existing.washedAt) updateData.washedAt = now;
      if (status === "DRYING" && !existing.driedAt) updateData.driedAt = now;
      if (status === "IRONING" && !existing.ironedAt) updateData.ironedAt = now;
      if (status === "READY_FOR_PICKUP" && !existing.readyAt) updateData.readyAt = now;
      if (status === "COMPLETED") {
        updateData.pickedUpAt = now;
        // Mark payment as paid full if picked up
        updateData.paymentStatus = JobPaymentStatus.PAID_FULL;
        updateData.remainingAmount = 0;
        if (pickupPaymentMethod) {
          updateData.pickupPaymentMethod = pickupPaymentMethod as PaymentType;
          updateData.pickupPaymentRef = pickupPaymentRef || null;
        }
      }
    }

    const updated = await prisma.laundryJobOrder.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PATCH /api/laundry/jobs error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui status laundry" },
      { status: 500 }
    );
  }
}
