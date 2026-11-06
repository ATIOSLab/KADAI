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
  Gift,
  ArrowLeftRight,
  Wallet,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LeadItem {
  id: string;
  leadName: string;
  businessName: string;
  phone: string;
  status: string;
  subscriptionAmount: number;
  commissionEarned: number;
  commissionPaid?: number;
  createdAt: string;
}

interface PayoutItem {
  id: string;
  amount: number;
  status: string;
  period: string | null;
  paidAt: string | null;
  notes: string | null;
}

interface PartnerItem {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  referralCode: string;
  commissionRate: number;
  status: "ACTIVE" | "SUSPENDED";
  notes: string | null;
  createdAt: string;
  leads: LeadItem[];
  payouts: PayoutItem[];
}

export default function ReferralsAdminPage() {
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [processingPayouts, setProcessingPayouts] = useState(false);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/referrals");
      const json = await res.json();
      if (res.ok && json.success) {
        setPartners(json.data || []);
      } else {
        toast.error(json.error || "Gagal memuat data mitra referral");
      }
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleToggleStatus = async (partner: PartnerItem) => {
    const newStatus = partner.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      setUpdatingId(partner.id);
      const res = await fetch(`/api/referrals/${partner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Status mitra berhasil diubah menjadi ${newStatus}`);
        setPartners((prev) =>
          prev.map((p) => (p.id === partner.id ? { ...p, status: newStatus } : p))
        );
      } else {
        toast.error(json.error || "Gagal mengubah status mitra");
      }
    } catch {
      toast.error("Terjadi gangguan jaringan");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleProcessPayouts = async () => {
    try {
      setProcessingPayouts(true);
      const res = await fetch("/api/referrals/payouts", { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message || "Komisi bulanan berhasil diproses");
        fetchPartners();
      } else {
        toast.error(json.error || "Gagal memproses komisi bulanan");
      }
    } catch {
      toast.error("Terjadi gangguan jaringan");
    } finally {
      setProcessingPayouts(false);
    }
  };

  const getWaLink = (partner: PartnerItem) => {
    let cleanPhone = partner.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.substring(1);
    }
    const message = `Halo Kak ${partner.fullName}, terima kasih atas kontribusi Anda sebagai Mitra KADAI (Kode: *${partner.referralCode}*). Ada pembaruan komisi dan prospek baru yang terhubung ke akun referral Anda.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const totalLeads = partners.reduce((acc, p) => acc + (p.leads?.length || 0), 0);

  const formatIdr = (value: number) => `Rp ${(value || 0).toLocaleString("id-ID")}`;

  const outstandingCommission = (partner: PartnerItem) =>
    (partner.leads || []).reduce(
      (acc, lead) => acc + (Number(lead.commissionEarned) || 0) - (Number(lead.commissionPaid) || 0),
      0
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 flex items-center gap-2">
            <Gift className="size-6 text-primary" />
            <span>Mitra Referral & Afiliasi Marketing</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daftar partner pemasaran, kode referral aktif, dan pelacakan komisi bagi hasil.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleProcessPayouts}
            disabled={loading || processingPayouts}
            className="rounded-xl font-bold text-xs flex items-center gap-1.5"
          >
            <Wallet className={`size-3.5 ${processingPayouts ? "animate-pulse" : ""}`} />
            <span>{processingPayouts ? "Memproses..." : "Proses Komisi Bulanan"}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPartners}
            disabled={loading}
            className="rounded-xl font-bold text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan Data</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Mitra Terdaftar</span>
            <span className="size-8 rounded-lg bg-orange-50 flex items-center justify-center text-primary">
              <Users className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-950 mt-2">{partners.length} Mitra</div>
        </Card>

        <Card className="rounded-2xl p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Prospek Klien</span>
            <span className="size-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{totalLeads} Bisnis</div>
        </Card>

        <Card className="rounded-2xl p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Standar Komisi Berulang</span>
            <span className="size-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Wallet className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">20.0% / Bulan</div>
        </Card>
      </div>

      {/* Table */}
      <Card className="rounded-2xl bg-white border-slate-200 shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-950">
            Daftar Mitra Referral Resmi
          </CardTitle>
          <CardDescription className="text-xs">
            Pantau kode promosi, rekening pencairan komisi, dan hubungi mitra via WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {partners.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Gift className="size-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Belum ada mitra referral terdaftar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="py-3 px-4 font-bold">Waktu Daftar</th>
                    <th className="py-3 px-4 font-bold">Nama Mitra</th>
                    <th className="py-3 px-4 font-bold">Kode Referral</th>
                    <th className="py-3 px-4 font-bold">Rekening Bank</th>
                    <th className="py-3 px-4 font-bold">Prospek Klien</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Tindakan Super Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {partners.map((partner) => (
                    <tr key={partner.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(partner.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        <div className="font-bold text-slate-950">{partner.fullName}</div>
                        <div className="text-[11px] text-slate-500">{partner.phone}</div>
                        <div className="text-[10px] text-slate-400">{partner.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-primary bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
                          {partner.referralCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {partner.bankName || "—"}
                        </div>
                        <div className="font-mono text-[11px] text-slate-600">
                          {partner.bankAccountNumber || "—"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          a.n. {partner.bankAccountName || "—"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
                          {partner.leads?.length || 0} Klien
                        </span>
                        <div className="mt-1.5 space-y-0.5">
                          {outstandingCommission(partner) > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              <Wallet className="size-2.5" />
                              Komisi terhutang: {formatIdr(outstandingCommission(partner))}
                            </span>
                          )}
                          {partner.payouts?.some((p) => p.status === "PAID") && (
                            <span className="block text-[10px] font-semibold text-emerald-700">
                              ✓ {partner.payouts.filter((p) => p.status === "PAID").length} payout dibayar
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {partner.status === "ACTIVE" ? (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 text-[10px]">
                            Aktif
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200 text-[10px]">
                            Ditangguhkan
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === partner.id}
                          onClick={() => handleToggleStatus(partner)}
                          className="h-7 text-[11px] px-2.5 rounded-lg text-slate-700"
                        >
                          {partner.status === "ACTIVE" ? "Tangguhkan" : "Aktifkan"}
                        </Button>

                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] px-2.5 rounded-lg border-[#25D366] text-[#25D366] hover:bg-emerald-50 font-bold"
                        >
                          <a
                            href={getWaLink(partner)}
                            target="_blank"
                            rel="noopener noreferrer"
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
