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
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: {
            recipesAsParent: {
              include: { ingredient: true },
            },
          },
        });

        if (product?.productType === "MANUFACTURED" && product.recipesAsParent.length > 0) {
          // F&B Manufactured Product with Recipe (e.g. Dimsum, Kopi)
          // Deduct from raw material ingredients' batches via FIFO!
          let itemCost = new Decimal(0);
          const rawAllocations: any[] = [];

          for (const recipe of product.recipesAsParent) {
            const qtyNeeded = Math.ceil(
              Number(recipe.quantityNeeded) * item.quantity * (1 + Number(recipe.wastagePercent) / 100)
            );
            if (qtyNeeded > 0) {
              const rawFifo = await processFIFODeduction(tx, recipe.ingredientId, qtyNeeded);
              itemCost = itemCost.add(rawFifo.totalCost);
              rawAllocations.push(...rawFifo.allocations);
              await applyFIFODeductions(tx, rawFifo.allocations);
            }
          }

          const unitSellingPrice = new Decimal(item.unitPrice);
          const lineRevenue = unitSellingPrice.mul(item.quantity);
          const itemDiscount = new Decimal(item.discountAmount || 0);
          const itemTotalPrice = lineRevenue.sub(itemDiscount);

          processedItems.push({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: unitSellingPrice,
            totalPrice: itemTotalPrice,
            totalCost: itemCost,
            discountAmount: item.discountAmount || 0,
            allocations: rawAllocations,
          });

          totalCost = totalCost.add(itemCost);
          subtotal = subtotal.add(lineRevenue);
          itemDiscountTotal = itemDiscountTotal.add(itemDiscount);
        } else {
          // Standard Retail Finished Good FIFO deduction
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

      // 3. Store tax & service charge settings
      const store = await tx.store.findFirst();
      const serviceRate = Number(store?.serviceChargeRate || 0);
      const taxRate = Number(store?.taxRate || 0);
      const taxInclusive = store?.taxInclusive ?? false;
      const enableRounding = store?.enableRounding ?? true;

      // 4. Calculate totals
      const transactionDiscount = new Decimal(data.discountAmount || 0);
      const discountAmount = itemDiscountTotal.add(transactionDiscount);
      const netSubtotal = subtotal.sub(discountAmount);

      let serviceCharge = new Decimal(0);
      if (serviceRate > 0) {
        serviceCharge = netSubtotal.mul(serviceRate).div(100);
      }

      const taxableBase = netSubtotal.add(serviceCharge);
      let taxAmount = new Decimal(0);
      let preRoundingTotal = new Decimal(0);

      if (taxRate > 0) {
        if (taxInclusive) {
          const dpp = taxableBase.div(1 + taxRate / 100);
          taxAmount = taxableBase.sub(dpp);
          preRoundingTotal = taxableBase;
        } else {
          taxAmount = taxableBase.mul(taxRate).div(100);
          preRoundingTotal = taxableBase.add(taxAmount);
        }
      } else {
        preRoundingTotal = taxableBase;
      }

      let roundingAmount = new Decimal(0);
      let totalAmount = preRoundingTotal;
      if (enableRounding) {
        const rounded = Math.round(Number(preRoundingTotal) / 100) * 100;
        roundingAmount = new Decimal(rounded).sub(preRoundingTotal);
        totalAmount = new Decimal(rounded);
      }

      const grossProfit = netSubtotal.sub(totalCost);

      // 5. Create sale record
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          orderType: data.orderType || "DINE_IN",
          tableId: data.tableId || null,
          subtotal,
          discountAmount,
          serviceCharge,
          taxAmount,
          roundingAmount,
          totalAmount,
          totalCost,
          grossProfit,
          paymentType: data.paymentType,
          paymentRef: data.paymentRef,
          customerName: data.customerName,
          customerId: data.customerId || null,
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
              product: { select: { id: true, name: true, sku: true, unit: true, station: true } },
              batchAllocations: true,
            },
          },
          cashier: { select: { id: true, name: true } },
          table: true,
        },
      });

      // 6. Update table occupancy if dine-in
      if (data.tableId) {
        await tx.restaurantTable.update({
          where: { id: data.tableId },
          data: { isOccupied: true },
        });
      }

      // 7. Route to Kitchen Display System (KDS)
      const kitchenItems = sale.items.filter(
        (i: any) => i.product.station === "KITCHEN" || i.product.station === "GENERAL"
      );
      const barItems = sale.items.filter((i: any) => i.product.station === "BAR");

      if (kitchenItems.length > 0) {
        await tx.kDSOrder.create({
          data: {
            saleId: sale.id,
            station: "KITCHEN",
            status: "QUEUED",
            tableNo: sale.table?.tableNo || null,
            orderType: data.orderType || "DINE_IN",
            notes: data.notes || null,
            itemsJson: kitchenItems.map((k: any) => ({
              productId: k.productId,
              name: k.product.name,
              quantity: k.quantity,
              unit: k.product.unit,
              station: k.product.station,
              notes: null,
            })),
          },
        });
      }

      if (barItems.length > 0) {
        await tx.kDSOrder.create({
          data: {
            saleId: sale.id,
            station: "BAR",
            status: "QUEUED",
            tableNo: sale.table?.tableNo || null,
            orderType: data.orderType || "DINE_IN",
            notes: data.notes || null,
            itemsJson: barItems.map((b: any) => ({
              productId: b.productId,
              name: b.product.name,
              quantity: b.quantity,
              unit: b.product.unit,
              station: b.product.station,
              notes: null,
            })),
          },
        });
      }

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

      // 8. Update customer CRM stats
      if (data.customerId) {
        const loyaltyEarned = Math.floor(Number(totalAmount) / 10000);
        await tx.customer.update({
          where: { id: data.customerId },
          data: {
            totalSpent: { increment: totalAmount },
            visitCount: { increment: 1 },
            loyaltyPoints: { increment: loyaltyEarned },
            lastVisitAt: new Date(),
          },
        });
      }

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
