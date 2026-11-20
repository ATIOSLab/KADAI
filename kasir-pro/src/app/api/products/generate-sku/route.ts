import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildSkuPrefix, formatSku } from "@/lib/utils";
import { INVENTORY_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";
import { resolveTenantScope } from "@/lib/tenant-scope";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const categoryName = searchParams.get("categoryName");
    const productName = searchParams.get("productName");

    let resolvedCategoryName = categoryName?.trim() || "";

    if (!resolvedCategoryName && categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, storeId: scope.storeId },
        select: { name: true },
      });
      resolvedCategoryName = category?.name ?? "";
    }

    const prefix = buildSkuPrefix(resolvedCategoryName, productName);
    // Nomor urut SKU dihitung per tenant (SKU kini unik per tenant)
    const existingSkus = await prisma.product.findMany({
      where: {
        storeId: scope.storeId,
        sku: {
          startsWith: `${prefix}-`,
          mode: "insensitive",
        },
      },
      select: { sku: true },
      orderBy: { sku: "asc" },
    });

    const usedSequences = new Set(
      existingSkus
        .map((product) => {
          const match = product.sku.match(/-(\d+)$/);
          return match ? Number(match[1]) : null;
        })
        .filter((value): value is number => value !== null)
    );

    let sequence = 1;
    while (usedSequences.has(sequence)) {
      sequence += 1;
    }

    return NextResponse.json({
      data: {
        sku: formatSku(prefix, sequence),
        prefix,
      },
    });
  } catch (error) {
    console.error("GET /api/products/generate-sku error:", error);
    return NextResponse.json(
      { error: "Gagal membuat SKU otomatis" },
      { status: 500 }
    );
  }
}
