import { NextRequest, NextResponse } from "next/server";
import { ApiBusinessError, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { voidSaleSchema, voidSaleAfterCloseSchema } from "@/lib/validators/sale";
import { restoreFIFODeductions } from "@/lib/fifo";
import { Decimal } from "@prisma/client/runtime/library";
import { logActivity } from "@/lib/activity-logger";
import {
  FINANCE_SYSTEM_CATEGORY_KEYS,
  getSystemFinanceCategoryId,
} from "@/lib/finance";
import { getSessionUserFromRequest } from "@/lib/session";
import { resolveTenantScope } from "@/lib/tenant-scope";
import { ADMIN_MANAGER_ROLES, hasRequiredRole } from "@/lib/rbac";
import { verifySupervisorPin } from "@/lib/rbac/pin";
import { evaluateVoidGuard, markShiftLateVoid, resolveShiftCoveringSale } from "@/lib/void-policy";

// POST /api/sales/[id]/void — Void a sale and restore stock
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ["ADMIN", "MANAGER", "CASHIER"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const { id } = await params;
    const body = await request.json();
    const { reason } = voidSaleSchema.parse(body);

    const isSupervisor = hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES);
    let approvedSupervisorName: string | null = null;

    if (!isSupervisor) {
      // Kasir memerlukan verifikasi PIN Supervisor
      const pin = body.supervisorPin;
      if (!pin) {
        return NextResponse.json(
          { error: "Pembatalan transaksi oleh kasir memerlukan PIN Supervisor" },
          { status: 403 }
        );
      }

      const clientIp =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const pinCheck = await verifySupervisorPin(pin, clientIp, scope.storeId);
      if (!pinCheck.valid) {
        return NextResponse.json(
          { error: pinCheck.error || "PIN Supervisor tidak valid" },
          { status: 403 }
        );
      }
      approvedSupervisorName = `${pinCheck.supervisor?.name} (${pinCheck.supervisor?.role})`;
    }

    const sale = await prisma.sale.findFirst({
      where: {
        id,
        OR: [
          { storeId: scope.storeId },
          { storeId: null, outlet: { storeId: scope.storeId } },
        ],
      },
      include: {
        items: {
          include: { batchAllocations: true },
        },
        // Laci tempat transaksi terjadi: dipakai untuk menilai apakah ini
        // pembatalan susulan (laci sudah ditutup) atau koreksi di depan laci.
        shift: { select: { id: true, status: true } },
      },
    });

    if (!sale) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    if (sessionUser.role === "CASHIER" && sale.cashierId !== sessionUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (sale.isVoided) {
      return NextResponse.json(
        {
          success: false,
          error: "Transaksi sudah di-void",
          code: "SALE_ALREADY_VOIDED",
        },
        { status: 409 }
      );
    }

    // Laci laporan yang mencakup transaksi ini. Kalau transaksinya belum
    // menempel ke laci (data lama), laci dicari lewat rentang waktu yang sama
    // dengan yang dipakai Z-Report — supaya aturan koreksi susulan tidak bisa
    // dihindari hanya karena kolom lacinya kosong.
    const saleShift = sale.shift ?? (await resolveShiftCoveringSale(prisma, sale));

    // Pembatalan setelah laci ditutup = koreksi buku: laporan Z yang sudah
    // dicetak tidak bisa berubah lagi. Hanya boleh lewat supervisor, dan
    // alasannya wajib menjelaskan (bukan "salah input" satu kata).
    const supervisorApproved = isSupervisor || Boolean(approvedSupervisorName);
    const voidGuard = evaluateVoidGuard({
      shiftStatus: saleShift?.status ?? null,
      isSupervisor: supervisorApproved,
    });

    if (!voidGuard.allowed) {
      return NextResponse.json(
        { success: false, error: voidGuard.message, code: voidGuard.code },
        { status: 409 }
      );
    }

    if (voidGuard.isLateVoid) {
      const lateReason = voidSaleAfterCloseSchema.safeParse({ reason });
      if (!lateReason.success) {
        return NextResponse.json(
          {
            success: false,
            error:
              lateReason.error.issues[0]?.message ??
              "Alasan pembatalan susulan wajib diisi",
            code: "VOID_AFTER_CLOSE_REASON_REQUIRED",
          },
          { status: 409 }
        );
      }
    }

    // Restore stock in transaction
    await prisma.$transaction(async (tx) => {
      // Atomic claim prevents concurrent requests from restoring stock twice.
      const claim = await tx.sale.updateMany({
        where: {
          id,
          isVoided: false,
          OR: [
            { storeId: scope.storeId },
            { storeId: null, outlet: { storeId: scope.storeId } },
          ],
        },
        data: { isVoided: true },
      });
      if (claim.count !== 1) {
        throw new ApiBusinessError(
          "Transaksi ini sudah dibatalkan sebelumnya",
          409,
          "SALE_ALREADY_VOIDED"
        );
      }
      // Mark sale as voided
      const voidedSale = await tx.sale.update({
        where: { id },
        data: {
          isVoided: true,
          voidedAt: new Date(),
          voidReason: reason,
        },
      });

      const saleVoidCategoryId = await getSystemFinanceCategoryId(
        tx,
        FINANCE_SYSTEM_CATEGORY_KEYS.SALE_VOID_OUTFLOW
      );

      await tx.financeEntry.create({
        data: {
          amount: voidedSale.totalAmount,
          direction: "OUT",
          source: "SALE_VOID",
          title: `Void ${sale.invoiceNumber}`,
          notes: reason,
          entryDate: voidedSale.voidedAt ?? new Date(),
          categoryId: saleVoidCategoryId,
          createdByUserId: sessionUser.id,
          saleId: id,
          storeId: scope.storeId,
        },
      });

      // Restore batch quantities
      const allocations = sale.items.flatMap((item) =>
        item.batchAllocations.map((alloc) => ({
          productBatchId: alloc.productBatchId,
          quantity: alloc.quantity,
        }))
      );

      await restoreFIFODeductions(tx, allocations);

      // CRM: transaksi batal harus mengembalikan statistik pelanggan. Tanpa ini
      // pelanggan yang uangnya dikembalikan tetap membawa total belanja,
      // kunjungan, dan poin loyalitas dari transaksi yang tidak pernah terjadi.
      if (sale.customerId) {
        const customer = await tx.customer.findFirst({
          where: { id: sale.customerId, storeId: scope.storeId },
          select: { id: true, totalSpent: true, visitCount: true, loyaltyPoints: true },
        });
        if (customer) {
          const spentAfterVoid = customer.totalSpent.sub(sale.totalAmount);
          const pointsBack = Math.floor(Number(sale.totalAmount) / 10000);
          await tx.customer.update({
            where: { id: customer.id },
            data: {
              totalSpent: spentAfterVoid.isNegative() ? new Decimal(0) : spentAfterVoid,
              visitCount: Math.max(0, customer.visitCount - 1),
              loyaltyPoints: Math.max(0, customer.loyaltyPoints - pointsBack),
            },
          });
        }
      }

      // Tiket dapur milik transaksi batal wajib ikut dibatalkan. Tanpa ini
      // layar KDS tetap menampilkan pesanan yang uangnya sudah dikembalikan,
      // sehingga dapur memasak hidangan yang tidak akan pernah dibayar.
      await tx.kDSOrder.updateMany({
        where: {
          saleId: id,
          status: { in: ["QUEUED", "COOKING", "READY"] },
        },
        data: { status: "CANCELED" },
      });

      // Tandai laci yang laporannya sudah ditutup: kertas Z-Report yang sudah
      // di tangan pemilik tidak berubah, jadi koreksi ini harus terlihat di
      // daftar riwayat shift, bukan cuma di log aktivitas.
      if (voidGuard.isLateVoid && saleShift?.id) {
        await markShiftLateVoid(tx, saleShift.id);
      }
    });

    await logActivity({
      userId: sessionUser.id,
      action: "SALE_VOIDED",
      entity: "Sale",
      entityId: id,
      details: {
        invoiceNumber: sale.invoiceNumber,
        reason,
        approvedBy: approvedSupervisorName || `${sessionUser.name} (${sessionUser.role})`,
        afterShiftClosed: voidGuard.isLateVoid,
        shiftId: saleShift?.id ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      afterShiftClosed: voidGuard.isLateVoid,
      message: voidGuard.isLateVoid
        ? "Transaksi dibatalkan sebagai koreksi susulan; laci terkait sudah ditandai"
        : undefined,
    });
  } catch (error) {
    // Void ganda / transaksi bukan milik tenant = aturan bisnis (4xx), bukan 500
    return handleApiError(error, "POST /api/sales/[id]/void", "Gagal void transaksi");
  }
}
