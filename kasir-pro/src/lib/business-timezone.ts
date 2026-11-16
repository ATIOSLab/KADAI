import { prisma } from "./prisma";
import { DEFAULT_BUSINESS_TIMEZONE } from "./business-day";

/**
 * Zona waktu bisnis aplikasi (disimpan pada pengaturan platform `bot_settings`).
 *
 * Server produksi berjalan di UTC, sehingga setiap perhitungan "hari ini",
 * rentang tanggal, bucket harian, dan jam grafik WAJIB memakai zona ini —
 * kalau tidak, hari operasional toko WIB bergeser 7 jam (00:00-07:00 lokal
 * terbaca sebagai hari sebelumnya).
 */
export async function resolveBusinessTimezone(): Promise<string> {
  const settings = await prisma.botSettings.findFirst({
    orderBy: { createdAt: "asc" },
    select: { timezone: true },
  });

  return settings?.timezone || DEFAULT_BUSINESS_TIMEZONE;
}
