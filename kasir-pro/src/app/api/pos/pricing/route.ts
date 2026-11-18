import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionUser } from "@/lib/session";
import { resolveTenantScope } from "@/lib/tenant-scope";
import { resolvePricingRates } from "@/lib/pricing-rates";

/**
 * GET /api/pos/pricing
 *
 * Tarif PB1 & service charge yang berlaku untuk kasir ini. Dipakai layar kasir
 * untuk menampilkan total yang akan ditagih sebelum checkout, supaya angka di
 * keranjang sama dengan angka di struk (sebelumnya keranjang hanya menampilkan
 * subtotal, sehingga uang tunai yang diterima kurang dari total tagihan).
 */
export async function GET() {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const outletSelect = {
      id: true,
      name: true,
      code: true,
      taxRate: true,
      serviceChargeRate: true,
    } as const;

    // Cabang aktif mengikuti aturan checkout: outlet kasir, kalau tidak ada
    // cabang utama yang aktif.
    const userRecord = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { outletId: true },
    });

    const outlet = userRecord?.outletId
      ? await prisma.outlet.findUnique({ where: { id: userRecord.outletId }, select: outletSelect })
      : await prisma.outlet.findFirst({
          where: { storeId: scope.storeId, isMain: true, isActive: true },
          select: outletSelect,
        });

    const store = await prisma.store.findUnique({
      where: { id: scope.storeId },
      select: {
        taxRate: true,
        serviceChargeRate: true,
        taxInclusive: true,
        enableRounding: true,
        taxType: true,
        maxCashierDiscountPercent: true,
      },
    });

    const rates = resolvePricingRates({ outlet, store });

    return NextResponse.json({
      success: true,
      data: {
        outlet: outlet ?? null,
        taxType: store?.taxType ?? "NONE",
        rates,
        // Batas diskon kasir ikut dikirim supaya layar kasir bisa memperingatkan
        // SEBELUM checkout, bukan setelah transaksi ditolak server.
        discountPolicy: {
          maxCashierDiscountPercent: Number(store?.maxCashierDiscountPercent ?? 10),
          role: sessionUser.role,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/pos/pricing error:", error);
    return NextResponse.json({ error: "Gagal memuat tarif pajak & service charge" }, { status: 500 });
  }
}
