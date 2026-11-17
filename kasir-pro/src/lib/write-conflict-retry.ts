import { Prisma } from "@prisma/client";
import { ApiBusinessError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

/**
 * Transaksi Serializable (transfer, penyesuaian stok, produksi) bisa dibatalkan
 * PostgreSQL saat dua permintaan menyentuh baris yang sama: kode 40001
 * ("could not serialize access due to read/write dependencies") yang Prisma
 * angkat sebagai P2034, atau P2028 saat transaksi sudah ditutup. Sebelumnya
 * kegagalan ini lolos ke handler error dan menjadi HTTP 500 "Terjadi kesalahan
 * pada database" - padahal permintaan lawannya sukses, jadi pengguna hanya
 * perlu melihat pesan "sedang diproses permintaan lain, coba lagi" (409).
 *
 * Di sini transaksi dikembalikan ke pemanggil, dicoba ulang beberapa kali
 * dengan jeda acak kecil, dan hanya bila tetap gagal diterjemahkan menjadi 409
 * yang bisa ditindaklanjuti.
 */
export function isWriteConflictError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  if (code === "P2034" || code === "P2028") return true;
  const message = (error as { message?: string }).message ?? "";
  return /40001|could not serialize|write conflict|deadlock detected|Transaction already closed/i.test(message);
}

type RetryOptions = {
  /** Jumlah percobaan total (termasuk percobaan pertama). Default 5. */
  attempts?: number;
  /** Kode pesan 409 yang dipakai bila percobaan habis. */
  exhaustedCode?: string;
  /** Pesan 409 yang dipakai bila percobaan habis. */
  exhaustedMessage?: string;
  /** Label untuk log, mis. "transfer.receive". */
  context?: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withWriteConflictRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const attempts = options.attempts ?? 5;
  const exhaustedCode = options.exhaustedCode ?? "WRITE_CONFLICT";
  const exhaustedMessage =
    options.exhaustedMessage ??
    "Permintaan lain sedang menyentuh data yang sama. Silakan ulangi sebentar lagi.";

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isWriteConflictError(error)) throw error;
      lastError = error;
      logger.warn(
        `${options.context ?? "write"} bentrok tulis (percobaan ${attempt}/${attempts}): ${(error as Error)?.message ?? error}`
      );
      if (attempt < attempts) {
        // Jeda tumbuh + acak: penantang mundur makin jauh, sehingga 8-12
        // permintaan serentak tidak terus bertabrakan pada baris yang sama.
        await sleep(Math.min(400, 30 * attempt) + Math.floor(Math.random() * 80));
      }
    }
  }

  // Bila kegagalan sudah berupa aturan bisnis (mis. baris sudah diklaim pihak
  // lain), teruskan apa adanya supaya pesannya tetap spesifik.
  if (lastError instanceof Prisma.PrismaClientKnownRequestError && lastError.code === "P2002") {
    throw lastError;
  }
  throw new ApiBusinessError(exhaustedMessage, 409, exhaustedCode);
}
