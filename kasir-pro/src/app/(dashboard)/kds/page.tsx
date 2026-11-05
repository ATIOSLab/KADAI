"use client";

import { useEffect, useState, useRef } from "react";
import { soundEffects } from "@/lib/audio-effects";
import {
  ChefHat,
  Coffee,
  Clock,
  CheckCircle2,
  Flame,
  RefreshCw,
  Bell,
  Volume2,
  UtensilsCrossed,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface KDSItemSnapshot {
  productId: string;
  name: string;
  quantity: number;
  unit: string;
  station: string;
  notes: string | null;
}

interface KDSOrder {
  id: string;
  saleId: string;
  station: string;
  status: "QUEUED" | "COOKING" | "READY" | "SERVED" | "CANCELED";
  itemsJson: KDSItemSnapshot[];
  notes: string | null;
  tableNo: string | null;
  orderType: string;
  queuedAt: string;
  startedAt: string | null;
  readyAt: string | null;
  sale: {
    invoiceNumber: string;
    customerName: string | null;
    outletId?: string | null;
    outlet?: {
      id: string;
      name: string;
      code: string;
    } | null;
  };
}

export default function KDSPage() {
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [activeStation, setActiveStation] = useState<"ALL" | "KITCHEN" | "BAR">("ALL");
  const [cockpitMode, setCockpitMode] = useState(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const prevOrderCountRef = useRef<number | null>(null);

  // Polling every second for timers and every 6 seconds for new orders
  useEffect(() => {
    setCurrentTime(Date.now());
    const timerInterval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timerInterval);
  }, []);

  // Fetch outlets once
  useEffect(() => {
    fetch("/api/outlets")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setOutlets(d.data);
      })
      .catch(() => {});
  }, []);

  const fetchOrders = async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      const outletParam = selectedOutletId !== "ALL" ? `&outletId=${selectedOutletId}` : "";
      const res = await fetch(`/api/kds?station=${activeStation}${outletParam}`);
      const data = await res.json();
      if (res.ok) {
        const newOrders: KDSOrder[] = data.data || [];
        if (prevOrderCountRef.current !== null && newOrders.length > prevOrderCountRef.current) {
          soundEffects.playKitchenChime();
        }
        prevOrderCountRef.current = newOrders.length;
        setOrders(newOrders);
      }
    } catch {
      if (!quiet) toast.error("Gagal memperbarui antrean dapur");
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 6000);
    return () => clearInterval(interval);
  }, [activeStation, selectedOutletId]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/kds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Tiket berhasil diubah ke ${newStatus}`);
        fetchOrders(true);
      } else {
        toast.error("Gagal mengubah status");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    }
  };

  const getElapsedTime = (queuedAtStr: string) => {
    const diffSec = Math.max(0, Math.floor((currentTime - new Date(queuedAtStr).getTime()) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getElapsedMinutes = (queuedAtStr: string) => {
    return Math.floor((currentTime - new Date(queuedAtStr).getTime()) / 60000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <ChefHat className="size-7 text-primary" /> Kitchen Display System (KDS)
          </h1>
          <p className="text-sm text-muted-foreground">
            Layar antrean pesanan real-time untuk Dapur Makanan & Bar Minuman.
          </p>
        </div>

        {/* Station Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {outlets.length > 0 && (
            <div className="w-44">
              <Select value={selectedOutletId} onValueChange={setSelectedOutletId}>
                <SelectTrigger className="h-9 text-xs font-bold">
                  <SelectValue placeholder="Pilih Cabang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Cabang</SelectItem>
                  {outlets.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex bg-muted p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveStation("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeStation === "ALL"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semua Stasiun
            </button>
            <button
              onClick={() => setActiveStation("KITCHEN")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeStation === "KITCHEN"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Flame className="size-3.5 text-primary" /> Dapur
            </button>
            <button
              onClick={() => setActiveStation("BAR")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeStation === "BAR"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Coffee className="size-3.5 text-amber-600" /> Bar
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setCockpitMode(!cockpitMode)}
            className="text-xs font-bold"
            title="Ubah Mode Layar"
          >
            {cockpitMode ? "🌙 Cockpit Dapur" : "☀️ Mode Terang"}
          </Button>

          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              soundEffects.playKitchenChime();
              toast.info("Lonceng dapur berbunyi");
            }}
            className="size-8 text-amber-500 hover:text-amber-400"
            title="Tes Suara Lonceng Dapur"
          >
            <Volume2 className="size-4" />
          </Button>

          <Button
            size="icon"
            variant="outline"
            onClick={() => fetchOrders()}
            className="size-8"
            title="Refresh Antrean"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-64 rounded-2xl border ${cockpitMode ? "border-slate-800 bg-slate-900" : "border-border bg-card"} animate-pulse`} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card className={`border border-border shadow-sm p-16 text-center ${cockpitMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-card"}`}>
          <CheckCircle2 className="size-16 mx-auto text-emerald-600 mb-4" />
          <h3 className="text-xl font-bold">Tidak Ada Antrean Dapur</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Semua pesanan saat ini sudah siap saji atau telah diantar ke pelanggan.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {orders.map((ord) => {
            const elapsedMins = getElapsedMinutes(ord.queuedAt);
            const isLate = elapsedMins >= 15;
            const isWarning = elapsedMins >= 10 && elapsedMins < 15;

            const timerBg = isLate
              ? "bg-destructive text-destructive-foreground animate-pulse"
              : isWarning
              ? "bg-amber-100 text-amber-900 border-amber-300"
              : cockpitMode
              ? "bg-slate-800 text-slate-200 border-slate-700"
              : "bg-muted text-foreground";

            const stationBadgeBg =
              ord.station === "BAR"
                ? "bg-slate-800 text-white"
                : "bg-primary text-primary-foreground";

            return (
              <Card
                key={ord.id}
                className={`border shadow-sm flex flex-col justify-between overflow-hidden transition-all ${
                  cockpitMode
                    ? "bg-slate-900 border-slate-800 text-slate-100 shadow-lg"
                    : "bg-card border-border"
                }`}
              >
                {/* Header */}
                <div className={`p-4 border-b ${cockpitMode ? "border-slate-800 bg-slate-950/60" : "border-border/60 bg-muted/20"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${stationBadgeBg}`}>
                        {ord.station === "BAR" ? "BAR" : "DAPUR"}
                      </span>
                      <h2 className={`text-xl font-black tracking-tight ${cockpitMode ? "text-white" : ""}`}>
                        {ord.tableNo || "Takeaway"}
                      </h2>
                    </div>

                    <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black neo-border flex items-center gap-1 ${timerBg}`}>
                      <Clock className="size-3.5" />
                      {getElapsedTime(ord.queuedAt)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-1.5 font-mono">
                      <span>#{ord.sale.invoiceNumber}</span>
                      {ord.sale.outlet?.name && (
                        <Badge variant="outline" className="text-[10px] font-sans font-bold">
                          {ord.sale.outlet.name}
                        </Badge>
                      )}
                    </div>
                    <span className={`font-semibold ${cockpitMode ? "text-slate-200" : "text-foreground"}`}>
                      {ord.sale.customerName || "Pelanggan"}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <CardContent className="p-4 space-y-3 flex-1">
                  {ord.itemsJson.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl neo-border flex items-start justify-between gap-3 ${
                        cockpitMode
                          ? "bg-slate-800/80 border-slate-700/60 text-slate-100"
                          : "bg-muted/40"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-primary">
                            {item.quantity}x
                          </span>
                          <span className="text-sm font-black">{item.name}</span>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-destructive font-semibold mt-1 bg-destructive/10 px-2 py-0.5 rounded inline-block">
                            ⚠️ {item.notes}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-bold text-muted-foreground">
                        {item.unit}
                      </span>
                    </div>
                  ))}

                  {ord.notes && (
                    <div className="text-xs font-medium text-muted-foreground bg-muted p-2 rounded-lg border border-border">
                      <span className="font-bold text-foreground">Catatan Nota:</span> {ord.notes}
                    </div>
                  )}
                </CardContent>

                {/* Footer Action Buttons */}
                <div className="p-4 pt-0">
                  {ord.status === "QUEUED" && (
                    <Button
                      onClick={() => updateStatus(ord.id, "COOKING")}
                      className="w-full neo-border neo-shadow font-black bg-accent-orange text-white hover:bg-accent-orange/90 h-11"
                    >
                      <Flame className="size-4 mr-2" /> Mulai Siapkan / Masak
                    </Button>
                  )}

                  {ord.status === "COOKING" && (
                    <Button
                      onClick={() => updateStatus(ord.id, "READY")}
                      className="w-full neo-border neo-shadow font-black bg-accent-success text-white hover:bg-accent-success/90 h-11"
                    >
                      <CheckCircle2 className="size-4 mr-2" /> Makanan / Minuman Siap Saji
                    </Button>
                  )}

                  {ord.status === "READY" && (
                    <Button
                      onClick={() => updateStatus(ord.id, "SERVED")}
                      variant="outline"
                      className="w-full neo-border font-black text-primary hover:bg-primary/10 h-11"
                    >
                      <UtensilsCrossed className="size-4 mr-2" /> Selesai Diantar ke Meja
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
