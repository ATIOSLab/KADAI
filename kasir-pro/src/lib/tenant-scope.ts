import { prisma } from "@/lib/prisma";

export type TenantScope =
  | { ok: true; storeId: string }
  | { ok: false; status: 401 | 403; message: string };

/**
 * Resolusi lingkup tenant untuk API tenant (operasional toko).
 *
 * Aturan model peran KADAI:
 * - SUPER_ADMIN = operator platform, berdiri DI ATAS tenant → API tenant DITOLAK (403).
 *   Urusannya lewat modul /api/platform/* (kelola akun owner).
 * - ADMIN (owner) ke bawah = staf tenant → wajib punya storeId; tanpa storeId → 403.
 *
 * storeId diambil dari payload sesi, dengan fallback lookup DB (anti-stale).
 */
export async function resolveTenantScope(sessionUser: {
  id: string;
  role: string;
  storeId?: string | null;
}): Promise<TenantScope> {
  if (!sessionUser?.id) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  if (sessionUser.role === "SUPER_ADMIN") {
    return {
      ok: false,
      status: 403,
      message: "Super Admin tidak mengoperasikan tenant; gunakan modul Platform",
    };
  }

  let storeId = sessionUser.storeId ?? null;

  if (!storeId) {
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { storeId: true },
    });
    storeId = user?.storeId ?? null;
  }

  if (!storeId) {
    return {
      ok: false,
      status: 403,
      message: "Akun Anda belum terikat ke tenant (store). Hubungi owner Anda.",
    };
  }

  return { ok: true, storeId };
}
