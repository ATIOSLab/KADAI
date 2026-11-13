import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionUser } from "@/lib/session";
import { ADMIN_MANAGER_ROLES, hasRequiredRole } from "@/lib/rbac";
import { createOutletSchema, updateOutletSchema } from "@/lib/validators/outlet";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { resolveTenantScope } from "@/lib/tenant-scope";

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
    if (!sessionUser || !hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES)) {
      return jsonError("Forbidden", 403);
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return jsonError(scope.message, scope.status);
    }

    const body = await req.json();
    const validated = createOutletSchema.parse(body);

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
    if (!sessionUser || !hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES)) {
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
      select: { id: true },
    });
    if (!owned) {
      return jsonError("Cabang tidak ditemukan pada tenant Anda", 404);
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
      },
    });

    return jsonOk(updated, "Cabang berhasil diperbarui");
  } catch (error) {
    return handleApiError(error, "PUT /api/outlets", "Gagal memperbarui data cabang");
  }
}
