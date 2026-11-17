import { Prisma } from "@prisma/client";

/**
 * Nomor dokumen (invoice, batch, transfer) dihitung dari jumlah dokumen pada
 * hari itu, jadi dua permintaan bersamaan bisa menghitung nomor yang sama dan
 * ditolak unique index (P2002). Bila yang ditolak memang nomor dokumen, ulangi
 * — hitungan ulang memakai nomor berikutnya secara alami.
 *
 * `uniqueFields` WAJIB diisi bila transaksi juga menyimpan field unik lain
 * (SKU, barcode, email): penolakan atas field itu tidak boleh diulang, karena
 * hasilnya akan sama dan pengguna justru butuh pesan aslinya.
 */
export async function withUniqueNumberRetry<T>(
  // `attempt` (0,1,2,...) dipakai pemanggil untuk MENGESER nomor dokumen.
  // Tanpa itu hitungan ulang menghasilkan nomor yang sama persis, sehingga
  // lima percobaan menabrak nomor yang sama dan pengguna menerima 409 padahal
  // tidak ada yang bersamaan (nomor lama bolong karena batch dihapus).
  run: (attempt: number) => Promise<T>,
  options: { attempts?: number; uniqueFields?: string[]; onExhausted?: () => Error } = {}
): Promise<T> {
  const attempts = options.attempts ?? 5;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await run(attempt);
    } catch (error) {
      const retryable = isRetryableUniqueViolation(error, options.uniqueFields);
      if (!retryable) {
        // Bukan nomor dokumen yang bentrok: teruskan pesan aslinya.
        throw error;
      }
      // Percobaan terakhir: ganti galat Prisma dengan pesan yang bisa
      // ditindaklanjuti kasir/staff, bukan 500 tanpa penjelasan.
      if (attempt === attempts - 1) {
        throw options.onExhausted?.() ?? error;
      }
    }
  }

  throw options.onExhausted?.() ?? new Error("Gagal membuat nomor unik setelah beberapa percobaan");
}

/** P2002 pada `uniqueFields` (atau semua field bila daftarnya tidak diberikan). */
export function isRetryableUniqueViolation(error: unknown, uniqueFields?: string[]): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }
  if (!uniqueFields?.length) {
    return true;
  }

  const target = (error.meta as { target?: unknown } | undefined)?.target;
  const fields = Array.isArray(target)
    ? target.map(String)
    : typeof target === "string"
      ? [target]
      : [];

  // Sebagian driver tidak mengirim daftar field; anggap perlu diulang daripada
  // menggagalkan restock yang sebenarnya hanya bersamaan.
  return fields.length === 0 || fields.some((field) => uniqueFields.includes(field));
}
