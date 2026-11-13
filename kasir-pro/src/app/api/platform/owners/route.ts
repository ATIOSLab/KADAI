import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/activity-logger";
import { SUPER_ADMIN_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { handleApiError, jsonOk, jsonError } from "@/lib/api-response";
import { ownerCreateSchema } from "@/lib/validators/platform";
import { provisionInitialSubscription } from "@/lib/platform";
import { CYCLE_MONTHS } from "@/lib/pricing";
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

// GET /api/platform/owners — daftar seluruh akun OWNER (role ADMIN) lintas tenant
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) return jsonError("Unauthorized", 401);
    if (!hasRequiredRole(sessionUser.role, SUPER_ADMIN_ROLES)) {
      return jsonError("Hanya Super Admin yang dapat mengelola akun owner", 403);
    }

    const storeId = request.nextUrl.searchParams.get("storeId");
    const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";

    const owners = await prisma.user.findMany({
      where: {
        role: "ADMIN",
        isDemo: false, // akun hasil demo-seeder tidak ditampilkan sebagai owner asli
        ...(storeId ? { storeId } : {}),
        ...(includeInactive ? {} : { isActive: true }),
      },
      select: ownerSelect,
      orderBy: { createdAt: "desc" },
    });

    // Lampirkan langganan aktif per tenant (untuk kolom status tenant).
    const storeIds = Array.from(
      new Set(owners.map((o) => o.storeId).filter((v): v is string => Boolean(v)))
    );
    const subscriptions = storeIds.length
      ? await prisma.storeSubscription.findMany({
          where: { storeId: { in: storeIds }, status: "ACTIVE" },
          select: { storeId: true, tier: true, cycle: true, status: true, expiresAt: true },
        })
      : [];
    const subByStore = new Map(subscriptions.map((s) => [s.storeId, s]));

    const data = owners.map((owner) => ({
      ...owner,
      subscription: owner.storeId ? (subByStore.get(owner.storeId) ?? null) : null,
    }));

    return jsonOk(data);
  } catch (error) {
    return handleApiError(error, "GET /api/platform/owners", "Gagal memuat daftar owner");
  }
}

// POST /api/platform/owners — onboarding owner: akun owner baru (+ tenant/Store baru opsional)
export async function POST(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) return jsonError("Unauthorized", 401);
    if (!hasRequiredRole(sessionUser.role, SUPER_ADMIN_ROLES)) {
      return jsonError("Hanya Super Admin yang dapat membuat akun owner", 403);
    }

    const body = ownerCreateSchema.parse(await request.json());

    if (body.storeId && body.newStore) {
      return jsonError("Pilih salah satu: storeId (tenant existing) atau newStore (tenant baru)", 400);
    }
    if (!body.storeId && !body.newStore) {
      return jsonError("Wajib mengisi storeId atau newStore", 400);
    }

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return jsonError("Email sudah terdaftar", 409);
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const supervisorPinHash = body.supervisorPin
      ? await bcrypt.hash(body.supervisorPin, 10)
      : null;

    let storeId: string;
    let createdStoreName: string | null = null;

    if (body.newStore) {
      const store = await prisma.store.create({
        data: {
          name: body.newStore.name,
          businessType: body.newStore.businessType,
          tier: body.newStore.tier,
        },
      });
      storeId = store.id;
      createdStoreName = store.name;
      await provisionInitialSubscription(
        store.id,
        body.newStore.tier,
        body.newStore.cycle,
        CYCLE_MONTHS[body.newStore.cycle]
      );
    } else {
      const store = await prisma.store.findUnique({ where: { id: body.storeId! } });
      if (!store) return jsonError("Tenant (store) tidak ditemukan", 404);
      storeId = store.id;
    }

    const owner = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        supervisorPin: supervisorPinHash,
        role: "ADMIN", // akun owner — SUPER_ADMIN tidak dapat dibuat dari endpoint ini
        storeId,
      },
      select: { id: true, name: true, email: true, role: true, storeId: true, createdAt: true },
    });

    await logActivity({
      userId: sessionUser.id,
      action: ActionType.OWNER_CREATED,
      entity: "User",
      entityId: owner.id,
      details: { name: owner.name, email: owner.email, storeId, createdStoreName },
    });

    return jsonOk(owner, "Akun owner berhasil dibuat", 201);
  } catch (error) {
    return handleApiError(error, "POST /api/platform/owners", "Gagal membuat akun owner");
  }
}
