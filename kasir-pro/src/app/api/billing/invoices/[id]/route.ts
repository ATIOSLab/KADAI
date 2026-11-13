import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { settleInvoice } from "@/lib/billing-service";
import { createPaymentIntent } from "@/lib/payment/providers";
import { SUPER_ADMIN_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { handleApiError, jsonOk } from "@/lib/api-response";

const updateSchema = z
  .object({
    action: z.enum(["SETTLE", "FAIL", "REFUND"]),
    paymentProof: z.string().max(500).optional(),
    notes: z.string().max(255).optional(),
    providerRef: z.string().max(255).optional(),
  })
  .strict();

const checkoutSchema = z.object({
  provider: z.enum(["MANUAL", "MIDTRANS", "XENDIT"]),
});

async function requireAdmin(request: NextRequest): Promise<
  { sessionUser: { name: string } } | { error: NextResponse }
> {
  const sessionUser = getSessionUserFromRequest(request);
  if (!sessionUser) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!hasRequiredRole(sessionUser.role, SUPER_ADMIN_ROLES)) {
    return {
      error: NextResponse.json(
        { error: "Hanya Super Admin yang dapat mengelola tagihan" },
        { status: 403 }
      ),
    };
  }
  return { sessionUser };
}

// PATCH /api/billing/invoices/[id] - Pelunasan / penandaan status tagihan
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const validated = updateSchema.parse(await request.json());

    if (validated.action === "SETTLE") {
      const result = await settleInvoice({
        invoiceId: id,
        paidBy: auth.sessionUser.name,
        paymentProof: validated.paymentProof,
        notes: validated.notes,
        providerRef: validated.providerRef,
      });
      return jsonOk(
        result,
        result.alreadySettled
          ? "Tagihan ini sudah berstatus lunas sebelumnya"
          : "Tagihan dilunasi, langganan diaktifkan, dan komisi mitra tercatat"
      );
    }

    const invoice = await prisma.paymentInvoice.update({
      where: { id },
      data: {
        status: validated.action === "FAIL" ? "FAILED" : "REFUNDED",
        notes: validated.notes,
      },
    });
    return jsonOk(invoice, "Status tagihan diperbarui");
  } catch (error) {
    return handleApiError(error, "PATCH /api/billing/invoices/[id]", "Gagal memperbarui tagihan");
  }
}

// POST /api/billing/invoices/[id] - Buat sesi pembayaran (transfer bank / Midtrans / Xendit)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const { provider } = checkoutSchema.parse(await request.json());

    const invoice = await prisma.paymentInvoice.findUnique({
      where: { id },
      include: { store: { select: { name: true, email: true } } },
    });
    if (!invoice) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
    }
    if (invoice.status === "SETTLED") {
      return NextResponse.json({ error: "Tagihan sudah lunas" }, { status: 409 });
    }

    const intent = await createPaymentIntent(provider, {
      amount: invoice.amount.toNumber(),
      description: invoice.description,
      externalId: invoice.invoiceNumber,
      customerName: invoice.store.name,
      customerEmail: invoice.store.email,
    });

    const updated = await prisma.paymentInvoice.update({
      where: { id: invoice.id },
      data: { provider, providerRef: intent.providerRef || invoice.providerRef },
    });

    return jsonOk({
      invoiceNumber: updated.invoiceNumber,
      provider,
      providerRef: intent.providerRef,
      checkoutUrl: intent.checkoutUrl ?? null,
      instructions: intent.instructions ?? null,
    });
  } catch (error) {
    return handleApiError(error, "POST /api/billing/invoices/[id]", "Gagal membuat sesi pembayaran");
  }
}
