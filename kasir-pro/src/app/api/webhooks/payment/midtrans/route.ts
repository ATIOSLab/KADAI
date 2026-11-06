import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { settleInvoice } from "@/lib/billing-service";
import { midtransIsSettled, verifyMidtransSignature } from "@/lib/payment/providers";
import { logger } from "@/lib/logger";

/**
 * Webhook Midtrans (Snap) — verifikasi signature sha512, lalu lunasi tagihan.
 * Idempotent: settleInvoice aman dipanggil berulang (status SETTLED ditahan).
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      order_id?: string;
      transaction_status?: string;
      fraud_status?: string;
      status_code?: string;
      gross_amount?: string;
      signature_key?: string;
      transaction_id?: string;
    };

    const verified = verifyMidtransSignature({
      order_id: body.order_id,
      status_code: body.status_code,
      gross_amount: body.gross_amount,
      signature_key: body.signature_key,
    });
    if (!verified) {
      logger.warn("Midtrans webhook: signature tidak valid", "webhook-midtrans", {
        order_id: body.order_id,
      });
      return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 403 });
    }

    if (body.transaction_status === "pending") {
      return NextResponse.json({ success: true, message: "Menunggu pembayaran" });
    }

    if (!midtransIsSettled(body.transaction_status ?? "", body.fraud_status)) {
      return NextResponse.json({ success: true, message: `Status tidak dilunasi: ${body.transaction_status}` });
    }

    const invoiceNumber = body.order_id ?? "";
    const invoice = await prisma.paymentInvoice.findUnique({
      where: { invoiceNumber },
      select: { id: true },
    });
    if (!invoice) {
      return NextResponse.json({ success: true, message: "Invoice tidak ditemukan (diabaikan)" });
    }

    await settleInvoice({
      invoiceId: invoice.id,
      paidBy: "Midtrans Webhook",
      providerRef: body.transaction_id,
      notes: `Midtrans ${body.transaction_status}`,
    });

    return NextResponse.json({ success: true, message: "Tagihan lunas via Midtrans" });
  } catch (error) {
    logger.error("Midtrans webhook gagal diproses", error);
    return NextResponse.json({ success: false, message: "Webhook gagal diproses" }, { status: 500 });
  }
}
