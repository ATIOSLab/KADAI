import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createProductSchema } from "@/lib/validators/product";
import { logActivity } from "@/lib/activity-logger";
import { getSessionUserFromRequest } from "@/lib/session";
import { ADMIN_MANAGER_ROLES, hasRequiredRole } from "@/lib/rbac";
import { ZodError } from "zod";

function normalizeUnitName(name: string) {
  return name.trim().toLowerCase();
}

// GET /api/products — List products with search, filter, pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { sku: { contains: search, mode: "insensitive" as const } },
          { barcode: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(categoryId && { categoryId }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          batches: {
            where: { remainingQty: { gt: 0 } },
            orderBy: { purchaseDate: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Add computed fields
    const productsWithStock = products.map((product) => {
      const totalStock = product.batches.reduce(
        (sum, batch) => sum + batch.remainingQty,
        0
      );
      const currentSellingPrice =
        product.batches.length > 0
          ? Number(product.batches[0].sellingPrice)
          : null;

      return {
        ...product,
        totalStock,
        currentSellingPrice,
        pricingBatches: product.batches.map((batch) => ({
          id: batch.id,
          batchNumber: batch.batchNumber,
          remainingQty: batch.remainingQty,
          sellingPrice: Number(batch.sellingPrice),
        })),
      };
    });

    return NextResponse.json({
      data: productsWithStock,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Gagal memuat data produk" },
      { status: 500 }
    );
  }
}

// POST /api/products — Create new product
export async function POST(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat menambah produk" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createProductSchema.parse(body);

    // Check if SKU already exists
    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: data.sku },
          ...(data.barcode ? [{ barcode: data.barcode }] : []),
        ],
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "SKU atau barcode sudah digunakan" },
        { status: 400 }
      );
    }

    const unitName = data.unit.trim();
    await prisma.unit.upsert({
      where: { normalizedName: normalizeUnitName(unitName) },
      update: {
        name: unitName,
        isActive: true,
      },
      create: {
        name: unitName,
        normalizedName: normalizeUnitName(unitName),
      },
    });

    const product = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        barcode: data.barcode,
        description: data.description,
        unit: unitName,
        categoryId: data.categoryId,
        lowStockThreshold: data.lowStockThreshold,
        image: data.image,
      },
      include: { category: true },
    });

    await logActivity({
      userId: sessionUser.id,
      action: "PRODUCT_CREATED",
      entity: "Product",
      entityId: product.id,
      details: { name: product.name, sku: product.sku },
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Data produk tidak valid" },
        { status: 400 }
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "SKU atau barcode sudah digunakan" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Gagal membuat produk baru" },
      { status: 500 }
    );
  }
}
