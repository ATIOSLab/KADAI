import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SUPER_ADMIN_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { handleApiError } from "@/lib/api-response";

// GET /api/referrals - Khusus Super Admin / Owner
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, SUPER_ADMIN_ROLES)) {
      return NextResponse.json(
        { error: "Hanya Super Admin yang dapat mengakses data mitra referral" },
        { status: 403 }
      );
    }

    const partners = await prisma.referralPartner.findMany({
      include: {
        leads: {
          orderBy: { createdAt: "desc" },
        },
        payouts: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: partners });
  } catch (error) {
    return handleApiError(error, "GET /api/referrals", "Gagal memuat data mitra referral");
  }
}
