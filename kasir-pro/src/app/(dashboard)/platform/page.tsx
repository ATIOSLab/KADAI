"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
  ArrowRight,
  Store,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge, ownerStatusTone } from "@/components/shared/status-badge";
import { apiFetch } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

interface PlatformOwner {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  storeCount: number;
  store: {
    id: string;
    name: string;
    businessType: string;
    tier: string;
  } | null;
}

/**
 * Dashboard Platform (SUPER_ADMIN).
 * Fokus: mengelola AKUN OWNER (pemilik tenant) — bukan operasional tenant.
 */
export default function PlatformDashboardPage() {
  const [owners, setOwners] = useState<PlatformOwner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch<{ data: PlatformOwner[] }>(
          "/api/platform/owners?includeInactive=true"
        );
        setOwners(res.data || []);
      } catch {
        // biarkan kosong — halaman hanya untuk SUPER_ADMIN
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const total = owners.length;
  const active = owners.filter((o) => o.isActive).length;
  const inactive = total - active;
  const neverLoggedIn = owners.filter((o) => !o.lastLoginAt).length;

  const needsAttention = owners.filter((o) => !o.isActive || !o.lastLoginAt);

  const fmtDateTime = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
      : "Belum pernah login";

  const recentOwners = [...owners]
    .sort((a, b) => {
      const ta = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
      const tb = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operator Platform"
        title="Platform Dashboard"
        description="Pantau dan kelola akun owner (pemilik tenant) KADAI. Urusan operasional toko tetap di tangan masing-masing owner."
        icon={Users}
      >
        <Button asChild className="gap-2">
          <Link href="/platform/owners">
            Kelola Akun Owner <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Owner"
          value={loading ? "—" : total}
          description="Akun pemilik tenant terdaftar"
          icon={Users}
          badge="Platform"
        />
        <StatCard
          title="Owner Aktif"
          value={loading ? "—" : active}
          description="Akun berstatus aktif"
          icon={UserCheck}
          badgeVariant="success"
          badge="Aktif"
        />
        <StatCard
          title="Owner Nonaktif"
          value={loading ? "—" : inactive}
          description="Akun dinonaktifkan sementara"
          icon={UserX}
          badgeVariant={inactive > 0 ? "danger" : "success"}
          badge={inactive > 0 ? "Perlu tindak lanjut" : "Bersih"}
        />
        <StatCard
          title="Belum Pernah Login"
          value={loading ? "—" : neverLoggedIn}
          description="Akun dibuat namun belum dipakai"
          icon={Clock}
          badgeVariant={neverLoggedIn > 0 ? "warning" : "success"}
          badge="Onboarding"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Akses Cepat</CardTitle>
            <CardDescription>Kelola akun pemilik tenant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/platform/owners">
                Daftar &amp; Kelola Owner <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/demo-requests">
                Permohonan Demo <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-amber-200 bg-amber-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4" /> Perlu Perhatian
            </CardTitle>
            <CardDescription>Owner nonaktif atau belum pernah login</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-full" />
            ) : needsAttention.length === 0 ? (
              <p className="text-sm text-text-muted">Semua akun owner sehat.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {needsAttention.slice(0, 5).map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      {o.name} <span className="text-text-muted">· {o.email}</span>
                    </span>
                    <StatusBadge tone={o.isActive ? "warning" : ownerStatusTone(false)}>
                      {o.isActive ? "Belum login" : "Nonaktif"}
                    </StatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Ringkasan Akun Owner</CardTitle>
          <CardDescription>Owner terbaru berdasarkan aktivitas login</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recentOwners.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">
              Belum ada akun owner terdaftar.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-text-muted">
                    <th className="py-2 pr-4">Owner</th>
                    <th className="py-2 pr-4">Tenant</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Login Terakhir</th>
                    <th className="py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOwners.map((o) => (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <p className="font-medium">{o.name}</p>
                        <p className="text-xs text-text-muted">{o.email}</p>
                      </td>
                      <td className="py-3 pr-4">
                        {o.store ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Store className="h-3.5 w-3.5 text-text-muted" />
                            <span>{o.store.name}</span>
                            <StatusBadge tone="muted">{o.storeCount} tenant</StatusBadge>
                          </span>
                        ) : (
                          <span className="text-text-muted">Tanpa tenant</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge tone={ownerStatusTone(o.isActive)}>
                          {o.isActive ? "Aktif" : "Nonaktif"}
                        </StatusBadge>
                      </td>
                      <td className="py-3 pr-4">{fmtDateTime(o.lastLoginAt)}</td>
                      <td className="py-3 text-right">
                        <Button asChild variant="ghost" size="sm" className="gap-1">
                          <Link href="/platform/owners">
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
