import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signSession, checkRateLimit, sanitizeError, SESSION_TTL_SECONDS } from "@/lib/security";
import { logActivity } from "@/lib/activity-logger";

// Login demo tanpa password: kode akses demo (lead /demo-requests atau kode master)
// berfungsi sebagai tiket masuk. Sesi dibuat sama seperti /api/auth/login, tetapi
// HANYA untuk akun yang terikat store klaster demo (store.isDemo === true) — akun
// produksi tidak bisa dimasuki lewat jalur ini.

const demoLoginSchema = z.object({
  code: z.string().min(3, "Kode demo minimal 3 karakter"),
  email: z.string().email("Email tidak valid"),
});

// Kode master (opsional) dari env — tanpa env tidak ada kode master (fail-closed, tanpa hardcode).
function getMasterCodes(): string[] {
  const raw = process.env.DEMO_MASTER_CODES || "";
  return raw
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const clientIp =
      request.headers.get("cf-connecting-ip")?.trim() ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const limit = checkRateLimit(`demo-login:${clientIp}`, 10, 10 * 60 * 1000, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Terlalu banyak percobaan masuk demo. Coba lagi dalam ${limit.retryAfterSeconds} detik.` },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const { code, email } = demoLoginSchema.parse(body);
    const cleanCode = code.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Kode akses harus valid: kode master ATAU kode dari lead /api/demo-requests
    const isMaster = getMasterCodes().includes(cleanCode);
    const requestRecord = isMaster
      ? null
      : await prisma.demoRequest.findFirst({
          where: { accessCode: { equals: cleanCode, mode: "insensitive" } },
          select: { id: true },
        });
    if (!isMaster && !requestRecord) {
      return NextResponse.json(
        { error: "Kode akses demo tidak valid atau belum terdaftar. Ajukan demo di halaman Demo." },
        { status: 400 }
      );
    }

    // 2. Akun harus user demo aktif yang terikat store klaster demo (isDemo = true)
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
        store: { select: { id: true, name: true, isDemo: true } },
      },
    });
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Akun demo tidak ditemukan atau belum aktif." }, { status: 401 });
    }
    const store = user.store;
    if (!store || store.isDemo !== true) {
      return NextResponse.json(
        { error: "Akun ini bukan akun demo — silakan masuk dengan email & password Anda." },
        { status: 403 }
      );
    }

    // 3. Bangun sesi (identik dengan login normal, tanpa verifikasi password)
    const authenticatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      version: authenticatedUser.updatedAt.toISOString(),
      storeId: store.id,
      storeName: store.name,
    };
    const signedToken = signSession(sessionData);

    const response = NextResponse.json({ success: true, data: sessionData });
    response.cookies.set("session", signedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });

    await logActivity({
      userId: user.id,
      action: "USER_LOGIN",
      entity: "User",
      entityId: user.id,
      details: { ip: clientIp, demo: true, codeSource: isMaster ? "master" : "lead" },
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: "Format kode atau email tidak valid" }, { status: 400 });
    }
    const message = sanitizeError(error, "Terjadi kesalahan saat masuk demo");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
