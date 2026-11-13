import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { SUPER_ADMIN_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { handleApiError } from "@/lib/api-response";

const updatePartnerSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  commissionRate: z.number().min(5).max(50).optional(),
  payoutAmount: z.number().min(10000).optional(),
  payoutNotes: z.string().max(255).optional(),
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

    if (!hasRequiredRole(sessionUser.role, SUPER_ADMIN_ROLES)) {
      return NextResponse.json(
        { error: "Hanya Super Admin yang dapat mengelola mitra referral" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updatePartnerSchema.parse(body);

    // Jika ada perintah payout komisi
    if (validated.payoutAmount) {
      const payout = await prisma.referralPayout.create({
        data: {
          partnerId: id,
          amount: validated.payoutAmount,
          status: "PAID",
          paidAt: new Date(),
          notes: validated.payoutNotes || "Transfer komisi referral",
        },
      });

      return NextResponse.json({
        success: true,
        data: payout,
        message: "Pencairan komisi referral berhasil dicatat",
      });
    }

    // Update profil mitra
    const updated = await prisma.referralPartner.update({
      where: { id },
      data: {
        status: validated.status,
        commissionRate: validated.commissionRate,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Data mitra berhasil diperbarui",
    });
  } catch (error) {
    return handleApiError(error, "PATCH /api/referrals/[id]", "Gagal memperbarui mitra referral");
  }
}
