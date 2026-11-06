import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ADMIN_ONLY_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { handleApiError } from "@/lib/api-response";

const createDemoRequestSchema = z.object({
  fullName: z.string().min(2, "Nama minimal 2 karakter"),
  businessName: z.string().min(2, "Nama usaha minimal 2 karakter"),
  businessType: z.string().min(1, "Pilih jenis usaha"),
  phone: z.string().min(9, "Nomor WhatsApp minimal 9 digit"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  outletCount: z.number().int().min(1).default(1),
  notes: z.string().max(500).optional().or(z.literal("")),
});

// POST /api/demo-requests - Publik untuk calon klien request demo
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const validated = createDemoRequestSchema.parse(rawBody);

    // Generate kode akses unik misal DEMO-9A2F3
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const accessCode = `DEMO-${randomSuffix}`;

    const demoRequest = await prisma.demoRequest.create({
      data: {
        fullName: validated.fullName,
        businessName: validated.businessName,
        businessType: validated.businessType,
        phone: validated.phone,
        email: validated.email || null,
        outletCount: validated.outletCount,
        notes: validated.notes || null,
        accessCode,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: demoRequest.id,
          accessCode: demoRequest.accessCode,
          businessName: demoRequest.businessName,
          status: demoRequest.status,
        },
        message: "Permohonan demo berhasil diajukan. Tim kami akan segera menghubungi Anda.",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "POST /api/demo-requests", "Gagal menyimpan permohonan demo");
  }
}

// GET /api/demo-requests - Khusus Super Admin / Owner untuk melihat daftar lead demo
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ADMIN_ONLY_ROLES)) {
      return NextResponse.json(
        { error: "Hanya Super Admin yang dapat mengakses data permohonan demo" },
        { status: 403 }
      );
    }

    const requests = await prisma.demoRequest.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    console.error("GET /api/demo-requests error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat data permohonan demo" },
      { status: 500 }
    );
  }
}
