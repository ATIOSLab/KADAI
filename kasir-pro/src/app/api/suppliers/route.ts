import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionUser } from "@/lib/session";
import { INVENTORY_ROLES, hasRequiredRole } from "@/lib/rbac";
import { createSupplierSchema, updateSupplierSchema } from "@/lib/validators/supplier";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";

// GET /api/suppliers
export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return jsonError("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";

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

    return jsonOk(suppliers);
  } catch (error) {
    return handleApiError(error, "GET /api/suppliers", "Gagal memuat data pemasok");
  }
}

// POST /api/suppliers
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return jsonError("Forbidden", 403);
    }

    const body = await req.json();
    const validated = createSupplierSchema.parse(body);

    const supplier = await prisma.supplier.create({
      data: {
        name: validated.name,
        phone: validated.phone || null,
        email: validated.email || null,
        address: validated.address || null,
      },
    });

    return jsonOk(supplier, "Pemasok berhasil ditambahkan", 201);
  } catch (error) {
    return handleApiError(error, "POST /api/suppliers", "Gagal menambahkan pemasok");
  }
}

// PUT /api/suppliers
export async function PUT(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return jsonError("Forbidden", 403);
    }

    const body = await req.json();
    const validated = updateSupplierSchema.parse(body);

    const supplier = await prisma.supplier.update({
      where: { id: validated.id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.phone !== undefined && { phone: validated.phone || null }),
        ...(validated.email !== undefined && { email: validated.email || null }),
        ...(validated.address !== undefined && { address: validated.address || null }),
      },
    });

    return jsonOk(supplier, "Data pemasok berhasil diperbarui");
  } catch (error) {
    return handleApiError(error, "PUT /api/suppliers", "Gagal memperbarui data pemasok");
  }
}
