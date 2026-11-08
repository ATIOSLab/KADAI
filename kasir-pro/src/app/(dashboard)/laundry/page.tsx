"use client";

import { useState, useEffect } from "react";
import {
  Shirt,
  Sparkles,
  Wind,
  Flame,
  CheckCircle2,
  CheckCheck,
  Search,
  RefreshCw,
  Phone,
  Clock,
  ExternalLink,
  Loader2,
  QrCode,
  Tag,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

interface LaundryJob {
  id: string;
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
  totalAmount: number;
  downPayment: number;
  remainingAmount: number;
  customerName: string;
  customerPhone: string | null;
  outlet: { name: string } | null;
  handledBy: { name: string } | null;
}

const STAGES = [
  { id: "ALL", label: "Semua Order" },
  { id: "RECEIVED", label: "Diterima", icon: Shirt },
  { id: "WASHING", label: "Cuci", icon: Sparkles },
  { id: "DRYING", label: "Pengering", icon: Wind },
  { id: "IRONING", label: "Setrika", icon: Flame },
  { id: "READY_FOR_PICKUP", label: "Siap Ambil", icon: CheckCircle2 },
  { id: "COMPLETED", label: "Selesai", icon: CheckCheck },
];

function formatRp(val: number): string {
  return "Rp" + Math.round(val).toLocaleString("id-ID");
}

export default function LaundryDashboardPage() {
  const [jobs, setJobs] = useState<LaundryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState("ALL");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const url = new URL("/api/laundry/jobs", window.location.origin);
      if (selectedStage !== "ALL") url.searchParams.set("status", selectedStage);
      if (search.trim()) url.searchParams.set("search", search.trim());

      const res = await fetch(url.toString());
      const json = await res.json();
      if (res.ok && json.success) {
        setJobs(json.data);
      }
    } catch {
      toast.error("Gagal memuat antrean laundry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [selectedStage]);

  const handleUpdateStatus = async (id: string, nextStatus: string, nextRack?: string) => {
    try {
      setUpdatingId(id);
      const res = await fetch("/api/laundry/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: nextStatus,
          rackLocation: nextRack,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memperbarui status");

      toast.success(`Status berhasil diperbarui: ${nextStatus}`);
      fetchJobs();
    } catch (err: any) {
      toast.error(err?.message || "Terjadi kesalahan");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Antrean & Stasiun Laundry"
        eyebrow="Operasional & Transaksi"
        description="Monitor status pencucian, dryer, setrika uap, dan rak siap ambil secara terintegrasi."
        icon={Shirt}
      >
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-slate-300 font-bold text-xs h-9 gap-1.5"
          onClick={fetchJobs}
          disabled={loading}
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Segarkan Data</span>
        </Button>
      </PageHeader>

      {/* Filter Stages Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 sm:pb-0 scrollbar-none">
          {STAGES.map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStage(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedStage === st.id
                  ? "bg-slate-950 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchJobs()}
            placeholder="Cari resi / nama / nomor WA..."
            className="pl-9 h-9 text-xs rounded-xl border-slate-200"
          />
        </div>
      </div>

      {/* Grid of Job Cards */}
      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="size-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground font-semibold">Memuat antrean pekerjaan...</p>
        </div>
      ) : jobs.length === 0 ? (
        <Card className="rounded-3xl border border-slate-200 p-12 text-center bg-white">
          <Shirt className="size-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 text-sm">Belum Ada Pekerjaan Laundry</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Order laundry yang dibuat melalui kasir POS akan otomatis muncul di stasiun pengerjaan ini.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => {
            const isUpdating = updatingId === job.id;

            return (
              <Card
                key={job.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar Card */}
                  <div className="p-4 pb-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-slate-950">
                          {job.jobCode}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold border-slate-300 bg-white"
                        >
                          {job.serviceType === "KILOAN" ? "Kiloan" : "Satuan"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Diterima: {new Date(job.receivedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    <Button
                      asChild
                      variant="ghost"
                      size="icon-sm"
                      className="size-7 rounded-lg text-slate-500 hover:text-slate-900"
                      title="Buka Halaman Lacak Mandiri Pelanggan"
                    >
                      <Link href={`/lacak/${job.trackingToken}`} target="_blank">
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </Button>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3 text-xs">
                    {/* Customer Info */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-sm text-slate-900">{job.customerName}</p>
                        {job.customerPhone && (
                          <a
                            href={`https://wa.me/${job.customerPhone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-medium text-emerald-700 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Phone className="size-3" />
                            <span>{job.customerPhone}</span>
                          </a>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="font-black text-sm text-slate-950">
                          {formatRp(job.totalAmount)}
                        </span>
                        <p className="text-[10px] font-bold text-emerald-700">
                          {job.remainingAmount === 0 ? "Lunas" : `Sisa ${formatRp(job.remainingAmount)}`}
                        </p>
                      </div>
                    </div>

                    {/* Operational Details */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Berat / Item:</span>
                        <strong className="font-bold">
                          {job.weightKg ? `${job.weightKg} kg` : job.itemCount ? `${job.itemCount} potong` : "-"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Lokasi Rak:</span>
                        <strong className="font-bold text-primary">
                          {job.rackLocation || "Belum dialokasikan"}
                        </strong>
                      </div>
                    </div>

                    {job.specialNotes && (
                      <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-200/60 text-[11px] text-amber-900">
                        <strong>Catatan:</strong> {job.specialNotes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Per Status */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-100">
                  {job.status === "RECEIVED" && (
                    <Button
                      size="sm"
                      className="w-full h-9 rounded-xl font-bold text-xs bg-primary text-white shadow-xs"
                      onClick={() => handleUpdateStatus(job.id, "WASHING")}
                      disabled={isUpdating}
                    >
                      <Sparkles className="size-3.5 mr-1.5" /> Masukkan ke Mesin Cuci
                    </Button>
                  )}

                  {job.status === "WASHING" && (
                    <Button
                      size="sm"
                      className="w-full h-9 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                      onClick={() => handleUpdateStatus(job.id, "DRYING")}
                      disabled={isUpdating}
                    >
                      <Wind className="size-3.5 mr-1.5" /> Pindahkan ke Dryer
                    </Button>
                  )}

                  {job.status === "DRYING" && (
                    <Button
                      size="sm"
                      className="w-full h-9 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                      onClick={() => handleUpdateStatus(job.id, "IRONING")}
                      disabled={isUpdating}
                    >
                      <Flame className="size-3.5 mr-1.5" /> Mulai Setrika Uap
                    </Button>
                  )}

                  {job.status === "IRONING" && (
                    <Button
                      size="sm"
                      className="w-full h-9 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      onClick={() => handleUpdateStatus(job.id, "READY_FOR_PICKUP", "Rak A-01")}
                      disabled={isUpdating}
                    >
                      <CheckCircle2 className="size-3.5 mr-1.5" /> Siap Ambil (Simpan di Rak)
                    </Button>
                  )}

                  {job.status === "READY_FOR_PICKUP" && (
                    <Button
                      size="sm"
                      className="w-full h-9 rounded-xl font-bold text-xs bg-slate-950 text-white shadow-xs"
                      onClick={() => handleUpdateStatus(job.id, "COMPLETED")}
                      disabled={isUpdating}
                    >
                      <CheckCheck className="size-3.5 mr-1.5" /> Serahkan ke Pelanggan (Selesai)
                    </Button>
                  )}

                  {job.status === "COMPLETED" && (
                    <div className="text-center py-1 text-[11px] font-bold text-emerald-700 flex items-center justify-center gap-1">
                      <CheckCheck className="size-3.5" /> Pakaian Telah Diambil
                    </div>
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
