import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { createUnitSchema, updateUnitSchema } from "@/lib/validators/unit";
import { logActivity } from "@/lib/activity-logger";
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
          storeId: true,
        },
      }),
      prisma.product.groupBy({
        by: ["unit"],
        where: { storeId: scope.storeId },
        _count: { _all: true },
      }),
    ]);

    // Jumlah produk per satuan dipakai halaman Satuan untuk menolak penghapusan
    // sebelum menembak server, dan untuk menampilkan satuan mana yang masih hidup.
    const pemakaian = new Map<string, number>();
    for (const row of usedUnits) {
      const nama = row.unit?.trim();
      if (!nama) continue;
      pemakaian.set(normalizeUnitName(nama), row._count._all);
    }

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
        storeId: null,
        dipakai: pemakaian.get(normalizeUnitName(name)) ?? 0,
        // Satuan hasil impor tidak punya baris Unit, jadi tidak bisa diganti
        // namanya dari halaman ini; hanya bisa dipakai.
        bisaDiubah: false,
      }));

    return NextResponse.json({
      data: [
        ...units.map((unit) => ({
          ...unit,
          // Baris bawaan platform (storeId NULL) adalah kamus bersama, bukan
          // milik tenant: tidak boleh diganti nama atau dihapus.
          bisaDiubah: unit.storeId === scope.storeId,
          dipakai: pemakaian.get(unit.normalizedName) ?? 0,
        })),
        ...extra,
      ].sort((a, b) => a.name.localeCompare(b.name)),
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

/**
 * PUT /api/units — ganti nama satuan milik tenant.
 *
 * Nama satuan juga tersimpan sebagai teks di `Product.unit`, jadi mengganti nama
 * di sini WAJIB ikut memperbarui produk yang memakainya. Tanpa itu, satuan
 * "pcs" berubah jadi "buah" tetapi semua produk tetap menulis "pcs" dan pemilih
 * satuan menampilkan dua entri untuk barang yang sama.
 */
export async function PUT(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser || !hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const data = updateUnitSchema.parse(await request.json());
    const unit = await prisma.unit.findFirst({
      where: { id: data.id, storeId: scope.storeId },
      select: { id: true, name: true, normalizedName: true },
    });
    if (!unit) {
      return NextResponse.json(
        { error: "Satuan bawaan platform atau milik tenant lain tidak bisa diubah" },
        { status: 404 }
      );
    }

    const normalizedName = normalizeUnitName(data.name);
    if (normalizedName === unit.normalizedName && data.name.trim() === unit.name) {
      return NextResponse.json({ success: true, data: unit, message: "Nama satuan tidak berubah" });
    }

    const bentrok = await prisma.unit.findFirst({
      where: {
        normalizedName,
        id: { not: unit.id },
        OR: [{ storeId: scope.storeId }, { storeId: null }],
      },
      select: { id: true },
    });
    if (bentrok) {
      return NextResponse.json({ error: `Satuan "${data.name}" sudah ada` }, { status: 409 });
    }

    const hasil = await prisma.$transaction(async (tx) => {
      const diperbarui = await tx.unit.update({
        where: { id: unit.id },
        data: { name: data.name.trim(), normalizedName },
        select: { id: true, name: true, normalizedName: true },
      });
      // Produk menyimpan nama satuan sebagai teks; ikut disamakan agar tidak ada
      // dua ejaan untuk satuan yang sama.
      const produk = await tx.product.updateMany({
        where: { storeId: scope.storeId, unit: unit.name },
        data: { unit: data.name.trim() },
      });
      return { diperbarui, produkTerpakai: produk.count };
    });

    await logActivity({
      userId: sessionUser.id,
      action: "UNIT_UPDATED",
      entity: "unit",
      entityId: unit.id,
      details: { dari: unit.name, ke: data.name.trim(), produkTerpakai: hasil.produkTerpakai },
    });

    return NextResponse.json({
      success: true,
      data: hasil.diperbarui,
      message:
        hasil.produkTerpakai > 0
          ? `Satuan diganti menjadi "${data.name.trim()}" pada ${hasil.produkTerpakai} produk`
          : `Satuan diganti menjadi "${data.name.trim()}"`,
    });
  } catch (error) {
    console.error("PUT /api/units error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Data satuan tidak valid" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Gagal memperbarui satuan" }, { status: 500 });
  }
}

/**
 * DELETE /api/units?id=...
 *
 * Satuan yang masih dipakai produk TIDAK boleh dihapus: produk akan kehilangan
 * satuannya dan laporan stok kehilangan dasar pembacaannya. Yang ditawarkan
 * adalah penolakan dengan jumlah pemakaian, supaya pengguna tahu harus
 * memindahkan produk dulu.
 */
export async function DELETE(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser || !hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const id = new URL(request.url).searchParams.get("id")?.trim() || "";
    if (!id) {
      return NextResponse.json({ error: "ID satuan wajib disertakan" }, { status: 400 });
    }

    const unit = await prisma.unit.findFirst({
      where: { id, storeId: scope.storeId },
      select: { id: true, name: true, isActive: true },
    });
    if (!unit) {
      return NextResponse.json(
        { error: "Satuan bawaan platform atau milik tenant lain tidak bisa dihapus" },
        { status: 404 }
      );
    }

    const dipakai = await prisma.product.count({
      where: { storeId: scope.storeId, unit: unit.name },
    });
    if (dipakai > 0) {
      return NextResponse.json(
        {
          error: `Satuan "${unit.name}" masih dipakai ${dipakai} produk. Ganti satuan produk tersebut terlebih dahulu.`,
          code: "UNIT_IN_USE",
          dipakai,
        },
        { status: 409 }
      );
    }

    // Satuan adalah entri kamus tanpa relasi kunci asing - produk menyimpan
    // namanya sebagai teks. Karena sudah dipastikan tidak dipakai, barisnya
    // boleh benar-benar dihapus; menyimpannya sebagai nonaktif hanya akan
    // membuat daftar satuan penuh sampah yang tak bisa dilihat siapa pun.
    await prisma.unit.delete({ where: { id: unit.id } });

    await logActivity({
      userId: sessionUser.id,
      action: "UNIT_DELETED",
      entity: "unit",
      entityId: unit.id,
      details: { dihapus: unit.name },
    });

    return NextResponse.json({ success: true, message: `Satuan "${unit.name}" dihapus` });
  } catch (error) {
    console.error("DELETE /api/units error:", error);
    return NextResponse.json({ error: "Gagal menghapus satuan" }, { status: 500 });
  }
}
