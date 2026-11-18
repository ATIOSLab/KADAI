import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBotSettings } from "@/lib/bot/settings";
import { buildDailyExecutiveSummary } from "@/lib/bot/summary";
import { sendTelegramMessage } from "@/lib/bot/telegram";
import { verifyCronSecret } from "@/lib/cron-auth";
import { logger } from "@/lib/logger";

/**
 * Daily Executive & Z-Report Summary Cron
 * Dilindungi header `x-cron-secret` (atau `Authorization: Bearer`) yang harus
 * sama dengan CRON_SECRET di server. Tidak ada nilai cadangan di kode.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = verifyCronSecret(request);
    if (!auth.ok) {
      logger.warn("Cron daily-summary ditolak", "cron", { reason: auth.message });
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const settings = await ensureBotSettings();
    if (!settings.enabled) {
      return NextResponse.json({
        success: false,
        message: "Bot dinonaktifkan di pengaturan sistem.",
      });
    }

    // Find authorized chat bindings for daily summary
    const recipients = await prisma.telegramChatBinding.findMany({
      where: {
        isAuthorized: true,
        canReceiveSummary: true,
      },
    });

    if (recipients.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Tidak ada akun Telegram yang diotorisasi untuk menerima rekap harian.",
      });
    }

    // Build the executive summary report
    const summary = await buildDailyExecutiveSummary(settings);

    // Dispatch to all authorized recipients
    const dispatchResults = await Promise.allSettled(
      recipients.map(async (r) => {
        await sendTelegramMessage(r.telegramChatId, summary);
        return r.telegramChatId;
      })
    );

    const sent = dispatchResults.filter((r) => r.status === "fulfilled").length;
    const failed = dispatchResults.filter((r) => r.status === "rejected").length;

    logger.info("Daily summary cron executed", "cron", {
      totalRecipients: recipients.length,
      sent,
      failed,
    });

    return NextResponse.json({
      success: true,
      data: {
        totalRecipients: recipients.length,
        sent,
        failed,
        summaryPreview: summary.slice(0, 150) + "...",
      },
    });
  } catch (error: any) {
    logger.error("Daily summary cron failed", error, "cron");
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memproses rekap harian" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Allow health check / manual status check
  return POST(request);
}
