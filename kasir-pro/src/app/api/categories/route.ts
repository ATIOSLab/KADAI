import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { createCategorySchema } from "@/lib/validators/category";
import { INVENTORY_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getSessionUserFromRequest } from "@/lib/session";

// GET /api/categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(
      { data: categories },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({ error: "Gagal memuat kategori" }, { status: 500 });
  }
}

// POST /api/categories
export async function POST(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser || !hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data = createCategorySchema.parse(body);

    const trimmedName = data.name.trim();
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: "insensitive",
        },
      },
    });

    if (existingCategory) {
      if (!existingCategory.isActive) {
        const reactivatedCategory = await prisma.category.update({
          where: { id: existingCategory.id },
          data: { isActive: true },
        });
        return NextResponse.json({ success: true, data: reactivatedCategory });
      }

      return NextResponse.json({ success: true, data: existingCategory });
    }

    const category = await prisma.category.create({
      data: {
        ...data,
        name: trimmedName,
      },
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Data kategori tidak valid" },
        { status: 400 }
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Kategori sudah tersedia" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Gagal membuat kategori" }, { status: 500 });
  }
}
