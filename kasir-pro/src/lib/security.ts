import { createHmac, timingSafeEqual } from "crypto";

// ============================================================
// A02 — Cryptographic Failures: Session Cookie Signing
// ============================================================
// Session cookie MUST be HMAC-signed to prevent forgery.
// Format: base64(payload).base64(hmac)

export const SESSION_TTL_SECONDS = 8 * 60 * 60;

function getSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("Session signing requires a secret of at least 32 bytes");
  }
  return secret;
}

function hmacSign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export function signSession(payload: Record<string, unknown>): string {
  const payloadStr = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })).toString("base64url");
  const signature = hmacSign(payloadStr);
  return `${payloadStr}.${signature}`;
}

export function verifyAndParseSession<T = Record<string, unknown>>(
  token: string | null | undefined
): T | null {
  if (!token || token.length > 4096) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadPart, signaturePart] = parts;

  const expectedSignature = hmacSign(payloadPart);

  // Timing-safe comparison to prevent timing attacks
  try {
    const a = Buffer.from(signaturePart);
    const b = Buffer.from(expectedSignature);
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const decoded = Buffer.from(payloadPart, "base64url").toString("utf8");
    const parsed: unknown = JSON.parse(decoded);
    if (!parsed || typeof parsed !== "object" || !("exp" in parsed) || !("iat" in parsed)) return null;
    const now = Math.floor(Date.now() / 1000);
    if (typeof parsed.exp !== "number" || typeof parsed.iat !== "number" ||
        parsed.exp <= now || parsed.iat > now || parsed.exp - parsed.iat > SESSION_TTL_SECONDS) return null;
    return parsed as T;
  } catch {
    return null;
  }
}

// ============================================================
// A07 — Authentication Failures: Rate Limiting (in-memory)
// ============================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
  lockedUntil?: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now > entry.resetAt && (!entry.lockedUntil || now > entry.lockedUntil)) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  locked: boolean;
}

export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000,
  lockoutMs: number = 30 * 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  // Check lockout
  if (entry?.lockedUntil && now < entry.lockedUntil) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
      locked: true,
    };
  }

  // Reset window if expired
  if (!entry || now > entry.resetAt) {
    if (rateLimitMap.size >= 10000 && !entry) {
      return { allowed: false, remaining: 0, retryAfterSeconds: 300, locked: true };
    }
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterSeconds: 0, locked: false };
  }

  entry.count++;

  if (entry.count > maxAttempts) {
    // Lock out the key
    entry.lockedUntil = now + lockoutMs;
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(lockoutMs / 1000),
      locked: true,
    };
  }

  return {
    allowed: true,
    remaining: maxAttempts - entry.count,
    retryAfterSeconds: 0,
    locked: false,
  };
}

export function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}

// ============================================================
// A04 — Insecure Design: CSRF Protection
// ============================================================

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isCsrfSafe(
  method: string,
  origin: string | null,
  host: string | null
): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) return true;

  // For state-changing requests, verify Origin matches Host
  if (!origin || !host) return false;

  try {
    const originUrl = new URL(origin);
    const hostUrl = new URL(host.startsWith("http") ? host : `https://${host}`);

    return ["https:", "http:"].includes(originUrl.protocol) && originUrl.host === hostUrl.host;
  } catch {
    return false;
  }
}

// ============================================================
// A05 — Security Misconfiguration: Security Headers
// ============================================================

export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-DNS-Prefetch-Control": "off",
};

export const CSP_HEADER =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline'; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob: https:; " +
  "font-src 'self' data:; " +
  "connect-src 'self'; " +
  "frame-ancestors 'none'; " +
  "form-action 'self'; " +
  "base-uri 'self'; " +
  "object-src 'none';";

// ============================================================
// A05 — Error message sanitization
// ============================================================

export function sanitizeError(error: unknown, fallback: string): string {
  if (process.env.NODE_ENV === "production") {
    return fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
