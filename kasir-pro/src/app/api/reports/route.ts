import { NextRequest, NextResponse } from "next/server";
import { FINANCE_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { getDefaultDashboardRange, getCurrentWeekRange, getWeekRangeFromDate } from "@/lib/dashboard-periods";
import { getReportSnapshot } from "@/lib/reporting";

// GET /api/reports?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&weekDate=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, FINANCE_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat mengakses laporan" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const defaultRange = getDefaultDashboardRange();
    const defaultWeek = getCurrentWeekRange();

    const startDateParam = searchParams.get("startDate") ?? defaultRange.startDate;
    const endDateParam = searchParams.get("endDate") ?? defaultRange.endDate;
    const weekDateParam = searchParams.get("weekDate") ?? defaultWeek.startDate;

    if (startDateParam > endDateParam) {
      return NextResponse.json(
        { error: "Tanggal mulai tidak boleh melebihi tanggal akhir" },
        { status: 400 }
      );
    }
    const normalizedWeek = getWeekRangeFromDate(weekDateParam);
    const report = await getReportSnapshot({
      startDate: startDateParam,
      endDate: endDateParam,
      weekDate: normalizedWeek.startDate,
    });

    return NextResponse.json({
      data: report,
    });
  } catch (error) {
    console.error("GET /api/reports error:", error);
    if (error instanceof Error && error.message === "INVALID_REPORT_DATE") {
      return NextResponse.json(
        { error: "Format tanggal laporan tidak valid" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Gagal memuat data laporan" },
      { status: 500 }
    );
  }
}
