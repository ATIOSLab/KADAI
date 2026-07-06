import OpenAI from "openai";
import { type BotSettings } from "@prisma/client";
import {
  DEFAULT_BUSINESS_TIMEZONE,
  type BotAnalyticsPeriod,
  resolveBusinessRange,
} from "@/lib/business-day";
import {
  getHourlySales,
  getLowStockHighlights,
  getPaymentMix,
  getProfitSummary,
  getSalesSummary,
  getTopProducts,
} from "@/lib/reporting";
import { getStoredOpenAiApiKey } from "@/lib/bot/settings";

const PERIODS: BotAnalyticsPeriod[] = [
  "today",
  "yesterday",
  "last_7_days",
  "last_30_days",
  "this_month",
];

type FunctionCallLike = {
  name: string;
  call_id: string;
  arguments: string;
};

function createOpenAIClient(settings: Pick<BotSettings, "openaiApiKeyEncrypted">) {
  const apiKey =
    getStoredOpenAiApiKey(settings) || process.env.OPENAI_API_KEY || null;

  if (!apiKey) {
    throw new Error(
      "OpenAI API key belum dikonfigurasi. Isi API key di pengaturan bot atau env."
    );
  }

  return new OpenAI({
    apiKey,
  });
}

function getToolDefinitions() {
  return [
    {
      type: "function",
      name: "getSalesSummary",
      description:
        "Ambil ringkasan penjualan berdasarkan periode bisnis yang tersedia.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: PERIODS,
          },
        },
        required: ["period"],
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "getProfitSummary",
      description:
        "Ambil ringkasan profit, HPP, margin, dan revenue untuk periode bisnis.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: PERIODS,
          },
        },
        required: ["period"],
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "getTopProducts",
      description: "Ambil daftar produk terlaris pada periode tertentu.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: PERIODS,
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
        },
        required: ["period"],
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "getPaymentMix",
      description: "Ambil distribusi metode pembayaran untuk periode tertentu.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: PERIODS,
          },
        },
        required: ["period"],
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "getHourlySales",
      description: "Ambil distribusi transaksi per jam untuk periode tertentu.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: PERIODS,
          },
        },
        required: ["period"],
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "getLowStockHighlights",
      description:
        "Ambil daftar produk yang stoknya paling rendah saat ini. Tidak butuh periode.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
        },
        additionalProperties: false,
      },
    },
  ] as const;
}

async function executeTool(
  toolName: string,
  rawArgs: string,
  settings: Pick<BotSettings, "timezone" | "closingTimeLocal" | "openaiModel">
) {
  const parsedArgs = rawArgs ? (JSON.parse(rawArgs) as Record<string, unknown>) : {};
  const period = (parsedArgs.period as BotAnalyticsPeriod | undefined) || "today";
  const timezone = settings.timezone || DEFAULT_BUSINESS_TIMEZONE;

  if (toolName === "getLowStockHighlights") {
    return getLowStockHighlights(Number(parsedArgs.limit ?? 5));
  }

  const range = resolveBusinessRange(period, new Date(), settings);

  if (toolName === "getSalesSummary") {
    return getSalesSummary(range, timezone);
  }

  if (toolName === "getProfitSummary") {
    return getProfitSummary(range, timezone);
  }

  if (toolName === "getTopProducts") {
    return getTopProducts(range, Number(parsedArgs.limit ?? 5));
  }

  if (toolName === "getPaymentMix") {
    return getPaymentMix(range);
  }

  if (toolName === "getHourlySales") {
    return getHourlySales(range, timezone);
  }

  throw new Error(`Tool ${toolName} tidak dikenali`);
}

function extractFunctionCalls(response: { output?: unknown[] }) {
  return (response.output ?? []).filter((item): item is FunctionCallLike => {
    const value = item as Record<string, unknown>;
    return value.type === "function_call";
  });
}

export async function answerSalesQuestion(params: {
  question: string;
  settings: Pick<
    BotSettings,
    "timezone" | "closingTimeLocal" | "openaiModel" | "openaiApiKeyEncrypted"
  >;
}) {
  const client = createOpenAIClient(params.settings);
  const responseModel = params.settings.openaiModel || process.env.OPENAI_MODEL || "gpt-5.5";
  const tools = getToolDefinitions();
  let response = await client.responses.create({
    model: responseModel,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "Anda adalah bot analis penjualan KADAI. Jawab hanya pertanyaan yang berkaitan dengan penjualan, profit, produk terlaris, metode pembayaran, jam transaksi, atau stok rendah. Selalu gunakan tool jika membutuhkan angka. Jangan mengarang data. Jika pertanyaan di luar domain, tolak dengan singkat dalam Bahasa Indonesia. Gunakan jawaban ringkas, jelas, dan langsung ke inti.",
          },
        ],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: params.question }],
      },
    ],
    tools: tools as never,
  });

  for (let step = 0; step < 5; step += 1) {
    const functionCalls = extractFunctionCalls(response as { output?: unknown[] });
    if (functionCalls.length === 0) {
      return response.output_text?.trim() || "Saya belum bisa menjawab pertanyaan itu.";
    }

    const toolOutputs = [];
    for (const toolCall of functionCalls) {
      const result = await executeTool(
        toolCall.name,
        toolCall.arguments,
        params.settings
      );

      toolOutputs.push({
        type: "function_call_output",
        call_id: toolCall.call_id,
        output: JSON.stringify(result),
      });
    }

    response = await client.responses.create({
      model: responseModel,
      previous_response_id: response.id,
      input: toolOutputs as never,
    });
  }

  return "Saya belum bisa menyelesaikan pertanyaan itu sekarang.";
}
