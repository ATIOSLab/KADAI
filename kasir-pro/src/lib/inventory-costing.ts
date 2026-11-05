import type { Prisma, PrismaClient, CostingMethod } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface CostingAllocation {
  batchId: string;
  quantity: number;
  costPrice: Decimal;
  sellingPrice: Decimal;
}

export interface CostingResult {
  allocations: CostingAllocation[];
  totalCost: Decimal;
  totalRevenue: Decimal;
  unitCost: Decimal;
  averageSellingPrice: Decimal;
  methodUsed: CostingMethod;
}

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

/**
 * Deduct stock and calculate HPP based on configured CostingMethod (FIFO or AVERAGE).
 * Supports optional outlet-scoping: if outletId is provided, prioritizes batches for that outlet.
 */
export async function processStockDeduction(
  db: PrismaExecutor,
  productId: string,
  requestedQty: number,
  options?: {
    outletId?: string | null;
    method?: CostingMethod;
  }
): Promise<CostingResult> {
  const method = options?.method ?? "FIFO";
  const outletId = options?.outletId ?? null;

  // 1. Fetch available batches. If outletId is provided, match that outlet or global (null)
  const batches = await db.productBatch.findMany({
    where: {
      productId,
      remainingQty: { gt: 0 },
      ...(outletId ? { OR: [{ outletId }, { outletId: null }] } : {}),
    },
    orderBy: { purchaseDate: "asc" },
  });

  if (batches.length === 0) {
    throw new Error("Stok produk ini tidak tersedia di cabang terpilih.");
  }

  const totalAvailable = batches.reduce((acc, b) => acc + b.remainingQty, 0);
  if (totalAvailable < requestedQty) {
    throw new Error(
      `Stok tidak mencukupi. Tersedia ${totalAvailable} unit, diminta ${requestedQty} unit.`
    );
  }

  // Calculate Weighted Average Cost across available batches if method is AVERAGE
  let weightedAverageCost = new Decimal(0);
  if (method === "AVERAGE" && totalAvailable > 0) {
    const totalInventoryValue = batches.reduce(
      (acc, b) => acc.add(b.costPrice.mul(b.remainingQty)),
      new Decimal(0)
    );
    weightedAverageCost = totalInventoryValue.div(totalAvailable);
  }

  let remainingQtyToDeduct = requestedQty;
  let totalCost = new Decimal(0);
  let totalRevenue = new Decimal(0);
  const allocations: CostingAllocation[] = [];

  for (const batch of batches) {
    if (remainingQtyToDeduct <= 0) break;

    const deductQty = Math.min(remainingQtyToDeduct, batch.remainingQty);
    const assignedCostPrice = method === "AVERAGE" ? weightedAverageCost : batch.costPrice;

    allocations.push({
      batchId: batch.id,
      quantity: deductQty,
      costPrice: assignedCostPrice,
      sellingPrice: batch.sellingPrice,
    });

    totalCost = totalCost.add(assignedCostPrice.mul(deductQty));
    totalRevenue = totalRevenue.add(batch.sellingPrice.mul(deductQty));
    remainingQtyToDeduct -= deductQty;
  }

  const unitCost = requestedQty > 0 ? totalCost.div(requestedQty) : new Decimal(0);
  const averageSellingPrice = requestedQty > 0 ? totalRevenue.div(requestedQty) : new Decimal(0);

  return {
    allocations,
    totalCost,
    totalRevenue,
    unitCost,
    averageSellingPrice,
    methodUsed: method,
  };
}

/**
 * Deduct stock from a specific batch (Specific Identification)
 */
export async function processSpecificBatchDeduction(
  db: PrismaExecutor,
  productId: string,
  batchId: string,
  requestedQty: number
): Promise<CostingResult> {
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
    unitCost: batch.costPrice,
    averageSellingPrice: batch.sellingPrice,
    methodUsed: "FIFO",
  };
}

/**
 * Apply deductions to database
 */
export async function applyStockDeductions(
  db: PrismaExecutor,
  allocations: CostingAllocation[]
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
 * Restore deductions (for voiding sales)
 */
export async function restoreStockDeductions(
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
