import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionUser } from "@/lib/session";
import { hasRequiredRole, ADMIN_MANAGER_ROLES } from "@/lib/rbac";

export async function GET() {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tables = await prisma.restaurantTable.findMany({
      orderBy: [{ section: "asc" }, { tableNo: "asc" }],
      include: {
        sales: {
          where: { isVoided: false },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            customerName: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ data: tables });
  } catch (error) {
    console.error("GET /api/tables error:", error);
    return NextResponse.json(
      { error: "Gagal memuat data meja" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { tableNo, section = "Utama", capacity = 4 } = body;

    if (!tableNo || typeof tableNo !== "string") {
      return NextResponse.json(
        { error: "Nomor meja wajib diisi" },
        { status: 400 }
      );
    }

    const qrToken = `table-${tableNo.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;

    const table = await prisma.restaurantTable.create({
      data: {
        tableNo,
        section,
        capacity: Number(capacity) || 4,
        qrToken,
      },
    });

    return NextResponse.json({ data: table }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/tables error:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Nomor meja atau token sudah digunakan" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Gagal menambahkan meja" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, tableNo, section, capacity, isOccupied } = body;

    if (!id) {
      return NextResponse.json({ error: "ID meja wajib diisi" }, { status: 400 });
    }

    const updated = await prisma.restaurantTable.update({
      where: { id },
      data: {
        ...(tableNo && { tableNo }),
        ...(section && { section }),
        ...(capacity !== undefined && { capacity: Number(capacity) }),
        ...(isOccupied !== undefined && { isOccupied: Boolean(isOccupied) }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PUT /api/tables error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui meja" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID meja wajib diisi" }, { status: 400 });
    }

    await prisma.restaurantTable.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tables error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus meja" },
      { status: 500 }
    );
  }
}
