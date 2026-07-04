import { NextRequest, NextResponse } from "next/server";
import { getDashboardOverview } from "@/lib/dashboard";
import { ADMIN_MANAGER_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";

// GET /api/dashboard/summary
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat mengakses dashboard" },
        { status: 403 }
      );
    }

    const overview = await getDashboardOverview();
    return NextResponse.json({
      data: overview.summary,
    });
  } catch (error) {
    console.error("GET /api/dashboard/summary error:", error);
    return NextResponse.json({ error: "Gagal memuat summary" }, { status: 500 });
  }
}
