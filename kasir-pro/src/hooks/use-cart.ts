import { create } from "zustand";
import type { CartItem } from "@/types";
import {
  getAvailablePricingBatchesForLine,
  getMaxQuantityForSelection,
  calculateAverageUnitPrice,
  calculateCartLineSubtotal,
  type PricingBatch,
} from "@/lib/pos-pricing";

interface CartStore {
  items: CartItem[];
  discountTotal: number;
  catalogVersion: number;
  setDiscountTotal: (amount: number) => void;
  addItem: (item: Omit<CartItem, "subtotal">) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  updateDiscount: (lineId: string, discount: number) => void;
  updateSelectedBatch: (lineId: string, selectedBatchId: string | null) => void;
  clearCart: () => void;
  bumpCatalogVersion: () => void;
  getSubtotal: () => number;
  getGrandTotal: () => number;
  getItemCount: () => number;
  getAvailablePricingBatchesForLine: (lineId: string) => PricingBatch[];
}

function generateLineId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildCartItem(
  item: Omit<CartItem, "subtotal">,
  allItems: Omit<CartItem, "subtotal">[]
): CartItem {
  const availablePricingBatches = getAvailablePricingBatchesForLine(item, allItems);
  const maxStock = getMaxQuantityForSelection(
    availablePricingBatches,
    item.selectedBatchId
  );
  const safeQuantity = Math.max(1, Math.min(item.quantity, maxStock || 1));

  return {
    ...item,
    quantity: safeQuantity,
    maxStock,
    unitPrice: calculateAverageUnitPrice(
      safeQuantity,
      availablePricingBatches,
      item.selectedBatchId
    ),
    subtotal: calculateCartLineSubtotal(
      safeQuantity,
      availablePricingBatches,
      item.discountAmount,
      item.selectedBatchId
    ),
  };
}

function recalculateItems(items: Omit<CartItem, "subtotal">[]): CartItem[] {
  return items.map((item) => buildCartItem(item, items));
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  discountTotal: 0,
  catalogVersion: 0,

  setDiscountTotal: (amount) => set({ discountTotal: amount }),

  addItem: (newItem) => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          item.selectedBatchId === newItem.selectedBatchId
      );

      if (existingIndex >= 0) {
        const updated = [...state.items];
        const existing = updated[existingIndex];
        updated[existingIndex] = {
          ...existing,
          quantity: existing.quantity + newItem.quantity,
        };
        return { items: recalculateItems(updated) };
      }

      return {
        items: recalculateItems([
          ...state.items,
          { ...newItem, lineId: newItem.lineId || generateLineId() },
        ]),
      };
    });
  },

  removeItem: (lineId) => {
    set((state) => ({
      items: recalculateItems(
        state.items.filter((item) => item.lineId !== lineId)
      ),
    }));
  },

  updateQuantity: (lineId, quantity) => {
    set((state) => ({
      items: recalculateItems(
        state.items.map((item) =>
          item.lineId === lineId
            ? {
              ...item,
                quantity: Math.max(1, quantity),
              }
            : item
        )
      ),
    }));
  },

  updateDiscount: (lineId, discount) => {
    set((state) => ({
      items: recalculateItems(
        state.items.map((item) =>
          item.lineId === lineId
            ? {
                ...item,
                discountAmount: discount,
              }
            : item
        )
      ),
    }));
  },

  updateSelectedBatch: (lineId, selectedBatchId) => {
    set((state) => ({
      items: recalculateItems(
        state.items.map((item) =>
          item.lineId === lineId
            ? {
                ...item,
                selectedBatchId,
              }
            : item
        )
      ),
    }));
  },

  clearCart: () => set({ items: [], discountTotal: 0 }),

  bumpCatalogVersion: () =>
    set((state) => ({ catalogVersion: state.catalogVersion + 1 })),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.subtotal, 0);
  },

  getGrandTotal: () => {
    const subtotal = get().getSubtotal();
    return subtotal - get().discountTotal;
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getAvailablePricingBatchesForLine: (lineId) => {
    const item = get().items.find((currentItem) => currentItem.lineId === lineId);
    if (!item) {
      return [];
    }

    return getAvailablePricingBatchesForLine(item, get().items);
  },
}));
