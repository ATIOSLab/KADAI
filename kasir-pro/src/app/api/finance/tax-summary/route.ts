import { NextRequest, NextResponse } from "next/server";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { resolveBusinessTimezone } from "@/lib/business-timezone";
import { getServerSessionUser } from "@/lib/session";
import { resolveTenantScope } from "@/lib/tenant-scope";
import { FINANCE_ROLES, hasRequiredRole } from "@/lib/rbac";
import { describeEffectiveTaxProfile } from "@/lib/tax-labels";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, FINANCE_ROLES)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const { searchParams } = new URL(req.url);
    // Zona waktu toko: tahun buku & bulan penjualan tidak boleh mengikuti jam
    // server (UTC) - penjualan 01:00 WIB tanggal 1 akan jatuh ke bulan sebelumnya.
    const timezone = await resolveBusinessTimezone();
    const year =
      Number(searchParams.get("year")) ||
      Number(formatInTimeZone(new Date(), timezone, "yyyy"));
    const outletId = searchParams.get("outletId");

    const startOfYear = fromZonedTime(`${year}-01-01T00:00:00.000`, timezone);
    const endOfYear = new Date(
      fromZonedTime(`${year + 1}-01-01T00:00:00.000`, timezone).getTime() - 1
    );

    // Fetch all sales for this year
    const sales = await prisma.sale.findMany({
      where: {
        isVoided: false,
        outlet: { storeId: scope.storeId },
        ...(outletId && outletId !== "ALL" ? { outletId } : {}),
        createdAt: { gte: startOfYear, lte: endOfYear },
      },
      select: {
        id: true,
        subtotal: true,
        serviceCharge: true,
        taxAmount: true,
        totalAmount: true,
        totalCost: true,
        grossProfit: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Tarif yang benar-benar ditagih kasir disimpan di Outlet (halaman Cabang),
    // bukan di Store. Rekap pajak dulu membaca Store (default NONE) sehingga
    // menampilkan "Pajak Terpungut (NONE)" padahal struk memungut PB1 10%.
    const outlets = await prisma.outlet.findMany({
      where: {
        storeId: scope.storeId,
        ...(outletId && outletId !== "ALL" ? { id: outletId } : {}),
      },
      select: { taxType: true, taxRate: true, serviceChargeRate: true },
    });
    const taxProfile = describeEffectiveTaxProfile(
      outlets.map((o) => ({ taxType: o.taxType, taxRate: Number(o.taxRate) }))
    );

    // Fetch store tax profile (tenant pemanggil) - fallback bila belum ada cabang
    const store = await prisma.store.findUnique({
      where: { id: scope.storeId },
    });

    // Group by month (0-11)
    const monthlySummary = Array.from({ length: 12 }, (_, i) => {
      const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];

      return {
        monthIndex: i + 1,
        monthName: monthNames[i],
        transactionCount: 0,
        grossRevenue: 0, // Omzet Bruto
        serviceCharge: 0,
        taxCollected: 0, // PB1 / PPN
        totalHPP: 0,
        grossProfit: 0,
        pphFinal: 0, // 0.5% PP 55/2022
      };
    });

    let cumulativeGrossRevenue = 0;
    const PTKP_THRESHOLD = 500_000_000; // Rp 500 Juta batas bebas pajak WP OP

    for (const sale of sales) {
      const monthIdx = Number(formatInTimeZone(sale.createdAt, timezone, "M")) - 1;
      const gross = Number(sale.subtotal);
      const srv = Number(sale.serviceCharge);
      const tax = Number(sale.taxAmount);
      const hpp = Number(sale.totalCost);
      // Laba kotor = total dibayar - PB1 - HPP. Diturunkan, bukan dibaca dari
      // kolom tersimpan, supaya pembulatan tunai dan baris lama tetap konsisten.
      const profit = Number(sale.totalAmount) - tax - hpp;

      monthlySummary[monthIdx].transactionCount += 1;
      // Peredaran bruto (PP 55/2022) = nilai penyerahan ke pembeli, yaitu
      // subtotal + service charge. PB1/PPN tidak ikut karena hanya titipan
      // negara yang lewat di kas (dasar pengenaan pajak daerah = angka ini).
      monthlySummary[monthIdx].grossRevenue += gross + srv;
      monthlySummary[monthIdx].serviceCharge += srv;
      monthlySummary[monthIdx].taxCollected += tax;
      monthlySummary[monthIdx].totalHPP += hpp;
      monthlySummary[monthIdx].grossProfit += profit;
    }

    // Calculate PPh Final 0.5% considering cumulative threshold
    for (const m of monthlySummary) {
      cumulativeGrossRevenue += m.grossRevenue;
      // PP 55/2022: Omzet di atas 500jt dikenakan PPh Final 0.5%
      if (cumulativeGrossRevenue > PTKP_THRESHOLD) {
        const taxableAmount = Math.min(
          m.grossRevenue,
          cumulativeGrossRevenue - PTKP_THRESHOLD
        );
        m.pphFinal = Math.round(taxableAmount * 0.005);
      } else {
        m.pphFinal = 0;
      }
    }

    const totals = monthlySummary.reduce(
      (acc, m) => {
        acc.totalGrossRevenue += m.grossRevenue;
        acc.totalTaxCollected += m.taxCollected;
        acc.totalServiceCharge += m.serviceCharge;
        acc.totalHPP += m.totalHPP;
        acc.totalGrossProfit += m.grossProfit;
        acc.totalPphFinal += m.pphFinal;
        return acc;
      },
      {
        totalGrossRevenue: 0,
        totalTaxCollected: 0,
        totalServiceCharge: 0,
        totalHPP: 0,
        totalGrossProfit: 0,
        totalPphFinal: 0,
      }
    );

    return NextResponse.json({
      year,
      store: {
        name: store?.name || "KADAI Indonesia",
        taxType: taxProfile.taxType,
        taxRate: taxProfile.rate,
        taxLabel: taxProfile.label,
        taxProfileMixed: taxProfile.mixed,
      },
      summary: monthlySummary,
      totals,
    });
  } catch (error) {
    console.error("GET /api/finance/tax-summary error:", error);
    return NextResponse.json(
      { error: "Gagal memuat rekapitulasi pajak & SAK EMKM" },
      { status: 500 }
    );
  }
}
