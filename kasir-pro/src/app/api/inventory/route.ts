import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { getServerSessionUser } from "@/lib/session";
import { resolveTenantScope } from "@/lib/tenant-scope";
import { INVENTORY_ROLES, hasRequiredRole } from "@/lib/rbac";

// GET /api/inventory — Stock overview
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) {
      return jsonError("Unauthorized", 401);
    }

    // Gerbang role: data stok adalah ranah inventori, bukan seluruh staf.
    if (!hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return jsonError("Forbidden: peran Anda tidak diizinkan mengakses data inventori", 403);
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return jsonError(scope.message, scope.status);
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const lowStockOnly = searchParams.get("lowStock") === "true";
    const expiringOnly = searchParams.get("expiring") === "true";

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        storeId: scope.storeId,
        ...(categoryId && { categoryId }),
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
