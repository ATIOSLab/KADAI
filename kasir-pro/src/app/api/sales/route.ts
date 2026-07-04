import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validators/sale";
import {
  processFIFODeduction,
  processSelectedBatchDeduction,
  applyFIFODeductions,
} from "@/lib/fifo";
import { generateInvoiceNumber } from "@/lib/utils";
import { logActivity } from "@/lib/activity-logger";
import {
  FINANCE_SYSTEM_CATEGORY_KEYS,
  getSystemFinanceCategoryId,
} from "@/lib/finance";
import { Decimal } from "@prisma/client/runtime/library";
import { getSessionUserFromRequest } from "@/lib/session";
import { ADMIN_CASHIER_ROLES, ALL_AUTHENTICATED_ROLES, hasRequiredRole } from "@/lib/rbac";
import { ZodError } from "zod";

// GET /api/sales — List sales
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ALL_AUTHENTICATED_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat melihat transaksi" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const paymentType = searchParams.get("paymentType");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where = {
      ...(search && {
        OR: [
          { invoiceNumber: { contains: search, mode: "insensitive" as const } },
          { customerName: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(sessionUser.role === "CASHIER" && { cashierId: sessionUser.id }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate + "T23:59:59.999Z"),
        },
      }),
      ...(paymentType && { paymentType: paymentType as "CASH" | "BANK_TRANSFER" | "QRIS" | "E_WALLET" }),
    };

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          cashier: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, unit: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ]);

    return NextResponse.json({
      data: sales,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/sales error:", error);
    return NextResponse.json({ error: "Gagal memuat data penjualan" }, { status: 500 });
  }
}

// POST /api/sales — Create sale with FIFO deduction
export async function POST(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ADMIN_CASHIER_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat membuat transaksi" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = checkoutSchema.parse(body);

    // Process sale in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Process FIFO for each item
      const processedItems = [];
      let totalCost = new Decimal(0);
      let subtotal = new Decimal(0);
      let itemDiscountTotal = new Decimal(0);

      for (const item of data.items) {
        const fifoResult = item.selectedBatchId
          ? await processSelectedBatchDeduction(
              tx,
              item.productId,
              item.selectedBatchId,
              item.quantity
            )
          : await processFIFODeduction(tx, item.productId, item.quantity);
        const itemDiscount = new Decimal(item.discountAmount || 0);
        const itemTotalPrice = fifoResult.totalRevenue.sub(itemDiscount);

        processedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: fifoResult.averageSellingPrice,
          totalPrice: itemTotalPrice,
          totalCost: fifoResult.totalCost,
          discountAmount: item.discountAmount || 0,
          allocations: fifoResult.allocations,
        });

        totalCost = totalCost.add(fifoResult.totalCost);
        subtotal = subtotal.add(fifoResult.totalRevenue);
        itemDiscountTotal = itemDiscountTotal.add(itemDiscount);

        await applyFIFODeductions(tx, fifoResult.allocations);
      }

      // 2. Generate invoice number
      const todaySalesCount = await tx.sale.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      });
      const invoiceNumber = generateInvoiceNumber(todaySalesCount + 1);

      // 3. Calculate totals
      const transactionDiscount = new Decimal(data.discountAmount || 0);
      const discountAmount = itemDiscountTotal.add(transactionDiscount);
      const totalAmount = subtotal.sub(discountAmount);
      const grossProfit = totalAmount.sub(totalCost);

      // 4. Create sale record
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          subtotal,
          discountAmount,
          taxAmount: 0,
          totalAmount,
          totalCost,
          grossProfit,
          paymentType: data.paymentType,
          paymentRef: data.paymentRef,
          customerName: data.customerName,
          notes: data.notes,
          cashierId: sessionUser.id,
          items: {
            create: processedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              totalCost: item.totalCost,
              discountAmount: item.discountAmount,
              batchAllocations: {
                create: item.allocations.map((alloc) => ({
                  productBatchId: alloc.batchId,
                  quantity: alloc.quantity,
                  costPrice: alloc.costPrice,
                  sellingPrice: alloc.sellingPrice,
                })),
              },
            })),
          },
        },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, unit: true } },
              batchAllocations: true,
            },
          },
          cashier: { select: { id: true, name: true } },
        },
      });

      const saleCategoryId = await getSystemFinanceCategoryId(
        tx,
        FINANCE_SYSTEM_CATEGORY_KEYS.SALE_INCOME
      );

      await tx.financeEntry.create({
        data: {
          amount: totalAmount,
          direction: "IN",
          source: "SALE",
          title: `Penjualan ${sale.invoiceNumber}`,
          notes: sale.notes,
          entryDate: sale.createdAt,
          categoryId: saleCategoryId,
          createdByUserId: sessionUser.id,
          saleId: sale.id,
        },
      });

      return sale;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    await logActivity({
      userId: sessionUser.id,
      action: "SALE_CREATED",
      entity: "Sale",
      entityId: result.id,
      details: {
        invoiceNumber: result.invoiceNumber,
        totalAmount: result.totalAmount.toString(),
        itemCount: result.items.length,
      },
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("POST /api/sales error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Data checkout tidak valid" },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Gagal membuat transaksi";
    const status =
      message.includes("Stok tidak cukup") || message.includes("Kurang")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
