import OpenAI from "openai";
import { type BotSettings } from "@prisma/client";
import { getBusinessDayContext } from "@/lib/business-day";
import {
  getLowStockHighlights,
  getPaymentMix,
  getProfitSummary,
  getSalesSummary,
  getTopProducts,
} from "@/lib/reporting";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { getStoredOpenAiApiKey } from "@/lib/bot/settings";

function createOpenAIClient(settings: Pick<BotSettings, "openaiApiKeyEncrypted">) {
  const apiKey =
    getStoredOpenAiApiKey(settings) || process.env.OPENAI_API_KEY || null;

  if (!apiKey) {
    throw new Error("OpenAI API key belum dikonfigurasi");
  }

  return new OpenAI({
    apiKey,
  });
}

function buildFallbackSummary(bundle: {
  sales: Awaited<ReturnType<typeof getSalesSummary>>;
  profit: Awaited<ReturnType<typeof getProfitSummary>>;
  topProducts: Awaited<ReturnType<typeof getTopProducts>>;
  paymentMix: Awaited<ReturnType<typeof getPaymentMix>>;
  lowStock: Awaited<ReturnType<typeof getLowStockHighlights>>;
}) {
  const lines = [
    `Executive Summary ${bundle.sales.label}`,
    `Revenue ${formatCurrency(bundle.sales.revenue)} dari ${formatNumber(bundle.sales.transactions)} transaksi.`,
    `Profit ${formatCurrency(bundle.profit.profit)} dengan margin ${bundle.profit.margin.toFixed(1)}%.`,
  ];

  if (bundle.topProducts[0]) {
    lines.push(
      `Produk teratas: ${bundle.topProducts[0].name} (${formatNumber(bundle.topProducts[0].qty)} item).`
    );
  }

  if (bundle.paymentMix[0]) {
    lines.push(
      `Metode bayar dominan: ${bundle.paymentMix[0].name} ${formatCurrency(bundle.paymentMix[0].value)}.`
    );
  }

  if (bundle.lowStock[0]) {
    lines.push(
      `Perlu perhatian stok: ${bundle.lowStock
        .slice(0, 3)
        .map((item) => `${item.name} (${item.remainingQty})`)
        .join(", ")}.`
    );
  }

  return lines.join("\n");
}

export async function buildDailyExecutiveSummary(
  settings: Pick<
    BotSettings,
    "timezone" | "closingTimeLocal" | "openaiModel" | "openaiApiKeyEncrypted"
  >
) {
  const context = getBusinessDayContext(new Date(), settings);
  const completedRange = {
    ...context.completedWindow,
    label: `Closing ${context.completedWindow.labelDate}`,
    period: "yesterday" as const,
  };

  const [sales, profit, topProducts, paymentMix, lowStock] = await Promise.all([
    getSalesSummary(completedRange, settings.timezone),
    getProfitSummary(completedRange, settings.timezone),
    getTopProducts(completedRange, 5),
    getPaymentMix(completedRange),
    getLowStockHighlights(5),
  ]);

  const bundle = { sales, profit, topProducts, paymentMix, lowStock };

  try {
    const client = createOpenAIClient(settings);
    const response = await client.responses.create({
      model: settings.openaiModel || process.env.OPENAI_MODEL || "gpt-5.5",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "Anda adalah analis penjualan eksekutif. Ubah data terstruktur menjadi executive summary Bahasa Indonesia yang singkat, profesional, dan padat. Maksimal 6 baris. Jangan menambah angka yang tidak ada.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(bundle),
            },
          ],
        },
      ],
    });

    return response.output_text?.trim() || buildFallbackSummary(bundle);
  } catch {
    return buildFallbackSummary(bundle);
  }
}
