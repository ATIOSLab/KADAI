import { NextRequest, NextResponse } from "next/server";
import { redactCosts, SALES_READ_ROLES } from "@/app/api/_lib/access";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validators/sale";
import {
  processFIFODeduction,
  processSelectedBatchDeduction,
  applyFIFODeductions,
} from "@/lib/fifo";
import { generateInvoiceNumber } from "@/lib/utils";
import { ApiBusinessError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity-logger";
import {
  FINANCE_SYSTEM_CATEGORY_KEYS,
  getSystemFinanceCategoryId,
} from "@/lib/finance";
import { Decimal } from "@prisma/client/runtime/library";
import { getSessionUserFromRequest } from "@/lib/session";
import { resolveTenantScope } from "@/lib/tenant-scope";
import { ADMIN_CASHIER_ROLES, hasRequiredRole } from "@/lib/rbac";
import { getBusinessDayStart } from "@/lib/business-day";
import { resolveBusinessTimezone } from "@/lib/business-timezone";
import { ZodError } from "zod";

// GET /api/sales — List sales
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, SALES_READ_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat melihat transaksi" },
        { status: 403 }
      );
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const paymentType = searchParams.get("paymentType");
    const outletId = searchParams.get("outletId");
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000 ||
        !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ error: "Pagination tidak valid" }, { status: 400 });
    }

    if ((paymentType && !["CASH", "BANK_TRANSFER", "QRIS", "E_WALLET", "TEMPO"].includes(paymentType)) ||
        [startDate, endDate].some((d) => d !== null &&
          (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !Number.isFinite(Date.parse(d))))) {
      return NextResponse.json({ error: "Filter tidak valid" }, { status: 400 });
    }
    const where = {
      // Isolasi tenant: hanya penjualan dari outlet milik tenant pemanggil
      outlet: { storeId: scope.storeId },
      ...(search && {
        OR: [
          { invoiceNumber: { contains: search, mode: "insensitive" as const } },
          { customerName: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(sessionUser.role === "CASHIER" && { cashierId: sessionUser.id }),
      ...(outletId && { outletId }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate + "T23:59:59.999Z"),
        },
      }),
      ...(paymentType && { paymentType: paymentType as "CASH" | "BANK_TRANSFER" | "QRIS" | "E_WALLET" | "TEMPO" }),
    };

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          cashier: { select: { id: true, name: true, email: true } },
          outlet: { select: { id: true, name: true, code: true } },
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
      data: redactCosts(sales, sessionUser.role),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/sales error:", error);
    return NextResponse.json({ error: "Gagal memuat data penjualan" }, { status: 500 });
  }
}

// In-memory Idempotency Cache (TTL 60 detik) untuk mencegah double-deduction transaksi kasir
interface SaleIdempotencyRecord {
  timestamp: number;
  response: unknown;
}
const salesIdempotencyMap = new Map<string, SaleIdempotencyRecord>();
const IDEMPOTENCY_TTL_MS = 60 * 1000;

function pruneSalesIdempotency() {
  const now = Date.now();
  for (const [key, val] of salesIdempotencyMap.entries()) {
    if (now - val.timestamp > IDEMPOTENCY_TTL_MS) {
      salesIdempotencyMap.delete(key);
    }
  }
}

// POST /api/sales — Create sale with FIFO deduction
// Nomor invoice dihitung dari jumlah penjualan tenant pada hari itu. Bila dua kasir
// checkout bersamaan, keduanya bisa mendapat nomor sama → P2002 → ulangi transaksi
// (hitungan di dalam transaksi ikut maju, jadi percobaan kedua pasti mendapat nomor baru).
const MAX_INVOICE_ATTEMPTS = 3;

