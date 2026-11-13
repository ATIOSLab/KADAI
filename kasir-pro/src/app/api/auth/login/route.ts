import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validators/user";
import { signSession, checkRateLimit, resetRateLimit, sanitizeError, SESSION_TTL_SECONDS } from "@/lib/security";
import { logActivity } from "@/lib/activity-logger";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // A07: Rate limiting — prevent brute force attacks
    const clientIp =
      request.headers.get("cf-connecting-ip")?.trim() ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateLimitKey = `login:account:${email.toLowerCase()}`;
    const ipLimit = checkRateLimit(`login:ip:${clientIp}`, 30, 15 * 60 * 1000, 30 * 60 * 1000);
    if (!ipLimit.allowed) return NextResponse.json({ error: "Terlalu banyak percobaan login" }, {
      status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) },
    });
    const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000, 30 * 60 * 1000);

    if (!rateLimit.allowed) {
      const message = rateLimit.locked
        ? `Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil(rateLimit.retryAfterSeconds / 60)} menit.`
        : "Terlalu banyak percobaan login.";
      return NextResponse.json(
        { error: message },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { store: { select: { id: true, name: true } } },
    });

    // A07: Always return generic error — don't reveal if email exists
    const genericError = "Email atau password salah";

    if (!user || !user.isActive) {
      return NextResponse.json({ error: genericError }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      // A09: Log failed login attempt
      console.warn(`[SECURITY] Failed login: email=${email} ip=${clientIp}`);
      return NextResponse.json({ error: genericError }, { status: 401 });
    }

    // A07: Reset rate limit on successful login
    resetRateLimit(rateLimitKey);

    // Update last login
    const authenticatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session data
    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      version: authenticatedUser.updatedAt.toISOString(),
      storeId: user.storeId ?? user.store?.id ?? undefined,
      storeName: user.store?.name,
    };

    // A02: Sign session with HMAC — prevent cookie forgery
    const signedToken = signSession(sessionData);

    const response = NextResponse.json({
      success: true,
      data: sessionData,
    });

    response.cookies.set("session", signedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });

    // A09: Log successful login
    await logActivity({
      userId: user.id,
      action: "USER_LOGIN",
      entity: "User",
      entityId: user.id,
      details: { ip: clientIp },
    });

    return response;
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: "Input login tidak valid" }, { status: 400 });
    }
    const message = sanitizeError(error, "Terjadi kesalahan saat login");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
