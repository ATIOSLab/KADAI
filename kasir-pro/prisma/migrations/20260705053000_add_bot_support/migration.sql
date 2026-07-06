-- CreateEnum
CREATE TYPE "BotBusinessDayMode" AS ENUM ('CLOSING_CUTOFF');

-- CreateEnum
CREATE TYPE "BotJobType" AS ENUM ('TELEGRAM_MESSAGE', 'DAILY_SUMMARY');

-- CreateEnum
CREATE TYPE "BotJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "bot_settings" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "closingTimeLocal" TEXT NOT NULL DEFAULT '22:00',
    "summaryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "openaiModel" TEXT NOT NULL DEFAULT 'gpt-5.5',
    "businessDayMode" "BotBusinessDayMode" NOT NULL DEFAULT 'CLOSING_CUTOFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_chat_bindings" (
    "id" TEXT NOT NULL,
    "telegramChatId" TEXT NOT NULL,
    "chatType" TEXT NOT NULL,
    "title" TEXT,
    "username" TEXT,
    "isAuthorized" BOOLEAN NOT NULL DEFAULT false,
    "canReceiveSummary" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_chat_bindings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_jobs" (
    "id" TEXT NOT NULL,
    "type" "BotJobType" NOT NULL,
    "status" "BotJobStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "telegram_chat_bindings_telegramChatId_key" ON "telegram_chat_bindings"("telegramChatId");

-- CreateIndex
CREATE INDEX "telegram_chat_bindings_isAuthorized_idx" ON "telegram_chat_bindings"("isAuthorized");

-- CreateIndex
CREATE INDEX "telegram_chat_bindings_canReceiveSummary_idx" ON "telegram_chat_bindings"("canReceiveSummary");

-- CreateIndex
CREATE UNIQUE INDEX "bot_jobs_dedupeKey_key" ON "bot_jobs"("dedupeKey");

-- CreateIndex
CREATE INDEX "bot_jobs_status_nextRetryAt_idx" ON "bot_jobs"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "bot_jobs_type_status_idx" ON "bot_jobs"("type", "status");

-- CreateIndex
CREATE INDEX "bot_jobs_lockedAt_idx" ON "bot_jobs"("lockedAt");
