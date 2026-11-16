import { NextRequest, NextResponse } from "next/server";
import { getDashboardOverview } from "@/lib/dashboard";
import { ADMIN_MANAGER_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { resolveTenantScope } from "@/lib/tenant-scope";

const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Tanggal dashboard diperlakukan sebagai tanggal KALENDER di zona waktu toko,
// bukan instant UTC: server produksi berjalan di UTC sehingga
// "2026-11-16T00:00:00Z" berarti 07:00 WIB dan memotong penjualan pagi.
function parseDateParam(value: string | null) {
  if (!value) {
    return undefined;
  }

  return CALENDAR_DATE_PATTERN.test(value) ? value : null;
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

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const startDate = parseDateParam(startDateParam);
    const endDate = parseDateParam(endDateParam);

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
      startDateLocal: startDate,
      endDateLocal: endDate,
      storeId: scope.storeId,
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
