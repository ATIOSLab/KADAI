import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionUser } from "@/lib/session";
import { ADMIN_MANAGER_ROLES, hasRequiredRole } from "@/lib/rbac";

// GET /api/outlets
export async function GET() {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const outlets = await prisma.outlet.findMany({
      orderBy: [{ isMain: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({ data: outlets });
  } catch (error) {
    console.error("GET /api/outlets error:", error);
    return NextResponse.json({ error: "Gagal memuat data cabang" }, { status: 500 });
  }
}

// POST /api/outlets
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, address, phone, isMain, taxType, taxRate, serviceChargeRate } = body;

    if (!name || !code) {
      return NextResponse.json({ error: "Nama dan kode cabang wajib diisi" }, { status: 400 });
    }

    // Check duplicate code
    const existing = await prisma.outlet.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (existing) {
      return NextResponse.json({ error: `Kode cabang '${code}' sudah digunakan` }, { status: 400 });
    }

    if (isMain) {
      await prisma.outlet.updateMany({
        where: { isMain: true },
        data: { isMain: false },
      });
    }

    const outlet = await prisma.outlet.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        isMain: Boolean(isMain),
        taxType: taxType || "PB1_10",
        taxRate: taxRate !== undefined ? Number(taxRate) : 10,
        serviceChargeRate: serviceChargeRate !== undefined ? Number(serviceChargeRate) : 5,
      },
    });

    return NextResponse.json({ success: true, data: outlet }, { status: 201 });
  } catch (error) {
    console.error("POST /api/outlets error:", error);
    return NextResponse.json({ error: "Gagal menambahkan cabang" }, { status: 500 });
  }
}

// PUT /api/outlets
export async function PUT(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, code, address, phone, isMain, taxType, taxRate, serviceChargeRate, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "ID cabang wajib diisi" }, { status: 400 });
    }

    if (isMain) {
      await prisma.outlet.updateMany({
        where: { isMain: true, NOT: { id } },
        data: { isMain: false },
      });
    }

    const updated = await prisma.outlet.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(code && { code: code.trim().toUpperCase() }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(isMain !== undefined && { isMain: Boolean(isMain) }),
        ...(taxType && { taxType }),
        ...(taxRate !== undefined && { taxRate: Number(taxRate) }),
        ...(serviceChargeRate !== undefined && { serviceChargeRate: Number(serviceChargeRate) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/outlets error:", error);
    return NextResponse.json({ error: "Gagal memperbarui data cabang" }, { status: 500 });
  }
}
