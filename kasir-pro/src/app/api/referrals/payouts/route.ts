import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePayoutBatch, monthlyPeriod } from "@/lib/referral-engine";
import { ADMIN_ONLY_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { handleApiError, jsonOk } from "@/lib/api-response";

// GET /api/referrals/payouts - Riwayat payout komisi (Super Admin)
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasRequiredRole(sessionUser.role, ADMIN_ONLY_ROLES)) {
      return NextResponse.json(
        { error: "Hanya Super Admin yang dapat mengakses data payout" },
        { status: 403 }
      );
    }

    const payouts = await prisma.referralPayout.findMany({
      include: {
        partner: { select: { id: true, fullName: true, phone: true, referralCode: true } },
      },
      orderBy: [{ period: "desc" }, { createdAt: "desc" }],
      take: 200,
    });

    return jsonOk(payouts);
  } catch (error) {
    return handleApiError(error, "GET /api/referrals/payouts", "Gagal memuat data payout");
  }
}

// POST /api/referrals/payouts - Proses komisi bulanan -> payout PENDING (idempotent)
export async function POST(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasRequiredRole(sessionUser.role, ADMIN_ONLY_ROLES)) {
      return NextResponse.json(
        { error: "Hanya Super Admin yang dapat memproses komisi" },
        { status: 403 }
      );
    }

    const period = monthlyPeriod();
    const result = await generatePayoutBatch(period);

    return jsonOk(
      result,
      result.generated > 0
        ? `${result.generated} payout komisi periode ${period} berhasil diproses`
        : `Tidak ada komisi terhutang pada periode ${period}`
    );
  } catch (error) {
    return handleApiError(error, "POST /api/referrals/payouts", "Gagal memproses komisi bulanan");
  }
}
