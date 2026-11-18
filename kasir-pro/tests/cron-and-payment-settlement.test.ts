import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";
import { verifyCronSecret } from "../src/lib/cron-auth";

const repoRoot = path.join(import.meta.dirname, "..");
const RUTE = ["src/app/api/cron/billing-referral/route.ts", "src/app/api/cron/daily-summary/route.ts"];

function req(headers: Record<string, string>, query = ""): NextRequest {
  return {
    headers: new Headers(headers),
    nextUrl: { searchParams: new URLSearchParams(query) },
  } as unknown as NextRequest;
}

function denganSecret(nilai: string | undefined, fn: () => void) {
  const lama = process.env.CRON_SECRET;
  if (nilai === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = nilai;
  try {
    fn();
  } finally {
    if (lama === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = lama;
  }
}

test("tanpa CRON_SECRET di server, cron ditolak dan tidak berjalan", () => {
  denganSecret(undefined, () => {
    const hasil = verifyCronSecret(req({ "x-cron-secret": "apa pun" }));
    assert.equal(hasil.ok, false);
    if (!hasil.ok) {
      assert.equal(hasil.status, 503);
      assert.match(hasil.message, /CRON_SECRET belum dikonfigurasi/);
    }
  });
});

test("rahasia benar lewat header atau Bearer diterima", () => {
  denganSecret("rahasia-produksi", () => {
    assert.equal(verifyCronSecret(req({ "x-cron-secret": "rahasia-produksi" })).ok, true);
    assert.equal(
      verifyCronSecret(req({ authorization: "Bearer rahasia-produksi" })).ok,
      true
    );
  });
});

test("rahasia salah atau kosong ditolak", () => {
  denganSecret("rahasia-produksi", () => {
    assert.equal(verifyCronSecret(req({})).ok, false);
    assert.equal(verifyCronSecret(req({ "x-cron-secret": "rahasia-lama" })).ok, false);
    assert.equal(verifyCronSecret(req({ "x-cron-secret": "rahasia-produks" })).ok, false);
    // Panjang berbeda tidak boleh bikin error (perbandingan konstan-waktu).
    assert.equal(verifyCronSecret(req({ "x-cron-secret": "rahasia" })).ok, false);
  });
});

test("rahasia lewat query string tidak lagi diterima", () => {
  denganSecret("rahasia-produksi", () => {
    const hasil = verifyCronSecret(req({}, "?secret=rahasia-produksi"));
    assert.equal(hasil.ok, false);
  });
});

test("tidak ada rahasia cadangan yang ditulis di kode cron", () => {
  const sumber = RUTE.map((f) => readFileSync(path.join(repoRoot, f), "utf8")).join("\n");
  const seluruhSrc = ["src/lib", "src/app/api"].map((d) =>
    readFileSync(path.join(repoRoot, d, d.endsWith("lib") ? "cron-auth.ts" : "cron/billing-referral/route.ts"), "utf8")
  ).join("\n");

  for (const f of RUTE) {
    const isi = readFileSync(path.join(repoRoot, f), "utf8");
    assert.match(isi, /verifyCronSecret\(request\)/, `${f} harus memakai verifyCronSecret`);
    assert.doesNotMatch(isi, /kadai-internal-cron-token/, `${f} tidak boleh punya rahasia cadangan`);
    assert.doesNotMatch(isi, /BETTER_AUTH_SECRET/, `${f} tidak boleh memakai kunci sesi sebagai kunci API`);
    assert.doesNotMatch(isi, /searchParams\.get\("secret"\)/, `${f} tidak boleh menerima rahasia dari query`);
  }
  assert.match(sumber ?? "", /verifyCronSecret/);
  assert.match(seluruhSrc, /timingSafeEqual/);
});

test("tagihan tidak dilunasi bila nominal yang masuk kurang", () => {
  const billing = readFileSync(path.join(repoRoot, "src/lib/billing-service.ts"), "utf8");
  const midtrans = readFileSync(
    path.join(repoRoot, "src/app/api/webhooks/payment/midtrans/route.ts"),
    "utf8"
  );
  const xendit = readFileSync(
    path.join(repoRoot, "src/app/api/webhooks/payment/xendit/route.ts"),
    "utf8"
  );

  assert.match(billing, /underpaid: true/);
  assert.match(billing, /dibayar \+ 0\.01 < tagihan/);
  // Nominal dari penyedia wajib diteruskan ke settleInvoice.
  assert.match(midtrans, /paidAmount: Number\(body\.gross_amount \?\? 0\)/);
  assert.match(xendit, /paidAmount: body\.paid_amount/);
  assert.match(midtrans, /hasil\.underpaid/);
  assert.match(xendit, /hasil\.underpaid/);
});
