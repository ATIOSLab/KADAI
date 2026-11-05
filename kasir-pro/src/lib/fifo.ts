import type { Prisma, PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "./prisma";

export interface FIFOAllocation {
  batchId: string;
  quantity: number;
  costPrice: Decimal;
  sellingPrice: Decimal;
}

export interface FIFOResult {
  allocations: FIFOAllocation[];
  totalCost: Decimal;
  totalRevenue: Decimal;
  averageCost: Decimal;
  averageSellingPrice: Decimal;
}

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

/**
 * Process FIFO or Weighted Average deduction for a single product
 * Returns batch allocations and total HPP
 */
export async function processFIFODeduction(
  db: PrismaExecutor,
  productId: string,
  requestedQty: number,
  options?: { outletId?: string | null; method?: "FIFO" | "AVERAGE" }
): Promise<FIFOResult> {
  const method = options?.method ?? "FIFO";
  const outletId = options?.outletId ?? null;

  // Get batches with remaining stock, ordered by purchase date (FIFO)
  // If outletId is provided, look for batches specific to this outlet or global (null)
  const batches = await db.productBatch.findMany({
    where: {
      productId,
      remainingQty: { gt: 0 },
      ...(outletId ? { OR: [{ outletId }, { outletId: null }] } : {}),
    },
    orderBy: { purchaseDate: "asc" },
  });

  const totalAvailable = batches.reduce((acc, b) => acc + b.remainingQty, 0);
  if (totalAvailable < requestedQty) {
    throw new Error(
      `Stok tidak cukup untuk produk ini. Tersedia ${totalAvailable} unit, diminta ${requestedQty} unit.`
    );
  }

  // If method is AVERAGE, compute weighted average cost
  let weightedAverageCost = new Decimal(0);
  if (method === "AVERAGE" && totalAvailable > 0) {
    const totalValue = batches.reduce(
      (acc, b) => acc.add(b.costPrice.mul(b.remainingQty)),
      new Decimal(0)
    );
    weightedAverageCost = totalValue.div(totalAvailable);
  }

  let remainingQty = requestedQty;
  let totalCost = new Decimal(0);
  let totalRevenue = new Decimal(0);
  const allocations: FIFOAllocation[] = [];

  for (const batch of batches) {
    if (remainingQty <= 0) break;

    const deductQty = Math.min(remainingQty, batch.remainingQty);
    const assignedCost = method === "AVERAGE" ? weightedAverageCost : batch.costPrice;

    allocations.push({
      batchId: batch.id,
      quantity: deductQty,
      costPrice: assignedCost,
      sellingPrice: batch.sellingPrice,
    });

    totalCost = totalCost.add(assignedCost.mul(deductQty));
    totalRevenue = totalRevenue.add(batch.sellingPrice.mul(deductQty));
    remainingQty -= deductQty;
  }

  const averageCost = requestedQty > 0
    ? totalCost.div(requestedQty)
    : new Decimal(0);
  const averageSellingPrice = requestedQty > 0
    ? totalRevenue.div(requestedQty)
    : new Decimal(0);

  return {
    allocations,
    totalCost,
    totalRevenue,
    averageCost,
    averageSellingPrice,
  };
}

export async function processSelectedBatchDeduction(
  db: PrismaExecutor,
  productId: string,
  batchId: string,
  requestedQty: number
): Promise<FIFOResult> {
  const batch = await db.productBatch.findFirst({
    where: {
      id: batchId,
      productId,
      remainingQty: { gt: 0 },
    },
  });

  if (!batch) {
    throw new Error("Batch yang dipilih tidak ditemukan atau stoknya habis.");
  }

  if (batch.remainingQty < requestedQty) {
    throw new Error(
      `Stok batch ${batch.batchNumber} tidak cukup. Tersisa ${batch.remainingQty} unit.`
    );
  }

  const totalCost = batch.costPrice.mul(requestedQty);
  const totalRevenue = batch.sellingPrice.mul(requestedQty);

  return {
    allocations: [
      {
        batchId: batch.id,
        quantity: requestedQty,
        costPrice: batch.costPrice,
        sellingPrice: batch.sellingPrice,
      },
    ],
    totalCost,
    totalRevenue,
    averageCost: batch.costPrice,
    averageSellingPrice: batch.sellingPrice,
  };
}

/**
 * Get the current FIFO selling price for a product
 * Returns the selling price from the oldest batch with remaining stock
 */
export async function getFIFOSellingPrice(
  productId: string
): Promise<Decimal | null> {
  const batch = await prisma.productBatch.findFirst({
    where: {
      productId,
      remainingQty: { gt: 0 },
    },
    orderBy: { purchaseDate: "asc" },
    select: { sellingPrice: true },
  });

  return batch?.sellingPrice ?? null;
}

/**
 * Get the total available stock for a product across all batches
 */
export async function getTotalStock(productId: string): Promise<number> {
  const result = await prisma.productBatch.aggregate({
    where: {
      productId,
      remainingQty: { gt: 0 },
    },
    _sum: { remainingQty: true },
  });

  return result._sum.remainingQty ?? 0;
}

/**
 * Apply FIFO deductions to database (update batch remaining quantities)
 */
export async function applyFIFODeductions(
  db: PrismaExecutor,
  allocations: FIFOAllocation[]
): Promise<void> {
  for (const allocation of allocations) {
    await db.productBatch.update({
      where: { id: allocation.batchId },
      data: {
        remainingQty: {
          decrement: allocation.quantity,
        },
      },
    });
  }
}

/**
 * Restore FIFO deductions (for voiding a sale)
 */
export async function restoreFIFODeductions(
  db: PrismaExecutor,
  allocations: { productBatchId: string; quantity: number }[]
): Promise<void> {
  for (const allocation of allocations) {
    await db.productBatch.update({
      where: { id: allocation.productBatchId },
      data: {
        remainingQty: {
          increment: allocation.quantity,
        },
      },
    });
  }
}
