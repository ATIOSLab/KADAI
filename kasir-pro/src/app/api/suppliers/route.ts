import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionUser } from "@/lib/session";
import { INVENTORY_ROLES, hasRequiredRole } from "@/lib/rbac";
import { createSupplierSchema, updateSupplierSchema } from "@/lib/validators/supplier";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { resolveTenantScope } from "@/lib/tenant-scope";
import { logActivity } from "@/lib/activity-logger";

// GET /api/suppliers
export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return jsonError("Unauthorized", 401);
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return jsonError(scope.message, scope.status);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    // Pemasok yang dinonaktifkan tidak boleh ikut muncul di pemilih restock,
    // tetapi masih perlu bisa dilihat untuk audit riwayat pembelian.
    const includeInactive = searchParams.get("includeInactive") === "1";

    const suppliers = await prisma.supplier.findMany({
      where: {
        storeId: scope.storeId,
        ...(includeInactive ? {} : { isActive: true }),
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

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return jsonError(scope.message, scope.status);
    }

    const body = await req.json();
    const validated = createSupplierSchema.parse(body);

    const supplier = await prisma.supplier.create({
      data: {
        name: validated.name,
        phone: validated.phone || null,
        email: validated.email || null,
        address: validated.address || null,
        storeId: scope.storeId,
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

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return jsonError(scope.message, scope.status);
    }

    const body = await req.json();
    const validated = updateSupplierSchema.parse(body);

    const owned = await prisma.supplier.findFirst({
      where: { id: validated.id, storeId: scope.storeId },
      select: { id: true, isActive: true },
    });
    if (!owned) {
      return jsonError("Data tidak ditemukan pada tenant Anda", 404);
    }

    const statusBerubah =
      validated.isActive !== undefined && validated.isActive !== owned.isActive;

    const pemasok = await prisma.supplier.update({
      where: { id: validated.id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.phone !== undefined && { phone: validated.phone || null }),
        ...(validated.email !== undefined && { email: validated.email || null }),
        ...(validated.address !== undefined && { address: validated.address || null }),
        ...(validated.isActive !== undefined && { isActive: validated.isActive }),
      },
    });

    if (statusBerubah) {
      await logActivity({
        userId: sessionUser.id,
        action: validated.isActive ? "SUPPLIER_ACTIVATED" : "SUPPLIER_DEACTIVATED",
        entity: "supplier",
        entityId: pemasok.id,
        details: { name: pemasok.name, cara: "PUT" },
      });
    }

    return jsonOk(
      pemasok,
      statusBerubah
        ? `Pemasok "${pemasok.name}" ${validated.isActive ? "diaktifkan" : "dinonaktifkan"}`
        : "Data pemasok berhasil diperbarui"
    );
  } catch (error) {
    return handleApiError(error, "PUT /api/suppliers", "Gagal memperbarui data pemasok");
  }
}

/**
 * DELETE /api/suppliers?id=...
 *
 * Menonaktifkan pemasok (soft delete). Pemasok tidak pernah dihapus permanen
 * karena batch stok dan riwayat pembelian masih menunjuk ke barisnya; yang
 * berhenti hanyalah kemunculannya di pemilih restock. Idempoten: menonaktifkan
 * pemasok yang sudah nonaktif tetap dijawab 200 agar tombol yang terklik dua
 * kali tidak memunculkan error palsu.
 */
export async function DELETE(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return jsonError("Unauthorized", 401);
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return jsonError(scope.message, scope.status);
    }

    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id")?.trim() || "";
    if (!id) {
      // Sebagian klien mengirim id di body (pola yang sama dengan PUT).
      const body = await req.json().catch(() => ({}));
      id = typeof body?.id === "string" ? body.id.trim() : "";
    }
    if (!id) {
      return jsonError("ID pemasok wajib disertakan", 400);
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id, storeId: scope.storeId },
      select: { id: true, name: true, isActive: true },
    });
    if (!supplier) {
      return jsonError("Data tidak ditemukan pada tenant Anda", 404);
    }

    if (!supplier.isActive) {
      return jsonOk({ id: supplier.id, isActive: false }, `Pemasok "${supplier.name}" sudah nonaktif`);
    }

    await prisma.supplier.update({
      where: { id: supplier.id },
      data: { isActive: false },
    });

    await logActivity({
      userId: sessionUser.id,
      action: "SUPPLIER_DEACTIVATED",
      entity: "supplier",
      entityId: supplier.id,
      details: { name: supplier.name },
    });

    return jsonOk({ id: supplier.id, isActive: false }, `Pemasok "${supplier.name}" dinonaktifkan`);
  } catch (error) {
    return handleApiError(error, "DELETE /api/suppliers", "Gagal menonaktifkan pemasok");
  }
}
