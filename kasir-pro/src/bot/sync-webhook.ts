import { syncTelegramWebhook } from "@/lib/bot/telegram";

async function main() {
  try {
    const result = await syncTelegramWebhook();
    console.log(result.reason);
  } catch (error) {
    console.error("Telegram webhook sync failed:", error);
    process.exitCode = 1;
  }
}

void main();
