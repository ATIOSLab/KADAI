# OWASP Top 10 hardening — 2026-11-04

Scope: single-store KADAI, OWASP Top 10 (2021) mapping. This is not a certification or completed penetration test.

- A01: server-side role guards, recursive sales cost/profit redaction, live identity/role/version validation in proxy. Public ADMIN registration disabled. No tenant isolation exists in the schema; do not market this database as isolated SaaS.
- A02: HMAC-SHA256 cookie with timing-safe verification and signed 8-hour expiry. Signing secret must be >=32 bytes; no fallback. Seed no longer ships a password/PIN. Current signed cookie sessions invalidated after user update.
- A03: validation strengthened for login/PIN, sales pagination/filter, upload path and image signatures. This does not establish exhaustive injection coverage for every route.
- A04: public QR write disabled because it bypassed cashier settlement/FIFO. Read menu remains available. This is an intentional feature restriction pending an authenticated cashier-settled draft workflow. Atomic void claim added; DB concurrency still needs integration testing.
- A05: origin/host CSRF checks including login/logout; dedicated authenticated webhook exemption. CSP, nosniff, frame denial, HSTS, no-store API responses; no eval in CSP. Inline scripts still allowed for Next compatibility. Container configured non-root, but image not built/exercised here.
- A06: Next upgraded to 16.4.5; compatible dependency fixes applied. Initial production audit 32 vulnerabilities (3 critical); after fixes production audit 9 (0 critical, 3 high, 4 moderate, 2 low) before attempted removal of shadcn. Removal broke a real CSS import, so dependency restored to 4.23.0 (exports shadcn/tailwind.css). Final production audit remains 9 vulnerabilities: 0 critical, 3 high, 4 moderate, 2 low. A clean-build gate is required after restoring the package. Prisma 6 CLI includes vulnerable deepmerge-ts <8 (GHSA-ggr8-5vv4-36mx). Do not force Prisma 7 without migration/adapter verification. Re-run audit on final lockfile.
- A07: account and IP login budgets, PIN throttling, no default supervisor PIN, bounded cookie payload. In-memory limits are per-process and reset on restart; distributed/shared enforcement remains required for scale. Forwarded-IP trust depends on ingress configuration.
- A08: lockfile/npm ci used. No image digest pinning, artifact signing or complete CI provenance supplied by this change.
- A09: auth success/failure activity logging added. No central SIEM/alert delivery or log retention evidence established. Inspect existing logs for personal data before forwarding them.
- A10: outbound URL configuration/redirect/private-address restrictions not comprehensively verified. SSRF cannot be declared fully closed.

## Verification
Executed security unit/source-wiring tests and bot tests: 16/16 pass before final build. TypeScript and Next production build passed before dependency refresh. Final refreshed build is a separate gate; inspect actual command output. Tests do not exercise live HTTP/database, concurrent transactions, screenshots or Docker runtime.

## Deployment and operations
No deployment performed. Dokploy source metadata did not match authorized root-id/ATIOSLab scope; correct source and verify signing/webhook secrets before deploying. Login sessions will expire; provision admin credentials and supervisor PIN through environment/authenticated workflows. Back up DB before deployment. Confirm persistent upload volume is writable by container UID 1001. Docker non-root change requires runtime verification on VPS.

See src/app/api/SECURITY-AUDIT.md for API-specific restrictions and follow-up.
