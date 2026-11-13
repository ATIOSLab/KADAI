import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/activity-logger";
import { SUPER_ADMIN_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { handleApiError, jsonOk, jsonError } from "@/lib/api-response";
import { ownerUpdateSchema } from "@/lib/validators/platform";
import { ensureNotLastSuperAdmin } from "@/lib/platform";
import { ActionType } from "@prisma/client";

const ownerSelect = {
  id: true,
  name: true,
  email: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  avatar: true,
  storeId: true,
  store: { select: { id: true, name: true, tier: true, businessType: true } },
} as const;

async function findOwner(id: string) {
  return prisma.user.findFirst({
    where: { id, role: "ADMIN" }, // endpoint owner: TIDAK bisa menyentuh SUPER_ADMIN
    select: ownerSelect,
  });
}

// GET /api/platform/owners/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = getSessionUserFromRequest(_request);
    if (!sessionUser) return jsonError("Unauthorized", 401);
    if (!hasRequiredRole(sessionUser.role, SUPER_ADMIN_ROLES)) {
      return jsonError("Hanya Super Admin yang dapat mengelola akun owner", 403);
    }

    const { id } = await params;
    const owner = await findOwner(id);
    if (!owner) return jsonError("Akun owner tidak ditemukan", 404);

    const subscription = owner.storeId
      ? await prisma.storeSubscription.findFirst({
          where: { storeId: owner.storeId, status: "ACTIVE" },
          select: { tier: true, cycle: true, status: true, startedAt: true, expiresAt: true },
        })
      : null;

    return jsonOk({ ...owner, subscription });
  } catch (error) {
    return handleApiError(error, "GET /api/platform/owners/[id]", "Gagal memuat akun owner");
  }
}

// PUT /api/platform/owners/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) return jsonError("Unauthorized", 401);
    if (!hasRequiredRole(sessionUser.role, SUPER_ADMIN_ROLES)) {
      return jsonError("Hanya Super Admin yang dapat mengelola akun owner", 403);
    }

    const { id } = await params;
    const owner = await findOwner(id);
    if (!owner) return jsonError("Akun owner tidak ditemukan", 404);

    const body = ownerUpdateSchema.parse(await request.json());

    // Guard: jangan biarkan SUPER_ADMIN menonaktifkan akun dirinya sendiri (kehilangan akses).
    if (sessionUser.id === id && body.isActive === false) {
      return jsonError("Anda tidak dapat menonaktifkan akun Anda sendiri", 400);
    }

    // Email uniqueness jika diubah
    if (body.email && body.email !== owner.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email: body.email } });
      if (emailTaken) return jsonError("Email sudah digunakan akun lain", 409);
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.storeId !== undefined) updateData.storeId = body.storeId;
    if (body.supervisorPin !== undefined) {
      updateData.supervisorPin = body.supervisorPin
        ? await bcrypt.hash(body.supervisorPin, 10)
        : null;
    }
    if (body.password) {
      updateData.passwordHash = await bcrypt.hash(body.password, 12);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: ownerSelect,
    });

    await logActivity({
      userId: sessionUser.id,
      action: ActionType.OWNER_UPDATED,
      entity: "User",
      entityId: id,
      details: {
        name: updated.name,
        changes: Object.keys(updateData).filter((k) => k !== "passwordHash"),
      },
    });

    return jsonOk(updated, "Akun owner berhasil diperbarui");
  } catch (error) {
    return handleApiError(error, "PUT /api/platform/owners/[id]", "Gagal memperbarui akun owner");
  }
}

// DELETE /api/platform/owners/[id] — soft delete (isActive = false)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = getSessionUserFromRequest(_request);
    if (!sessionUser) return jsonError("Unauthorized", 401);
    if (!hasRequiredRole(sessionUser.role, SUPER_ADMIN_ROLES)) {
      return jsonError("Hanya Super Admin yang dapat mengelola akun owner", 403);
    }

    const { id } = await params;
    const owner = await findOwner(id);
    if (!owner) return jsonError("Akun owner tidak ditemukan", 404);

    if (sessionUser.id === id) {
      return jsonError("Anda tidak dapat menonaktifkan akun Anda sendiri", 400);
    }

    const canDemote = await ensureNotLastSuperAdmin(id);
    if (!canDemote) {
      return jsonError("Tidak dapat menonaktifkan SUPER_ADMIN aktif terakhir", 400);
    }

    await prisma.user.update({ where: { id }, data: { isActive: false } });

    await logActivity({
      userId: sessionUser.id,
      action: ActionType.OWNER_DEACTIVATED,
      entity: "User",
      entityId: id,
      details: { name: owner.name, email: owner.email, storeId: owner.storeId },
    });

    return jsonOk({ id }, "Akun owner dinonaktifkan");
  } catch (error) {
    return handleApiError(error, "DELETE /api/platform/owners/[id]", "Gagal menonaktifkan akun owner");
  }
}
