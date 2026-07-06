import { z } from "zod";

const timeRegex = /^\d{2}:\d{2}$/;

export const botChatSettingsSchema = z.object({
  id: z.string().min(1),
  isAuthorized: z.boolean(),
  canReceiveSummary: z.boolean(),
});

export const botSettingsPayloadSchema = z
  .object({
    enabled: z.boolean(),
    timezone: z.string().min(1, "Timezone wajib diisi"),
    closingTimeLocal: z
      .string()
      .regex(timeRegex, "Jam closing harus format HH:MM"),
    summaryEnabled: z.boolean(),
    openaiApiKey: z.string().trim().optional().default(""),
    telegramBotToken: z.string().trim().optional().default(""),
    businessDayMode: z.literal("CLOSING_CUTOFF"),
    chats: z.array(botChatSettingsSchema).default([]),
  })
  .superRefine((value, context) => {
    const summaryTargets = value.chats.filter((chat) => chat.canReceiveSummary);

    if (summaryTargets.length > 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hanya satu chat yang boleh menerima summary",
        path: ["chats"],
      });
    }

    for (const chat of summaryTargets) {
      if (!chat.isAuthorized) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Chat penerima summary harus diotorisasi",
          path: ["chats"],
        });
      }
    }
  });

export type BotSettingsPayload = z.infer<typeof botSettingsPayloadSchema>;
