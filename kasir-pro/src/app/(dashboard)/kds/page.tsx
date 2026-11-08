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
  Volume2,
  UtensilsCrossed,
  Columns,
  LayoutGrid,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  const [viewMode, setViewMode] = useState<"kanban" | "grid">("kanban");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const prevOrderCountRef = useRef<number | null>(null);

  useEffect(() => {
    setCurrentTime(Date.now());
    const timerInterval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timerInterval);
  }, []);

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
        if (newStatus === "READY") {
          soundEffects.playKitchenChime();
        }
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

  const queuedOrders = orders.filter((o) => o.status === "QUEUED");
  const cookingOrders = orders.filter((o) => o.status === "COOKING");
  const readyOrders = orders.filter((o) => o.status === "READY");
  const lateOrders = orders.filter((o) => getElapsedMinutes(o.queuedAt) >= 15);

  const renderOrderCard = (ord: KDSOrder) => {
    const elapsedMins = getElapsedMinutes(ord.queuedAt);
    const isLate = elapsedMins >= 15;
    const isWarning = elapsedMins >= 10 && elapsedMins < 15;

    const timerBg = isLate
      ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
      : isWarning
      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
      : cockpitMode
      ? "bg-slate-800/80 text-slate-300 border-slate-700/60"
      : "bg-slate-100 text-slate-700 border-slate-200";

    const stationBadge =
      ord.station === "BAR" ? (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
          BAR
        </span>
      ) : (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-[#FB923C] border border-orange-500/30">
          DAPUR
        </span>
      );

    return (
      <Card
        key={ord.id}
        className={`flex flex-col justify-between overflow-hidden transition-all border rounded-2xl ${
          cockpitMode
            ? "bg-[#161A18]/90 border-white/10 hover:border-white/20 text-slate-100 shadow-xl"
            : "bg-white border-slate-200 shadow-sm"
        }`}
      >
        <div
          className={`p-3.5 border-b ${
            cockpitMode
              ? "border-white/5 bg-white/[0.02]"
              : "border-slate-100 bg-slate-50/70"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {stationBadge}
              <h3 className="text-lg font-black tracking-tight truncate">
                {ord.tableNo || "Takeaway"}
              </h3>
            </div>

            <div
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border flex items-center gap-1 shrink-0 ${timerBg}`}
            >
              <Clock className="size-3" />
              <span>{getElapsedTime(ord.queuedAt)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
            <span className="truncate">#{ord.sale.invoiceNumber}</span>
            <span
              className={`font-sans font-semibold truncate ${
                cockpitMode ? "text-slate-300" : "text-slate-700"
              }`}
            >
              {ord.sale.customerName || "Pelanggan"}
            </span>
          </div>
        </div>

        <CardContent className="p-3.5 space-y-2 flex-1">
          {ord.itemsJson.map((item, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-xl flex items-start justify-between gap-2 border ${
                cockpitMode
                  ? "bg-white/[0.03] border-white/5 text-slate-100"
                  : "bg-slate-50/80 border-slate-200/80 text-slate-900"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-[#EA580C] shrink-0">
                    {item.quantity}x
                  </span>
                  <span className="text-xs font-bold leading-tight truncate">
                    {item.name}
                  </span>
                </div>
                {item.notes && (
                  <p className="text-[10px] text-rose-400 font-semibold mt-0.5 bg-rose-500/10 px-1.5 py-0.5 rounded inline-block">
                    ⚠️ {item.notes}
                  </p>
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                {item.unit}
              </span>
            </div>
          ))}

          {ord.notes && (
            <div
              className={`text-[11px] p-2 rounded-xl border ${
                cockpitMode
                  ? "bg-white/[0.02] border-white/5 text-slate-300"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              <strong className="text-primary font-bold">Catatan:</strong> {ord.notes}
            </div>
          )}
        </CardContent>

        <div className="p-3 pt-0">
          {ord.status === "QUEUED" && (
            <Button
              onClick={() => updateStatus(ord.id, "COOKING")}
              className="w-full font-bold text-xs h-10 rounded-xl bg-gradient-to-r from-[#EA580C] to-[#FB923C] text-white hover:brightness-110 shadow-md transition-all active:scale-[0.98]"
            >
              <Flame className="size-3.5 mr-1.5" /> Mulai Masak / Siapkan
            </Button>
          )}

          {ord.status === "COOKING" && (
            <Button
              onClick={() => updateStatus(ord.id, "READY")}
              className="w-full font-bold text-xs h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:brightness-110 shadow-md transition-all active:scale-[0.98]"
            >
              <CheckCircle2 className="size-3.5 mr-1.5" /> Siap Saji (Ready)
            </Button>
          )}

          {ord.status === "READY" && (
            <Button
              onClick={() => updateStatus(ord.id, "SERVED")}
              variant="outline"
              className={`w-full font-bold text-xs h-10 rounded-xl transition-all active:scale-[0.98] ${
                cockpitMode
                  ? "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                  : "border-emerald-500 text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <UtensilsCrossed className="size-3.5 mr-1.5" /> Selesai Diantar ke Meja
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div
      className={`min-h-[calc(100vh-6rem)] p-4 sm:p-6 rounded-3xl transition-colors space-y-6 ${
        cockpitMode ? "bg-[#0F1311] text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-9 rounded-xl bg-[#EA580C]/20 border border-[#EA580C]/30 flex items-center justify-center text-[#FB923C]">
              <ChefHat className="size-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight">Kitchen Display System (KDS)</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Layar alur masak dapur & bar real-time berstandar enterprise pipeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {outlets.length > 0 && (
            <div className="w-40 sm:w-44">
              <Select value={selectedOutletId} onValueChange={setSelectedOutletId}>
                <SelectTrigger
                  className={`h-9 text-xs font-bold rounded-xl ${
                    cockpitMode
                      ? "bg-white/[0.04] border-white/10 text-white"
                      : "bg-white border-slate-200"
                  }`}
                >
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

          <div
            className={`flex p-1 rounded-xl border ${
              cockpitMode ? "bg-white/[0.04] border-white/10" : "bg-white border-slate-200"
            }`}
          >
            <button
              onClick={() => setActiveStation("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeStation === "ALL"
                  ? "bg-[#EA580C] text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setActiveStation("KITCHEN")}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeStation === "KITCHEN"
                  ? "bg-[#EA580C] text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Flame className="size-3" /> Dapur
            </button>
            <button
              onClick={() => setActiveStation("BAR")}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeStation === "BAR"
                  ? "bg-[#EA580C] text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Coffee className="size-3" /> Bar
            </button>
          </div>

          <div
            className={`flex p-1 rounded-xl border ${
              cockpitMode ? "bg-white/[0.04] border-white/10" : "bg-white border-slate-200"
            }`}
          >
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === "kanban"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Tampilan Kanban Pipeline"
            >
              <Columns className="size-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === "grid"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Tampilan Grid Standard"
            >
              <LayoutGrid className="size-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setCockpitMode(!cockpitMode)}
            className={`h-9 px-3 rounded-xl text-xs font-bold ${
              cockpitMode
                ? "bg-white/[0.04] border-white/10 text-white hover:bg-white/10"
                : "border-slate-300"
            }`}
          >
            {cockpitMode ? "🌙 Dark Cockpit" : "☀️ Mode Terang"}
          </Button>

          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              soundEffects.playKitchenChime();
              toast.info("Lonceng dapur berbunyi");
            }}
            className={`size-9 rounded-xl ${
              cockpitMode
                ? "bg-white/[0.04] border-white/10 text-amber-400 hover:bg-white/10"
                : "text-amber-600 border-slate-300"
            }`}
            title="Tes Suara Lonceng Dapur"
          >
            <Volume2 className="size-4" />
          </Button>

          <Button
            size="icon"
            variant="outline"
            onClick={() => fetchOrders()}
            className={`size-9 rounded-xl ${
              cockpitMode
                ? "bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/10"
                : "border-slate-300"
            }`}
            title="Refresh Antrean"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          className={`p-3.5 rounded-2xl border transition-all ${
            cockpitMode
              ? "bg-[#161A18]/80 border-white/5 text-slate-100 shadow-md"
              : "bg-white border-slate-200 text-slate-900 shadow-xs"
          }`}
        >
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Antrean Masuk
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black tabular-nums">{queuedOrders.length}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300">
              Menunggu
            </span>
          </div>
        </div>

        <div
          className={`p-3.5 rounded-2xl border transition-all ${
            cockpitMode
              ? "bg-[#161A18]/80 border-white/5 text-slate-100 shadow-md"
              : "bg-white border-slate-200 text-slate-900 shadow-xs"
          }`}
        >
          <div className="text-[11px] font-bold text-[#FB923C] uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="size-3 text-[#EA580C]" /> Sedang Dimasak
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black tabular-nums text-[#FB923C]">
              {cookingOrders.length}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-[#FB923C]">
              Proses Dapur
            </span>
          </div>
        </div>

        <div
          className={`p-3.5 rounded-2xl border transition-all ${
            cockpitMode
              ? "bg-[#161A18]/80 border-white/5 text-slate-100 shadow-md"
              : "bg-white border-slate-200 text-slate-900 shadow-xs"
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="size-3 text-emerald-400" /> Siap Saji
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black tabular-nums text-emerald-400">
              {readyOrders.length}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
              Siap Antar
            </span>
          </div>
        </div>

        <div
          className={`p-3.5 rounded-2xl border transition-all ${
            cockpitMode
              ? "bg-[#161A18]/80 border-white/5 text-slate-100 shadow-md"
              : "bg-white border-slate-200 text-slate-900 shadow-xs"
          }`}
        >
          <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="size-3 text-rose-400" /> Terlambat (&gt;15m)
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span
              className={`text-2xl font-black tabular-nums ${
                lateOrders.length > 0 ? "text-rose-400 animate-pulse" : ""
              }`}
            >
              {lateOrders.length}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                lateOrders.length > 0
                  ? "bg-rose-500/20 text-rose-300"
                  : "bg-slate-500/10 text-slate-400"
              }`}
            >
              {lateOrders.length > 0 ? "Prioritas!" : "Aman"}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-96 rounded-3xl border animate-pulse ${
                cockpitMode ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-white"
              }`}
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card
          className={`border p-16 text-center rounded-3xl ${
            cockpitMode
              ? "bg-[#161A18]/80 border-white/10 text-slate-100 shadow-xl"
              : "bg-white border-slate-200 shadow-xs"
          }`}
        >
          <CheckCircle2 className="size-16 mx-auto text-emerald-500 mb-4 animate-bounce" />
          <h3 className="text-xl font-bold">Semua Antrean Dapur Selesai</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Tidak ada pesanan aktif saat ini. Pesanan baru dari kasir POS akan muncul otomatis di sini disertai denting lonceng dapur.
          </p>
        </Card>
      ) : viewMode === "kanban" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div
            className={`rounded-3xl p-4 border space-y-3.5 transition-all ${
              cockpitMode
                ? "bg-white/[0.02] border-white/5"
                : "bg-slate-100/70 border-slate-200/80"
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/5 px-1">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-slate-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  1. Antrean Baru
                </h4>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono font-bold">
                {queuedOrders.length}
              </Badge>
            </div>

            <div className="space-y-3 min-h-[300px]">
              {queuedOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 rounded-2xl border border-dashed border-white/5">
                  Kosong
                </div>
              ) : (
                queuedOrders.map(renderOrderCard)
              )}
            </div>
          </div>

          <div
            className={`rounded-3xl p-4 border space-y-3.5 transition-all ${
              cockpitMode
                ? "bg-white/[0.02] border-white/5"
                : "bg-slate-100/70 border-slate-200/80"
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/5 px-1">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#EA580C] animate-pulse" />
                <h4 className="text-xs font-black uppercase tracking-wider text-[#FB923C]">
                  2. Sedang Dimasak
                </h4>
              </div>
              <Badge
                variant="outline"
                className="text-[11px] font-mono font-bold border-orange-500/30 text-[#FB923C]"
              >
                {cookingOrders.length}
              </Badge>
            </div>

            <div className="space-y-3 min-h-[300px]">
              {cookingOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 rounded-2xl border border-dashed border-white/5">
                  Tidak ada yang sedang dimasak
                </div>
              ) : (
                cookingOrders.map(renderOrderCard)
              )}
            </div>
          </div>

          <div
            className={`rounded-3xl p-4 border space-y-3.5 transition-all ${
              cockpitMode
                ? "bg-white/[0.02] border-white/5"
                : "bg-slate-100/70 border-slate-200/80"
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/5 px-1">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  3. Siap Saji (Ready)
                </h4>
              </div>
              <Badge
                variant="outline"
                className="text-[11px] font-mono font-bold border-emerald-500/30 text-emerald-300"
              >
                {readyOrders.length}
              </Badge>
            </div>

            <div className="space-y-3 min-h-[300px]">
              {readyOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 rounded-2xl border border-dashed border-white/5">
                  Belum ada pesanan siap saji
                </div>
              ) : (
                readyOrders.map(renderOrderCard)
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {orders.map(renderOrderCard)}
        </div>
      )}
    </div>
  );
}
