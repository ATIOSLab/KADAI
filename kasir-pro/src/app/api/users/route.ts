import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/lib/validators/user";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/activity-logger";
import { ADMIN_ONLY_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";

// GET /api/users
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ADMIN_ONLY_ROLES)) {
      return NextResponse.json(
        { error: "Hanya admin yang dapat mengelola pengguna" },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, lastLoginAt: true, createdAt: true, avatar: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: users });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Gagal memuat data user" }, { status: 500 });
  }
}

// POST /api/users
export async function POST(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ADMIN_ONLY_ROLES)) {
      return NextResponse.json(
        { error: "Hanya admin yang dapat mengelola pengguna" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createUserSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        avatar: data.avatar,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    await logActivity({
      userId: sessionUser.id,
      action: "USER_CREATED",
      entity: "User",
      entityId: user.id,
      details: { name: user.name, role: user.role },
    });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Gagal membuat user baru" }, { status: 500 });
  }
}
