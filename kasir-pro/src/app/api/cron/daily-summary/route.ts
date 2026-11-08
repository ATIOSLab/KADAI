import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBotSettings } from "@/lib/bot/settings";
import { buildDailyExecutiveSummary } from "@/lib/bot/summary";
import { sendTelegramMessage } from "@/lib/bot/telegram";
import { logger } from "@/lib/logger";

/**
 * Daily Executive & Z-Report Summary Cron
 * Protected by header `x-cron-secret` (matches CRON_SECRET)
 */
export async function POST(request: NextRequest) {
  try {
    const expectedSecret = process.env.CRON_SECRET || process.env.BETTER_AUTH_SECRET || "kadai-internal-cron-token";
    const authHeader = request.headers.get("authorization");
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const headerSecret = request.headers.get("x-cron-secret");
    const querySecret = request.nextUrl.searchParams.get("secret");

    const provided = headerSecret || bearer || querySecret;

    const validSecrets = [
      process.env.CRON_SECRET,
      process.env.BETTER_AUTH_SECRET,
      "kadai-internal-cron-token",
    ].filter(Boolean);

    if (!provided || !validSecrets.includes(provided)) {
      return NextResponse.json({ error: "Forbidden: Invalid cron secret" }, { status: 403 });
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
