import type { Prisma } from "@prisma/client";

/**
 * Satu sumber kebenaran untuk "cabang mana yang dipakai transaksi ini".
 *
 * Dipakai bersama oleh pembuatan penjualan dan pembukaan laci. Dulu keduanya
 * menebak sendiri-sendiri: penjualan memakai cabang utama, laci dibiarkan tanpa
 * cabang — akibatnya transaksi tidak pernah menempel ke lacinya, dan Z-Report
 * harus menebak lewat rentang waktu.
 */
export async function resolveDefaultOutletId(
  db: Pick<Prisma.TransactionClient, "user" | "outlet">,
  input: { storeId: string; userId: string }
): Promise<string | null> {
  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: { outletId: true },
  });
  if (user?.outletId) return user.outletId;

  const mainOutlet = await db.outlet.findFirst({
    where: { isMain: true, isActive: true, storeId: input.storeId },
    select: { id: true },
  });
  return mainOutlet?.id ?? null;
}
