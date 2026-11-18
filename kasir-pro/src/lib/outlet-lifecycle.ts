import type { Prisma, PrismaClient } from "@prisma/client";

/**
 * Satu sumber aturan "boleh tidak cabang ini dinonaktifkan".
 *
 * Aturan ini dipakai dua jalur yang berbeda: `DELETE /api/outlets` (tombol
 * hapus) dan `PUT /api/outlets` dengan `isActive: false` (formulir ubah).
 * Kalau aturannya ditulis dua kali, cepat atau lambat salah satu jalur jadi
 * pintu belakang - persis yang terjadi pada pemasok, di mana tombol
 * "Nonaktifkan" mengirim `isActive` yang dibuang diam-diam oleh validator.
 */
export interface OutletSnapshot {
  id: string;
  name: string;
  isMain: boolean;
  isActive: boolean;
}

export interface PenolakanOutlet {
  message: string;
  code: "MAIN_OUTLET_PROTECTED" | "LAST_OUTLET_PROTECTED" | "OUTLET_HAS_OPEN_SHIFT";
}

type Client = PrismaClient | Prisma.TransactionClient;

/**
 * Mengembalikan alasan penolakan, atau `null` bila cabang boleh dinonaktifkan.
 *
 *  - Cabang utama: kasir tanpa cabang kehilangan default laci kas.
 *  - Cabang aktif terakhir: toko jadi tidak punya tempat berjualan.
 *  - Cabang dengan laci terbuka: uang tunai yang belum dihitung hilang dari
 *    rekonsiliasi begitu cabangnya tidak lagi muncul di pemilih.
 */
export async function outletDeactivationBlocker(
  client: Client,
  storeId: string,
  outlet: OutletSnapshot
): Promise<PenolakanOutlet | null> {
  if (!outlet.isActive) return null;

  if (outlet.isMain) {
    return {
      code: "MAIN_OUTLET_PROTECTED",
      message: `Cabang "${outlet.name}" adalah cabang utama. Pindahkan status utama ke cabang lain sebelum menonaktifkan.`,
    };
  }

  const aktif = await client.outlet.count({ where: { storeId, isActive: true } });
  if (aktif <= 1) {
    return {
      code: "LAST_OUTLET_PROTECTED",
      message: "Ini satu-satunya cabang aktif. Tambahkan cabang lain sebelum menonaktifkannya.",
    };
  }

  const laciTerbuka = await client.cashShift.count({
    where: { outletId: outlet.id, status: "OPEN" },
  });
  if (laciTerbuka > 0) {
    return {
      code: "OUTLET_HAS_OPEN_SHIFT",
      message: `Masih ada ${laciTerbuka} laci kasir terbuka di cabang ini. Tutup laci terlebih dahulu.`,
    };
  }

  return null;
}