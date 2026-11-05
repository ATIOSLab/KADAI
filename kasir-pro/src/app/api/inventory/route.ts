import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk, handleApiError } from "@/lib/api-response";

// GET /api/inventory — Stock overview
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const lowStockOnly = searchParams.get("lowStock") === "true";
    const expiringOnly = searchParams.get("expiring") === "true";

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        category: true,
        batches: {
          where: { remainingQty: { gt: 0 } },
          orderBy: { purchaseDate: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const inventory = products
      .map((product) => {
        const totalStock = product.batches.reduce((sum, b) => sum + b.remainingQty, 0);
        const currentPrice = product.batches.length > 0 ? Number(product.batches[0].sellingPrice) : 0;
        const totalValue = product.batches.reduce(
          (sum, b) => sum + b.remainingQty * Number(b.costPrice),
          0
        );

        const criticalExpiringCount = product.batches.filter(
          (b) => b.expiryDate && new Date(b.expiryDate) <= in7Days
        ).length;

        const warningExpiringCount = product.batches.filter(
          (b) => b.expiryDate && new Date(b.expiryDate) > in7Days && new Date(b.expiryDate) <= in30Days
        ).length;

        const sortedExpiry = product.batches
          .filter((b) => b.expiryDate)
          .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());

        const nearestExpiryDate = sortedExpiry[0]?.expiryDate || null;

        return {
          ...product,
          totalStock,
          currentPrice,
          totalValue,
          isLowStock: totalStock <= product.lowStockThreshold,
          batchCount: product.batches.length,
          hasExpiringBatch: criticalExpiringCount > 0 || warningExpiringCount > 0,
          criticalExpiringCount,
          warningExpiringCount,
          nearestExpiryDate,
        };
      })
      .filter((p) => (!lowStockOnly || p.isLowStock) && (!expiringOnly || p.hasExpiringBatch));

    return jsonOk(inventory);
  } catch (error) {
    return handleApiError(error, "GET /api/inventory", "Gagal memuat data inventori");
  }
}

// POST /api/inventory/adjustment is in its own route file
