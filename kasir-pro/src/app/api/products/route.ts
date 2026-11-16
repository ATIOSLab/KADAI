import { NextRequest, NextResponse } from "next/server";
import { redactCosts } from "@/app/api/_lib/access";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createProductSchema } from "@/lib/validators/product";
import { logActivity } from "@/lib/activity-logger";
import { getSessionUserFromRequest } from "@/lib/session";
import { resolveTenantScope } from "@/lib/tenant-scope";
import { INVENTORY_ROLES, hasRequiredRole } from "@/lib/rbac";
import { checkFeature, checkProductLimit, checkSkuLimit } from "@/lib/plan-limits";
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
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000 ||
        !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ error: "Pagination tidak valid" }, { status: 400 });
    }
    const skip = (page - 1) * limit;

    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Isolasi tenant: hanya produk milik tenant pemanggil
    // (storeId NULL = data demo/shared lama, sengaja tidak diikutkan)
    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const where = {
      isActive: true,
      storeId: scope.storeId,
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

      const safeBatches = product.batches;

      return {
        ...product,
        batches: safeBatches,
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
      data: redactCosts(productsWithStock, sessionUser.role),
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

    if (!hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat menambah produk" },
        { status: 403 }
      );
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    // Kuota paket langganan: batas jumlah produk per tenant (dikelola superadmin)
    const limitCheck = await checkProductLimit(scope.storeId);
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.message }, { status: 403 });
    }

    const body = await request.json();
    const data = createProductSchema.parse(body);

    // Kuota SKU paket (null = tanpa batas) hanya dihitung untuk produk ber-SKU
    if (data.sku) {
      const skuCheck = await checkSkuLimit(scope.storeId);
      if (!skuCheck.allowed) {
        return NextResponse.json({ error: skuCheck.message }, { status: 403 });
      }
    }

    // SKU unik per tenant; barcode tetap unik global (identitas fisik barang)
    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: data.sku, storeId: scope.storeId },
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

    // Kategori wajib milik tenant pemanggil (cegah IDOR lintas tenant)
    const ownedCategory = await prisma.category.findFirst({
      where: { id: data.categoryId, storeId: scope.storeId },
      select: { id: true },
    });
    if (!ownedCategory) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan pada tenant Anda" },
        { status: 400 }
      );
    }

    const unitName = data.unit.trim();
    const normalizedUnit = normalizeUnitName(unitName);
    const existingUnit = await prisma.unit.findFirst({
      where: {
        normalizedName: normalizedUnit,
        OR: [{ storeId: scope.storeId }, { storeId: null }],
      },
      select: { id: true },
    });
    if (existingUnit) {
      await prisma.unit.update({
        where: { id: existingUnit.id },
        data: { isActive: true },
      });
    } else {
      await prisma.unit.create({
        data: {
          name: unitName,
          normalizedName: normalizedUnit,
          storeId: scope.storeId,
        },
      });
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        barcode: data.barcode,
        description: data.description,
        productType: (data.productType as any) || "FINISHED_GOOD",
        station: (data.station as any) || "GENERAL",
        unit: unitName,
        categoryId: data.categoryId,
        lowStockThreshold: data.lowStockThreshold,
        image: data.image,
        storeId: scope.storeId,
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
