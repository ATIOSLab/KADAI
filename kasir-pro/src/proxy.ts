import { NextRequest, NextResponse } from "next/server";
import {
  canAccessPath,
  getDefaultPathForRole,
  parseSessionCookie,
} from "@/lib/rbac";

const publicPaths = [
  "/login",
  "/register",
  "/pricing",
  "/order",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register",
  "/api/order",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow landing page
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Allow public paths
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // Allow static files and internal paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
