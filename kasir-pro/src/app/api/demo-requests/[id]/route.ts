import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ADMIN_ONLY_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { handleApiError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

const updateSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "CONTACTED", "REJECTED"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ADMIN_ONLY_ROLES)) {
      return NextResponse.json(
        { error: "Hanya Super Admin yang dapat menyetujui permohonan demo" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateSchema.parse(body);

    const updated = await prisma.demoRequest.update({
      where: { id },
      data: {
        status: validated.status,
        approvedAt: validated.status === "APPROVED" ? new Date() : undefined,
        approvedBy: validated.status === "APPROVED" ? sessionUser.name : undefined,
      },
    });

    // Lifecycle referral: demo disetujui -> lead naik ke TRIAL (attribution by phone)
    if (validated.status === "APPROVED" && updated.phone) {
      const phoneTail = updated.phone.replace(/[^0-9]/g, "").slice(-10);
      if (phoneTail.length >= 6) {
        const transition = await prisma.referralLead.updateMany({
          where: { phone: { contains: phoneTail }, status: "LEAD" },
          data: { status: "TRIAL", packageTier: "DEMO" },
        });
        if (transition.count > 0) {
          logger.info("Lead referral naik ke TRIAL dari persetujuan demo", "referral", {
            demoRequestId: id,
            phone: phoneTail.slice(-4),
          });
        }
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleApiError(error, "PATCH /api/demo-requests/[id]", "Gagal memperbarui status permohonan demo");
  }
}
