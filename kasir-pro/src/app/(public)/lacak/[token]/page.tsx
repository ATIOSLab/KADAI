"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Shirt,
  Wind,
  Flame,
  CheckCheck,
  ShoppingBag,
  MapPin,
  Calendar,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Phone,
} from "lucide-react";
import { KadaiLockup } from "@/components/shared/kadai-logo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TrackingData {
  jobCode: string;
  trackingToken: string;
  serviceType: string;
  status: string;
  paymentStatus: string;
  weightKg: number | null;
  itemCount: number | null;
  fragrance: string | null;
  rackLocation: string | null;
  specialNotes: string | null;
  estimatedDoneAt: string;
  receivedAt: string;
  washedAt: string | null;
  driedAt: string | null;
  ironedAt: string | null;
  readyAt: string | null;
  pickedUpAt: string | null;
  totalAmount: number;
  downPayment: number;
  remainingAmount: number;
  customerName: string;
  customerPhone: string | null;
  outlet: {
    name: string;
    address: string | null;
    phone: string | null;
  } | null;
  invoiceNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }>;
}

const STEPS = [
  { key: "RECEIVED", label: "Diterima", icon: Shirt, desc: "Cucian masuk & ditimbang" },
  { key: "WASHING", label: "Pencucian", icon: Sparkles, desc: "Proses cuci higienis" },
  { key: "DRYING", label: "Pengeringan", icon: Wind, desc: "Mesin dryer suhu presisi" },
  { key: "IRONING", label: "Setrika Uap", icon: Flame, desc: "Pelicinan & parfum anti-bakteri" },
  { key: "READY_FOR_PICKUP", label: "Siap Ambil", icon: CheckCircle2, desc: "Tersusun rapi di rak" },
  { key: "COMPLETED", label: "Selesai", icon: CheckCheck, desc: "Telah diambil pelanggan" },
];

function getStepIndex(status: string): number {
  const map: Record<string, number> = {
    RECEIVED: 0,
    WASHING: 1,
    DRYING: 2,
    IRONING: 3,
    READY_FOR_PICKUP: 4,
    COMPLETED: 5,
  };
  return map[status] ?? 0;
}

function formatRp(val: number): string {
  return "Rp" + Math.round(val).toLocaleString("id-ID");
}

