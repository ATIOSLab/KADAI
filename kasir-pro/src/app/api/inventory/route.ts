import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import { z } from "zod";

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

    return NextResponse.json({ data: inventory });
  } catch (error) {
    console.error("GET /api/inventory error:", error);
    return NextResponse.json({ error: "Gagal memuat data inventori" }, { status: 500 });
  }
}

// POST /api/inventory/adjustment is in its own route file
