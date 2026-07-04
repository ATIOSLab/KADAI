export interface PricingBatch {
  id: string;
  batchNumber: string;
  remainingQty: number;
  sellingPrice: number;
}

export interface CartPricingLine {
  lineId: string;
  productId: string;
  quantity: number;
  selectedBatchId: string | null;
  pricingBatches: PricingBatch[];
}

function reserveSelectedBatchLines(
  items: CartPricingLine[],
  availableMap: Map<string, number>
) {
  for (const item of items) {
    if (!item.selectedBatchId) {
      continue;
    }

    const currentAvailable = availableMap.get(item.selectedBatchId) ?? 0;
    const reservedQty = Math.min(item.quantity, currentAvailable);
    availableMap.set(item.selectedBatchId, currentAvailable - reservedQty);
  }
}

function reserveAutomaticLines(
  items: CartPricingLine[],
  batches: PricingBatch[],
  availableMap: Map<string, number>
) {
  for (const item of items) {
    if (item.selectedBatchId) {
      continue;
    }

    let remaining = item.quantity;

    for (const batch of batches) {
      if (remaining <= 0) {
        break;
      }

      const currentAvailable = availableMap.get(batch.id) ?? 0;
      const reservedQty = Math.min(remaining, currentAvailable);
      availableMap.set(batch.id, currentAvailable - reservedQty);
      remaining -= reservedQty;
    }
  }
}

export function getRemainingPricingBatches(
  pricingBatches: PricingBatch[],
  items: CartPricingLine[]
) {
  const availableMap = new Map(
    pricingBatches.map((batch) => [batch.id, batch.remainingQty])
  );

  reserveSelectedBatchLines(items, availableMap);
  reserveAutomaticLines(items, pricingBatches, availableMap);

  return pricingBatches
    .map((batch) => ({
      ...batch,
      remainingQty: Math.max(0, availableMap.get(batch.id) ?? 0),
    }))
    .filter((batch) => batch.remainingQty > 0);
}

export function getAvailablePricingBatchesForLine(
  line: CartPricingLine,
  items: CartPricingLine[]
) {
  const siblingLines = items.filter(
    (item) => item.productId === line.productId && item.lineId !== line.lineId
  );

  return getRemainingPricingBatches(line.pricingBatches, siblingLines);
}

export function getMaxQuantityForSelection(
  pricingBatches: PricingBatch[],
  selectedBatchId: string | null
) {
  if (selectedBatchId) {
    const selectedBatch = pricingBatches.find(
      (batch) => batch.id === selectedBatchId
    );
    return selectedBatch?.remainingQty ?? 0;
  }

  return pricingBatches.reduce((sum, batch) => sum + batch.remainingQty, 0);
}

function getBatchesForSelection(
  pricingBatches: PricingBatch[],
  selectedBatchId: string | null
) {
  if (!selectedBatchId) {
    return pricingBatches;
  }

  const selectedBatch = pricingBatches.find(
    (batch) => batch.id === selectedBatchId
  );

  return selectedBatch ? [selectedBatch] : [];
}

export function calculateTieredSellingTotal(
  quantity: number,
  pricingBatches: PricingBatch[]
): number {
  if (quantity <= 0) {
    return 0;
  }

  let remaining = quantity;
  let total = 0;

  for (const batch of pricingBatches) {
    if (remaining <= 0) {
      break;
    }

    const qtyFromBatch = Math.min(remaining, batch.remainingQty);
    total += qtyFromBatch * batch.sellingPrice;
    remaining -= qtyFromBatch;
  }

  return total;
}

export function calculateAverageUnitPrice(
  quantity: number,
  pricingBatches: PricingBatch[],
  selectedBatchId: string | null = null
): number {
  if (quantity <= 0) {
    return 0;
  }

  const relevantBatches = getBatchesForSelection(pricingBatches, selectedBatchId);

  return calculateTieredSellingTotal(quantity, relevantBatches) / quantity;
}

export function calculateCartLineSubtotal(
  quantity: number,
  pricingBatches: PricingBatch[],
  discountAmount: number,
  selectedBatchId: string | null = null
): number {
  const relevantBatches = getBatchesForSelection(pricingBatches, selectedBatchId);

  return Math.max(
    0,
    calculateTieredSellingTotal(quantity, relevantBatches) - discountAmount
  );
}

export function usesMixedBatchPricing(
  quantity: number,
  pricingBatches: PricingBatch[],
  selectedBatchId: string | null = null
): boolean {
  if (selectedBatchId || quantity <= 0 || pricingBatches.length <= 1) {
    return false;
  }

  let remaining = quantity;
  let distinctPricesUsed = 0;

  for (const batch of pricingBatches) {
    if (remaining <= 0) {
      break;
    }

    if (batch.remainingQty > 0) {
      distinctPricesUsed += 1;
      remaining -= Math.min(remaining, batch.remainingQty);
    }
  }

  return distinctPricesUsed > 1;
}