async function createSaleWithRetry<T>(run: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      const isInvoiceCollision =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        (((error.meta?.target as string[]) ?? []).includes("invoiceNumber") ||
          ((error.meta?.target as string[]) ?? []).includes("storeId_invoiceNumber"));
      if (!isInvoiceCollision || attempt >= MAX_INVOICE_ATTEMPTS) {
        throw error;
      }
    }
  }
}

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

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    // Zona bisnis: dasar penomoran invoice & jendela harian (bukan jam server UTC)
    const timezone = await resolveBusinessTimezone();

    const body = await request.json();
    const data = checkoutSchema.parse(body);

    // Isolasi tenant: cabang (outlet) yang dipilih klien wajib milik tenant pemanggil
    if (data.outletId) {
      const ownedOutlet = await prisma.outlet.findFirst({
        where: { id: data.outletId, storeId: scope.storeId },
        select: { id: true },
      });
      if (!ownedOutlet) {
        return NextResponse.json(
          { error: "Cabang tidak ditemukan pada tenant Anda" },
          { status: 404 }
        );
      }
    }

    const idempotencyKey =
      request.headers.get("x-idempotency-key")?.trim() ||
      data.idempotencyKey?.trim() ||
      null;

    if (idempotencyKey) {
      pruneSalesIdempotency();
      const existing = salesIdempotencyMap.get(idempotencyKey);
      if (existing && Date.now() - existing.timestamp <= IDEMPOTENCY_TTL_MS) {
        return NextResponse.json(existing.response, {
          status: 201,
          headers: { "X-Idempotent-Replay": "true" },
        });
      }
    }

    if (data.items.length > 100 || data.items.some((item) => item.quantity > 10000 ||
        item.discountAmount > 1e12) || data.discountAmount > 1e12) {
      return NextResponse.json({ error: "Batas transaksi terlampaui" }, { status: 400 });
    }

    // Process sale in a transaction.
    // Nomor invoice unik PER TENANT (storeId + invoiceNumber); retry menutup balapan
    // dua kasir yang checkout pada detik yang sama (Serializable + P2002).
    const result = await createSaleWithRetry(() =>
      prisma.$transaction(async (tx) => {
      // Resolve effective outlet, costing method, and kitchen workflow
      let effectiveOutletId = data.outletId || null;
      if (!effectiveOutletId) {
        const userRec = await tx.user.findUnique({
          where: { id: sessionUser.id },
          select: { outletId: true },
        });
        if (userRec?.outletId) {
          effectiveOutletId = userRec.outletId;
        } else {
          const mainOutlet = await tx.outlet.findFirst({
            where: { isMain: true, isActive: true, storeId: scope.storeId },
            select: { id: true },
          });
          effectiveOutletId = mainOutlet?.id || null;
        }
      }

      const store = await tx.store.findUnique({
        where: { id: scope.storeId },
      });
      let effectiveCostingMethod: "FIFO" | "FEFO" | "AVERAGE" = (store?.costingMethod as any) || "FIFO";
      let effectiveKitchenWorkflow: "DIRECT_SERVE" | "KITCHEN_DISPATCH" | "HYBRID" =
        store?.kitchenWorkflow || "KITCHEN_DISPATCH";

      if (effectiveOutletId) {
        const targetOutlet = await tx.outlet.findUnique({
          where: { id: effectiveOutletId },
          select: { costingMethod: true, kitchenWorkflow: true },
        });
        if (targetOutlet) {
          effectiveCostingMethod = targetOutlet.costingMethod as any;
          effectiveKitchenWorkflow = targetOutlet.kitchenWorkflow;
        }
      }

      // 1. Process Stock Deduction (FIFO or Weighted Average) for each item
      const processedItems = [];
      let totalCost = new Decimal(0);
      let subtotal = new Decimal(0);
      let itemDiscountTotal = new Decimal(0);

      for (const item of data.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, storeId: scope.storeId },
          include: {
            recipesAsParent: {
              include: { ingredient: true },
            },
          },
        });

        // Isolasi tenant: produk tenant lain tidak boleh bisa dijual (404, bukan 500)
        // Isolasi tenant: id produk tenant lain harus tampak "tidak ada" (404),
        // bukan kegagalan server (500) - dan tidak membocorkan keberadaannya.
        if (!product) {
          throw new ApiBusinessError(
            "Produk tidak ditemukan pada tenant Anda",
            404,
            "PRODUCT_NOT_FOUND"
          );
        }
        if (!product.isActive) {
          throw new ApiBusinessError("Produk tidak tersedia", 409, "PRODUCT_INACTIVE");
        }

        if (product.productType === "MANUFACTURED" && product.recipesAsParent.length > 0) {
          // F&B Manufactured Product with Recipe (e.g. Makanan, Kopi)
          // Deduct from raw material ingredients' batches
          let itemCost = new Decimal(0);
          const rawAllocations: any[] = [];

          for (const recipe of product.recipesAsParent) {
            const qtyNeeded = Math.ceil(
              Number(recipe.quantityNeeded) * item.quantity * (1 + Number(recipe.wastagePercent) / 100)
            );
            if (qtyNeeded > 0) {
              const rawFifo = await processFIFODeduction(tx, recipe.ingredientId, qtyNeeded, {
                outletId: effectiveOutletId,
                method: effectiveCostingMethod,
              });
              itemCost = itemCost.add(rawFifo.totalCost);
              rawAllocations.push(...rawFifo.allocations);
              await applyFIFODeductions(tx, rawFifo.allocations);
            }
          }

          // Manufactured prices must also come from the server, never the POS body.
          const priceBatch = await tx.productBatch.findFirst({
            where: {
              productId: product.id,
              remainingQty: { gt: 0 },
              ...(effectiveOutletId ? { OR: [{ outletId: effectiveOutletId }, { outletId: null }] } : {}),
            },
            orderBy: { purchaseDate: "asc" },
          });
          if (!priceBatch) {
            throw new ApiBusinessError(
              "Harga produk belum tersedia",
              409,
              "PRICE_UNAVAILABLE"
            );
          }
          const unitSellingPrice = priceBatch.sellingPrice;
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
          // Standard Retail Finished Good deduction (FIFO or AVERAGE)
          const fifoResult = item.selectedBatchId
            ? await processSelectedBatchDeduction(
                tx,
                item.productId,
                item.selectedBatchId,
                item.quantity,
                { outletId: effectiveOutletId }
              )
            : await processFIFODeduction(tx, item.productId, item.quantity, {
                outletId: effectiveOutletId,
                method: effectiveCostingMethod,
              });
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
      // Jendela harian & tanggal pada nomor memakai zona bisnis, bukan jam server
      // (UTC): urutan reset pada tengah malam WIB dan struk dini hari tetap
      // bertanggal hari setempat.
      const todaySalesCount = await tx.sale.count({
        where: {
          // Isolasi tenant: nomor invoice dihitung per tenant
          outlet: { storeId: scope.storeId },
          createdAt: { gte: getBusinessDayStart(new Date(), timezone) },
        },
      });
      const invoiceNumber = generateInvoiceNumber(
        todaySalesCount + 1,
        new Date(),
        timezone
      );

      // 3. Store tax & service charge settings
      const serviceRate = Number(store?.serviceChargeRate || 0);
      const taxRate = Number(store?.taxRate || 0);
      const taxInclusive = store?.taxInclusive ?? false;
      const enableRounding = store?.enableRounding ?? true;

      // 4. Calculate totals
      const transactionDiscount = new Decimal(data.discountAmount || 0);
      const discountAmount = itemDiscountTotal.add(transactionDiscount);
      const netSubtotal = subtotal.sub(discountAmount);
      if (netSubtotal.isNegative() || processedItems.some((item) => item.totalPrice.isNegative())) {
        throw new ApiBusinessError(
          "Diskon melebihi nilai transaksi",
          400,
          "INVALID_DISCOUNT"
        );
      }

      let serviceCharge = new Decimal(0);
      if (serviceRate > 0) {
        serviceCharge = netSubtotal.mul(serviceRate).div(100);
      }

      const taxableBase = netSubtotal.add(serviceCharge);
      let taxAmount = new Decimal(0);
      let preRoundingTotal = new Decimal(0);

      if (taxInclusive) {
        if (taxRate > 0) {
          taxAmount = taxableBase.mul(taxRate).div(100 + taxRate);
        }
        preRoundingTotal = taxableBase;
      } else {
        if (taxRate > 0) {
          taxAmount = taxableBase.mul(taxRate).div(100);
        }
        preRoundingTotal = taxableBase.add(taxAmount);
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
          storeId: scope.storeId,
          orderType: data.orderType || "DINE_IN",
          outletId: effectiveOutletId,
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
        // Isolasi tenant: meja wajib milik outlet tenant pemanggil
        const ownedTable = await tx.restaurantTable.findFirst({
          where: {
            id: data.tableId,
            OR: [{ outlet: { storeId: scope.storeId } }, { outletId: null }],
          },
          select: { id: true },
        });
        if (ownedTable) {
          await tx.restaurantTable.update({
            where: { id: data.tableId },
            data: { isOccupied: true },
          });
        }
      }

      // 7. Route to Kitchen Display System (KDS) according to KitchenWorkflow
      const shouldDispatchKDS =
        effectiveKitchenWorkflow === "KITCHEN_DISPATCH" ||
        (effectiveKitchenWorkflow === "HYBRID" && (data.orderType || "DINE_IN") === "DINE_IN");

      if (shouldDispatchKDS) {
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
          storeId: scope.storeId,
        },
      });

      // 8. Update customer CRM stats
      if (data.customerId) {
        // Isolasi tenant: pelanggan (CRM) wajib milik tenant pemanggil
        const ownedCustomer = await tx.customer.findFirst({
          where: { id: data.customerId, storeId: scope.storeId },
          select: { id: true },
        });
        if (ownedCustomer) {
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
      }

      return sale;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    })
    );

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

    const finalPayload = { success: true, data: redactCosts(result, sessionUser.role) };
    if (idempotencyKey) {
      salesIdempotencyMap.set(idempotencyKey, {
        timestamp: Date.now(),
        response: finalPayload,
      });
    }

    return NextResponse.json(finalPayload, { status: 201 });
  } catch (error) {
    console.error("POST /api/sales error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Data checkout tidak valid" },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Gagal membuat transaksi";
    const isStockError =
      message.includes("Stok tidak cukup") || message.includes("Kurang");
    const isNotFound = message.includes("tidak ditemukan");
    const isUnavailable = message === "Produk tidak tersedia";
    const isConflict =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
    const status = isStockError
      ? 400
      : isNotFound
        ? 404
        : isUnavailable || isConflict
          ? 400
          : 500;
    const clientMessage = isStockError
      ? "Stok tidak mencukupi"
      : isConflict
        ? "Nomor transaksi bentrok, silakan ulangi"
        : status === 500
          ? "Gagal membuat transaksi"
          : message;
    return NextResponse.json({ error: clientMessage }, { status });
  }
}
