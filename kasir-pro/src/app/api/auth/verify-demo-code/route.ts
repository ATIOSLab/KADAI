import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const verifyCodeSchema = z.object({
  code: z.string().min(3, "Kode demo minimal 3 karakter"),
});

const MASTER_CODES = ["KADAI2026", "DEMO-KADAI", "NETKRIDA", "KADAI-DEMO"];

export async function POST(request: NextRequest) {
  try {
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
