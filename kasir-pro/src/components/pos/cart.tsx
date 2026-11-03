"use client";

import { useState } from "react";
import { ShoppingBag, Trash2 } from "lucide-react";
import { CartItemRow } from "@/components/pos/cart-item";
import { CheckoutDialog } from "@/components/pos/checkout-dialog";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface CartProps {
  onClose?: () => void;
}

export function Cart({ onClose }: CartProps) {
  const items = useCart((state) => state.items);
  const clearCart = useCart((state) => state.clearCart);
  const getSubtotal = useCart((state) => state.getSubtotal);
  const getGrandTotal = useCart((state) => state.getGrandTotal);
  const getItemCount = useCart((state) => state.getItemCount);
  const discountTotal = useCart((state) => state.discountTotal);
  const [showCheckout, setShowCheckout] = useState(false);

  const subtotal = getSubtotal();
  const grandTotal = getGrandTotal();
  const itemCount = getItemCount();

  return (
    <>
      <div className="p-3.5 border-b border-border flex items-center justify-between shrink-0 bg-card">
        <div className="flex items-center gap-2">
          <ShoppingBag className="size-5 text-primary" />
          <h2 className="font-bold text-base text-foreground">Keranjang</h2>
          {itemCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold font-mono">
              {itemCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-destructive text-xs h-8 px-2"
            >
              <Trash2 className="size-3.5 mr-1" />
              <span>Kosongkan</span>
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="md:hidden text-xs h-8 px-2"
            >
              Tutup
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto neo-scrollbar p-3 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="size-14 rounded-2xl bg-muted border border-border flex items-center justify-center mb-3">
              <ShoppingBag className="size-6 text-muted-foreground opacity-50" />
            </div>
            <p className="font-bold text-sm text-foreground">Keranjang Kosong</p>
            <p className="text-xs text-muted-foreground mt-1">
              Sentuh produk di sebelah kiri untuk menambahkan
            </p>
          </div>
        ) : (
          items.map((item) => <CartItemRow key={item.lineId} item={item} />)
        )}
      </div>

      {items.length > 0 && (
        <div className="border-t border-border p-3.5 space-y-3 shrink-0 bg-card">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-bold tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Diskon</span>
                <span className="font-bold tabular-nums">
                  -{formatCurrency(discountTotal)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-base pt-2 border-t border-border">
              <span className="font-bold text-foreground">Total Tagihan</span>
              <span className="font-black text-primary tabular-nums">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full font-bold text-sm h-11 rounded-xl shadow-sm"
            onClick={() => setShowCheckout(true)}
          >
            Bayar ({formatCurrency(grandTotal)})
          </Button>
        </div>
      )}

      <CheckoutDialog open={showCheckout} onOpenChange={setShowCheckout} />
    </>
  );
}
