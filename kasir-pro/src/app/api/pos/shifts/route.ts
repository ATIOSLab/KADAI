import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session";
import { resolveTenantScope } from "@/lib/tenant-scope";
import { ADMIN_MANAGER_ROLES, POS_ROLES, hasRequiredRole } from "@/lib/rbac";
import { ApiBusinessError, handleApiError, jsonError, jsonOk } from "@/lib/api-response";
import { logActivity } from "@/lib/activity-logger";
import type { CashShift } from "@prisma/client";
import { buildLiveShiftReport } from "@/lib/shift-service";
import { varianceStatus } from "@/lib/shift";
import { resolveDefaultOutletId } from "@/lib/outlet-resolution";

const openShiftSchema = z.object({
  openingCash: z.coerce
    .number("Modal awal harus berupa angka")
    .min(0, "Modal awal tidak boleh negatif")
    .max(1e12, "Nilai modal awal tidak wajar"),
  outletId: z.string().optional().nullable(),
  notes: z.string().max(500, "Catatan terlalu panjang").optional().nullable(),
});

const CASHIER_SELECT = { id: true, name: true, role: true } as const;

async function buildLiveReport(shift: CashShift) {
  return buildLiveShiftReport(shift);
}

// GET /api/pos/shifts — laci yang sedang terbuka + riwayat tutup terakhir
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) return jsonError("Unauthorized", 401);

    if (!hasRequiredRole(sessionUser.role, POS_ROLES)) {
      return jsonError("Role Anda tidak dapat membuka laporan shift", 403);
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) return jsonError(scope.message, scope.status);

    const { searchParams } = new URL(request.url);
    const bolehLihatOrangLain = hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES);
    const cashierId = bolehLihatOrangLain
      ? searchParams.get("cashierId") || sessionUser.id
      : sessionUser.id;

    const cashier = await prisma.user.findFirst({
      where: { id: cashierId, storeId: scope.storeId },
      select: CASHIER_SELECT,
    });
    if (!cashier) return jsonError("Kasir tidak ditemukan pada tenant Anda", 404);

    const currentShift = await prisma.cashShift.findFirst({
      where: { storeId: scope.storeId, cashierId, status: "OPEN" },
      orderBy: { openedAt: "desc" },
    });

    const recentShifts = await prisma.cashShift.findMany({
      where: { storeId: scope.storeId, cashierId, status: "CLOSED" },
      orderBy: { closedAt: "desc" },
      take: 5,
      select: {
        id: true,
        openedAt: true,
        closedAt: true,
        openingCash: true,
        closingCash: true,
        expectedCash: true,
        variance: true,
        totalSales: true,
        totalRevenue: true,
        totalCashSales: true,
      },
    });

    return jsonOk({
      cashier,
      currentShift: currentShift ? await buildLiveReport(currentShift) : null,
      recentShifts: recentShifts.map((shift) => ({
        id: shift.id,
        openedAt: shift.openedAt,
        closedAt: shift.closedAt,
        openingCash: Number(shift.openingCash),
        closingCash: shift.closingCash === null ? null : Number(shift.closingCash),
        expectedCash: shift.expectedCash === null ? null : Number(shift.expectedCash),
        variance: shift.variance === null ? null : Number(shift.variance),
        varianceStatus: varianceStatus(shift.variance === null ? null : Number(shift.variance)),
        totalSales: shift.totalSales,
        totalRevenue: Number(shift.totalRevenue),
        totalCashSales: Number(shift.totalCashSales),
      })),
    });
  } catch (error) {
    return handleApiError(error, "GET /api/pos/shifts", "Gagal memuat data shift kasir");
  }
}

// POST /api/pos/shifts — buka laci (modal awal masuk hitungan)
export async function POST(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) return jsonError("Unauthorized", 401);

    if (!hasRequiredRole(sessionUser.role, POS_ROLES)) {
      return jsonError("Role Anda tidak dapat membuka shift kasir", 403);
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) return jsonError(scope.message, scope.status);

    const body = await request.json();
    const data = openShiftSchema.parse(body);

    if (data.outletId) {
      const outlet = await prisma.outlet.findFirst({
        where: { id: data.outletId, storeId: scope.storeId, isActive: true },
        select: { id: true },
      });
      if (!outlet) return jsonError("Cabang tidak ditemukan pada tenant Anda", 404);
    }

    // Satu laci = satu shift terbuka. Kasir yang lupa menutup shift kemarin
    // tidak boleh diam-diam menumpuk penjualan ke laci baru.
    const sudahTerbuka = await prisma.cashShift.findFirst({
      where: {
        storeId: scope.storeId,
        cashierId: sessionUser.id,
        status: "OPEN",
      },
      select: { id: true, openedAt: true, openingCash: true },
    });
    if (sudahTerbuka) {
      throw new ApiBusinessError(
        "Shift Anda masih terbuka. Tutup shift sebelumnya terlebih dahulu.",
        409,
        "SHIFT_ALREADY_OPEN"
      );
    }

    const shift = await prisma.cashShift.create({
      data: {
        storeId: scope.storeId,
        cashierId: sessionUser.id,
        // Laci harus berada di cabang yang sama dengan transaksi. Kalau kasir
        // tidak menyebut cabang, pakai cabang yang sama dengan resolusi
        // transaksi (cabang kasir, atau cabang utama toko).
        outletId:
          data.outletId ||
          (await resolveDefaultOutletId(prisma, {
            storeId: scope.storeId,
            userId: sessionUser.id,
          })),
        openingCash: data.openingCash,
        openingNotes: data.notes?.trim() || null,
        status: "OPEN",
      },
    });

    await logActivity({
      userId: sessionUser.id,
      action: "SHIFT_OPENED",
      entity: "CashShift",
      entityId: shift.id,
      details: {
        openingCash: data.openingCash,
        outletId: shift.outletId,
        notes: shift.openingNotes,
        openedAt: shift.openedAt.toISOString(),
      },
    });

    return jsonOk(await buildLiveReport(shift), "Shift kasir dibuka", 201);
  } catch (error) {
    return handleApiError(error, "POST /api/pos/shifts", "Gagal membuka shift kasir");
  }
}