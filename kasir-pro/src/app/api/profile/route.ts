import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session";
import { ALL_AUTHENTICATED_ROLES, hasRequiredRole } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ALL_AUTHENTICATED_ROLES)) {
      return NextResponse.json(
        { error: "Anda tidak memiliki akses ke profil" },
        { status: 403 }
      );
    }

    const profile = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        avatar: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profil pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: profile });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(
      { error: "Gagal memuat profil pengguna" },
      { status: 500 }
    );
  }
}
