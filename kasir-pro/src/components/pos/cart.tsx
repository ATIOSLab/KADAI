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
      <div className="p-4 border-b-[2.5px] border-border-default flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-accent-primary" />
          <h2 className="font-extrabold text-lg">Keranjang</h2>
          {itemCount > 0 && (
            <span className="neo-badge bg-accent-primary text-white text-xs">
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
              className="text-accent-danger"
            >
              <Trash2 className="w-4 h-4 mr-1 lg:mr-0" />
              <span className="hidden lg:inline">Hapus</span>
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden"
            >
              Tutup
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto neo-scrollbar p-4 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-bg-main neo-border flex items-center justify-center mb-3">
              <ShoppingBag className="w-8 h-8 text-text-muted" />
            </div>
            <p className="font-bold text-text-muted">Keranjang Kosong</p>
            <p className="text-xs text-text-muted mt-1">
              Klik produk untuk menambahkan
            </p>
          </div>
        ) : (
          items.map((item) => <CartItemRow key={item.lineId} item={item} />)
        )}
      </div>

      {items.length > 0 && (
        <div className="border-t-[2.5px] border-border-default p-4 space-y-3 shrink-0 bg-bg-card">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-text-secondary">Subtotal</span>
              <span className="font-bold">{formatCurrency(subtotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-sm text-accent-danger">
                <span className="font-medium">Diskon</span>
                <span className="font-bold">
                  -{formatCurrency(discountTotal)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg pt-2 border-t-[1.5px] border-border-default">
              <span className="font-extrabold">Total</span>
              <span className="font-black text-accent-primary">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          <Button
            size="xl"
            className="w-full"
            onClick={() => setShowCheckout(true)}
          >
            Bayar - {formatCurrency(grandTotal)}
          </Button>
        </div>
      )}

      <CheckoutDialog open={showCheckout} onOpenChange={setShowCheckout} />
    </>
  );
}
