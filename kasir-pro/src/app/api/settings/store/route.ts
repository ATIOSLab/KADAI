import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_ONLY_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";

// GET /api/settings/store
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ADMIN_ONLY_ROLES)) {
      return NextResponse.json(
        { error: "Hanya admin yang dapat mengakses pengaturan toko" },
        { status: 403 }
      );
    }

    let store = await prisma.store.findFirst();
    if (!store) {
      store = await prisma.store.create({
        data: { name: "Toko Saya" },
      });
    }
    return NextResponse.json({ data: store });
  } catch (error) {
    console.error("GET /api/settings/store error:", error);
    return NextResponse.json({ error: "Gagal memuat konfigurasi toko" }, { status: 500 });
  }
}

// PUT /api/settings/store
export async function PUT(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ADMIN_ONLY_ROLES)) {
      return NextResponse.json(
        { error: "Hanya admin yang dapat mengubah pengaturan toko" },
        { status: 403 }
      );
    }

    const body = await request.json();
    let store = await prisma.store.findFirst();

    if (store) {
      store = await prisma.store.update({
        where: { id: store.id },
        data: body,
      });
    } else {
      store = await prisma.store.create({ data: body });
    }

    return NextResponse.json({ success: true, data: store });
  } catch (error) {
    console.error("PUT /api/settings/store error:", error);
    return NextResponse.json({ error: "Gagal update konfigurasi toko" }, { status: 500 });
  }
}
