import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createInvoice } from "@/lib/billing-service";
import { ADMIN_ONLY_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { handleApiError, jsonOk } from "@/lib/api-response";

const createInvoiceSchema = z.object({
  storeId: z.string().min(1, "Toko wajib dipilih"),
  tier: z.enum(["FREE", "STARTER", "PRO_BUSINESS", "ENTERPRISE"]),
  cycle: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]).default("MONTHLY"),
  provider: z.enum(["MANUAL", "MIDTRANS", "XENDIT"]).default("MANUAL"),
  description: z.string().max(255).optional(),
  amount: z.number().int().min(0).optional(),
});

// GET /api/billing/invoices - Daftar tagihan (Super Admin)
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasRequiredRole(sessionUser.role, ADMIN_ONLY_ROLES)) {
      return NextResponse.json(
        { error: "Hanya Super Admin yang dapat melihat daftar tagihan" },
        { status: 403 }
      );
    }

    const statusParam = request.nextUrl.searchParams.get("status");
    const invoices = await prisma.paymentInvoice.findMany({
      where: statusParam ? { status: statusParam as "PENDING" } : undefined,
      include: {
        store: { select: { id: true, name: true, phone: true, tier: true } },
        referralLead: { select: { id: true, leadName: true, businessName: true, partnerId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return jsonOk(invoices);
  } catch (error) {
    return handleApiError(error, "GET /api/billing/invoices", "Gagal memuat daftar tagihan");
  }
}

// POST /api/billing/invoices - Terbitkan tagihan langganan (Super Admin)
export async function POST(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasRequiredRole(sessionUser.role, ADMIN_ONLY_ROLES)) {
      return NextResponse.json(
        { error: "Hanya Super Admin yang dapat menerbitkan tagihan" },
        { status: 403 }
      );
    }

    const validated = createInvoiceSchema.parse(await request.json());
    const invoice = await createInvoice({
      storeId: validated.storeId,
      tier: validated.tier,
      cycle: validated.cycle,
      provider: validated.provider,
      description: validated.description,
      amount: validated.amount,
    });

    return jsonOk(invoice, `Tagihan ${invoice.invoiceNumber} berhasil diterbitkan`, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/billing/invoices", "Gagal menerbitkan tagihan");
  }
}
