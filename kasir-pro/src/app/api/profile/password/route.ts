import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { logActivity } from "@/lib/activity-logger";
import { prisma } from "@/lib/prisma";
import { ALL_AUTHENTICATED_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { changePasswordSchema } from "@/lib/validators/user";

export async function PUT(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ALL_AUTHENTICATED_ROLES)) {
      return NextResponse.json(
        { error: "Anda tidak memiliki akses untuk mengubah password" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = changePasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Akun pengguna tidak ditemukan atau tidak aktif" },
        { status: 404 }
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      data.currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Password saat ini tidak sesuai" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await logActivity({
      userId: sessionUser.id,
      action: "USER_UPDATED",
      entity: "User",
      entityId: user.id,
      details: {
        name: user.name,
        changes: ["password"],
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password berhasil diperbarui",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error("PUT /api/profile/password error:", error);
    return NextResponse.json(
      { error: "Gagal mengubah password" },
      { status: 500 }
    );
  }
}
