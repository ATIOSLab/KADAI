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
  "/harga",
  "/hardware",
  "/fitur",
  "/solusi",
  "/blog",
  "/pricing",
  "/order",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/icon.svg",
  "/favicon.ico",
  "/manifest.json",
  "/sw.js",
  "/images",
  "/uploads",
];
const publicApis = ["/api/auth/login", "/api/auth/logout", "/api/auth/register", "/api/order", "/api/telegram/webhook", "/api/admin/seed-demo"];
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
  // Webhook and Seed have their own shared-secret authentication, not browser cookies.
  if (isApi && pathname !== "/api/telegram/webhook" && pathname !== "/api/admin/seed-demo" &&
      !isCsrfSafe(request.method, request.headers.get("origin"), request.headers.get("host"))) {
    return secure(NextResponse.json({ error: "CSRF validation failed" }, { status: 403 }));
  }
  if ((!isApi && publicPages.some(p => pathname === p || (p !== "/" && matches(pathname, p)))) ||
      (isApi && publicApis.some(p => matches(pathname, p)))) {
    return secure(NextResponse.next());
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|window.svg|vercel.svg|next.svg|globe.svg|file.svg|uploads/).*)"],
};

