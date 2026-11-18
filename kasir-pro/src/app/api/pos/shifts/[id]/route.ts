import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session";
import { resolveTenantScope } from "@/lib/tenant-scope";
import { ADMIN_MANAGER_ROLES, POS_ROLES, hasRequiredRole } from "@/lib/rbac";
import { ApiBusinessError, handleApiError, jsonError, jsonOk } from "@/lib/api-response";
import { buildLiveShiftReport, closeCashShift } from "@/lib/shift-service";
import { logActivity } from "@/lib/activity-logger";
import type { ShiftReport } from "@/lib/shift";

const closeShiftSchema = z.object({
  actualCash: z.coerce
    .number("Uang fisik di laci harus berupa angka")
    .min(0, "Uang fisik tidak boleh negatif")
    .max(1e12, "Nilai uang fisik tidak wajar"),
  notes: z.string().max(500, "Catatan terlalu panjang").optional().nullable(),
});

// GET /api/pos/shifts/[id] — Z-Report tersimpan (bisa dicetak ulang kapan pun)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) return jsonError("Unauthorized", 401);

    if (!hasRequiredRole(sessionUser.role, POS_ROLES)) {
      return jsonError("Role Anda tidak dapat melihat laporan shift", 403);
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) return jsonError(scope.message, scope.status);

    const { id } = await params;
    const shift = await prisma.cashShift.findFirst({
      where: { id, storeId: scope.storeId },
    });
    if (!shift) return jsonError("Shift tidak ditemukan", 404);

    // Kasir hanya boleh melihat lacinya sendiri; manager/admin boleh semua.
    if (
      !hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES) &&
      shift.cashierId !== sessionUser.id
    ) {
      return jsonError("Forbidden", 403);
    }

    // Shift tertutup disajikan dari snapshot yang disimpan saat penutupan:
    // angka di kertas Z-Report lama harus sama persis dengan yang tampil kini.
    // Satu-satunya hal yang boleh menempel kemudian adalah penanda koreksi
    // susulan — kalau tidak, cetak ulang akan terlihat identik dengan kertas
    // lama padahal sudah ada transaksi yang dibatalkan setelahnya.
    if (shift.status === "CLOSED" && shift.reportJson) {
      const snapshot = shift.reportJson as unknown as ShiftReport;

      // Membuka laporan laci tertutup = mencetak ulang kertas. Setiap kali
      // kertas keluar, itu dicatat — termasuk kalau isinya sudah berubah karena
      // koreksi susulan. Kegagalan pencatatan tidak boleh menggagalkan cetak,
      // tetapi angkanya tidak boleh muncul kalau memang tidak tercatat.
      let reprintCount = shift.reprintCount;
      try {
        const diperbarui = await prisma.cashShift.update({
          where: { id: shift.id },
          data: { reprintCount: { increment: 1 } },
          select: { reprintCount: true },
        });
        reprintCount = diperbarui.reprintCount;
        await logActivity({
          userId: sessionUser.id,
          action: "SHIFT_REPORT_REPRINTED",
          entity: "CashShift",
          entityId: shift.id,
          details: {
            shiftNumber: shift.shiftNumber,
            reprintCount,
            lateVoidCount: shift.lateVoidCount,
            cashierId: shift.cashierId,
          },
        });
      } catch (error) {
        console.warn("Gagal mencatat cetak ulang Z-Report:", error);
      }

      return jsonOk({
        ...snapshot,
        shift: {
          ...snapshot.shift,
          lateVoidCount: shift.lateVoidCount,
          lastLateVoidAt: shift.lastLateVoidAt ? shift.lastLateVoidAt.toISOString() : null,
          reprintCount,
        },
      });
    }

    return jsonOk(await buildLiveShiftReport(shift));
  } catch (error) {
    return handleApiError(error, "GET /api/pos/shifts/[id]", "Gagal memuat laporan shift");
  }
}

// POST /api/pos/shifts/[id] — tutup laci: hitung fisik, simpan selisih
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) return jsonError("Unauthorized", 401);

    if (!hasRequiredRole(sessionUser.role, POS_ROLES)) {
      return jsonError("Role Anda tidak dapat menutup shift kasir", 403);
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) return jsonError(scope.message, scope.status);

    const { id } = await params;
    const body = await request.json();
    const data = closeShiftSchema.parse(body);

    const shift = await prisma.cashShift.findFirst({
      where: { id, storeId: scope.storeId },
    });
    if (!shift) return jsonError("Shift tidak ditemukan", 404);

    if (
      !hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES) &&
      shift.cashierId !== sessionUser.id
    ) {
      return jsonError("Hanya kasir pemilik laci atau manager yang dapat menutup shift", 403);
    }

    if (shift.status === "CLOSED") {
      throw new ApiBusinessError(
        "Shift ini sudah ditutup",
        409,
        "SHIFT_ALREADY_CLOSED"
      );
    }

    const { report, status, ledgerEntryId } = await closeCashShift(shift, {
      actualCash: data.actualCash,
      notes: data.notes,
      actorUserId: sessionUser.id,
    });

    // Selisih kas tidak berhenti sebagai angka di kertas Z-Report: kalau ada
    // selisih, entri Buku Kas ikut dibuat dan itu harus terlihat oleh kasir.
    const pesanSelisih = `Rp ${Math.abs(report.shift.variance ?? 0).toLocaleString("id-ID")}`;

    return jsonOk(
      { ...report, varianceStatus: status, ledgerEntryId },
      status === "BALANCED"
        ? "Shift ditutup, kas sesuai"
        : `Shift ditutup dengan selisih ${pesanSelisih}${
            ledgerEntryId ? " — tercatat di Buku Kas" : ""
          }`
    );
  } catch (error) {
    return handleApiError(error, "POST /api/pos/shifts/[id]", "Gagal menutup shift kasir");
  }
}