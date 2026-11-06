import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-response";

const registerPartnerSchema = z.object({
  fullName: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  phone: z.string().min(9, "Nomor WhatsApp minimal 9 digit"),
  email: z.string().email("Format email tidak valid"),
  bankName: z.string().min(2, "Nama bank / e-wallet wajib diisi"),
  bankAccountNumber: z.string().min(4, "Nomor rekening / e-wallet wajib diisi"),
  bankAccountName: z.string().min(2, "Nama pemilik rekening wajib diisi"),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const validated = registerPartnerSchema.parse(rawBody);

    // Cek apakah nomor HP atau email sudah terdaftar sebagai mitra
    const existing = await prisma.referralPartner.findFirst({
      where: {
        OR: [{ phone: validated.phone }, { email: validated.email }],
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        isExisting: true,
        data: {
          id: existing.id,
          fullName: existing.fullName,
          referralCode: existing.referralCode,
          commissionRate: Number(existing.commissionRate),
          referralLink: `https://kadai.asia/demo?ref=${existing.referralCode}`,
        },
        message: "Nomor atau email Anda sudah terdaftar sebagai Mitra KADAI.",
      });
    }

    // Generate kode unik referral (REF-5 karakter alfanumerik)
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const referralCode = `REF-${randomSuffix}`;

    const newPartner = await prisma.referralPartner.create({
      data: {
        fullName: validated.fullName,
        phone: validated.phone,
        email: validated.email,
        bankName: validated.bankName,
        bankAccountNumber: validated.bankAccountNumber,
        bankAccountName: validated.bankAccountName,
        notes: validated.notes || null,
        referralCode,
        commissionRate: 20.0, // Standar komisi 20%
        status: "ACTIVE",
      },
    });

    return NextResponse.json(
      {
        success: true,
        isExisting: false,
        data: {
          id: newPartner.id,
          fullName: newPartner.fullName,
          referralCode: newPartner.referralCode,
          commissionRate: Number(newPartner.commissionRate),
          referralLink: `https://kadai.asia/demo?ref=${newPartner.referralCode}`,
        },
        message: "Pendaftaran Mitra KADAI berhasil! Selamat bergabung di tim pemasaran kami.",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "POST /api/referrals/register", "Gagal mendaftarkan mitra referral");
  }
}
