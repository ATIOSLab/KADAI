import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_CASHIER_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { resolveTenantScope } from "@/lib/tenant-scope";
import { cateringPaymentSchema } from "@/lib/validators/sale";
import { cateringRemaining } from "@/lib/catering";
import { ApiBusinessError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity-logger";
import { Decimal } from "@prisma/client/runtime/library";
import { ZodError } from "zod";

// POST /api/sales/[id]/catering-payment
// Mencatat cicilan/pelunasan booking catering ke buku kas (DP pertama sudah
// dicatat saat booking dibuat). Semua cek sisa tagihan dilakukan di server
// dengan penulisan kondisi (optimistic), sehingga dua kasir yang membayarkan
// sisa yang sama tidak bisa menagih dua kali.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasRequiredRole(sessionUser.role, ADMIN_CASHIER_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat mencatat pembayaran" },
        { status: 403 }
      );
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const { id } = await params;
    const body = await request.json();
    const data = cateringPaymentSchema.parse(body);

    const sale = await prisma.sale.findFirst({
      where: {
        id,
        OR: [
          { storeId: scope.storeId },
          { storeId: null, outlet: { storeId: scope.storeId } },
        ],
      },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        cateringStatus: true,
        cateringPaidAmount: true,
        customerName: true,
      },
    });
    if (!sale) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }
    if (!sale.cateringStatus) {
      return NextResponse.json(
        { error: "Transaksi ini bukan booking catering" },
        { status: 400 }
      );
    }
    if (sale.cateringStatus === "CANCELLED") {
      return NextResponse.json(
        { error: "Booking catering sudah dibatalkan" },
        { status: 400 }
      );
    }
    if (sale.cateringStatus === "COMPLETED") {
      return NextResponse.json(
        { error: "Booking catering sudah selesai dan lunas" },
        { status: 400 }
      );
    }

    const paid = new Decimal(sale.cateringPaidAmount ?? 0);
    const amount = new Decimal(data.amount).toDecimalPlaces(2);
    const remaining = cateringRemaining(sale.totalAmount.toString(), paid.toString());
    if (remaining <= 0) {
      return NextResponse.json(
        { error: "Sisa tagihan sudah lunas" },
        { status: 400 }
      );
    }
    if (amount.greaterThan(remaining)) {
      return NextResponse.json(
        { error: `Pembayaran melebihi sisa tagihan (sisa Rp ${remaining.toLocaleString("id-ID")})` },
        { status: 400 }
      );
    }

    const payment = await prisma.$transaction(async (tx) => {
      // Optimistic guard: hanya maju bila akumulasi masih persis seperti yang
      // dibaca tadi. Bila kasir lain mencatat pembayaran lebih dulu, hitungan
      // sisa di layar sudah usang → transaksi ini ditolak, bukan menimpa.
      const pushed = await tx.sale.updateMany({
        where: { id: sale.id, cateringPaidAmount: paid },
        data: { cateringPaidAmount: paid.add(amount) },
      });
      if (pushed.count !== 1) {
        throw new ApiBusinessError(
          "Saldo pembayaran booking berubah oleh transaksi lain, muat ulang dan coba lagi",
          409,
          "CATERING_PAYMENT_CONFLICT"
        );
      }
      return tx.cateringPayment.create({
        data: {
          saleId: sale.id,
          amount,
          method: data.method,
          paidAt: new Date(),
          note: data.note?.trim() || "Cicilan / pelunasan",
          createdById: sessionUser.id,
        },
      });
    });

    await logActivity({
      userId: sessionUser.id,
      action: "CATERING_PAYMENT_RECORDED",
      entity: "Sale",
      entityId: sale.id,
      details: {
        invoiceNumber: sale.invoiceNumber,
        amount: Number(amount),
        method: data.method,
        paidAt: payment.paidAt.toISOString(),
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    const updated = await prisma.sale.findFirst({
      where: { id: sale.id },
      include: {
        cashier: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit: true } },
          },
        },
        cateringPayments: {
          orderBy: { paidAt: "asc" },
          select: {
            id: true,
            amount: true,
            method: true,
            paidAt: true,
            note: true,
            createdBy: { select: { id: true, name: true } },
          },
        },
      },
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      const first = error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? "Input tidak valid" },
        { status: 400 }
      );
    }
    if (error instanceof ApiBusinessError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error("POST catering-payment error:", error);
    return NextResponse.json(
      { error: "Gagal mencatat pembayaran booking" },
      { status: 500 }
    );
  }
}
