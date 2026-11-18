/**
 * Aturan pembatalan (void) transaksi setelah laci ditutup.
 *
 * Uang di laci sudah dihitung, Z-Report sudah ditutup dan disimpan sebagai
 * snapshot. Pembatalan setelah itu TIDAK bisa mengubah laporan yang sudah
 * tercetak, jadi pembatalan seperti itu adalah koreksi buku — bukan lagi
 * kesalahan ketik di depan pelanggan. Karenanya:
 *
 * - kasir tidak boleh melakukannya sendiri (uang sudah lewat, tidak ada yang
 *   bisa memverifikasi di depan laci),
 * - manager/admin boleh, tetapi laci yang bersangkutan ditandai supaya
 *   selisih antara laporan tercetak dan buku terlihat, bukan hilang diam-diam.
 */

import type { Prisma } from "@prisma/client";

export interface VoidGuardDecision {
  allowed: boolean;
  /** true bila pembatalan ini koreksi susulan atas laci yang sudah ditutup. */
  isLateVoid: boolean;
  code?: "VOID_REQUIRES_SUPERVISOR_AFTER_SHIFT_CLOSED";
  message?: string;
}

export function evaluateVoidGuard(input: {
  /** Status laci tempat transaksi terjadi; null bila transaksi tanpa laci. */
  shiftStatus: string | null;
  /** Pemanggil adalah ADMIN/MANAGER (bukan kasir dengan PIN supervisor). */
  isSupervisor: boolean;
}): VoidGuardDecision {
  const isLateVoid = input.shiftStatus === "CLOSED";

  if (isLateVoid && !input.isSupervisor) {
    return {
      allowed: false,
      isLateVoid,
      code: "VOID_REQUIRES_SUPERVISOR_AFTER_SHIFT_CLOSED",
      message:
        "Shift transaksi ini sudah ditutup dan laporannya sudah dicetak. Pembatalan susulan hanya boleh dilakukan Manager/Admin.",
    };
  }

  return { allowed: true, isLateVoid };
}

/**
 * Mencari laci yang mencakup waktu transaksi. Dipakai untuk transaksi lama
 * yang belum menempel ke laci (kolom shiftId kosong): tanpa ini, aturan
 * koreksi susulan bisa dihindari hanya karena kolomnya kosong.
 *
 * Aturan waktunya sengaja sama dengan atribusi Z-Report: laci dibuka sebelum
 * transaksi, dan belum ditutup (atau ditutup setelah transaksi).
 */
export async function resolveShiftCoveringSale(
  db: Pick<Prisma.TransactionClient, "cashShift">,
  sale: { storeId: string | null; cashierId: string | null; createdAt: Date }
): Promise<{ id: string; status: string } | null> {
  if (!sale.storeId || !sale.cashierId) return null;

  return db.cashShift.findFirst({
    where: {
      storeId: sale.storeId,
      cashierId: sale.cashierId,
      openedAt: { lte: sale.createdAt },
      OR: [{ closedAt: null }, { closedAt: { gte: sale.createdAt } }],
    },
    orderBy: { openedAt: "desc" },
    select: { id: true, status: true },
  });
}

/**
 * Menandai laci yang laporannya sudah ditutup bahwa ada koreksi susulan.
 * Dipanggil di dalam transaksi pembatalan yang sama, supaya penanda tidak
 * pernah terpisah dari pembatalannya.
 */
export async function markShiftLateVoid(
  tx: Prisma.TransactionClient,
  shiftId: string
) {
  return tx.cashShift.update({
    where: { id: shiftId },
    data: {
      lateVoidCount: { increment: 1 },
      lastLateVoidAt: new Date(),
    },
    select: { id: true, lateVoidCount: true, lastLateVoidAt: true },
  });
}
