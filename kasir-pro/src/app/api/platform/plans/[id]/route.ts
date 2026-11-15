import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ActionType, BillingCycle, Prisma } from "@prisma/client";
import { logActivity } from "@/lib/activity-logger";
import { SUPER_ADMIN_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { handleApiError, jsonOk, jsonError } from "@/lib/api-response";
import { planUpdateSchema } from "@/lib/validators/platform";
import { ensureNotLastActivePlan } from "@/lib/platform";
import {
  invalidatePlanCatalog,
  pricesByCycle,
  type PlanWithPrices,
} from "@/lib/plan-catalog";

function planView(plan: PlanWithPrices) {
  return { ...plan, prices: pricesByCycle(plan) };
}

// GET /api/platform/plans/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = getSessionUserFromRequest(_request);
    if (!sessionUser) return jsonError("Unauthorized", 401);
    if (!hasRequiredRole(sessionUser.role, SUPER_ADMIN_ROLES)) {
      return jsonError("Hanya Super Admin yang dapat mengelola paket", 403);
    }

    const { id } = await params;
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
      include: { prices: true },
    });
    if (!plan) return jsonError("Paket tidak ditemukan", 404);

    return jsonOk(planView(plan));
  } catch (error) {
    return handleApiError(error, "GET /api/platform/plans/[id]", "Gagal memuat paket");
  }
}

// PATCH /api/platform/plans/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) return jsonError("Unauthorized", 401);
    if (!hasRequiredRole(sessionUser.role, SUPER_ADMIN_ROLES)) {
      return jsonError("Hanya Super Admin yang dapat mengelola paket", 403);
    }

    const { id } = await params;
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
      select: { id: true, code: true, isActive: true },
    });
    if (!plan) return jsonError("Paket tidak ditemukan", 404);

    const body = planUpdateSchema.parse(await request.json());

    // Guard: paket FREE (Starter) wajib tetap Rp 0 di semua siklus.
    if (
      plan.code === "FREE" &&
      body.prices &&
      Object.values(body.prices).some((amount) => amount != null && amount > 0)
    ) {
      return jsonError("Paket FREE (Starter) wajib tetap Rp 0 di semua siklus", 400);
    }

    // Guard: paket FREE (Starter) tidak bisa diarsipkan.
    if (body.isActive === false && plan.code === "FREE") {
      return jsonError("Paket FREE (Starter) tidak dapat dinonaktifkan", 400);
    }

    // Guard: jangan biarkan semua paket menjadi non-aktif (tidak ada katalog yang terbit).
    if (body.isActive === false) {
      const canArchive = await ensureNotLastActivePlan(id);
      if (!canArchive) {
        return jsonError("Tidak dapat menonaktifkan paket aktif terakhir", 400);
      }
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.badge !== undefined) updateData.badge = body.badge;
    if (body.features !== undefined) updateData.features = body.features;
    if (body.limits !== undefined) updateData.limits = body.limits as Prisma.InputJsonValue;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    if (Object.keys(updateData).length > 0) {
      await prisma.subscriptionPlan.update({ where: { id }, data: updateData });
    }

    if (body.prices) {
      for (const [cycle, amount] of Object.entries(body.prices) as [
        BillingCycle,
        number
      ][]) {
        await prisma.planPrice.upsert({
          where: { planId_cycle: { planId: id, cycle } },
          update: { amount: new Prisma.Decimal(amount) },
          create: { planId: id, cycle, amount: new Prisma.Decimal(amount) },
        });
      }
    }

    const updated = await prisma.subscriptionPlan.findUniqueOrThrow({
      where: { id },
      include: { prices: true },
    });

    const isArchived = body.isActive === false;
    await logActivity({
      userId: sessionUser.id,
      action: isArchived ? ActionType.PLAN_ARCHIVED : ActionType.PLAN_UPDATED,
      entity: "SubscriptionPlan",
      entityId: id,
      details: isArchived
        ? { code: plan.code, name: updated.name }
        : { code: plan.code, name: updated.name, changes: Object.keys(updateData) },
    });

    invalidatePlanCatalog();

    return jsonOk(
      planView(updated),
      isArchived ? "Paket berhasil dinonaktifkan" : "Paket berhasil diperbarui"
    );
  } catch (error) {
    return handleApiError(error, "PATCH /api/platform/plans/[id]", "Gagal memperbarui paket");
  }
}
