import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security";

const verifyCodeSchema = z.object({
  code: z.string().min(3, "Kode demo minimal 3 karakter"),
});

// Kode master demo tidak lagi di-hardcode di source (bocor ke repo publik).
// Isi DEMO_MASTER_CODES="KODE1,KODE2" di environment bila master access dibutuhkan;
// tanpa env tersebut tidak ada kode master yang berlaku.
function getMasterCodes(): string[] {
  const raw = process.env.DEMO_MASTER_CODES || "";
  return raw
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);
}

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
    if (getMasterCodes().includes(cleanCode)) {
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
