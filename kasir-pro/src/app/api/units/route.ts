import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { createUnitSchema } from "@/lib/validators/unit";
import { INVENTORY_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest, getServerSessionUser } from "@/lib/session";
import { resolveTenantScope } from "@/lib/tenant-scope";

function normalizeUnitName(name: string) {
  return name.trim().toLowerCase();
}

export async function GET() {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const [units, usedUnits] = await Promise.all([
      prisma.unit.findMany({
        where: {
          isActive: true,
          OR: [{ storeId: scope.storeId }, { storeId: null }],
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          normalizedName: true,
        },
      }),
      prisma.product.groupBy({
        by: ["unit"],
        where: { storeId: scope.storeId },
      }),
    ]);

    // Satuan yang sudah dipakai produk tapi belum ada di tabel Unit (mis. hasil
    // impor/seed) tetap harus bisa dipilih. Tanpa ini, membuka produk ber-satuan
    // "gelas" memaksa pemilih jatuh ke mode "satuan baru".
    const known = new Set(units.map((unit) => unit.normalizedName));
    const extra = usedUnits
      .map((row) => row.unit?.trim())
      .filter((name): name is string => Boolean(name))
      .filter((name) => {
        const normalized = normalizeUnitName(name);
        if (known.has(normalized)) return false;
        known.add(normalized);
        return true;
      })
      .map((name) => ({
        id: `used:${normalizeUnitName(name)}`,
        name,
        normalizedName: normalizeUnitName(name),
      }));

    return NextResponse.json({
      data: [...units, ...extra].sort((a, b) => a.name.localeCompare(b.name)),
    });
  } catch (error) {
    console.error("GET /api/units error:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar satuan" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser || !hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const body = await request.json();
    const data = createUnitSchema.parse(body);
    const normalizedName = normalizeUnitName(data.name);

    // Satuan dilihat per-tenant: baris milik tenant + baris bawaan platform (storeId NULL).
    const existingUnit = await prisma.unit.findFirst({
      where: {
        normalizedName,
        OR: [{ storeId: scope.storeId }, { storeId: null }],
      },
      select: {
        id: true,
        name: true,
        normalizedName: true,
      },
    });

    if (existingUnit) {
      return NextResponse.json({ success: true, data: existingUnit });
    }

    const unit = await prisma.unit.create({
      data: {
        name: data.name.trim(),
        normalizedName,
        storeId: scope.storeId,
      },
      select: {
        id: true,
        name: true,
        normalizedName: true,
      },
    });

    return NextResponse.json({ success: true, data: unit }, { status: 201 });
  } catch (error) {
    console.error("POST /api/units error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Data satuan tidak valid" },
        { status: 400 }
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Satuan sudah tersedia" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Gagal menambahkan satuan baru" },
      { status: 500 }
    );
  }
}
