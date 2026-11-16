import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/security";
import { Prisma } from "@prisma/client";

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
    // Endpoint publik: batasi pendaftaran per IP agar tidak bisa dibanjiri
    const clientKey =
      request.headers.get("cf-connecting-ip")?.trim() ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const limit = checkRateLimit(
      `referral-register:${clientKey}`,
      5,
      10 * 60 * 1000,
      30 * 60 * 1000
    );
    if (!limit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Terlalu banyak pendaftaran dari jaringan ini. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
        },
        { status: 429 }
      );
    }

    const rawBody = await request.json();
    const validated = registerPartnerSchema.parse(rawBody);

    // Cek apakah nomor HP atau email sudah terdaftar sebagai mitra
    const existing = await prisma.referralPartner.findFirst({
      where: {
        OR: [{ phone: validated.phone }, { email: validated.email }],
      },
    });

    if (existing) {
      // Nomor/email yang cocok sebagian TIDAK boleh membocorkan kode & komisi
      // mitra lain (oracle enumerasi). Detail hanya untuk pemilik data.
      const isSamePerson =
        existing.phone === validated.phone &&
        existing.email.toLowerCase() === validated.email.toLowerCase();

      if (!isSamePerson) {
        return NextResponse.json({
          success: true,
          isExisting: true,
          message:
            "Nomor atau email tersebut sudah terdaftar. Hubungi admin KADAI bila Anda mitra yang sah.",
        });
      }

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

    // Kode referral 5 karakter acak berpeluang tabrakan; ulangi dengan kode baru
    // bila constraint unik menolak (P2002 pada referralCode) alih-alih
    // menggagalkan pendaftaran mitra.
    const createPartner = async () => {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
        const referralCode = `REF-${randomSuffix}`;

        try {
          return await prisma.referralPartner.create({
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
        } catch (error) {
          const isCodeCollision =
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002" &&
            JSON.stringify(error.meta?.target ?? "").includes("referralCode");

          if (!isCodeCollision || attempt === 4) {
            throw error;
          }
        }
      }

      throw new Error("Gagal membuat kode referral unik");
    };

    const newPartner = await createPartner();

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
