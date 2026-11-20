import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionUser } from "@/lib/session";
import { POS_ROLES, ADMIN_MANAGER_ROLES, hasRequiredRole } from "@/lib/rbac";
import { MEMBER_TIERS, createCustomerSchema, updateCustomerSchema } from "@/lib/validators/customer";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { resolveTenantScope } from "@/lib/tenant-scope";
import { logActivity } from "@/lib/activity-logger";

// GET /api/customers
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
    const search = searchParams.get("search")?.trim() || "";
    // Filter tier dari halaman Pelanggan dikirim sebagai ?tier=SILVER, dulu
    // diabaikan sehingga memilih tier apa pun tetap menampilkan semua pelanggan.
    const tierParam = (searchParams.get("tier") || "").trim().toUpperCase();
    const tier = MEMBER_TIERS.find((t) => t === tierParam);

    const customers = await prisma.customer.findMany({
      where: {
        storeId: scope.storeId,
        // Pelanggan nonaktif tidak muncul lagi di pemilih kasir; ?includeInactive=1
        // dipakai halaman Pelanggan untuk menampilkan arsip.
        ...(searchParams.get("includeInactive") === "1" ? {} : { isActive: true }),
        ...(tier && { memberTier: tier }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: { name: "asc" },
      take: 50,
    });

    return jsonOk(customers);
  } catch (error) {
    return handleApiError(error, "GET /api/customers", "Gagal memuat data pelanggan");
  }
}

// POST /api/customers
export async function POST(req: NextRequest) {
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
    const validated = createCustomerSchema.parse(body);

    const customer = await prisma.customer.create({
      data: {
        name: validated.name,
        phone: validated.phone || null,
        email: validated.email || null,
        address: validated.address || null,
        notes: validated.notes || null,
        memberTier: validated.memberTier,
        loyaltyPoints: validated.loyaltyPoints,
        storeId: scope.storeId,
      },
    });

    return jsonOk(customer, "Pelanggan berhasil ditambahkan", 201);
  } catch (error) {
    return handleApiError(error, "POST /api/customers", "Gagal menambahkan pelanggan");
  }
}

// PUT /api/customers
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
    const validated = updateCustomerSchema.parse(body);

    const owned = await prisma.customer.findFirst({
      where: { id: validated.id, storeId: scope.storeId },
      select: { id: true, isActive: true },
    });
    if (!owned) {
      return jsonError("Data tidak ditemukan pada tenant Anda", 404);
    }

    const customer = await prisma.customer.update({
      where: { id: validated.id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.phone !== undefined && { phone: validated.phone || null }),
        ...(validated.email !== undefined && { email: validated.email || null }),
        ...(validated.address !== undefined && { address: validated.address || null }),
        // Catatan pelanggan ("Preferensi meja atau alergi") ada di form dan di
        // tabel, tetapi tidak pernah ikut tersimpan karena tidak ada di skema
        // validasi - input pengguna hilang tanpa pesan.
        ...(validated.notes !== undefined && { notes: validated.notes || null }),
        ...(validated.memberTier && { memberTier: validated.memberTier }),
        ...(validated.loyaltyPoints !== undefined && { loyaltyPoints: validated.loyaltyPoints }),
        ...(validated.isActive !== undefined && { isActive: validated.isActive }),
      },
    });

    if (validated.isActive !== undefined && validated.isActive !== owned.isActive) {
      await logActivity({
        userId: sessionUser.id,
        action: validated.isActive ? "CUSTOMER_ACTIVATED" : "CUSTOMER_DEACTIVATED",
        entity: "customer",
        entityId: customer.id,
        details: { name: customer.name, cara: "PUT" },
      });
    }

    return jsonOk(
      customer,
      validated.isActive !== undefined && validated.isActive !== owned.isActive
        ? `Pelanggan "${customer.name}" ${validated.isActive ? "diaktifkan" : "dinonaktifkan"}`
        : "Data pelanggan berhasil diperbarui"
    );
  } catch (error) {
    return handleApiError(error, "PUT /api/customers", "Gagal memperbarui data pelanggan");
  }
}

/**
 * DELETE /api/customers?id=...
 *
 * Menonaktifkan pelanggan (soft delete), bukan menghapus barisnya: riwayat
 * transaksi dan nama penanggung utang pada nota lama harus tetap terbaca.
 * Hanya ADMIN/MANAGER yang boleh; kasir cukup memilih pelanggan.
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
    const id = searchParams.get("id")?.trim() || "";
    if (!id) {
      return jsonError("ID pelanggan wajib disertakan", 400);
    }

    const customer = await prisma.customer.findFirst({
      where: { id, storeId: scope.storeId },
      select: { id: true, name: true, isActive: true },
    });
    if (!customer) {
      return jsonError("Data tidak ditemukan pada tenant Anda", 404);
    }
    if (!customer.isActive) {
      return jsonOk({ id: customer.id, isActive: false }, `Pelanggan "${customer.name}" sudah nonaktif`);
    }

    // Piutang tempo yang belum lunas TIDAK dihitung di sini: aplikasi belum
    // menyimpan pembayaran bertahap per nota, jadi menonaktifkan pelanggan tidak
    // menghilangkan catatan apa pun - nota tempo lama tetap menyimpan namanya.
    await prisma.customer.update({
      where: { id: customer.id },
      data: { isActive: false },
    });

    await logActivity({
      userId: sessionUser.id,
      action: "CUSTOMER_DEACTIVATED",
      entity: "customer",
      entityId: customer.id,
      details: { name: customer.name },
    });

    return jsonOk({ id: customer.id, isActive: false }, `Pelanggan "${customer.name}" dinonaktifkan`);
  } catch (error) {
    return handleApiError(error, "DELETE /api/customers", "Gagal menonaktifkan pelanggan");
  }
}
