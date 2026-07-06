-- AlterTable
ALTER TABLE "bot_settings"
ADD COLUMN     "openaiApiKeyEncrypted" TEXT,
ADD COLUMN     "telegramBotTokenEncrypted" TEXT;
