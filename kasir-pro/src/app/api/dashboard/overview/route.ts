import { NextRequest, NextResponse } from "next/server";
import { getDashboardOverview } from "@/lib/dashboard";
import { ADMIN_MANAGER_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";

function parseDateParam(value: string | null, endOfDay = false) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

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

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const startDate = parseDateParam(startDateParam);
    const endDate = parseDateParam(endDateParam, true);

    if (startDate === null || endDate === null) {
      return NextResponse.json(
        { error: "Format tanggal dashboard tidak valid" },
        { status: 400 }
      );
    }

    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        { error: "Tanggal mulai tidak boleh melebihi tanggal akhir" },
        { status: 400 }
      );
    }

    const overview = await getDashboardOverview({
      startDate: startDate,
      endDate: endDate,
    });
    return NextResponse.json({ data: overview });
  } catch (error) {
    console.error("GET /api/dashboard/overview error:", error);
    return NextResponse.json(
      { error: "Gagal memuat data dashboard" },
      { status: 500 }
    );
  }
}
