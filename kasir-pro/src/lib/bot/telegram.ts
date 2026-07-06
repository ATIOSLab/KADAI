import { BotJobType } from "@prisma/client";
import { enqueueBotJob } from "@/lib/bot/jobs";
import { getBotRuntimeSettings } from "@/lib/bot/settings";
import { prisma } from "@/lib/prisma";

const TELEGRAM_API_BASE = "https://api.telegram.org";
export const TELEGRAM_WEBHOOK_PATH = "/api/telegram/webhook";

interface TelegramApiResponse<T> {
  ok: boolean;
  result: T;
  description?: string;
}

interface TelegramWebhookInfo {
  url: string;
  allowed_updates?: string[];
  pending_update_count?: number;
}

async function getTelegramToken() {
  const runtime = await getBotRuntimeSettings();
  const token = runtime.telegramBotToken;

  if (!token) {
    throw new Error(
      "Telegram bot token belum dikonfigurasi. Isi token di pengaturan bot atau env."
    );
  }

  return token;
}

export function getTelegramWebhookSecret() {
  return process.env.TELEGRAM_WEBHOOK_SECRET || "";
}

async function callTelegramApi<T>(method: string, payload?: unknown) {
  const token = await getTelegramToken();
  const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const json = (await response.json()) as TelegramApiResponse<T>;
  if (!response.ok || !json.ok) {
    throw new Error(json.description || `Telegram API ${method} gagal`);
  }

  return json.result;
}

export async function sendTelegramMessage(chatId: string, text: string) {
  return callTelegramApi("sendMessage", {
    chat_id: chatId,
    text,
  });
}

export async function getWebhookInfo() {
  return callTelegramApi<TelegramWebhookInfo>("getWebhookInfo");
}

export async function setWebhook(webhookUrl: string, secretToken: string) {
  return callTelegramApi<boolean>("setWebhook", {
    url: webhookUrl,
    secret_token: secretToken,
    allowed_updates: ["message"],
  });
}

export async function deleteWebhook() {
  return callTelegramApi<boolean>("deleteWebhook");
}

export async function syncTelegramWebhook() {
  const baseUrl = process.env.APP_BASE_URL;
  const secretToken = getTelegramWebhookSecret();
  const runtime = await getBotRuntimeSettings();

  if (!runtime.telegramBotToken || !baseUrl || !secretToken) {
    return {
      skipped: true,
      reason: "Telegram webhook belum dikonfigurasi penuh",
    };
  }

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  if (!normalizedBaseUrl.startsWith("https://")) {
    return {
      skipped: true,
      reason: "APP_BASE_URL harus HTTPS untuk webhook Telegram",
    };
  }

  const desiredUrl = `${normalizedBaseUrl}${TELEGRAM_WEBHOOK_PATH}`;
  const info = await getWebhookInfo();
  const allowedUpdates = info.allowed_updates ?? [];

  if (
    info.url === desiredUrl &&
    allowedUpdates.length === 1 &&
    allowedUpdates[0] === "message"
  ) {
    return {
      skipped: true,
      reason: "Webhook Telegram sudah sinkron",
    };
  }

  await setWebhook(desiredUrl, secretToken);

  return {
    skipped: false,
    reason: "Webhook Telegram berhasil diperbarui",
  };
}

export async function registerTelegramChatCandidate(payload: {
  telegramChatId: string;
  chatType: string;
  title?: string | null;
  username?: string | null;
}) {
  return prisma.telegramChatBinding.upsert({
    where: {
      telegramChatId: payload.telegramChatId,
    },
    update: {
      chatType: payload.chatType,
      title: payload.title || null,
      username: payload.username || null,
      lastSeenAt: new Date(),
    },
    create: {
      telegramChatId: payload.telegramChatId,
      chatType: payload.chatType,
      title: payload.title || null,
      username: payload.username || null,
      lastSeenAt: new Date(),
    },
  });
}

export async function enqueueTelegramUpdate(update: unknown, updateId: string) {
  return enqueueBotJob({
    type: BotJobType.TELEGRAM_MESSAGE,
    payload: update as never,
    dedupeKey: `telegram-update:${updateId}`,
  });
}
