import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionUser } from "@/lib/session";
import { ADMIN_CASHIER_ROLES, hasRequiredRole } from "@/lib/rbac";

// GET /api/customers
export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const tier = searchParams.get("tier");

    const customers = await prisma.customer.findMany({
      where: {
        ...(tier && { memberTier: tier }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: { totalSpent: "desc" },
    });

    return NextResponse.json({ data: customers });
  } catch (error) {
    console.error("GET /api/customers error:", error);
    return NextResponse.json({ error: "Gagal memuat data pelanggan" }, { status: 500 });
  }
}

// POST /api/customers
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, ADMIN_CASHIER_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, phone, email, address, memberTier, notes } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Nama pelanggan wajib diisi" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        memberTier: memberTier || "BRONZE",
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, data: customer }, { status: 201 });
  } catch (error) {
    console.error("POST /api/customers error:", error);
    return NextResponse.json({ error: "Gagal menambahkan pelanggan" }, { status: 500 });
  }
}

// PUT /api/customers
export async function PUT(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, ADMIN_CASHIER_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, phone, email, address, memberTier, notes, loyaltyPoints, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "ID pelanggan wajib diisi" }, { status: 400 });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(memberTier && { memberTier }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(loyaltyPoints !== undefined && { loyaltyPoints: Number(loyaltyPoints) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/customers error:", error);
    return NextResponse.json({ error: "Gagal memperbarui data pelanggan" }, { status: 500 });
  }
}
