import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { settleInvoice } from "@/lib/billing-service";
import { verifyXenditCallbackToken } from "@/lib/payment/providers";
import { logger } from "@/lib/logger";

/**
 * Webhook Xendit Invoice — verifikasi callback token, lalu lunasi tagihan.
 * Idempotent: settleInvoice aman dipanggil berulang.
 */
export async function POST(request: NextRequest) {
  try {
    const callbackToken = request.headers.get("x-callback-token");
    if (!verifyXenditCallbackToken(callbackToken)) {
      logger.warn("Xendit webhook: callback token tidak valid", "webhook-xendit");
      return NextResponse.json({ success: false, message: "Invalid callback token" }, { status: 403 });
    }

    const body = (await request.json()) as {
      external_id?: string;
      id?: string;
      status?: string;
      paid_amount?: number;
    };

    if (body.status === "PENDING") {
      return NextResponse.json({ success: true, message: "Menunggu pembayaran" });
    }
    if (body.status !== "PAID") {
      return NextResponse.json({ success: true, message: `Status tidak dilunasi: ${body.status}` });
    }

    const invoiceNumber = body.external_id ?? "";
    const invoice = await prisma.paymentInvoice.findUnique({
      where: { invoiceNumber },
      select: { id: true },
    });
    if (!invoice) {
      return NextResponse.json({ success: true, message: "Invoice tidak ditemukan (diabaikan)" });
    }

    await settleInvoice({
      invoiceId: invoice.id,
      paidBy: "Xendit Webhook",
      providerRef: body.id,
      notes: `Xendit PAID ${body.paid_amount ?? ""}`,
    });

    return NextResponse.json({ success: true, message: "Tagihan lunas via Xendit" });
  } catch (error) {
    logger.error("Xendit webhook gagal diproses", error);
    return NextResponse.json({ success: false, message: "Webhook gagal diproses" }, { status: 500 });
  }
}
