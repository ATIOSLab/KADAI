import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { SUPER_ADMIN_ROLES, hasRequiredRole } from "@/lib/rbac";
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
  referralCode: z.string().max(50).optional().or(z.literal("")),

  // Legalitas & Status Pajak (Opsional untuk onboarding terverifikasi)
  taxStatus: z.enum(["NON_PKP", "PKP"]).optional(),
  legalEntityType: z.string().max(50).optional().or(z.literal("")),
  legalName: z.string().max(150).optional().or(z.literal("")),
  nib: z.string().max(30).optional().or(z.literal("")),
  npwp: z.string().max(30).optional().or(z.literal("")),
  ownerNik: z.string().max(20).optional().or(z.literal("")),
});

// POST /api/demo-requests - Publik untuk calon klien request demo
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const validated = createDemoRequestSchema.parse(rawBody);

    // Generate kode akses unik misal DEMO-9A2F3
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const accessCode = `DEMO-${randomSuffix}`;

    const cleanRefCode = validated.referralCode?.trim().toUpperCase() || null;

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
        referralCode: cleanRefCode,
        status: "PENDING",
        taxStatus: validated.taxStatus || "NON_PKP",
        legalEntityType: validated.legalEntityType || null,
        legalName: validated.legalName || null,
        nib: validated.nib || null,
        npwp: validated.npwp || null,
        ownerNik: validated.ownerNik || null,
      },
    });

    // Jika membawa kode referral valid, tautkan ke mitra referral
    if (cleanRefCode) {
      const partner = await prisma.referralPartner.findFirst({
        where: { referralCode: { equals: cleanRefCode, mode: "insensitive" } },
      });
      if (partner) {
        await prisma.referralLead.create({
          data: {
            partnerId: partner.id,
            leadName: validated.fullName,
            businessName: validated.businessName,
            phone: validated.phone,
            status: "LEAD",
            taxStatus: validated.taxStatus || "NON_PKP",
            legalEntityType: validated.legalEntityType || null,
            legalName: validated.legalName || null,
            nib: validated.nib || null,
            npwp: validated.npwp || null,
            ownerNik: validated.ownerNik || null,
          },
        });
      }
    }

    // Kirim notifikasi instan ke admin jika Telegram terhubung
    try {
      const recipients = await prisma.telegramChatBinding.findMany({
        where: { isAuthorized: true },
        select: { telegramChatId: true },
      });

      if (recipients.length > 0) {
        const typeLabelMap: Record<string, string> = {
          FNB_CAFE: "Kafe & Kedai Minuman",
          FNB_RESTO: "Restoran / Rumah Makan",
          FNB_WARUNG: "Warung Makan & Booth",
          RETAIL_SHOP: "Toko Ritel & Grosir",
          MINIMARKET: "Minimarket Sembako",
          BUILDING_SUPPLY: "Toko Bangunan & Alat Teknik",
          PHARMACY: "Apotek & Alat Kesehatan",
          SERVICE: "Jasa, Barbershop & Laundry",
        };
        const displayType = typeLabelMap[validated.businessType] || validated.businessType;
        const alertMessage =
          `🔔 *LEAD PERMOHONAN DEMO KADAI*\n\n` +
          `👤 *Nama:* ${validated.fullName}\n` +
          `🏢 *Usaha:* ${validated.businessName} (${displayType})\n` +
          `📍 *Jumlah Gerai:* ${validated.outletCount} Outlet\n` +
          `📱 *WhatsApp:* \`${validated.phone}\`\n` +
          (validated.email ? `✉️ *Email:* ${validated.email}\n` : "") +
          `🔑 *Kode Akses:* \`${accessCode}\`\n` +
          (cleanRefCode ? `🤝 *Referral:* \`${cleanRefCode}\`\n` : "") +
          (validated.notes ? `📝 *Catatan:* ${validated.notes}\n` : "") +
          `\n_Segera hubungi prospek via WhatsApp untuk jadwal presentasi._`;

        const { sendTelegramMessage } = await import("@/lib/bot/telegram");
        await Promise.allSettled(
          recipients.map((r) => sendTelegramMessage(r.telegramChatId, alertMessage))
        );
      }
    } catch (notifErr) {
      console.error("Gagal mengirim Telegram demo alert:", notifErr);
    }

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

    if (!hasRequiredRole(sessionUser.role, SUPER_ADMIN_ROLES)) {
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
