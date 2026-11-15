import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, ActionType, BillingCycle } from "@prisma/client";
import { logActivity } from "@/lib/activity-logger";
import { SUPER_ADMIN_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { handleApiError, jsonOk, jsonError } from "@/lib/api-response";
import { planCreateSchema } from "@/lib/validators/platform";
import { invalidatePlanCatalog, pricesByCycle, PlanWithPrices } from "@/lib/plan-catalog";

function planView(plan: PlanWithPrices) {
  return { ...plan, prices: pricesByCycle(plan) };
}

// GET /api/platform/plans — katalog paket lengkap (termasuk nonaktif) untuk kelola
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) return jsonError("Unauthorized", 401);
    if (!hasRequiredRole(sessionUser.role, SUPER_ADMIN_ROLES)) {
      return jsonError("Hanya Super Admin yang dapat mengelola paket", 403);
    }

    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
      include: { prices: true },
    });

    return jsonOk(plans.map(planView));
  } catch (error) {
    return handleApiError(error, "GET /api/platform/plans", "Gagal memuat daftar paket");
  }
}

// POST /api/platform/plans — buat paket baru (dengan harga tiga siklus)
export async function POST(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) return jsonError("Unauthorized", 401);
    if (!hasRequiredRole(sessionUser.role, SUPER_ADMIN_ROLES)) {
      return jsonError("Hanya Super Admin yang dapat membuat paket", 403);
    }

    const body = planCreateSchema.parse(await request.json());

    const existing = await prisma.subscriptionPlan.findUnique({
      where: { code: body.code },
      select: { id: true },
    });
    if (existing) return jsonError("Kode paket sudah digunakan", 409);

    const created = await prisma.$transaction(async (tx) => {
      const plan = await tx.subscriptionPlan.create({
        data: {
          code: body.code,
          name: body.name,
          description: body.description,
          badge: body.badge,
          features: body.features,
          limits: body.limits as Prisma.InputJsonValue,
          sortOrder: body.sortOrder,
          isActive: body.isActive,
        },
      });

      await tx.planPrice.createMany({
        data: (Object.entries(body.prices) as [BillingCycle, number][]).map(
          ([cycle, amount]) => ({
            planId: plan.id,
            cycle,
            amount: new Prisma.Decimal(amount),
          })
        ),
      });

      return tx.subscriptionPlan.findUniqueOrThrow({
        where: { id: plan.id },
        include: { prices: true },
      });
    });

    invalidatePlanCatalog();
    await logActivity({
      userId: sessionUser.id,
      action: ActionType.PLAN_CREATED,
      entity: "SubscriptionPlan",
      entityId: created.id,
      details: { code: created.code, name: created.name },
    });

    return jsonOk(planView(created), "Paket berhasil dibuat", 201);
  } catch (error) {
    return handleApiError(error, "POST /api/platform/plans", "Gagal membuat paket");
  }
}
