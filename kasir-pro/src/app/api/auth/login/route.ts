import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validators/user";
import { signSession, checkRateLimit, resetRateLimit, sanitizeError } from "@/lib/security";
import { logActivity } from "@/lib/activity-logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // A07: Rate limiting — prevent brute force attacks
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateLimitKey = `login:${email.toLowerCase()}:${clientIp}`;
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
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session data
    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
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
      maxAge: 60 * 60 * 24 * 7, // 7 days
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
    const message = sanitizeError(error, "Terjadi kesalahan saat login");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
