"use client";

import { useMemo } from "react";
import { Minus, Plus, X } from "lucide-react";
import {
  getAvailablePricingBatchesForLine,
  usesMixedBatchPricing,
} from "@/lib/pos-pricing";
import { useCart } from "@/hooks/use-cart";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { ProductImage } from "@/components/shared/product-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/types";

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const items = useCart((state) => state.items);
  const updateQuantity = useCart((state) => state.updateQuantity);
  const removeItem = useCart((state) => state.removeItem);
  const updateSelectedBatch = useCart((state) => state.updateSelectedBatch);
  const availablePricingBatches = useMemo(
    () => getAvailablePricingBatchesForLine(item, items),
    [item, items]
  );
  const mixedPricing = usesMixedBatchPricing(
    item.quantity,
    availablePricingBatches,
    item.selectedBatchId
  );
  const quantityInput = String(item.quantity);
  const maxQuantity = item.maxStock;
  const selectedBatch = availablePricingBatches.find(
    (batch) => batch.id === item.selectedBatchId
  );

  return (
    <div className="neo-card p-3 animate-scale-in">
      <div className="flex items-start gap-3">
        <ProductImage
          src={item.image}
          alt={item.productName}
          className="h-14 w-14 shrink-0 rounded-lg"
          iconClassName="h-5 w-5"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{item.productName}</p>
          <p className="text-xs text-text-muted">
            {formatCurrency(item.unitPrice)} / {item.unit}
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
              Batch Stok
            </p>
            <SearchableSelect
              value={item.selectedBatchId ?? "AUTO"}
              onValueChange={(value) =>
                updateSelectedBatch(
                  item.lineId,
                  value === "AUTO" ? null : value
                )
              }
              placeholder="Pilih batch"
              searchPlaceholder="Cari batch..."
              emptyMessage="Batch tidak ditemukan."
              triggerClassName="h-8 text-xs"
              options={[
                {
                  value: "AUTO",
                  label: "FIFO Otomatis",
                  searchText: "fifo otomatis auto",
                },
                ...availablePricingBatches.map((batch) => ({
                  value: batch.id,
                  label: batch.batchNumber,
                  description: `${batch.remainingQty} unit - ${formatCurrency(batch.sellingPrice)}`,
                  searchText: `${batch.batchNumber} ${batch.remainingQty} ${batch.sellingPrice}`,
                  triggerLabel: batch.batchNumber,
                })),
              ]}
            />
          </div>
          {mixedPricing && (
            <p className="mt-1 text-[10px] font-bold text-accent-secondary">
              Harga campuran FIFO aktif
            </p>
          )}
          {selectedBatch && (
            <p className="mt-1 text-[10px] font-bold text-accent-secondary">
              Batch {selectedBatch.batchNumber} dipilih
            </p>
          )}
        </div>
        <button
          onClick={() => removeItem(item.lineId)}
          className="text-text-muted hover:text-accent-danger transition-colors p-0.5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="w-7 h-7"
            onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <Input
            type="text"
            inputMode="numeric"
            value={quantityInput}
            onChange={(event) => {
              const sanitizedValue = event.target.value.replace(/\D/g, "");
              if (!sanitizedValue) {
                return;
              }

              updateQuantity(item.lineId, Number(sanitizedValue));
            }}
            className="h-7 w-14 px-2 text-center text-sm font-bold tabular-nums"
          />
          <Button
            variant="outline"
            size="icon"
            className="w-7 h-7"
            onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
            disabled={item.quantity >= maxQuantity}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        <div className="text-right">
          <span className="font-bold text-sm text-accent-primary">
            {formatCurrency(item.subtotal)}
          </span>
          <p className="text-[10px] font-medium text-text-muted">
            Maks: {maxQuantity}
          </p>
        </div>
      </div>
    </div>
  );
}
