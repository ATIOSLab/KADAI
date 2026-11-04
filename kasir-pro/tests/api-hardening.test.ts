import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// @ts-ignore Node native TypeScript runner requires the explicit extension.
import { redactCosts, SALES_READ_ROLES, validUploadUrl, validImageContent } from "../src/app/api/_lib/access.ts";

const route = (p: string) => readFileSync(new URL(`../src/app/api/${p}/route.ts`, import.meta.url), "utf8");
test("cashier output strips costs recursively without altering prices or Decimal JSON", () => {
  const data = { totalCost: "90", grossProfit: "10", totalAmount: "100", items: [{ totalCost: "90", batchAllocations: [{ costPrice: "9", sellingPrice: "10" }] }], date: new Date("2026-01-01Z") };
  const result = JSON.stringify(redactCosts(data, "CASHIER"));
  assert.doesNotMatch(result, /costPrice|totalCost|grossProfit/);
  assert.match(result, /sellingPrice/);
  assert.match(result, /2026-01-01/);
  assert.match(JSON.stringify(redactCosts(data, "ADMIN")), /costPrice/);
  assert.equal(data.totalCost, "90");
});
test("non-sales roles have no general sales read access", () => {
  assert.deepEqual([...SALES_READ_ROLES], ["ADMIN", "MANAGER", "CASHIER", "ACCOUNTANT"]);
});
test("upload deletion rejects traversal, Windows ADS, encoded paths and remote URLs", () => {
  for (const url of ["/uploads/products/..", "/uploads/products/../x.jpg", "/uploads/products/..\\x.jpg", "/uploads/products/%2e%2e.jpg", "/uploads/products/x.jpg:foo", "https://x/a.jpg", "/uploads/products/x.svg", "/uploads/products/."]) assert.equal(validUploadUrl(url), false, url);
  assert.equal(validUploadUrl("/uploads/products/coffee-123.png"), true);
});
test("upload content rejects spoofed MIME, SVG and HTML", () => {
  for (const mime of ["image/png", "image/jpeg", "image/webp", "image/svg+xml"]) {
    assert.equal(validImageContent(new TextEncoder().encode("<script>alert(1)</script>"), mime), false);
  }
  assert.equal(validImageContent(new Uint8Array([255,216,255,217]), "image/jpeg"), true);
});
test("all sales response paths apply recursive redaction", () => {
  assert.match(route("sales"), /data: redactCosts\(sales,/);
  assert.match(route("sales"), /data: redactCosts\(result,/);
  assert.match(route("sales/[id]"), /data: redactCosts\(sale,/);
  assert.match(route("products"), /if \(!sessionUser\)/);
  assert.match(route("products"), /data: redactCosts/);
});
test("public QR write is disabled without touching database", () => {
  const post = route("order").split("export async function POST")[1];
  assert.match(post, /status: 403/);
  assert.doesNotMatch(post, /prisma|transaction|request.json/);
});
test("webhook authenticates before payload and void claims atomically", () => {
  const webhook = route("telegram/webhook");
  assert.ok(webhook.indexOf("timingSafeEqual(Buffer") < webhook.indexOf("request.json()"));
  assert.match(webhook, /!expectedSecret/);
  const voidRoute = route("sales/[id]/void");
  assert.match(voidRoute, /where: \{ id, isVoided: false \}/);
  assert.match(voidRoute, /claim.count !== 1/);
});
