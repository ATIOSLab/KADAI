"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Clock,
  Receipt,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/stat-card";
import { apiFetch } from "@/lib/api";
import { TIER_LABELS, CYCLE_MONTHS, cyclePrice } from "@/lib/pricing";
import { Skeleton } from "@/components/ui/skeleton";

interface SubscriptionSummary {
  storeId: string;
  storeName: string;
  businessType: string;
  storeTier: string;
  createdAt: string;
  userCount: number;
  outletCount: number;
  subscription: {
    id: string;
    tier: string;
    cycle: string;
    status: string;
    startedAt: string | null;
    expiresAt: string | null;
  } | null;
  daysRemaining: number | null;
  pendingInvoiceCount: number;
  pendingInvoiceAmount: number;
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PAST_DUE: "bg-amber-50 text-amber-700 border-amber-200",
  EXPIRED: "bg-rose-50 text-rose-700 border-rose-200",
  CANCELLED: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function PlatformDashboardPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch<{ data: SubscriptionSummary[] }>(
          "/api/platform/subscriptions"
        );
        setSubscriptions(res.data || []);
      } catch {
        // biarkan kosong — halaman hanya untuk SUPER_ADMIN
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeSubs = subscriptions.filter((s) => s.subscription?.status === "ACTIVE");
  const expiringSoon = subscriptions.filter(
    (s) => s.daysRemaining !== null && s.daysRemaining <= 30
  );
  const expired = subscriptions.filter(
    (s) => s.subscription?.status === "EXPIRED" || (s.daysRemaining !== null && s.daysRemaining < 0)
  );
  const pendingCount = subscriptions.reduce((sum, s) => sum + s.pendingInvoiceCount, 0);
  const pendingAmount = subscriptions.reduce((sum, s) => sum + s.pendingInvoiceAmount, 0);
  const totalUsers = subscriptions.reduce((sum, s) => sum + s.userCount, 0);
  const mrr = activeSubs.reduce((sum, s) => {
    const sub = s.subscription;
    if (!sub || sub.tier === "FREE") return sum;
    return (
      sum +
      cyclePrice(sub.tier as keyof typeof TIER_LABELS, sub.cycle as keyof typeof CYCLE_MONTHS) /
        CYCLE_MONTHS[sub.cycle as keyof typeof CYCLE_MONTHS]
    );
  }, 0);

  const fmtIDR = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tenant"
          value={loading ? "—" : subscriptions.length}
          description="Store yang terdaftar di platform"
          icon={Building2}
          badge="SaaS"
        />
        <StatCard
          title="Langganan Aktif"
          value={loading ? "—" : activeSubs.length}
          description={`${totalUsers} akun pengguna terhubung`}
          icon={TrendingUp}
          badgeVariant="success"
          badge="MRR aktif"
        />
        <StatCard
          title="Jatuh Tempo ≤ 30 Hari"
          value={loading ? "—" : expiringSoon.length}
          description={`${expired.length} sudah lewat jatuh tempo`}
          icon={Clock}
          badgeVariant="warning"
          badge="Perlu perhatian"
        />
        <StatCard
          title="Invoice Pending"
          value={loading ? "—" : pendingCount}
          description={fmtIDR(pendingAmount)}
          icon={Receipt}
          badgeVariant="danger"
          badge="Belum dibayar"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Estimasi MRR</CardTitle>
            <CardDescription>Pendapatan bulanan berulang dari langganan aktif</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "—" : fmtIDR(mrr)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Akses Cepat</CardTitle>
            <CardDescription>Kelola akun pemilik tenant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/platform/owners">
                Kelola Akun Owner <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/platform/subscriptions">
                Langganan & Invoice <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4" /> Perhatian Billing
            </CardTitle>
            <CardDescription>
              Tenant dengan langganan non-aktif / jatuh tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-full" />
            ) : expiringSoon.length === 0 ? (
              <p className="text-sm text-text-muted">Semua langganan dalam keadaan sehat.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {expiringSoon.slice(0, 5).map((s) => (
                  <li key={s.storeId} className="flex items-center justify-between gap-2">
                    <span className="truncate">{s.storeName}</span>
                    <Badge className={STATUS_STYLE[s.subscription?.status ?? ""] ?? ""}>
                      {s.daysRemaining !== null && s.daysRemaining < 0
                        ? `Lewat ${Math.abs(s.daysRemaining)} hari`
                        : `Sisa ${s.daysRemaining} hari`}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Ringkasan Tenant</CardTitle>
          <CardDescription>Status langganan seluruh store KADAI</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : subscriptions.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">
              Belum ada tenant terdaftar.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-text-muted">
                    <th className="py-2 pr-4">Tenant</th>
                    <th className="py-2 pr-4">Tier</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Jatuh Tempo</th>
                    <th className="py-2 pr-4">Invoice Pending</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((s) => (
                    <tr key={s.storeId} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <p className="font-medium">{s.storeName}</p>
                        <p className="text-xs text-text-muted">
                          {s.userCount} user · {s.outletCount} outlet
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        {TIER_LABELS[s.subscription?.tier as keyof typeof TIER_LABELS] ?? s.storeTier}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge className={STATUS_STYLE[s.subscription?.status ?? ""] ?? ""}>
                          {s.subscription?.status ?? "Belum berlangganan"}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {s.daysRemaining === null
                          ? "—"
                          : s.daysRemaining < 0
                            ? `Lewat ${Math.abs(s.daysRemaining)} hari`
                            : `${s.daysRemaining} hari`}
                      </td>
                      <td className="py-3 pr-4">
                        {s.pendingInvoiceCount > 0 ? (
                          <span className="font-semibold text-amber-600">
                            {s.pendingInvoiceCount} · {fmtIDR(s.pendingInvoiceAmount)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                        >
                          <Link href="/platform/subscriptions">
                            Kelola <ArrowRight className="h-3 w-3" />
                          </Link>
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
