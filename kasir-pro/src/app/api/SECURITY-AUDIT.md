# API security hardening (scoped review)

## Fixed
- Sales list/detail/create leaked nested item and allocation purchase costs to cashiers. Recursive JSON redaction now applies to all three responses, preserving Decimal/Date serialization. Kitchen/inventory roles no longer read arbitrary sales; cashier ownership remains enforced.
- Products list lacked its own authentication and only masked costs for cashiers. It now authenticates independently and redacts costs for all non-cost roles.
- Public QR POST directly created CASH sales under an arbitrary employee, accepted negative/unbounded quantities and inactive products, skipped FIFO/finance settlement, and fabricated zero costs. This unsafe write endpoint now fails closed (403); catalog GET remains available. This intentionally disables self-order submission until a proper pending-order model is implemented.
- Manufactured checkout trusted client unitPrice. It now uses the oldest available server batch price; missing price fails closed. Negative post-discount totals are rejected; checkout item count/quantity are bounded.
- Void allowed all authenticated roles with a supervisor PIN and concurrent calls could double-restore stock. Limit to sales writers, enforce cashier ownership, atomically claim a non-voided sale inside the transaction.
- Upload endpoint checks file size, common image signatures, and a single generated filename allowlist for deletion (rejects traversal, encoded paths, Windows ADS). Internal filesystem error messages are not returned.
- Telegram webhook already required its configured secret before processing. Comparison is now timing-safe; update IDs and candidate chat IDs receive basic validation. New table QR tokens use randomUUID instead of predictable timestamps.
- Sales pagination is bounded and payment/date filters validated before querying. Unexpected checkout errors no longer expose exception details.

## Verification
`npx tsx --test tests/api-hardening.test.ts`: 7 tests passed (pure policy tests plus source-wiring regression assertions). No local server/database or deployment used. These are NOT live HTTP/DB integration tests. Parent verification subsequently installed dependencies: TypeScript and production build passed before the dependency refresh. See DOCS/OWASP-HARDENING.md for final verification and residual risks.

## Remaining limitations / follow-up
- No tenant identifiers/ownership relationships exist in the inspected schema. This does NOT implement multi-tenant isolation.
- Public QR ordering needs a pending/unpaid state, secure settlement, FIFO/CRM/finance integration, idempotency and distributed abuse controls before re-enabling. Existing predictable table tokens are not automatically rotated.
- Image magic-byte checks are only baseline screening, not a full decoder/re-encoder or malware defense. Enforce streamed body limits at the ingress (Content-Length can be absent/forged), pixel/decompression limits, quotas, storage isolation and nosniff. Inventory users share uploaded assets; no per-uploader ownership exists.
- Generic role authorization remains dependent on parent-owned session/proxy/security code. No auth/session changes here.
- Financial race/business-logic integration tests, malformed-body consistency across remaining routes, global bounded pagination and comprehensive rate limiting remain to be audited. Manufactured pricing requires a configured active batch; errors currently return generic 500 rather than a domain-specific 400.
- No raw SQL or fetch calls were found directly in API routes. This does not establish SQL/SSRF safety of downstream reporting/bot integrations; those libraries require separate review.
- Telegram payload validation is basic, not a complete update schema; operational queue/retry/error logging controls remain separate.
