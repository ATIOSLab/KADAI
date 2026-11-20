import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionUser } from "@/lib/session";
import { ADMIN_MANAGER_ROLES, hasRequiredRole } from "@/lib/rbac";
import { createOutletSchema, updateOutletSchema } from "@/lib/validators/outlet";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { resolveTenantScope } from "@/lib/tenant-scope";
import { logActivity } from "@/lib/activity-logger";
import { outletDeactivationBlocker } from "@/lib/outlet-lifecycle";
import { checkFeature, checkOutletLimit } from "@/lib/plan-limits";

// GET /api/outlets — daftar cabang milik tenant pemanggil
export async function GET() {
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

    const outlets = await prisma.outlet.findMany({
      where: { storeId: scope.storeId },
      orderBy: [{ isMain: "desc" }, { name: "asc" }],
    });

    return jsonOk(outlets);
  } catch (error) {
    return handleApiError(error, "GET /api/outlets", "Gagal memuat data cabang");
  }
}

// POST /api/outlets
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
    const validated = createOutletSchema.parse(body);

    // Urutan gerbang: fitur paket dulu, baru kuota. Fitur yang tidak dijual pada
    // paket harus menjawab "tidak tersedia", bukan "kuota cabang habis" — pesan
    // kuota akan menyesatkan tenant yang memang tak pernah boleh punya dapur pusat.
    if (validated.outletType === "CENTRAL_KITCHEN") {
      const featureCheck = await checkFeature(scope.storeId, "centralKitchen");
      if (!featureCheck.allowed) {
        return jsonError(featureCheck.message, 403);
      }
    }

    const limitCheck = await checkOutletLimit(scope.storeId);
    if (!limitCheck.allowed) {
      return jsonError(limitCheck.message, 403);
    }

    // Check duplicate code dalam tenant
    const existing = await prisma.outlet.findFirst({
      where: { code: validated.code, storeId: scope.storeId },
    });
    if (existing) {
      return jsonError(`Kode cabang '${validated.code}' sudah digunakan`, 409);
    }

    if (validated.isMain) {
      await prisma.outlet.updateMany({
        where: { isMain: true, storeId: scope.storeId },
        data: { isMain: false },
      });
    }

    const outlet = await prisma.outlet.create({
      data: {
        name: validated.name,
        code: validated.code,
        address: validated.address || null,
        phone: validated.phone || null,
        isMain: validated.isMain,
        taxType: validated.taxType,
        taxRate: validated.taxRate,
        serviceChargeRate: validated.serviceChargeRate,
        outletType: validated.outletType,
        kitchenWorkflow: validated.kitchenWorkflow,
        costingMethod: validated.costingMethod,
        storeId: scope.storeId,
      },
    });

    return jsonOk(outlet, "Cabang berhasil ditambahkan", 201);
  } catch (error) {
    return handleApiError(error, "POST /api/outlets", "Gagal menambahkan cabang");
  }
}

