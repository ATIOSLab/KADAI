import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { updateProductSchema } from "@/lib/validators/product";
import { logActivity } from "@/lib/activity-logger";
import { deleteProductImageByUrl } from "@/lib/product-image";
import { getSessionUserFromRequest } from "@/lib/session";
import {
  ADMIN_MANAGER_ROLES,
  ADMIN_ONLY_ROLES,
  hasRequiredRole,
} from "@/lib/rbac";
import { ZodError } from "zod";

function normalizeUnitName(name: string) {
  return name.trim().toLowerCase();
}

// GET /api/products/[id] — Get product detail
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = getSessionUserFromRequest(_request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat melihat detail produk" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        batches: {
          orderBy: { purchaseDate: "asc" },
          include: { supplier: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    const totalStock = product.batches.reduce(
      (sum, batch) => sum + batch.remainingQty,
      0
    );

    return NextResponse.json({
      data: { ...product, totalStock },
    });
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal memuat data produk" },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] — Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ADMIN_MANAGER_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat mengubah produk" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = updateProductSchema.parse(body);

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    if (data.sku || data.barcode) {
      const conflictingProduct = await prisma.product.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(data.sku ? [{ sku: data.sku }] : []),
            ...(data.barcode ? [{ barcode: data.barcode }] : []),
          ],
        },
      });

      if (conflictingProduct) {
        return NextResponse.json(
          { error: "SKU atau barcode sudah digunakan" },
          { status: 409 }
        );
      }
    }

    if (data.unit) {
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
      data.unit = unitName;
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });

    if (existingProduct.image && existingProduct.image !== product.image) {
      try {
        await deleteProductImageByUrl(existingProduct.image);
      } catch (cleanupError) {
        console.error("Failed to delete old product image:", cleanupError);
      }
    }

    await logActivity({
      userId: sessionUser.id,
      action: "PRODUCT_UPDATED",
      entity: "Product",
      entityId: product.id,
      details: data,
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("PUT /api/products/[id] error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Data produk tidak valid" },
        { status: 400 }
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json(
        { error: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Gagal mengupdate produk" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] — Soft delete product
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = getSessionUserFromRequest(_request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ADMIN_ONLY_ROLES)) {
      return NextResponse.json(
        { error: "Hanya admin yang dapat menonaktifkan produk" },
        { status: 403 }
      );
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    if (existingProduct.image) {
      try {
        await deleteProductImageByUrl(existingProduct.image);
      } catch (cleanupError) {
        console.error("Failed to delete product image on delete:", cleanupError);
      }
    }

    await logActivity({
      userId: sessionUser.id,
      action: "PRODUCT_DELETED",
      entity: "Product",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus produk" },
      { status: 500 }
    );
  }
}
