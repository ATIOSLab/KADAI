import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { SUPER_ADMIN_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { handleApiError, jsonOk, jsonError } from "@/lib/api-response";
import { daysUntil } from "@/lib/platform";

// GET /api/platform/subscriptions — daftar tenant + status langganan (khusus SUPER_ADMIN)
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) return jsonError("Unauthorized", 401);
    if (!hasRequiredRole(sessionUser.role, SUPER_ADMIN_ROLES)) {
      return jsonError("Hanya Super Admin yang dapat mengelola langganan", 403);
    }

    const stores = await prisma.store.findMany({
      select: {
        id: true,
        name: true,
        tier: true,
        businessType: true,
        createdAt: true,
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            tier: true,
            cycle: true,
            status: true,
            startedAt: true,
            expiresAt: true,
          },
        },
        invoices: { select: { id: true, status: true, amount: true } },
        _count: { select: { users: true, outlets: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = stores.map((store) => {
      const subscription = store.subscriptions[0] ?? null;
      const pendingInvoices = store.invoices.filter((i) => i.status === "PENDING");
      const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.amount.toNumber(), 0);
      return {
        storeId: store.id,
        storeName: store.name,
        businessType: store.businessType,
        storeTier: store.tier,
        createdAt: store.createdAt,
        userCount: store._count.users,
        outletCount: store._count.outlets,
        subscription,
        daysRemaining: daysUntil(subscription?.expiresAt ?? null),
        pendingInvoiceCount: pendingInvoices.length,
        pendingInvoiceAmount: pendingAmount,
      };
    });

    return jsonOk(data);
  } catch (error) {
    return handleApiError(error, "GET /api/platform/subscriptions", "Gagal memuat daftar langganan");
  }
}