export default function LaundryTrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/laundry/track?token=${token}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Gagal memuat status pelacakan");
        }
        setData(json.data);
      } catch (err: any) {
        setError(err?.message || "Nomor resi tidak ditemukan");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="size-8 animate-spin text-primary mb-3" />
        <p className="text-xs font-semibold text-slate-600">Memeriksa status cucian Anda...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="size-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="size-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-950">Resi Tidak Ditemukan</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {error || "Nomor resi atau kode QR pelacakan tidak valid. Silakan periksa kembali struk laundry Anda."}
          </p>
          <Button asChild className="rounded-xl font-bold text-xs h-10 bg-primary text-white">
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentStep = getStepIndex(data.status);
  const isReady = data.status === "READY_FOR_PICKUP";
  const isCompleted = data.status === "COMPLETED";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 antialiased">
      {/* Brand Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-2xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <KadaiLockup variant="on-light" height={26} />
          </Link>
          <Badge
            variant="outline"
            className="text-[11px] font-mono font-bold border-slate-300 text-slate-800 bg-slate-100"
          >
            {data.jobCode}
          </Badge>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-5">
        {/* Status Highlight Banner */}
        <div className={`p-5 rounded-3xl border shadow-sm ${
          isReady
            ? "bg-emerald-500 text-white border-emerald-600"
            : isCompleted
              ? "bg-slate-900 text-white border-slate-950"
              : "bg-white text-slate-950 border-slate-200"
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${
                isReady || isCompleted ? "text-white/80" : "text-primary"
              }`}>
                {isCompleted
                  ? "PESANAN SELESAI"
                  : isReady
                    ? "SIAP DIAMBIL DI GERAI"
                    : "SEDANG DALAM PENGERJAAN"}
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Halo, {data.customerName}!
              </h1>
              <p className={`text-xs mt-1 leading-relaxed ${
                isReady || isCompleted ? "text-white/90" : "text-slate-600"
              }`}>
                {isCompleted
                  ? "Cucian Anda telah selesai dan berhasil diambil. Terima kasih atas kepercayaan Anda!"
                  : isReady
                    ? `Cucian sudah wangi, bersih, dan tersusun di ${data.rackLocation || "Rak Siap Ambil"}. Silakan datang ke gerai untuk pengambilan.`
                    : "Pakaian Anda sedang kami proses dengan standar kebersihan tertinggi."}
              </p>
            </div>
            {isReady && (
              <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="size-7 text-white" />
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          <div className={`mt-4 pt-4 border-t grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs ${
            isReady || isCompleted ? "border-white/20" : "border-slate-100"
          }`}>
            <div>
              <span className={`text-[10px] block ${isReady || isCompleted ? "text-white/70" : "text-muted-foreground"}`}>
                Layanan
              </span>
              <strong className="font-bold">
                {data.serviceType === "KILOAN" ? "Laundry Kiloan" : "Cuci Satuan"}
                {data.weightKg ? ` (${data.weightKg} kg)` : data.itemCount ? ` (${data.itemCount} item)` : ""}
              </strong>
            </div>

            <div>
              <span className={`text-[10px] block ${isReady || isCompleted ? "text-white/70" : "text-muted-foreground"}`}>
                Estimasi Selesai
              </span>
              <strong className="font-bold">
                {new Date(data.estimatedDoneAt).toLocaleDateString("id-ID", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <span className={`text-[10px] block ${isReady || isCompleted ? "text-white/70" : "text-muted-foreground"}`}>
                Status Tagihan
              </span>
              <strong className="font-bold">
                {data.remainingAmount === 0 ? (
                  <span className={isReady || isCompleted ? "text-white font-black" : "text-emerald-700 font-black"}>
                    LUNAS
                  </span>
                ) : (
                  <span className={isReady || isCompleted ? "text-amber-200 font-black" : "text-amber-700 font-black"}>
                    Sisa: {formatRp(data.remainingAmount)}
                  </span>
                )}
              </strong>
            </div>
          </div>
        </div>

        {/* Realtime Progress Steps Timeline */}
        <Card className="rounded-3xl border border-slate-200 bg-white shadow-xs p-5 sm:p-6">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-1.5">
            <Clock className="size-4 text-primary" />
            <span>Alur Pengerjaan Cucian</span>
          </h2>

          <div className="space-y-4">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div key={step.key} className="flex items-start gap-3.5 relative">
                  {idx < STEPS.length - 1 && (
                    <div className={`absolute left-4 top-8 bottom-0 w-0.5 -ml-[1px] ${
                      isPast ? "bg-primary" : "bg-slate-200"
                    }`} />
                  )}

                  <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    isPast
                      ? "bg-primary text-white shadow-xs"
                      : isCurrent
                        ? "bg-primary text-white ring-4 ring-primary/20 animate-pulse shadow-xs"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}>
                    <Icon className="size-4" />
                  </div>

                  <div className="flex-1 pb-3">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-bold ${
                        isCurrent
                          ? "text-primary text-sm font-black"
                          : isPast
                            ? "text-slate-900"
                            : "text-slate-400"
                      }`}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                          Tahap Aktif
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Detail Order & Rincian Item */}
        <Card className="rounded-3xl border border-slate-200 bg-white shadow-xs p-5 space-y-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Rincian Nota & Pembayaran
          </h2>

          <div className="divide-y divide-slate-100 text-xs">
            {data.items.map((it, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">{it.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {it.quantity} {it.unit} x {formatRp(it.unitPrice)}
                  </p>
                </div>
                <span className="font-bold text-slate-950 font-mono">
                  {formatRp(it.totalPrice)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Total Biaya</span>
              <span className="font-mono">{formatRp(data.totalAmount)}</span>
            </div>
            {data.downPayment > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Uang Muka (DP Diterima)</span>
                <span className="font-mono">-{formatRp(data.downPayment)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-200 text-slate-950">
              <span>Sisa yang Harus Dibayar</span>
              <span className="font-mono text-primary">
                {data.remainingAmount > 0 ? formatRp(data.remainingAmount) : "LUNAS"}
              </span>
            </div>
          </div>
        </Card>

        {/* Gerai Outlet Info */}
        {data.outlet && (
          <Card className="rounded-3xl border border-slate-200 bg-white shadow-xs p-4 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                <MapPin className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-slate-950">{data.outlet.name}</p>
                <p className="text-[11px] text-muted-foreground">{data.outlet.address || "Lokasi Gerai KADAI"}</p>
              </div>
            </div>

            {data.outlet.phone && (
              <Button asChild size="sm" variant="outline" className="h-8 text-xs font-bold rounded-xl border-slate-300">
                <a href={`https://wa.me/${data.outlet.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                  <Phone className="size-3.5 mr-1" /> Hubungi
                </a>
              </Button>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
