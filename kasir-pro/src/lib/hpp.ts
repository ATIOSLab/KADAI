import { prisma } from "./prisma";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Calculate HPP for a specific sale
 */
export async function calculateSaleHPP(saleId: string) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      items: {
        include: {
          batchAllocations: true,
          product: true,
        },
      },
    },
  });

  if (!sale) throw new Error("Sale not found");

  let totalHPP = new Decimal(0);
  const itemDetails = [];

  for (const item of sale.items) {
    let itemHPP = new Decimal(0);
    for (const alloc of item.batchAllocations) {
      itemHPP = itemHPP.add(alloc.costPrice.mul(alloc.quantity));
    }
    totalHPP = totalHPP.add(itemHPP);
    itemDetails.push({
      productName: item.product.name,
      quantity: item.quantity,
      revenue: item.totalPrice,
      hpp: itemHPP,
      profit: item.totalPrice.sub(itemHPP),
      margin: item.totalPrice.gt(0)
        ? itemHPP.div(item.totalPrice).mul(100).toNumber()
        : 0,
    });
  }

  return {
    saleId,
    invoiceNumber: sale.invoiceNumber,
    totalRevenue: sale.totalAmount,
    totalHPP,
    grossProfit: sale.totalAmount.sub(totalHPP),
    items: itemDetails,
  };
}

/**
 * Calculate HPP per product for a given date range
 */
export async function calculateProductHPP(
  productId: string,
  startDate?: Date,
  endDate?: Date
) {
  const whereClause: Record<string, unknown> = {
    productId,
    sale: { isVoided: false },
  };

  if (startDate || endDate) {
    whereClause.createdAt = {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    };
  }

  const saleItems = await prisma.saleItem.findMany({
    where: whereClause,
    include: {
      batchAllocations: true,
      product: true,
    },
  });

  let totalRevenue = new Decimal(0);
  let totalHPP = new Decimal(0);
  let totalQty = 0;

  for (const item of saleItems) {
    totalRevenue = totalRevenue.add(item.totalPrice);
    totalQty += item.quantity;
    for (const alloc of item.batchAllocations) {
      totalHPP = totalHPP.add(alloc.costPrice.mul(alloc.quantity));
    }
  }

  const grossProfit = totalRevenue.sub(totalHPP);
  const marginPercent = totalRevenue.gt(0)
    ? grossProfit.div(totalRevenue).mul(100).toNumber()
    : 0;

  return {
    productId,
    productName: saleItems[0]?.product.name ?? "",
    totalQuantitySold: totalQty,
    totalRevenue,
    totalHPP,
    grossProfit,
    marginPercent: Math.round(marginPercent * 100) / 100,
    averageCostPerUnit: totalQty > 0 ? totalHPP.div(totalQty) : new Decimal(0),
  };
}

/**
 * Get overall profit/loss summary for a date range
 */
export async function getProfitSummary(startDate: Date, endDate: Date) {
  const sales = await prisma.sale.findMany({
    where: {
      isVoided: false,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      totalAmount: true,
      totalCost: true,
      grossProfit: true,
      discountAmount: true,
      taxAmount: true,
    },
  });

  let totalRevenue = new Decimal(0);
  let totalCost = new Decimal(0);
  let totalProfit = new Decimal(0);
  let totalDiscount = new Decimal(0);
  let totalTax = new Decimal(0);

  for (const sale of sales) {
    totalRevenue = totalRevenue.add(sale.totalAmount);
    totalCost = totalCost.add(sale.totalCost);
    totalProfit = totalProfit.add(sale.grossProfit);
    totalDiscount = totalDiscount.add(sale.discountAmount);
    totalTax = totalTax.add(sale.taxAmount);
  }

  return {
    totalTransactions: sales.length,
    totalRevenue,
    totalCost,
    totalProfit,
    totalDiscount,
    totalTax,
    profitMargin: totalRevenue.gt(0)
      ? totalProfit.div(totalRevenue).mul(100).toNumber()
      : 0,
  };
}
