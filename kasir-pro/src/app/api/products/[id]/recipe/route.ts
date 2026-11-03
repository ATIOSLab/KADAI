import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionUser } from "@/lib/session";
import { ADMIN_MANAGER_ROLES, hasRequiredRole } from "@/lib/rbac";
import { Decimal } from "@prisma/client/runtime/library";

// GET /api/products/[id]/recipe
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        recipesAsParent: {
          include: {
            ingredient: {
              select: {
                id: true,
                name: true,
                sku: true,
                unit: true,
                productType: true,
                batches: {
                  where: { remainingQty: { gt: 0 } },
                  orderBy: { purchaseDate: "asc" },
                  take: 1,
                  select: { costPrice: true, remainingQty: true },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    const formattedRecipes = product.recipesAsParent.map((r: any) => {
      const activeBatch = r.ingredient.batches[0];
      const ingredientCost = activeBatch ? Number(activeBatch.costPrice) : 0;
      const totalAvailable = r.ingredient.batches.reduce(
        (sum: number, b: any) => sum + b.remainingQty,
        0
      );
      const costPerPortion = ingredientCost * Number(r.quantityNeeded) * (1 + Number(r.wastagePercent) / 100);

      return {
        id: r.id,
        ingredientId: r.ingredientId,
        ingredientName: r.ingredient.name,
        ingredientSku: r.ingredient.sku,
        quantityNeeded: Number(r.quantityNeeded),
        unit: r.unit,
        wastagePercent: Number(r.wastagePercent),
        ingredientCostPerUnit: ingredientCost,
        costPerPortion: Math.round(costPerPortion),
        totalStockAvailable: totalAvailable,
      };
    });

    const totalCalculatedHPP = formattedRecipes.reduce(
      (sum: number, r: any) => sum + r.costPerPortion,
      0
    );

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        productType: product.productType,
      },
      recipes: formattedRecipes,
      totalCalculatedHPP,
    });
  } catch (error) {
    console.error("GET /api/products/[id]/recipe error:", error);
    return NextResponse.json(
      { error: "Gagal memuat resep produk" },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id]/recipe — Update Bill of Materials (BOM)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { items = [] } = body; // Array<{ ingredientId, quantityNeeded, unit?, wastagePercent? }>

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    // Update recipe in transaction
    await prisma.$transaction(async (tx: any) => {
      // 1. Delete existing recipe items
      await tx.recipeItem.deleteMany({
        where: { parentProductId: id },
      });

      // 2. Insert new recipe items
      if (items.length > 0) {
        await tx.recipeItem.createMany({
          data: items.map((i: any) => ({
            parentProductId: id,
            ingredientId: i.ingredientId,
            quantityNeeded: new Decimal(i.quantityNeeded),
            unit: i.unit || "gram",
            wastagePercent: new Decimal(i.wastagePercent || 0),
          })),
        });
      }

      // 3. Mark productType as MANUFACTURED if it has recipes
      if (items.length > 0 && product.productType !== "MANUFACTURED") {
        await tx.product.update({
          where: { id },
          data: { productType: "MANUFACTURED" },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Resep bahan baku (BOM) berhasil disimpan",
    });
  } catch (error) {
    console.error("PUT /api/products/[id]/recipe error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan resep bahan baku" },
      { status: 500 }
    );
  }
}
