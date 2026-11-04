import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { signSession, verifyAndParseSession, checkRateLimit, resetRateLimit, isCsrfSafe, SESSION_TTL_SECONDS, CSP_HEADER } from "../src/lib/security";

process.env.BETTER_AUTH_SECRET = "test-only-secret-".repeat(4);

test("signed sessions reject altered payload, forged role and unsigned legacy cookie", () => {
  const token = signSession({ id: "user", role: "CASHIER" });
  assert.equal(verifyAndParseSession(token)?.role, "CASHIER");
  const [, signature] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ id: "user", role: "ADMIN" })).toString("base64url");
  assert.equal(verifyAndParseSession(`${forged}.${signature}`), null);
  assert.equal(verifyAndParseSession(forged), null);
  assert.equal(verifyAndParseSession(`${token}x`), null);
  assert.equal(verifyAndParseSession("x".repeat(5000)), null);
});

test("expired and unbounded signed sessions are rejected server-side", () => {
  function signed(payload: object) {
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${encoded}.${createHmac("sha256", process.env.BETTER_AUTH_SECRET!).update(encoded).digest("base64url")}`;
  }
  const now = Math.floor(Date.now() / 1000);
  assert.equal(verifyAndParseSession(signed({ iat: now - 60, exp: now - 1 })), null);
  assert.equal(verifyAndParseSession(signed({ iat: now, exp: now + SESSION_TTL_SECONDS + 1 })), null);
  assert.equal(verifyAndParseSession(signed({ role: "ADMIN" })), null);
});

test("missing or short signing secret fails closed", () => {
  const saved = process.env.BETTER_AUTH_SECRET;
  const fallback = process.env.NEXTAUTH_SECRET;
  delete process.env.NEXTAUTH_SECRET;
  process.env.BETTER_AUTH_SECRET = "short";
  try { assert.throws(() => signSession({ id: "user" }), /at least 32 bytes/); }
  finally { process.env.BETTER_AUTH_SECRET = saved; if (fallback) process.env.NEXTAUTH_SECRET = fallback; }
});

test("CSRF checks reject missing origins, sibling domains, unexpected ports and opaque origins", () => {
  assert.equal(isCsrfSafe("GET", null, null), true);
  assert.equal(isCsrfSafe("POST", "https://kadai.example", "kadai.example"), true);
  for (const origin of [null, "null", "https://evil.example", "https://kadai.example.evil.test", "https://kadai.example:444"]) {
    assert.equal(isCsrfSafe("POST", origin, "kadai.example"), false);
  }
});

test("login limiter allows configured budget, then enforces lockout", () => {
  const key = "security-test-rate";
  resetRateLimit(key);
  assert.equal(checkRateLimit(key, 2).allowed, true);
  assert.equal(checkRateLimit(key, 2).allowed, true);
  assert.equal(checkRateLimit(key, 2).allowed, false);
  assert.equal(checkRateLimit(key, 2).locked, true);
  resetRateLimit(key);
});

test("production CSP prohibits eval, framing and plugin objects", () => {
  assert.ok(!CSP_HEADER.includes("unsafe-eval"));
  assert.ok(CSP_HEADER.includes("frame-ancestors 'none'"));
  assert.ok(CSP_HEADER.includes("object-src 'none'"));
});
