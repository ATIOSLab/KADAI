import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionUser } from "@/lib/session";
import { ADMIN_MANAGER_ROLES, hasRequiredRole } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year")) || new Date().getFullYear();

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    // Fetch all sales for this year
    const sales = await prisma.sale.findMany({
      where: {
        isVoided: false,
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

    // Fetch store tax profile
    const store = await prisma.store.findFirst();

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
      const monthIdx = new Date(sale.createdAt).getMonth();
      const gross = Number(sale.subtotal);
      const srv = Number(sale.serviceCharge);
      const tax = Number(sale.taxAmount);
      const hpp = Number(sale.totalCost);
      const profit = Number(sale.grossProfit);

      monthlySummary[monthIdx].transactionCount += 1;
      monthlySummary[monthIdx].grossRevenue += gross;
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
        taxType: store?.taxType || "PB1_10",
        taxRate: Number(store?.taxRate || 10),
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