// PUT /api/outlets
export async function PUT(req: NextRequest) {
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
    const validated = updateOutletSchema.parse(body);

    const owned = await prisma.outlet.findFirst({
      where: { id: validated.id, storeId: scope.storeId },
      select: { id: true, name: true, isMain: true, isActive: true },
    });
    if (!owned) {
      return jsonError("Cabang tidak ditemukan pada tenant Anda", 404);
    }

    // Toko wajib punya tepat satu cabang utama: melepas statusnya tanpa
    // mempromosikan cabang lain membuat laci & laporan kehilangan acuan.
    if (validated.isMain === false && owned.isMain) {
      return jsonError(
        "Cabang utama tidak bisa dilepas. Jadikan cabang lain sebagai cabang utama lebih dahulu.",
        409,
        undefined,
        "MAIN_OUTLET_REQUIRED"
      );
    }

    // Menonaktifkan lewat formulir ubah harus melewati penjagaan yang sama
    // dengan tombol hapus; kalau tidak, aturan cabang utama bisa dilewati.
    if (validated.isActive === false) {
      const penolakan = await outletDeactivationBlocker(prisma, scope.storeId, owned);
      if (penolakan) {
        return jsonError(penolakan.message, 409, undefined, penolakan.code);
      }
    }

    if (validated.isMain) {
      await prisma.outlet.updateMany({
        where: { isMain: true, storeId: scope.storeId, NOT: { id: validated.id } },
        data: { isMain: false },
      });
    }

    const updated = await prisma.outlet.update({
      where: { id: validated.id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.code && { code: validated.code }),
        ...(validated.address !== undefined && { address: validated.address }),
        ...(validated.phone !== undefined && { phone: validated.phone }),
        ...(validated.isMain !== undefined && { isMain: validated.isMain }),
        ...(validated.taxType && { taxType: validated.taxType }),
        ...(validated.taxRate !== undefined && { taxRate: validated.taxRate }),
        ...(validated.serviceChargeRate !== undefined && { serviceChargeRate: validated.serviceChargeRate }),
        ...(validated.outletType && { outletType: validated.outletType }),
        ...(validated.kitchenWorkflow && { kitchenWorkflow: validated.kitchenWorkflow }),
        ...(validated.costingMethod && { costingMethod: validated.costingMethod }),
        ...(validated.isActive !== undefined && { isActive: validated.isActive }),
      },
    });

    if (validated.isActive !== undefined && validated.isActive !== owned.isActive) {
      await logActivity({
        userId: sessionUser.id,
        action: validated.isActive ? "OUTLET_ACTIVATED" : "OUTLET_DEACTIVATED",
        entity: "outlet",
        entityId: updated.id,
        details: { name: updated.name, cara: "PUT" },
      });
    }

    return jsonOk(
      updated,
      validated.isActive !== undefined && validated.isActive !== owned.isActive
        ? `Cabang "${updated.name}" ${validated.isActive ? "diaktifkan" : "dinonaktifkan"}`
        : "Cabang berhasil diperbarui"
    );
  } catch (error) {
    return handleApiError(error, "PUT /api/outlets", "Gagal memperbarui data cabang");
  }
}

/**
 * DELETE /api/outlets?id=...
 *
 * Menonaktifkan cabang (soft delete). Tiga penjagaan yang mencegah data
 * operasional jadi menggantung:
 *  1. cabang utama tidak bisa dinonaktifkan (kasir tanpa cabang kehilangan
 *     default laci),
 *  2. cabang terakhir yang aktif tidak bisa dinonaktifkan (toko jadi tanpa
 *     tempat berjualan),
 *  3. cabang dengan laci kasir masih terbuka tidak bisa dinonaktifkan (uang
 *     tunai yang belum dihitung akan hilang dari rekonsiliasi).
 */
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
    let id = searchParams.get("id")?.trim() || "";
    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = typeof body?.id === "string" ? body.id.trim() : "";
    }
    if (!id) {
      return jsonError("ID cabang wajib disertakan", 400);
    }

    const outlet = await prisma.outlet.findFirst({
      where: { id, storeId: scope.storeId },
      select: { id: true, name: true, isMain: true, isActive: true },
    });
    if (!outlet) {
      return jsonError("Data tidak ditemukan pada tenant Anda", 404);
    }
    if (!outlet.isActive) {
      return jsonOk({ id: outlet.id, isActive: false }, `Cabang "${outlet.name}" sudah nonaktif`);
    }
    const penolakan = await outletDeactivationBlocker(prisma, scope.storeId, outlet);
    if (penolakan) {
      return jsonError(penolakan.message, 409, undefined, penolakan.code);
    }

    await prisma.outlet.update({ where: { id: outlet.id }, data: { isActive: false } });

    await logActivity({
      userId: sessionUser.id,
      action: "OUTLET_DEACTIVATED",
      entity: "outlet",
      entityId: outlet.id,
      details: { name: outlet.name },
    });

    return jsonOk({ id: outlet.id, isActive: false }, `Cabang "${outlet.name}" dinonaktifkan`);
  } catch (error) {
    return handleApiError(error, "DELETE /api/outlets", "Gagal menonaktifkan cabang");
  }
}
