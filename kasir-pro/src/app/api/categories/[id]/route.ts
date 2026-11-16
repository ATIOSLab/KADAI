import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateCategorySchema } from "@/lib/validators/category";
import { INVENTORY_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { resolveTenantScope } from "@/lib/tenant-scope";

// PUT /api/categories/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser || !hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const { id } = await params;
    const owned = await prisma.category.findFirst({
      where: { id, storeId: scope.storeId },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan pada tenant Anda" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = updateCategorySchema.parse(body);
    const category = await prisma.category.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("PUT /api/categories/[id] error:", error);
    return NextResponse.json({ error: "Gagal update kategori" }, { status: 500 });
  }
}

// DELETE /api/categories/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser || !hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const { id } = await params;
    const owned = await prisma.category.findFirst({
      where: { id, storeId: scope.storeId },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan pada tenant Anda" },
        { status: 404 }
      );
    }

    await prisma.category.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/categories/[id] error:", error);
    return NextResponse.json({ error: "Gagal hapus kategori" }, { status: 500 });
  }
}
