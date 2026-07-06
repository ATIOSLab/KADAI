import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_ONLY_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import {
  buildBotSecretUpdate,
  getBotSettingsSnapshot,
} from "@/lib/bot/settings";
import { syncTelegramWebhook } from "@/lib/bot/telegram";
import { botSettingsPayloadSchema } from "@/lib/validators/bot";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ADMIN_ONLY_ROLES)) {
      return NextResponse.json(
        { error: "Hanya admin yang dapat mengelola bot" },
        { status: 403 }
      );
    }

    const snapshot = await getBotSettingsSnapshot();
    return NextResponse.json({ data: snapshot });
  } catch (error) {
    console.error("GET /api/settings/bot error:", error);
    return NextResponse.json(
      { error: "Gagal memuat pengaturan bot" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ADMIN_ONLY_ROLES)) {
      return NextResponse.json(
        { error: "Hanya admin yang dapat mengelola bot" },
        { status: 403 }
      );
    }

    const payload = botSettingsPayloadSchema.parse(await request.json());
    const secretUpdateData = buildBotSecretUpdate({
      openaiApiKey: payload.openaiApiKey,
      telegramBotToken: payload.telegramBotToken,
    });
    const existing = await prisma.botSettings.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    });

    await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.botSettings.update({
          where: { id: existing.id },
          data: {
            enabled: payload.enabled,
            timezone: payload.timezone,
            closingTimeLocal: payload.closingTimeLocal,
            summaryEnabled: payload.summaryEnabled,
            businessDayMode: payload.businessDayMode,
            ...secretUpdateData,
          },
        });
      } else {
        await tx.botSettings.create({
          data: {
            enabled: payload.enabled,
            timezone: payload.timezone,
            closingTimeLocal: payload.closingTimeLocal,
            summaryEnabled: payload.summaryEnabled,
            businessDayMode: payload.businessDayMode,
            ...secretUpdateData,
          },
        });
      }

      await tx.telegramChatBinding.updateMany({
        data: {
          canReceiveSummary: false,
        },
      });

      for (const chat of payload.chats) {
        await tx.telegramChatBinding.update({
          where: {
            id: chat.id,
          },
          data: {
            isAuthorized: chat.isAuthorized,
            canReceiveSummary: chat.canReceiveSummary,
          },
        });
      }
    });

    let warning: string | null = null;
    try {
      await syncTelegramWebhook();
    } catch (error) {
      warning =
        error instanceof Error
          ? error.message
          : "Pengaturan tersimpan, tetapi sinkronisasi webhook gagal.";
    }

    const snapshot = await getBotSettingsSnapshot();
    return NextResponse.json({ success: true, data: snapshot, warning });
  } catch (error) {
    console.error("PUT /api/settings/bot error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Payload bot tidak valid" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Gagal menyimpan pengaturan bot" },
      { status: 500 }
    );
  }
}
