import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionUser } from "@/lib/session";
import { POS_ROLES, hasRequiredRole } from "@/lib/rbac";
import { createCustomerSchema, updateCustomerSchema } from "@/lib/validators/customer";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";

// GET /api/customers
export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, POS_ROLES)) {
      return jsonError("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";

    const customers = await prisma.customer.findMany({
      where: {
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: { name: "asc" },
      take: 50,
    });

    return jsonOk(customers);
  } catch (error) {
    return handleApiError(error, "GET /api/customers", "Gagal memuat data pelanggan");
  }
}

// POST /api/customers
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, POS_ROLES)) {
      return jsonError("Forbidden", 403);
    }

    const body = await req.json();
    const validated = createCustomerSchema.parse(body);

    const customer = await prisma.customer.create({
      data: {
        name: validated.name,
        phone: validated.phone || null,
        email: validated.email || null,
        address: validated.address || null,
        memberTier: validated.memberTier,
        loyaltyPoints: validated.loyaltyPoints,
      },
    });

    return jsonOk(customer, "Pelanggan berhasil ditambahkan", 201);
  } catch (error) {
    return handleApiError(error, "POST /api/customers", "Gagal menambahkan pelanggan");
  }
}

// PUT /api/customers
export async function PUT(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || !hasRequiredRole(sessionUser.role, POS_ROLES)) {
      return jsonError("Forbidden", 403);
    }

    const body = await req.json();
    const validated = updateCustomerSchema.parse(body);

    const customer = await prisma.customer.update({
      where: { id: validated.id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.phone !== undefined && { phone: validated.phone || null }),
        ...(validated.email !== undefined && { email: validated.email || null }),
        ...(validated.address !== undefined && { address: validated.address || null }),
        ...(validated.memberTier && { memberTier: validated.memberTier }),
        ...(validated.loyaltyPoints !== undefined && { loyaltyPoints: validated.loyaltyPoints }),
      },
    });

    return jsonOk(customer, "Data pelanggan berhasil diperbarui");
  } catch (error) {
    return handleApiError(error, "PUT /api/customers", "Gagal memperbarui data pelanggan");
  }
}
