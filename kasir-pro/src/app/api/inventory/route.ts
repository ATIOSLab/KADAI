import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk, handleApiError } from "@/lib/api-response";

// GET /api/inventory — Stock overview
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const lowStockOnly = searchParams.get("lowStock") === "true";

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

    const inventory = products
      .map((product) => {
        const totalStock = product.batches.reduce((sum, b) => sum + b.remainingQty, 0);
        const currentPrice = product.batches.length > 0 ? Number(product.batches[0].sellingPrice) : 0;
        const totalValue = product.batches.reduce(
          (sum, b) => sum + b.remainingQty * Number(b.costPrice),
          0
        );

        return {
          ...product,
          totalStock,
          currentPrice,
          totalValue,
          isLowStock: totalStock <= product.lowStockThreshold,
          batchCount: product.batches.length,
        };
      })
      .filter((p) => !lowStockOnly || p.isLowStock);

    return jsonOk(inventory);
  } catch (error) {
    return handleApiError(error, "GET /api/inventory", "Gagal memuat data inventori");
  }
}

// POST /api/inventory/adjustment is in its own route file
