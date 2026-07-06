import { BotJobType } from "@prisma/client";
import { getBusinessDayContext } from "@/lib/business-day";
import { ensureBotSettings } from "@/lib/bot/settings";
import {
  claimNextBotJob,
  completeBotJob,
  enqueueBotJob,
  failBotJob,
  rescheduleBotJob,
} from "@/lib/bot/jobs";
import { answerSalesQuestion } from "@/lib/bot/qa";
import { buildDailyExecutiveSummary } from "@/lib/bot/summary";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/bot/telegram";

const IDLE_DELAY_MS = 5000;
const MAX_ATTEMPTS = 4;

function sleep(delayMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

interface TelegramMessagePayload {
  update_id?: number;
  message?: {
    text?: string;
    chat?: {
      id?: number | string;
    };
  };
}

function extractJobError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown bot worker error";
}

async function enqueueDailySummaryIfDue() {
  const settings = await ensureBotSettings();
  if (!settings.enabled || !settings.summaryEnabled) {
    return;
  }

  const summaryRecipient = await prisma.telegramChatBinding.findFirst({
    where: {
      isAuthorized: true,
      canReceiveSummary: true,
    },
  });

  if (!summaryRecipient) {
    return;
  }

  const context = getBusinessDayContext(new Date(), settings);
  await enqueueBotJob({
    type: BotJobType.DAILY_SUMMARY,
    dedupeKey: `daily-summary:${context.completedWindow.labelDate}`,
    payload: {
      labelDate: context.completedWindow.labelDate,
    } as never,
  });
}

async function handleTelegramMessageJob(payload: TelegramMessagePayload) {
  const text = payload.message?.text?.trim();
  const chatId = payload.message?.chat?.id;

  if (!chatId) {
    return;
  }

  const chatIdString = String(chatId);
  const settings = await ensureBotSettings();
  const binding = await prisma.telegramChatBinding.findUnique({
    where: {
      telegramChatId: chatIdString,
    },
  });

  if (text === "/start") {
    const statusMessage = binding?.isAuthorized
      ? "Bot siap dipakai. Anda bisa tanya penjualan hari ini, profit, produk terlaris, metode pembayaran, atau minta ringkasan stok rendah."
      : "Chat Anda sudah terdaftar sebagai kandidat. Minta admin mengotorisasi chat ini dari halaman Pengaturan sebelum memakai bot.";
    await sendTelegramMessage(chatIdString, statusMessage);
    return;
  }

  if (text === "/help") {
    await sendTelegramMessage(
      chatIdString,
      "Contoh pertanyaan: penjualan hari ini, keuntungan hari ini, top produk 7 hari terakhir, metode pembayaran hari ini, stok rendah."
    );
    return;
  }

  if (!settings.enabled) {
    await sendTelegramMessage(
      chatIdString,
      "Bot belum diaktifkan oleh admin."
    );
    return;
  }

  if (!binding?.isAuthorized) {
    await sendTelegramMessage(
      chatIdString,
      "Chat ini belum diotorisasi admin untuk membaca data penjualan."
    );
    return;
  }

  if (!text) {
    await sendTelegramMessage(
      chatIdString,
      "Saat ini saya baru bisa memproses pesan teks."
    );
    return;
  }

  const answer = await answerSalesQuestion({
    question: text,
    settings,
  });
  await sendTelegramMessage(chatIdString, answer);
}

async function handleDailySummaryJob() {
  const settings = await ensureBotSettings();
  const summaryRecipient = await prisma.telegramChatBinding.findFirst({
    where: {
      isAuthorized: true,
      canReceiveSummary: true,
    },
  });

  if (!summaryRecipient) {
    return;
  }

  const summary = await buildDailyExecutiveSummary(settings);
  await sendTelegramMessage(summaryRecipient.telegramChatId, summary);
}

async function processJob() {
  await enqueueDailySummaryIfDue();

  const job = await claimNextBotJob();
  if (!job) {
    await sleep(IDLE_DELAY_MS);
    return;
  }

  try {
    if (job.type === BotJobType.TELEGRAM_MESSAGE) {
      await handleTelegramMessageJob(job.payload as TelegramMessagePayload);
    } else if (job.type === BotJobType.DAILY_SUMMARY) {
      await handleDailySummaryJob();
    }

    await completeBotJob(job.id);
  } catch (error) {
    const message = extractJobError(error);
    if (job.attemptCount >= MAX_ATTEMPTS) {
      await failBotJob(job.id, message);
      return;
    }

    await rescheduleBotJob(job, message);
  }
}

async function main() {
  console.log("Bot worker started");
  while (true) {
    try {
      await processJob();
    } catch (error) {
      console.error("Bot worker loop error:", error);
      await sleep(IDLE_DELAY_MS);
    }
  }
}

void main();
