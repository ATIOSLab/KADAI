import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * Otorisasi cron.
 *
 * Endpoint cron menerbitkan tagihan perpanjangan dan mencairkan komisi mitra —
 * artinya memicunya sama dengan memindahkan uang. Karena itu:
 *  - rahasia wajib datang dari environment (`CRON_SECRET`); tidak ada nilai
 *    cadangan yang ditulis di kode, karena nilai di kode = nilai yang diketahui
 *    siapa pun yang pernah melihat repo;
 *  - kunci penandatangan sesi (`BETTER_AUTH_SECRET`) tidak boleh merangkap
 *    sebagai kunci API: satu kebocoran akan membuka dua pintu;
 *  - rahasia hanya diterima lewat header (`x-cron-secret` atau `Bearer`), tidak
 *    lewat query string yang ikut tercatat di log akses, history browser, dan
 *    header Referer;
 *  - perbandingan dilakukan konstan-waktu supaya tidak bisa ditebak sedikit
 *    demi sedikit dari selisih waktu balasan.
 */
export const CRON_SECRET_HEADER = "x-cron-secret";

export type CronAuthResult =
  | { ok: true }
  | { ok: false; status: number; message: string };

function samaPersis(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyCronSecret(request: NextRequest): CronAuthResult {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  if (!secret) {
    // Gagal-tertutup: tanpa rahasia yang benar, cron tidak dijalankan sama
    // sekali. Lebih baik tagihan tidak terbit daripada pintu uang terbuka.
    return {
      ok: false,
      status: 503,
      message: "Cron dinonaktifkan: CRON_SECRET belum dikonfigurasi di server",
    };
  }

  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  const provided = (request.headers.get(CRON_SECRET_HEADER) ?? bearer ?? "").trim();

  if (!provided || !samaPersis(provided, secret)) {
    return { ok: false, status: 403, message: "Forbidden" };
  }
  return { ok: true };
}
