import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionUser } from "@/lib/session";
import { POS_ROLES, ADMIN_MANAGER_ROLES, hasRequiredRole } from "@/lib/rbac";
import { createTableSchema, updateTableSchema } from "@/lib/validators/table";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { resolveTenantScope } from "@/lib/tenant-scope";
import crypto from "crypto";

// GET /api/tables
export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) {
      return jsonError("Unauthorized", 401);
    }
    if (!hasRequiredRole(sessionUser.role, POS_ROLES)) {
      return jsonError("Forbidden", 403);
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return jsonError(scope.message, scope.status);
    }

    const { searchParams } = new URL(req.url);
    const outletId = searchParams.get("outletId");

    if (outletId && outletId !== "ALL") {
      const ownedOutlet = await prisma.outlet.findFirst({
        where: { id: outletId, storeId: scope.storeId },
        select: { id: true },
      });
      if (!ownedOutlet) {
        return jsonError("Cabang tidak ditemukan pada tenant Anda", 404);
      }
    }

    const tables = await prisma.restaurantTable.findMany({
      where: {
        outlet: { storeId: scope.storeId },
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
    if (!sessionUser) {
      return jsonError("Unauthorized", 401);
    }
    if (!hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES)) {
      return jsonError("Forbidden", 403);
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return jsonError(scope.message, scope.status);
    }

    const body = await req.json();
    const validated = createTableSchema.parse(body);

    let effectiveOutletId = validated.outletId || null;
    if (!effectiveOutletId) {
      const defaultOutlet = await prisma.outlet.findFirst({
        where: { isMain: true, storeId: scope.storeId },
      });
      effectiveOutletId = defaultOutlet?.id || null;
    } else {
      const ownedOutlet = await prisma.outlet.findFirst({
        where: { id: effectiveOutletId, storeId: scope.storeId },
        select: { id: true },
      });
      if (!ownedOutlet) {
        return jsonError("Cabang tidak ditemukan pada tenant Anda", 404);
      }
    }

    const existing = await prisma.restaurantTable.findFirst({
      where: {
        tableNo: validated.tableNo,
        outletId: effectiveOutletId,
        ...(effectiveOutletId ? { outlet: { storeId: scope.storeId } } : {}),
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
    if (!sessionUser) {
      return jsonError("Unauthorized", 401);
    }
    if (!hasRequiredRole(sessionUser.role, POS_ROLES)) {
      return jsonError("Forbidden", 403);
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return jsonError(scope.message, scope.status);
    }

    const body = await req.json();
    const validated = updateTableSchema.parse(body);

    const owned = await prisma.restaurantTable.findFirst({
      where: { id: validated.id, outlet: { storeId: scope.storeId } },
      select: { id: true },
    });
    if (!owned) {
      return jsonError("Meja tidak ditemukan pada tenant Anda", 404);
    }

    if (validated.outletId) {
      const ownedOutlet = await prisma.outlet.findFirst({
        where: { id: validated.outletId, storeId: scope.storeId },
        select: { id: true },
      });
      if (!ownedOutlet) {
        return jsonError("Cabang tidak ditemukan pada tenant Anda", 404);
      }
    }

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
    if (!sessionUser) {
      return jsonError("Unauthorized", 401);
    }
    if (!hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES)) {
      return jsonError("Forbidden", 403);
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return jsonError(scope.message, scope.status);
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return jsonError("ID meja wajib disertakan", 400);
    }

    const owned = await prisma.restaurantTable.findFirst({
      where: { id, outlet: { storeId: scope.storeId } },
      select: { id: true },
    });
    if (!owned) {
      return jsonError("Meja tidak ditemukan pada tenant Anda", 404);
    }

    await prisma.restaurantTable.delete({
      where: { id },
    });

    return jsonOk(null, "Meja berhasil dihapus");
  } catch (error) {
    return handleApiError(error, "DELETE /api/tables", "Gagal menghapus meja");
  }
}
