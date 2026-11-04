import { NextRequest, NextResponse } from "next/server";
import {
  canAccessPath,
  getDefaultPathForRole,
  parseSessionCookie,
} from "@/lib/rbac";
import { isCsrfSafe, SECURITY_HEADERS, CSP_HEADER } from "@/lib/security";

const publicPaths = [
  "/login",
  "/register",
  "/pricing",
  "/order",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register",
  "/api/order",
  "/api/telegram/webhook",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // A05: Add security headers to every response
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  response.headers.set("Content-Security-Policy", CSP_HEADER);

  // Allow landing page
  if (pathname === "/") {
    return response;
  }

  // Allow public paths
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    // A04: CSRF check for state-changing requests on non-auth public endpoints
    if (
      pathname.startsWith("/api/") &&
      !pathname.startsWith("/api/auth/") &&
      !pathname.startsWith("/api/order") &&
      !pathname.startsWith("/api/telegram") &&
      !isCsrfSafe(request.method, request.headers.get("origin"), request.headers.get("host"))
    ) {
      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
    }
    return response;
  }

  // Allow static files and internal paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return response;
  }

  // A04: CSRF protection — verify Origin header for state-changing requests
  if (
    pathname.startsWith("/api/") &&
    !isCsrfSafe(request.method, request.headers.get("origin"), request.headers.get("host"))
  ) {
    return NextResponse.json(
      { error: "CSRF validation failed — Origin mismatch" },
      { status: 403 }
    );
  }

  // Check session cookie
  const sessionValue = request.cookies.get("session")?.value;
  const sessionUser = parseSessionCookie(sessionValue);

  if (!sessionUser) {
    // Redirect to login for page requests
    if (!pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // Return 401 for API requests
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!pathname.startsWith("/api") && !canAccessPath(pathname, sessionUser.role)) {
    return NextResponse.redirect(
      new URL(getDefaultPathForRole(sessionUser.role), request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
