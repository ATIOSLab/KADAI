import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionUser } from "@/lib/session";
import { ADMIN_MANAGER_ROLES, INVENTORY_ROLES, hasRequiredRole } from "@/lib/rbac";

// GET /api/suppliers
export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const suppliers = await prisma.supplier.findMany({
      where: {
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        _count: {
          select: { batches: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: suppliers });
  } catch (error) {
    console.error("GET /api/suppliers error:", error);
    return NextResponse.json({ error: "Gagal memuat data pemasok" }, { status: 500 });
  }
}

// POST /api/suppliers
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, phone, email, address } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Nama pemasok wajib diisi" }, { status: 400 });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (error) {
    console.error("POST /api/suppliers error:", error);
    return NextResponse.json({ error: "Gagal menambahkan pemasok" }, { status: 500 });
  }
}

// PUT /api/suppliers
export async function PUT(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, phone, email, address, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "ID pemasok wajib diisi" }, { status: 400 });
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/suppliers error:", error);
    return NextResponse.json({ error: "Gagal memperbarui data pemasok" }, { status: 500 });
  }
}

// DELETE /api/suppliers
export async function DELETE(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID pemasok wajib disertakan" }, { status: 400 });
    }

    await prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: "Pemasok berhasil dinonaktifkan" });
  } catch (error) {
    console.error("DELETE /api/suppliers error:", error);
    return NextResponse.json({ error: "Gagal menghapus pemasok" }, { status: 500 });
  }
}
