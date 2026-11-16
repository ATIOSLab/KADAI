import { NextRequest, NextResponse } from "next/server";
import { getDashboardOverview } from "@/lib/dashboard";
import { ADMIN_MANAGER_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { resolveTenantScope } from "@/lib/tenant-scope";

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

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const overview = await getDashboardOverview({ storeId: scope.storeId });
    return NextResponse.json({
      data: overview.summary,
    });
  } catch (error) {
    console.error("GET /api/dashboard/summary error:", error);
    return NextResponse.json({ error: "Gagal memuat summary" }, { status: 500 });
  }
}
