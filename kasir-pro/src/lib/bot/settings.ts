import { BotBusinessDayMode, type BotSettings } from "@prisma/client";
import { decryptBotSecret, encryptBotSecret } from "@/lib/bot/secrets";
import { prisma } from "@/lib/prisma";

export const DEFAULT_BOT_SETTINGS = {
  enabled: false,
  timezone: "Asia/Jakarta",
  closingTimeLocal: "22:00",
  summaryEnabled: false,
  openaiModel: process.env.OPENAI_MODEL || "gpt-5.5",
  businessDayMode: BotBusinessDayMode.CLOSING_CUTOFF,
} satisfies Pick<
  BotSettings,
  | "enabled"
  | "timezone"
  | "closingTimeLocal"
  | "summaryEnabled"
  | "openaiModel"
  | "businessDayMode"
>;

export async function ensureBotSettings() {
  const existing = await prisma.botSettings.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.botSettings.create({
    data: DEFAULT_BOT_SETTINGS,
  });
}

export async function getBotSettingsSnapshot() {
  const settings = await ensureBotSettings();
  const chats = await prisma.telegramChatBinding.findMany({
    orderBy: [{ canReceiveSummary: "desc" }, { updatedAt: "desc" }],
  });

  return {
    settings: {
      id: settings.id,
      enabled: settings.enabled,
      timezone: settings.timezone,
      closingTimeLocal: settings.closingTimeLocal,
      summaryEnabled: settings.summaryEnabled,
      businessDayMode: settings.businessDayMode,
      hasOpenAiApiKey: Boolean(settings.openaiApiKeyEncrypted),
      hasTelegramBotToken: Boolean(settings.telegramBotTokenEncrypted),
    },
    chats,
  };
}

export function getStoredOpenAiApiKey(
  settings: Pick<BotSettings, "openaiApiKeyEncrypted">
) {
  return decryptBotSecret(settings.openaiApiKeyEncrypted);
}

export function getStoredTelegramBotToken(
  settings: Pick<BotSettings, "telegramBotTokenEncrypted">
) {
  return decryptBotSecret(settings.telegramBotTokenEncrypted);
}

export function buildBotSecretUpdate(payload: {
  openaiApiKey?: string;
  telegramBotToken?: string;
}) {
  const updateData: {
    openaiApiKeyEncrypted?: string | null;
    telegramBotTokenEncrypted?: string | null;
  } = {};

  if (typeof payload.openaiApiKey === "string" && payload.openaiApiKey.trim()) {
    updateData.openaiApiKeyEncrypted = encryptBotSecret(payload.openaiApiKey);
  }

  if (
    typeof payload.telegramBotToken === "string" &&
    payload.telegramBotToken.trim()
  ) {
    updateData.telegramBotTokenEncrypted = encryptBotSecret(
      payload.telegramBotToken
    );
  }

  return updateData;
}

export async function getBotRuntimeSettings() {
  const settings = await ensureBotSettings();

  return {
    settings,
    openaiApiKey:
      getStoredOpenAiApiKey(settings) || process.env.OPENAI_API_KEY || null,
    telegramBotToken:
      getStoredTelegramBotToken(settings) || process.env.TELEGRAM_BOT_TOKEN || null,
  };
}
