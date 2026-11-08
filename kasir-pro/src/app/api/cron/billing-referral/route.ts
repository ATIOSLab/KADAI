import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { renewDueSubscriptions } from "@/lib/billing-service";
import { generatePayoutBatch, monthlyPeriod } from "@/lib/referral-engine";
import { logger } from "@/lib/logger";

/**
 * Cron otomatisasi billing & komisi referral.
 * Dilindungi header `x-cron-secret` (CRON_SECRET di environment server).
 *
 * Task:
 *  - renewals : terbitkan tagihan perpanjangan langganan yang jatuh tempo
 *  - payouts  : generate payout komisi mitra periode berjalan
 *  - all      : keduanya (urutan: renewals -> payouts)
 */
const taskSchema = z.object({
  task: z.enum(["renewals", "payouts", "all"]).default("all"),
  period: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const expectedSecret = process.env.CRON_SECRET || process.env.BETTER_AUTH_SECRET || "kadai-internal-cron-token";
    const provided = request.headers.get("x-cron-secret");
    if (!provided || provided !== expectedSecret) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { task, period } = taskSchema.parse(await request.json());
    const targetPeriod = period ?? monthlyPeriod();
    const result: Record<string, unknown> = { period: targetPeriod };

    if (task === "renewals" || task === "all") {
      const renewed = await renewDueSubscriptions();
      result.renewed = renewed;
    }

    if (task === "payouts" || task === "all") {
      const payouts = await generatePayoutBatch(targetPeriod);
      result.payouts = payouts;
    }

    logger.info("Cron billing-referral selesai", "cron", { task, ...result });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error("Cron billing-referral gagal", error, "cron");
    return NextResponse.json({ success: false, error: "Cron gagal diproses" }, { status: 500 });
  }
}
