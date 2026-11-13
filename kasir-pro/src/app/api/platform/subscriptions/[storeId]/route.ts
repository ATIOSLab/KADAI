import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import { SUPER_ADMIN_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { handleApiError, jsonOk, jsonError } from "@/lib/api-response";
import { subscriptionUpdateSchema } from "@/lib/validators/platform";
import { syncStoreTier } from "@/lib/platform";
import { ActionType } from "@prisma/client";

// GET /api/platform/subscriptions/[storeId] — detail langganan satu tenant
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const sessionUser = getSessionUserFromRequest(_request);
    if (!sessionUser) return jsonError("Unauthorized", 401);
    if (!hasRequiredRole(sessionUser.role, SUPER_ADMIN_ROLES)) {
      return jsonError("Hanya Super Admin yang dapat mengelola langganan", 403);
    }

    const { storeId } = await params;
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        tier: true,
        businessType: true,
        subscriptions: { orderBy: { createdAt: "desc" } },
        invoices: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });
    if (!store) return jsonError("Tenant tidak ditemukan", 404);

    return jsonOk(store);
  } catch (error) {
    return handleApiError(error, "GET /api/platform/subscriptions/[storeId]", "Gagal memuat langganan");
  }
}

// PUT /api/platform/subscriptions/[storeId] — kelola langganan tenant (khusus SUPER_ADMIN)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) return jsonError("Unauthorized", 401);
    if (!hasRequiredRole(sessionUser.role, SUPER_ADMIN_ROLES)) {
      return jsonError("Hanya Super Admin yang dapat mengelola langganan", 403);
    }

    const { storeId } = await params;
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return jsonError("Tenant tidak ditemukan", 404);

    const body = subscriptionUpdateSchema.parse(await request.json());

    const activeSubscription = await prisma.storeSubscription.findFirst({
      where: { storeId },
      orderBy: { createdAt: "desc" },
    });

    switch (body.action) {
      case "SET_TIER_CYCLE": {
        const tier = body.tier!;
        if (activeSubscription) {
          await prisma.storeSubscription.update({
            where: { id: activeSubscription.id },
            data: { tier, cycle: body.cycle ?? activeSubscription.cycle },
          });
        } else {
          await prisma.storeSubscription.create({
            data: { storeId, tier, cycle: body.cycle ?? "MONTHLY", status: "ACTIVE" },
          });
        }
        await syncStoreTier(storeId, tier);
        break;
      }

      case "SET_STATUS": {
        if (!activeSubscription) return jsonError("Tenant belum memiliki langganan", 404);
        await prisma.storeSubscription.update({
          where: { id: activeSubscription.id },
          data: { status: body.status! },
        });
        break;
      }

      case "SET_EXPIRY": {
        if (!activeSubscription) return jsonError("Tenant belum memiliki langganan", 404);
        await prisma.storeSubscription.update({
          where: { id: activeSubscription.id },
          data: { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null },
        });
        break;
      }

      case "SUSPEND_TENANT": {
        if (activeSubscription) {
          await prisma.storeSubscription.update({
            where: { id: activeSubscription.id },
            data: { status: "CANCELLED" },
          });
        }
        if (body.suspendOwners) {
          await prisma.user.updateMany({
            where: { storeId, role: "ADMIN" },
            data: { isActive: false },
          });
        }
        await logActivity({
          userId: sessionUser.id,
          action: ActionType.TENANT_SUSPENDED,
          entity: "Store",
          entityId: storeId,
          details: { storeName: store.name, suspendOwners: body.suspendOwners },
        });
        return jsonOk({ storeId, status: "CANCELLED" }, "Tenant berhasil disuspend");
      }
    }

    await logActivity({
      userId: sessionUser.id,
      action: ActionType.SUBSCRIPTION_UPDATED,
      entity: "StoreSubscription",
      entityId: storeId,
      details: { storeName: store.name, action: body.action, tier: body.tier, cycle: body.cycle, status: body.status, expiresAt: body.expiresAt },
    });

    const updated = await prisma.storeSubscription.findFirst({
      where: { storeId },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk(updated, "Langganan tenant berhasil diperbarui");
  } catch (error) {
    return handleApiError(error, "PUT /api/platform/subscriptions/[storeId]", "Gagal memperbarui langganan");
  }
}
