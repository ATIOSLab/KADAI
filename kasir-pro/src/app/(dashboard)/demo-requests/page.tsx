"use client";

import { useEffect, useState } from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  MessageCircle,
  Phone,
  Store,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DemoRequestItem {
  id: string;
  fullName: string;
  businessName: string;
  businessType: string;
  phone: string;
  email: string | null;
  outletCount: number;
  notes: string | null;
  accessCode: string;
  status: "PENDING" | "APPROVED" | "CONTACTED" | "REJECTED";
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
}

export default function DemoRequestsAdminPage() {
  const [requests, setRequests] = useState<DemoRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/demo-requests");
      const json = await res.json();
      if (res.ok && json.success) {
        setRequests(json.data || []);
      } else {
        toast.error(json.error || "Gagal memuat permohonan demo");
      }
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (
    id: string,
    status: "APPROVED" | "CONTACTED" | "REJECTED"
  ) => {
    try {
      setUpdatingId(id);
      const res = await fetch(`/api/demo-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Status berhasil diperbarui menjadi ${status}`);
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...json.data } : r))
        );
      } else {
        toast.error(json.error || "Gagal memperbarui status");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setUpdatingId(null);
    }
  };

  const getWaLink = (item: DemoRequestItem) => {
    let cleanPhone = item.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.substring(1);
    }
    const message = `Halo ${item.fullName} (${item.businessName}), terima kasih atas permohonan demo sistem operasi KADAI. Kode Akses Demo Anda: *${item.accessCode}*. Anda dapat login langsung di https://kadai.asia/login?code=${item.accessCode}. Tim PT Netkrida siap mendampingi operasional Anda.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 flex items-center gap-2">
            <Users className="size-6 text-primary" />
            <span>Permohonan Demo & Prospek Klien</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daftar prospek bisnis yang mengajukan permohonan demo dan kode akses sistem KADAI.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRequests}
          disabled={loading}
          className="rounded-xl font-bold text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Segarkan Data</span>
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Permohonan</span>
            <span className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Users className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-950 mt-2">{requests.length}</div>
        </Card>

        <Card className="rounded-2xl p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Menunggu ACC</span>
            <span className="size-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {requests.filter((r) => r.status === "PENDING").length}
          </div>
        </Card>

        <Card className="rounded-2xl p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Disetujui (ACC)</span>
            <span className="size-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {requests.filter((r) => r.status === "APPROVED").length}
          </div>
        </Card>

        <Card className="rounded-2xl p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sudah Dihubungi</span>
            <span className="size-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <MessageCircle className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">
            {requests.filter((r) => r.status === "CONTACTED").length}
          </div>
        </Card>
      </div>

      {/* Leads Table */}
      <Card className="rounded-2xl bg-white border-slate-200 shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-950">
            Daftar Pengajuan Demo Masuk
          </CardTitle>
          <CardDescription className="text-xs">
            Setujui permohonan atau kirim pesan WhatsApp otomatis beserta kode akses demo.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Store className="size-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Belum ada pengajuan demo baru.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="py-3 px-4 font-bold">Waktu</th>
                    <th className="py-3 px-4 font-bold">Pemohon & Usaha</th>
                    <th className="py-3 px-4 font-bold">Kontak WhatsApp</th>
                    <th className="py-3 px-4 font-bold">Sektor / Gerai</th>
                    <th className="py-3 px-4 font-bold">Kode Akses</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Tindakan Super Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {requests.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        <div className="font-bold text-slate-950">{item.businessName}</div>
                        <div className="text-[11px] text-slate-500">{item.fullName}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-900">{item.phone}</div>
                        {item.email && (
                          <div className="text-[10px] text-slate-400">{item.email}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-700">{item.businessType}</div>
                        <div className="text-[11px] text-slate-500">{item.outletCount} Gerai</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-primary bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                          {item.accessCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.status === "PENDING" && (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 text-[10px]">
                            Menunggu ACC
                          </Badge>
                        )}
                        {item.status === "APPROVED" && (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 text-[10px]">
                            Disetujui
                          </Badge>
                        )}
                        {item.status === "CONTACTED" && (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 text-[10px]">
                            Dihubungi
                          </Badge>
                        )}
                        {item.status === "REJECTED" && (
                          <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200 text-[10px]">
                            Ditolak
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {item.status === "PENDING" && (
                          <Button
                            size="sm"
                            disabled={updatingId === item.id}
                            onClick={() => handleUpdateStatus(item.id, "APPROVED")}
                            className="h-7 text-[11px] px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          >
                            Setujui (ACC)
                          </Button>
                        )}

                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] px-2.5 rounded-lg border-[#25D366] text-[#25D366] hover:bg-emerald-50 font-bold"
                        >
                          <a
                            href={getWaLink(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              if (item.status === "PENDING") {
                                handleUpdateStatus(item.id, "CONTACTED");
                              }
                            }}
                            className="inline-flex items-center gap-1"
                          >
                            <MessageCircle className="size-3" />
                            <span>Kirim WA</span>
                          </a>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
