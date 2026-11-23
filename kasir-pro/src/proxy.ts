import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { parseSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { canAccessPath, getDefaultPathForRole } from "@/lib/rbac";
import { isRouteAvailableForBusinessType } from "@/lib/business-catalog";
import { isCsrfSafe, SECURITY_HEADERS, buildCspHeader } from "@/lib/security";

const publicPages = [
  "/",
  "/login",
  "/register",
  "/demo",
  "/referral",
  "/harga",
  "/hardware",
  "/fitur",
  "/solusi",
  "/solusi/fnb",
  "/solusi/ritel",
  "/blog",
  "/kebijakan-privasi",
  "/syarat-ketentuan",
  "/.well-known",
  "/order",
  "/lacak",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/icon.svg",
  "/opengraph-image.png",
  "/twitter-image.png",
  "/apple-icon.png",
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
  "/sw.js",
  "/images",
  "/uploads",
];
// Server-to-server endpoints: authenticate with a shared secret or provider
// signature (never browser cookies), so they are exempt from both the browser
// CSRF origin check and the session gate. Every one of these verifies its own
// secret BEFORE any database read.
// Catatan: /api/admin/seed-demo ada di daftar ini karena pemanggil server-to-server
// memakai header X-Seed-Key (+ Origin yang cocok); route-nya sendiri fail-closed
// (menolak 401 bila X-Seed-Key salah/kosong), sehingga sesi cookie admin tidak wajib.
const serverToServerApis = [
  "/api/telegram/webhook",
  "/api/cron/billing-referral",
  "/api/cron/daily-summary",
  "/api/webhooks/payment/midtrans",
  "/api/webhooks/payment/xendit",
  "/api/admin/seed-demo",
];
const publicApis = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register",
  "/api/auth/verify-demo-code",
  // Login demo passwordless: pengunjung membawa kode akses (hasil permohonan demo)
  // tanpa akun/sesi, jadi harus lolos gerbang sesi; route-nya memvalidasi kode
  // ke DB dan menolak akun non-demo.
  "/api/auth/demo-login",
  "/api/order",
  "/api/laundry/track",
  "/api/demo-requests",
  "/api/referrals/register",
  "/api/health",
  "/api/public/plans",
  ...serverToServerApis,
];
const matches = (path: string, base: string) => path === base || path.startsWith(`${base}/`);

// URL marketing lama (pra-peluncuran) → halaman live penggantinya. Dialihkan
// permanen (308) sebelum gerbang sesi, supaya tautan/share lama tidak berakhir
// 404 maupun terlempar ke /login.
const legacyRedirects: Record<string, string> = {
  "/pricing": "/harga",
  "/request-demo": "/demo",
  "/mitra": "/referral",
  "/brand": "/",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Nonce per-request: dipakai CSP script-src dan diteruskan ke Next.js lewat
  // header x-nonce agar inline script framework memakai nonce yang sama.
  const nonce = randomBytes(16).toString("base64");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  const passThrough = () => NextResponse.next({ request: { headers: requestHeaders } });
  const secure = (response: NextResponse) => {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(key, value);
    response.headers.set("Content-Security-Policy", buildCspHeader(nonce));
    if (pathname.startsWith("/api/")) response.headers.set("Cache-Control", "no-store");
    return response;
  };
  const isApi = pathname.startsWith("/api/");
  // Redirect URL marketing lama sebelum pemeriksaan sesi/CSRF apa pun.
  const legacyTarget = legacyRedirects[pathname];
  if (legacyTarget) {
    return secure(NextResponse.redirect(new URL(legacyTarget, request.url), 308));
  }
  const refParam = request.nextUrl.searchParams.get("ref");
  // Kode referral hanya boleh berupa token pendek yang aman: mencegah nilai
  // sembarang (payload/header injection) masuk ke cookie attribution.
  const REF_PATTERN = /^[A-Z0-9][A-Z0-9-]{0,31}$/;
  const cleanRef = refParam ? refParam.trim().toUpperCase() : null;
  const attachRef = (res: NextResponse) => {
    if (cleanRef && REF_PATTERN.test(cleanRef) && !request.cookies.has("kadai_ref")) {
      res.cookies.set("kadai_ref", cleanRef, {
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
    return secure(attachRef(passThrough()));
  }
  // Never bypass authentication merely because a path contains a dot.
  const user = parseSessionUser(request.cookies.get("session")?.value);
  if (!user) {
    return secure(isApi ? NextResponse.json({ error: "Unauthorized" }, { status: 401 }) :
      NextResponse.redirect(new URL("/login", request.url)));
  }
  // Revalidate authoritative identity on every protected request: a role change,
  // password update or deactivation immediately invalidates the signed cookie.
  // businessType diambil dari DB (authoritative), bukan cookie, agar perubahan
  // jenis usaha oleh platform langsung berefek tanpa menunggu login ulang.
  let businessType: string | null = null;
  try {
    const current = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        isActive: true,
        role: true,
        updatedAt: true,
        store: { select: { businessType: true } },
      },
    });
    if (!current?.isActive || current.role !== user.role || current.updatedAt.toISOString() !== user.version) {
      const denied = isApi ? NextResponse.json({ error: "Session expired" }, { status: 401 }) :
        NextResponse.redirect(new URL("/login", request.url));
      denied.cookies.delete("session");
      return secure(denied);
    }
    businessType = current.store?.businessType ?? null;
  } catch {
    return secure(NextResponse.json({ error: "Authentication service unavailable" }, { status: 503 }));
  }
  if (!isApi && !canAccessPath(pathname, user.role)) {
    return secure(NextResponse.redirect(new URL(getDefaultPathForRole(user.role), request.url)));
  }
  // Gerbang vertikal (fail-closed): halaman & API modul spesifik-vertikal
  // (meja/QR, KDS, katering, laundry) hanya untuk toko dengan jenis usaha yang
  // memilikinya — menu yang disembunyikan tidak bisa dibuka lewat URL langsung.
  if (!isRouteAvailableForBusinessType(pathname, businessType)) {
    const denied = isApi
      ? NextResponse.json(
          { error: "Modul ini tidak tersedia untuk jenis usaha toko Anda" },
          { status: 403 }
        )
      : NextResponse.redirect(new URL("/dashboard?modul=tidak-tersedia", request.url));
    return secure(denied);
  }
  return secure(passThrough());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon.svg|favicon-.*\\.png|apple-touch-icon.png|android-chrome-.*\\.png|site.webmanifest|manifest.json|og-image.png|opengraph-image.png|twitter-image.png|apple-icon.png|brand/|window.svg|vercel.svg|next.svg|globe.svg|file.svg|uploads/).*)"],
};

