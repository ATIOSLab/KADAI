import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionUser } from "@/lib/session";
import { POS_ROLES, ADMIN_MANAGER_ROLES, hasRequiredRole } from "@/lib/rbac";
import { createTableSchema, updateTableSchema } from "@/lib/validators/table";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import crypto from "crypto";

// GET /api/tables
export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, POS_ROLES)) {
      return jsonError("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const outletId = searchParams.get("outletId");

    const tables = await prisma.restaurantTable.findMany({
      where: {
        ...(outletId && outletId !== "ALL" ? { outletId } : {}),
      },
      orderBy: { tableNo: "asc" },
      include: {
        outlet: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return jsonOk(tables);
  } catch (error) {
    return handleApiError(error, "GET /api/tables", "Gagal memuat data meja");
  }
}

// POST /api/tables
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES)) {
      return jsonError("Forbidden", 403);
    }

    const body = await req.json();
    const validated = createTableSchema.parse(body);

    let effectiveOutletId = validated.outletId || null;
    if (!effectiveOutletId) {
      const defaultOutlet = await prisma.outlet.findFirst({ where: { isMain: true } });
      effectiveOutletId = defaultOutlet?.id || null;
    }

    const existing = await prisma.restaurantTable.findFirst({
      where: {
        tableNo: validated.tableNo,
        outletId: effectiveOutletId,
      },
    });

    if (existing) {
      return jsonError(`Nomor meja ${validated.tableNo} sudah ada di cabang ini`, 409);
    }

    const qrToken = crypto.randomBytes(16).toString("hex");

    const table = await prisma.restaurantTable.create({
      data: {
        tableNo: validated.tableNo,
        section: validated.section,
        capacity: validated.capacity,
        isOccupied: validated.isOccupied,
        outletId: effectiveOutletId,
        qrToken,
      },
      include: {
        outlet: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return jsonOk(table, "Meja berhasil ditambahkan", 201);
  } catch (error) {
    return handleApiError(error, "POST /api/tables", "Gagal menambahkan meja");
  }
}

// PUT /api/tables
export async function PUT(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, POS_ROLES)) {
      return jsonError("Forbidden", 403);
    }

    const body = await req.json();
    const validated = updateTableSchema.parse(body);

    const updated = await prisma.restaurantTable.update({
      where: { id: validated.id },
      data: {
        ...(validated.tableNo && { tableNo: validated.tableNo }),
        ...(validated.section && { section: validated.section }),
        ...(validated.capacity !== undefined && { capacity: validated.capacity }),
        ...(validated.isOccupied !== undefined && { isOccupied: validated.isOccupied }),
        ...(validated.outletId !== undefined && { outletId: validated.outletId }),
      },
    });

    return jsonOk(updated, "Status meja berhasil diperbarui");
  } catch (error) {
    return handleApiError(error, "PUT /api/tables", "Gagal memperbarui meja");
  }
}

// DELETE /api/tables
export async function DELETE(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES)) {
      return jsonError("Forbidden", 403);
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return jsonError("ID meja wajib disertakan", 400);
    }

    await prisma.restaurantTable.delete({
      where: { id },
    });

    return jsonOk(null, "Meja berhasil dihapus");
  } catch (error) {
    return handleApiError(error, "DELETE /api/tables", "Gagal menghapus meja");
  }
}
