import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionUser } from "@/lib/session";
import { ADMIN_MANAGER_ROLES, hasRequiredRole } from "@/lib/rbac";
import { createOutletSchema, updateOutletSchema } from "@/lib/validators/outlet";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";

// GET /api/outlets
export async function GET() {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) {
      return jsonError("Unauthorized", 401);
    }

    const outlets = await prisma.outlet.findMany({
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

    const body = await req.json();
    const validated = createOutletSchema.parse(body);

    // Check duplicate code
    const existing = await prisma.outlet.findUnique({
      where: { code: validated.code },
    });
    if (existing) {
      return jsonError(`Kode cabang '${validated.code}' sudah digunakan`, 409);
    }

    if (validated.isMain) {
      await prisma.outlet.updateMany({
        where: { isMain: true },
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

    const body = await req.json();
    const validated = updateOutletSchema.parse(body);

    if (validated.isMain) {
      await prisma.outlet.updateMany({
        where: { isMain: true, NOT: { id: validated.id } },
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
