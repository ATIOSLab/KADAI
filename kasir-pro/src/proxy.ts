import { NextRequest, NextResponse } from "next/server";
import { parseSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { canAccessPath, getDefaultPathForRole } from "@/lib/rbac";
import { isCsrfSafe, SECURITY_HEADERS, CSP_HEADER } from "@/lib/security";

const publicPages = [
  "/",
  "/login",
  "/register",
  "/demo",
  "/request-demo",
  "/referral",
  "/mitra",
  "/harga",
  "/hardware",
  "/fitur",
  "/solusi",
  "/blog",
  "/pricing",
  "/kebijakan-privasi",
  "/syarat-ketentuan",
  "/.well-known",
  "/order",
  "/lacak",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/icon.svg",
  "/favicon.ico",
  "/favicon.svg",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/favicon-48x48.png",
  "/apple-touch-icon.png",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/site.webmanifest",
  "/manifest.json",
  "/og-image.png",
  "/brand",
  "/sw.js",
  "/images",
  "/uploads",
];
// Server-to-server endpoints: authenticate with a shared secret or provider
// signature (never browser cookies), so they are exempt from both the browser
// CSRF origin check and the session gate. Every one of these verifies its own
// secret BEFORE any database read.
const serverToServerApis = [
  "/api/telegram/webhook",
  "/api/admin/seed-demo",
  "/api/cron/billing-referral",
  "/api/cron/daily-summary",
  "/api/webhooks/payment/midtrans",
  "/api/webhooks/payment/xendit",
];
const publicApis = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register",
  "/api/auth/verify-demo-code",
  "/api/order",
  "/api/laundry/track",
  "/api/demo-requests",
  "/api/referrals/register",
  "/api/health",
  ...serverToServerApis,
];
const matches = (path: string, base: string) => path === base || path.startsWith(`${base}/`);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secure = (response: NextResponse) => {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(key, value);
    response.headers.set("Content-Security-Policy", CSP_HEADER);
    if (pathname.startsWith("/api/")) response.headers.set("Cache-Control", "no-store");
    return response;
  };
  const isApi = pathname.startsWith("/api/");
  const refParam = request.nextUrl.searchParams.get("ref");
  const attachRef = (res: NextResponse) => {
    if (refParam && !request.cookies.has("kadai_ref")) {
      res.cookies.set("kadai_ref", refParam.trim().toUpperCase(), {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 hari attribution window
        sameSite: "lax",
      });
    }
    return res;
  };

  // Webhook, Cron and Seed have their own shared-secret authentication, not browser cookies.
  if (isApi && !serverToServerApis.some(p => matches(pathname, p)) &&
      !isCsrfSafe(request.method, request.headers.get("origin"), request.headers.get("host"))) {
    return secure(attachRef(NextResponse.json({ error: "CSRF validation failed" }, { status: 403 })));
  }
  if ((!isApi && publicPages.some(p => pathname === p || (p !== "/" && matches(pathname, p)))) ||
      (isApi && publicApis.some(p => matches(pathname, p)))) {
    return secure(attachRef(NextResponse.next()));
  }
  // Never bypass authentication merely because a path contains a dot.
  const user = parseSessionUser(request.cookies.get("session")?.value);
  if (!user) {
    return secure(isApi ? NextResponse.json({ error: "Unauthorized" }, { status: 401 }) :
      NextResponse.redirect(new URL("/login", request.url)));
  }
  // Revalidate authoritative identity on every protected request: a role change,
  // password update or deactivation immediately invalidates the signed cookie.
  try {
    const current = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isActive: true, role: true, updatedAt: true },
    });
    if (!current?.isActive || current.role !== user.role || current.updatedAt.toISOString() !== user.version) {
      const denied = isApi ? NextResponse.json({ error: "Session expired" }, { status: 401 }) :
        NextResponse.redirect(new URL("/login", request.url));
      denied.cookies.delete("session");
      return secure(denied);
    }
  } catch {
    return secure(NextResponse.json({ error: "Authentication service unavailable" }, { status: 503 }));
  }
  if (!isApi && !canAccessPath(pathname, user.role)) {
    return secure(NextResponse.redirect(new URL(getDefaultPathForRole(user.role), request.url)));
  }
  return secure(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon.svg|favicon-.*\\.png|apple-touch-icon.png|android-chrome-.*\\.png|site.webmanifest|manifest.json|og-image.png|brand/|window.svg|vercel.svg|next.svg|globe.svg|file.svg|uploads/).*)"],
};

