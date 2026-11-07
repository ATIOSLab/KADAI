import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security";

const verifyCodeSchema = z.object({
  code: z.string().min(3, "Kode demo minimal 3 karakter"),
});

const MASTER_CODES = ["KADAI2026", "DEMO-KADAI", "NETKRIDA", "KADAI-DEMO"];

export async function POST(request: NextRequest) {
  try {
    // Endpoint publik tanpa sesi: batasi percobaan untuk mencegah brute-force kode demo.
    const clientKey =
      request.headers.get("cf-connecting-ip")?.trim() ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const limit = checkRateLimit(`verify-demo-code:${clientKey}`, 10, 10 * 60 * 1000, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          valid: false,
          error: `Terlalu banyak percobaan kode. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = verifyCodeSchema.parse(body);
    const cleanCode = validated.code.trim().toUpperCase();

    // 1. Cek apakah master code
    if (MASTER_CODES.includes(cleanCode)) {
      return NextResponse.json({
        valid: true,
        businessName: "Toko Demo KADAI (Master Access)",
        message: "Kode akses master valid. Akses demo terbuka.",
      });
    }

    // 2. Cek database demo_requests
    const requestRecord = await prisma.demoRequest.findFirst({
      where: {
        accessCode: { equals: cleanCode, mode: "insensitive" },
      },
    });

    if (requestRecord) {
      return NextResponse.json({
        valid: true,
        businessName: requestRecord.businessName,
        message: `Selamat datang, ${requestRecord.fullName}! Akses demo ${requestRecord.businessName} terbuka.`,
      });
    }

    return NextResponse.json(
      {
        valid: false,
        error: "Kode akses demo tidak terdaftar atau belum disetujui. Silakan ajukan demo di halaman /demo.",
      },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { valid: false, error: "Format kode tidak valid" },
      { status: 400 }
    );
  }
}
