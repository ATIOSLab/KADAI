import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ADMIN_ONLY_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { resolveTenantScope } from "@/lib/tenant-scope";

const storeUpdateSchema = z.object({
  name: z.string().min(1, "Nama toko wajib diisi").optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email("Format email tidak valid").nullable().optional().or(z.literal("")),

  // Status Perpajakan & Legalitas Badan Usaha RI
  taxStatus: z.enum(["NON_PKP", "PKP"]).optional(),
  legalEntityType: z.enum([
    "PERORANGAN",
    "PT_PERORANGAN",
    "CV",
    "PT",
    "UD",
    "KOPERASI",
    "FIRMA",
    "YAYASAN",
    "LAINNYA",
  ]).optional(),
  legalName: z.string().max(150).nullable().optional().or(z.literal("")),
  nib: z.string().max(30).nullable().optional().or(z.literal("")),
  npwp: z.string().max(30).nullable().optional().or(z.literal("")),
  ownerNik: z.string().max(20).nullable().optional().or(z.literal("")),

  taxType: z.enum(["NONE", "PPN_11", "PPN_12", "PB1_10", "CUSTOM"]).optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  taxInclusive: z.boolean().optional(),
  serviceChargeRate: z.coerce.number().min(0).max(100).optional(),
  enableRounding: z.boolean().optional(),
  costingMethod: z.enum(["FIFO", "FEFO", "AVERAGE"]).optional(),
});

// GET /api/settings/store
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ADMIN_ONLY_ROLES)) {
      return NextResponse.json(
        { error: "Hanya admin yang dapat mengakses pengaturan toko" },
        { status: 403 }
      );
    }

    // Lingkup tenant: hanya store milik tenant pemanggil (SUPER_ADMIN ditolak 403).
    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const store = await prisma.store.findUnique({
      where: { id: scope.storeId },
    });
    if (!store) {
      return NextResponse.json({ error: "Toko tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ data: store });
  } catch (error) {
    console.error("GET /api/settings/store error:", error);
    return NextResponse.json({ error: "Gagal memuat konfigurasi toko" }, { status: 500 });
  }
}

// PUT /api/settings/store
export async function PUT(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ADMIN_ONLY_ROLES)) {
      return NextResponse.json(
        { error: "Hanya admin yang dapat mengubah pengaturan toko" },
        { status: 403 }
      );
    }

    // Lingkup tenant: hanya store milik tenant pemanggil (SUPER_ADMIN ditolak 403).
    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const rawBody = await request.json();
    const validated = storeUpdateSchema.parse(rawBody);

    // Normalisasi string kosong menjadi null untuk field opsional
    const updateData: Record<string, unknown> = {
      ...(validated.name !== undefined && { name: validated.name }),
      ...(validated.address !== undefined && { address: validated.address || null }),
      ...(validated.phone !== undefined && { phone: validated.phone || null }),
      ...(validated.email !== undefined && { email: validated.email || null }),

      ...(validated.taxStatus !== undefined && { taxStatus: validated.taxStatus }),
      ...(validated.legalEntityType !== undefined && { legalEntityType: validated.legalEntityType }),
      ...(validated.legalName !== undefined && { legalName: validated.legalName || null }),
      ...(validated.nib !== undefined && { nib: validated.nib || null }),
      ...(validated.npwp !== undefined && { npwp: validated.npwp || null }),
      ...(validated.ownerNik !== undefined && { ownerNik: validated.ownerNik || null }),

      ...(validated.taxType !== undefined && { taxType: validated.taxType }),
      ...(validated.taxRate !== undefined && { taxRate: validated.taxRate }),
      ...(validated.taxInclusive !== undefined && { taxInclusive: validated.taxInclusive }),
      ...(validated.serviceChargeRate !== undefined && { serviceChargeRate: validated.serviceChargeRate }),
      ...(validated.enableRounding !== undefined && { enableRounding: validated.enableRounding }),
      ...(validated.costingMethod !== undefined && { costingMethod: validated.costingMethod }),
    };

    const existingStore = await prisma.store.findUnique({
      where: { id: scope.storeId },
      select: { id: true },
    });
    if (!existingStore) {
      return NextResponse.json({ error: "Toko tidak ditemukan" }, { status: 404 });
    }

    const store = await prisma.store.update({
      where: { id: scope.storeId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: store });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validasi gagal" },
        { status: 400 }
      );
    }
    console.error("PUT /api/settings/store error:", error);
    return NextResponse.json({ error: "Gagal update konfigurasi toko" }, { status: 500 });
  }
}
