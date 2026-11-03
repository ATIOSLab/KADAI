"use client";

import { useEffect, useState, use } from "react";
import {
  Utensils,
  Plus,
  Minus,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  image: string | null;
  unit: string;
  station: string;
  isAvailable: boolean;
}

interface CartLine {
  item: MenuItem;
  quantity: number;
  notes: string;
}

export default function TableOrderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableData, setTableData] = useState<{
    id: string;
    tableNo: string;
    section: string;
  } | null>(null);
  const [storeData, setStoreData] = useState<{
    name: string;
    taxType: string;
    taxRate: number;
    serviceChargeRate: number;
  } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");

  // Cart State
  const [cart, setCart] = useState<Map<string, CartLine>>(new Map());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{
    invoiceNumber: string;
    totalAmount: number;
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/order?token=${token}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Gagal memuat menu");
          return;
        }

        setTableData(data.table);
        setStoreData(data.store);
        setCategories(["Semua", ...(data.categories || [])]);
        setProducts(data.products || []);
      } catch {
        setError("Gagal terhubung ke server");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  const addToCart = (item: MenuItem) => {
    const existing = cart.get(item.id);
    const updated = new Map(cart);
    if (existing) {
      updated.set(item.id, {
        ...existing,
        quantity: existing.quantity + 1,
      });
    } else {
      updated.set(item.id, {
        item,
        quantity: 1,
        notes: "",
      });
    }
    setCart(updated);
    toast.success(`${item.name} ditambahkan ke keranjang`);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const existing = cart.get(itemId);
    if (!existing) return;
    const updated = new Map(cart);
    const newQty = existing.quantity + delta;
    if (newQty <= 0) {
      updated.delete(itemId);
    } else {
      updated.set(itemId, { ...existing, quantity: newQty });
    }
    setCart(updated);
  };

  const updateItemNotes = (itemId: string, notes: string) => {
    const existing = cart.get(itemId);
    if (!existing) return;
    const updated = new Map(cart);
    updated.set(itemId, { ...existing, notes });
    setCart(updated);
  };

  // Calculations
  const cartItems: CartLine[] = Array.from(cart.values());
  const totalItemCount = cartItems.reduce((sum, c) => sum + c.quantity, 0);
  const subtotal = cartItems.reduce(
    (sum, c) => sum + c.item.price * c.quantity,
    0
  );
  const serviceRate = storeData?.serviceChargeRate || 0;
  const serviceCharge = (subtotal * serviceRate) / 100;
  const taxRate = storeData?.taxRate || 0;
  const taxAmount = ((subtotal + serviceCharge) * taxRate) / 100;
  const grandTotal = subtotal + serviceCharge + taxAmount;

  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) {
      toast.error("Keranjang masih kosong");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        token,
        customerName: customerName.trim() || undefined,
        notes: generalNotes.trim() || undefined,
        items: cartItems.map((c) => ({
          productId: c.item.id,
          quantity: c.quantity,
          notes: c.notes || undefined,
        })),
      };

      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal mengirim pesanan");
        return;
      }

      setOrderSuccess({
        invoiceNumber: data.invoiceNumber,
        totalAmount: data.totalAmount,
      });
      setCart(new Map());
      setIsCartOpen(false);
      toast.success("Pesanan Anda berhasil dikirim ke dapur!");
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts =
    selectedCategory === "Semua"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-sm text-muted-foreground">Memuat Menu Meja...</p>
      </div>
    );
  }

  if (error || !tableData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="size-16 text-destructive mb-4" />
        <h2 className="text-xl font-black">Kode QR Tidak Valid</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          {error || "Meja ini tidak ditemukan atau sesi telah berakhir. Silakan hubungi pelayan."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Top Banner */}
      <header className="sticky top-0 z-30 bg-card border-b border-border neo-shadow-sm px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black">
              <Store className="size-4" />
            </span>
            <div>
              <h1 className="text-sm font-black tracking-tight">{storeData?.name}</h1>
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Utensils className="size-3 text-primary" /> {tableData.tableNo} ({tableData.section})
              </p>
            </div>
          </div>
          <Badge className="font-bold neo-border bg-accent-success text-white">
            Self-Order
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 pt-4 space-y-4">
        {/* Success Modal */}
        {orderSuccess && (
          <Card className="neo-border neo-shadow bg-accent-success/10 border-accent-success p-6 text-center">
            <CheckCircle2 className="size-14 mx-auto text-accent-success mb-3 animate-bounce" />
            <h2 className="text-xl font-black text-accent-success">Pesanan Berhasil Masuk!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Tiket dapur pesanan Anda #{orderSuccess.invoiceNumber} telah diterima koki.
            </p>
            <div className="mt-4 p-3 bg-card rounded-xl neo-border font-bold text-sm">
              Total Pembayaran: Rp {orderSuccess.totalAmount.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Pembayaran dapat dilakukan langsung di kasir saat selesai makan.
            </p>
            <Button
              onClick={() => setOrderSuccess(null)}
              className="mt-4 w-full neo-border font-bold bg-accent-success text-white"
            >
              Pesan Menu Lainnya
            </Button>
          </Card>
        )}

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap neo-border transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground neo-shadow-sm"
                  : "bg-card text-foreground hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="space-y-3">
          {filteredProducts.length === 0 ? (
            <Card className="p-8 text-center neo-border">
              <p className="text-sm text-muted-foreground font-medium">
                Belum ada produk aktif di kategori ini.
              </p>
            </Card>
          ) : (
            filteredProducts.map((p) => {
              const inCart = cart.get(p.id);
              return (
                <Card
                  key={p.id}
                  className="neo-border neo-shadow-sm bg-card overflow-hidden hover:border-primary transition-colors"
                >
                  <CardContent className="p-3 flex gap-3 items-center">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="size-20 rounded-xl object-cover neo-border shrink-0"
                      />
                    ) : (
                      <div className="size-20 rounded-xl bg-muted neo-border flex items-center justify-center shrink-0">
                        <Utensils className="size-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-black truncate">{p.name}</h3>
                      </div>
                      {p.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {p.description}
                        </p>
                      )}
                      <p className="text-sm font-black text-primary mt-1">
                        Rp {p.price.toLocaleString("id-ID")}
                      </p>
                    </div>

                    {/* Add / Qty Control */}
                    <div className="shrink-0">
                      {inCart ? (
                        <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl neo-border">
                          <button
                            onClick={() => updateQuantity(p.id, -1)}
                            className="size-7 rounded-lg bg-card neo-border flex items-center justify-center font-bold"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="font-black text-xs px-1">
                            {inCart.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(p.id, 1)}
                            className="size-7 rounded-lg bg-primary text-primary-foreground neo-border flex items-center justify-center font-bold"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => addToCart(p)}
                          className="neo-border font-bold text-xs bg-primary text-primary-foreground"
                        >
                          <Plus className="size-3.5 mr-1" /> Tambah
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>

      {/* Floating Bottom Cart Bar */}
      {totalItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border p-3 neo-shadow">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">
                {totalItemCount} Menu Dipilih
              </p>
              <p className="text-base font-black text-primary">
                Rp {grandTotal.toLocaleString("id-ID")}
              </p>
            </div>
            <Button
              onClick={() => setIsCartOpen(true)}
              className="neo-border neo-shadow font-black bg-primary text-primary-foreground hover:bg-primary/90 px-5"
            >
              <ShoppingBag className="size-4 mr-2" />
              Lihat Pesanan
            </Button>
          </div>
        </div>
      )}

      {/* Cart & Checkout Drawer Modal */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-lg neo-border neo-shadow max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Receipt className="size-5 text-primary" /> Pesanan {tableData.tableNo}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Customer Name Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Nama Pemesan (Opsional)</Label>
              <Input
                placeholder="Contoh: Pak Budi / Rina"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="neo-border text-sm"
              />
            </div>

            {/* List of Items */}
            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold text-muted-foreground">Rincian Menu:</p>
              {cartItems.map((c) => (
                <div
                  key={c.item.id}
                  className="p-3 bg-muted/40 rounded-xl neo-border space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm">{c.item.name}</h4>
                      <p className="text-xs text-primary font-bold">
                        Rp {(c.item.price * c.quantity).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-card p-1 rounded-lg neo-border">
                      <button
                        onClick={() => updateQuantity(c.item.id, -1)}
                        className="size-6 rounded bg-muted flex items-center justify-center font-bold"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="font-black text-xs px-1.5">
                        {c.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(c.item.id, 1)}
                        className="size-6 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                  </div>
                  <Input
                    placeholder="Catatan menu (misal: pedas sedang, es sedikit)"
                    value={c.notes}
                    onChange={(e) => updateItemNotes(c.item.id, e.target.value)}
                    className="text-xs bg-card neo-border h-8"
                  />
                </div>
              ))}
            </div>

            {/* Summary Breakdown */}
            <div className="p-3 bg-card rounded-xl neo-border space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold">Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              {serviceRate > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Biaya Layanan ({serviceRate}%)</span>
                  <span className="font-bold">Rp {serviceCharge.toLocaleString("id-ID")}</span>
                </div>
              )}
              {taxRate > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pajak ({storeData?.taxType} {taxRate}%)</span>
                  <span className="font-bold">Rp {taxAmount.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border font-black text-sm">
                <span>Total Estimasi</span>
                <span className="text-primary">Rp {grandTotal.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border flex flex-col gap-2">
            <Button
              disabled={submitting}
              onClick={handleSubmitOrder}
              className="w-full neo-border neo-shadow font-black bg-primary text-primary-foreground hover:bg-primary/90 h-11"
            >
              {submitting ? "Mengirim Pesanan..." : "Kirim Pesanan ke Dapur & Kasir"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsCartOpen(false)}
              className="w-full neo-border font-bold text-xs"
            >
              Kembali Pilih Menu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
