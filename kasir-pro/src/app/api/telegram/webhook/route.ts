import { NextRequest, NextResponse } from "next/server";
import {
  enqueueTelegramUpdate,
  getTelegramWebhookSecret,
  registerTelegramChatCandidate,
} from "@/lib/bot/telegram";

type TelegramUpdate = {
  update_id?: number;
  message?: {
    chat?: {
      id?: number | string;
      type?: string;
      title?: string;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
  };
};

export async function POST(request: NextRequest) {
  try {
    const secretHeader = request.headers.get("x-telegram-bot-api-secret-token");
    const expectedSecret = getTelegramWebhookSecret();

    if (!expectedSecret || secretHeader !== expectedSecret) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const update = (await request.json()) as TelegramUpdate;
    if (!update.update_id) {
      return NextResponse.json({ ok: true });
    }

    const chat = update.message?.chat;
    if (chat?.id) {
      const titleParts = [chat.first_name, chat.last_name].filter(Boolean).join(" ");
      await registerTelegramChatCandidate({
        telegramChatId: String(chat.id),
        chatType: chat.type || "private",
        title: chat.title || titleParts || null,
        username: chat.username || null,
      });
    }

    await enqueueTelegramUpdate(update, String(update.update_id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/telegram/webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}
