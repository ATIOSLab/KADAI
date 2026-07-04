import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_MANAGER_ROLES,
  ALL_AUTHENTICATED_ROLES,
  hasRequiredRole,
} from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";

// GET /api/activity-log
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ALL_AUTHENTICATED_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat mengakses activity log" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const canViewAllLogs = hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES);
    const userId = canViewAllLogs
      ? searchParams.get("userId") || undefined
      : sessionUser.id;
    const action = searchParams.get("action") || undefined;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");

    const where = {
      ...(userId && { userId }),
      ...(action && { action: action as never }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate + "T23:59:59.999Z"),
        },
      }),
    };

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return NextResponse.json({
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/activity-log error:", error);
    return NextResponse.json({ error: "Gagal memuat activity log" }, { status: 500 });
  }
}
