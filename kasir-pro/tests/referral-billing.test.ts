import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { TIER_PRICES, cyclePrice, CYCLE_MONTHS } from "../src/lib/pricing";
import { addMonths } from "../src/lib/billing-service";
import { monthlyPeriod } from "../src/lib/referral-engine";
import {
  verifyMidtransSignature,
  verifyXenditCallbackToken,
  midtransIsSettled,
} from "../src/lib/payment/providers";

const MIDTRANS_KEY = "SB-Mid-server-TESTKEY123";
process.env.MIDTRANS_SERVER_KEY = MIDTRANS_KEY;
process.env.XENDIT_CALLBACK_TOKEN = "xendit-callback-token-test";

test("harga tier sinkron dengan halaman harga publik", () => {
  assert.equal(cyclePrice("FREE", "MONTHLY"), 0);
  assert.equal(cyclePrice("STARTER", "MONTHLY"), 99_000);
  assert.equal(cyclePrice("PRO_BUSINESS", "MONTHLY"), 249_000);
  assert.equal(cyclePrice("ENTERPRISE", "MONTHLY"), 599_000);
  assert.ok(TIER_PRICES.ENTERPRISE.ANNUAL > TIER_PRICES.ENTERPRISE.MONTHLY);
  assert.equal(CYCLE_MONTHS.ANNUAL, 12);
});

test("perpanjangan langganan menambah bulan sesuai siklus billing", () => {
  const start = new Date("2026-01-31T00:00:00.000Z");
  const monthly = addMonths(start, CYCLE_MONTHS.MONTHLY);
  const annual = addMonths(start, CYCLE_MONTHS.ANNUAL);
  assert.equal(annual.getUTCFullYear(), 2027);
  assert.ok(monthly.getTime() > start.getTime());

  const base = new Date("2026-03-15T00:00:00.000Z");
  assert.equal(addMonths(base, 3).getUTCMonth(), 5); // Juni
});

test("periode payout mengikuti bulan UTC (bukan lokal)", () => {
  assert.equal(monthlyPeriod(new Date("2026-11-07T15:30:00.000Z")), "2026-11");
  assert.equal(monthlyPeriod(new Date("2026-01-01T00:00:00.000Z")), "2026-01");
  assert.match(monthlyPeriod(), /^\d{4}-\d{2}$/);
});

test("webhook Midtrans hanya menerima signature sha512 yang valid", () => {
  const order_id = "INV-202611-0001";
  const status_code = "200";
  const gross_amount = "249000.00";
  const signature_key = crypto
    .createHash("sha512")
    .update(`${order_id}${status_code}${gross_amount}${MIDTRANS_KEY}`)
    .digest("hex");

  assert.equal(verifyMidtransSignature({ order_id, status_code, gross_amount, signature_key }), true);
  assert.equal(
    verifyMidtransSignature({ order_id, status_code, gross_amount, signature_key: signature_key.replace(/^./, "0") }),
    false
  );
  assert.equal(verifyMidtransSignature({ order_id, status_code, gross_amount }), false);
  assert.equal(
    verifyMidtransSignature({ order_id: "INV-LAIN", status_code, gross_amount, signature_key }),
    false
  );
});

test("status pelunasan Midtrans tidak meloloskan transaksi tertunda/ditolak", () => {
  assert.equal(midtransIsSettled("settlement"), true);
  assert.equal(midtransIsSettled("capture", "accept"), true);
  assert.equal(midtransIsSettled("capture", "deny"), false);
  assert.equal(midtransIsSettled("pending"), false);
  assert.equal(midtransIsSettled("expire"), false);
});

test("callback token Xendit dibandingkan konstan-waktu dan gagal-tertutup", () => {
  assert.equal(verifyXenditCallbackToken("xendit-callback-token-test"), true);
  assert.equal(verifyXenditCallbackToken("xendit-callback-token-tesX"), false);
  assert.equal(verifyXenditCallbackToken(""), false);
  assert.equal(verifyXenditCallbackToken(null), false);

  const saved = process.env.XENDIT_CALLBACK_TOKEN;
  delete process.env.XENDIT_CALLBACK_TOKEN;
  assert.equal(verifyXenditCallbackToken("xendit-callback-token-test"), false);
  process.env.XENDIT_CALLBACK_TOKEN = saved;
});
