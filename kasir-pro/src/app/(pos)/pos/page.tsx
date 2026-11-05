"use client";

import { useState } from "react";
import { ProductSearch } from "@/components/pos/product-search";
import { Cart } from "@/components/pos/cart";
import { ShiftDialog } from "@/components/pos/shift-dialog";
import { ShoppingCart, ArrowLeft, ShoppingBag, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSessionUser } from "@/hooks/use-session-user";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency, cn } from "@/lib/utils";

export default function PosPage() {
  const { user } = useSessionUser();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const itemCount = useCart((state) => state.getItemCount());
  const grandTotal = useCart((state) => state.getGrandTotal());

  const roleLabel =
    user?.role === "ADMIN"
      ? "Administrator"
      : user?.role === "MANAGER"
        ? "Manager"
        : "Kasir";

  return (
    <div className="h-screen flex flex-col bg-bg-main relative overflow-hidden">
      {/* POS Header */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="size-8 rounded-lg">
            <Link href="/dashboard">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <ShoppingCart className="size-4" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight text-foreground">KADAI</h1>
              <p className="text-[10px] font-medium text-muted-foreground">
                Terminal Kasir POS
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsShiftOpen(true)}
            className="text-xs font-bold h-8 px-2.5 flex items-center gap-1.5 border-slate-300"
            title="Laporan Kas & Tutup Shift"
          >
            <Calculator className="size-3.5 text-primary" />
            <span className="hidden sm:inline">Kas & Tutup Shift</span>
          </Button>

          <span className="text-xs font-semibold text-muted-foreground hidden sm:inline-block">
            {roleLabel}: {user?.name ?? "Memuat..."}
          </span>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </div>
        </div>
      </header>

      {/* POS Content: Split view */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Product Search */}
        <div className="flex-1 overflow-y-auto neo-scrollbar p-3 sm:p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-4">
          <ProductSearch />
        </div>

        {/* Mobile Floating Cart Summary (<768px Phones only) */}
        <div className="md:hidden absolute bottom-4 inset-x-4 z-40 pb-[env(safe-area-inset-bottom)]">
          <Button
            size="lg"
            className="w-full flex items-center justify-between rounded-xl shadow-lg h-12 px-4"
            onClick={() => setIsCartOpen(true)}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-5" />
              <span className="text-xs font-bold">{itemCount} Item</span>
            </div>
            <span className="text-sm font-black tabular-nums">
              {formatCurrency(grandTotal)}
            </span>
          </Button>
        </div>

        {/* Right: Cart (Persistent on Tablet 768px+ & Desktop, Slide-over on Phones) */}
        <div
          className={cn(
            "fixed inset-0 z-50 bg-card flex flex-col transition-transform duration-300 ease-in-out",
            "md:static md:w-[340px] lg:w-[390px] xl:w-[420px] md:border-l md:border-border md:translate-y-0",
            isCartOpen ? "translate-y-0" : "translate-y-full"
          )}
        >
          <Cart onClose={() => setIsCartOpen(false)} />
        </div>
      </div>

      <ShiftDialog open={isShiftOpen} onOpenChange={setIsShiftOpen} />
    </div>
  );
}
