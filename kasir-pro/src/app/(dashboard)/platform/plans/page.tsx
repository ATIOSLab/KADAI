"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Power, RotateCcw, Tags } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogBody } from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type Cycle = "MONTHLY" | "QUARTERLY" | "ANNUAL";

const CYCLES: { key: Cycle; label: string }[] = [
  { key: "MONTHLY", label: "Bulanan" },
  { key: "QUARTERLY", label: "Triwulan" },
  { key: "ANNUAL", label: "Tahunan" },
];

interface PlanLimits {
  maxOutlets?: number | null;
  maxUsers?: number | null;
  maxProducts?: number | null;
  maxSku?: number | null;
  kds?: boolean;
  transferStock?: boolean;
  centralKitchen?: boolean;
}

interface PlanItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  badge: string | null;
  features: string[];
  limits: PlanLimits;
  sortOrder: number;
  isActive: boolean;
  prices: Record<Cycle, number>;
}

interface PlanForm {
  name: string;
  description: string;
  badge: string;
  featuresText: string;
  maxOutlets: string;
  maxUsers: string;
  maxProducts: string;
  maxSku: string;
  kds: boolean;
  transferStock: boolean;
  centralKitchen: boolean;
  monthly: string;
  quarterly: string;
  annual: string;
  sortOrder: string;
  isActive: boolean;
}

const emptyForm: PlanForm = {
  name: "",
  description: "",
  badge: "",
  featuresText: "",
  maxOutlets: "",
  maxUsers: "",
  maxProducts: "",
  maxSku: "",
  kds: false,
  transferStock: false,
  centralKitchen: false,
  monthly: "0",
  quarterly: "0",
  annual: "0",
  sortOrder: "0",
  isActive: true,
};

const numToStr = (value: number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

const priceOf = (prices: unknown, cycle: Cycle): number => {
  if (prices && typeof prices === "object" && !Array.isArray(prices)) {
    const value = (prices as Record<string, unknown>)[cycle];
    return Number(value ?? 0);
  }
  return 0;
};

const normalizePlan = (raw: PlanItem): PlanItem => ({
  ...raw,
  features: Array.isArray(raw.features) ? raw.features : [],
  limits:
    raw.limits && typeof raw.limits === "object" && !Array.isArray(raw.limits)
      ? raw.limits
      : {},
  prices: {
    MONTHLY: priceOf(raw.prices, "MONTHLY"),
    QUARTERLY: priceOf(raw.prices, "QUARTERLY"),
    ANNUAL: priceOf(raw.prices, "ANNUAL"),
  },
});

const limitSummary = (limits: PlanLimits): string[] => {
  const parts: string[] = [];
  const limit = (label: string, value: number | null | undefined) =>
    parts.push(`${label} ${value === null || value === undefined ? "∞" : value}`);
  if ("maxOutlets" in limits) limit("Outlet", limits.maxOutlets);
  if ("maxUsers" in limits) limit("User", limits.maxUsers);
  if ("maxProducts" in limits) limit("Produk", limits.maxProducts);
  if ("maxSku" in limits) limit("SKU", limits.maxSku);
  return parts;
};

const flagSummary = (limits: PlanLimits): string[] => {
  const flags: string[] = [];
  if (limits.kds) flags.push("KDS");
  if (limits.transferStock) flags.push("Transfer Stok");
  if (limits.centralKitchen) flags.push("Central Kitchen");
  return flags;
};

/**
 * Manajemen Paket Langganan (SUPER_ADMIN).
 * Perubahan harga langsung dipakai untuk tagihan baru; tagihan lama tetap
 * memakai snapshot harganya sendiri.
 */
export default function PlatformPlansPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PlanItem | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: PlanItem[] }>("/api/platform/plans");
      setPlans((res.data || []).map(normalizePlan));
    } catch {
      // halaman hanya untuk SUPER_ADMIN
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (plan: PlanItem) => {
    setEditTarget(plan);
    setForm({
      name: plan.name,
      description: plan.description ?? "",
      badge: plan.badge ?? "",
      featuresText: plan.features.join("\n"),
      maxOutlets: numToStr(plan.limits.maxOutlets),
      maxUsers: numToStr(plan.limits.maxUsers),
      maxProducts: numToStr(plan.limits.maxProducts),
      maxSku: numToStr(plan.limits.maxSku),
      kds: Boolean(plan.limits.kds),
      transferStock: Boolean(plan.limits.transferStock),
      centralKitchen: Boolean(plan.limits.centralKitchen),
      monthly: String(plan.prices.MONTHLY),
      quarterly: String(plan.prices.QUARTERLY),
      annual: String(plan.prices.ANNUAL),
      sortOrder: String(plan.sortOrder),
      isActive: plan.isActive,
    });
    setDialogOpen(true);
  };

  const parseLimit = (value: string): number | null => {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : null;
  };

  const parseAmount = (value: string): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() ? form.description.trim() : null,
        badge: form.badge.trim() ? form.badge.trim() : null,
        features: form.featuresText
          .split("\n")
          .map((feature) => feature.trim())
          .filter(Boolean),
        limits: {
          maxOutlets: parseLimit(form.maxOutlets),
          maxUsers: parseLimit(form.maxUsers),
          maxProducts: parseLimit(form.maxProducts),
          maxSku: parseLimit(form.maxSku),
          kds: form.kds,
          transferStock: form.transferStock,
          centralKitchen: form.centralKitchen,
        },
        prices: {
          MONTHLY: parseAmount(form.monthly),
          QUARTERLY: parseAmount(form.quarterly),
          ANNUAL: parseAmount(form.annual),
        },
        sortOrder: parseAmount(form.sortOrder),
        isActive: form.isActive,
      };
      const res = await apiFetch<{ message?: string }>(`/api/platform/plans/${editTarget.id}`, {
        method: "PATCH",
        body: payload,
      });
      toast.success(res.message || "Paket diperbarui");
      setDialogOpen(false);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan paket");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (plan: PlanItem) => {
    setTogglingId(plan.id);
    try {
      const res = await apiFetch<{ message?: string }>(`/api/platform/plans/${plan.id}`, {
        method: "PATCH",
        body: { isActive: !plan.isActive },
      });
      toast.success(res.message || (plan.isActive ? "Paket dinonaktifkan" : "Paket diaktifkan"));
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengubah status paket");
    } finally {
      setTogglingId(null);
    }
  };

  const activeCount = plans.filter((plan) => plan.isActive).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operator Platform"
        title="Paket Langganan"
        description="Atur harga, fitur, dan batas pemakaian tiap paket. Perubahan langsung berlaku untuk tagihan baru."
        icon={Tags}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Paket"
          value={loading ? "—" : plans.length}
          description="Termasuk paket nonaktif"
          icon={Tags}
          badge="Platform"
        />
        <StatCard
          title="Paket Aktif"
          value={loading ? "—" : activeCount}
          description="Tampil di landing & internal"
          icon={Power}
          badgeVariant="success"
        />
        <StatCard
          title="Paket Non-Aktif"
          value={loading ? "—" : plans.length - activeCount}
          description="Tidak ditawarkan ke tenant baru"
          icon={RotateCcw}
          badgeVariant="warning"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Daftar Paket</CardTitle>
          <CardDescription>Harga berlaku per siklus penagihan</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <p className="py-10 text-center text-sm text-text-muted">
              Belum ada paket langganan.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-text-muted">
                    <th className="py-2 pr-4">Paket</th>
                    <th className="py-2 pr-4">Harga</th>
                    <th className="py-2 pr-4">Fitur</th>
                    <th className="py-2 pr-4">Batas & Modul</th>
                    <th className="py-2 pr-4">Urutan</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => {
                    const limits = limitSummary(plan.limits);
                    const flags = flagSummary(plan.limits);
                    return (
                      <tr key={plan.id} className="border-b align-top last:border-0">
                        <td className="py-3 pr-4">
                          <p className="font-medium">{plan.name}</p>
                          <p className="font-mono text-xs text-text-muted">{plan.code}</p>
                          {plan.badge && (
                            <StatusBadge tone="info" className="mt-1">
                              {plan.badge}
                            </StatusBadge>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="space-y-0.5 text-xs">
                            {CYCLES.map((cycle) => (
                              <p key={cycle.key} className="flex justify-between gap-4">
                                <span className="text-text-muted">{cycle.label}</span>
                                <span className="font-medium tabular-nums">
                                  {formatCurrency(plan.prices[cycle.key])}
                                </span>
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-xs text-text-muted">
                            {plan.features.length} fitur
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-1">
                            {limits.map((item) => (
                              <StatusBadge key={item} tone="muted">
                                {item}
                              </StatusBadge>
                            ))}
                            {flags.map((item) => (
                              <StatusBadge key={item} tone="success">
                                {item}
                              </StatusBadge>
                            ))}
                            {limits.length === 0 && flags.length === 0 && (
                              <span className="text-xs text-text-muted">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-text-muted tabular-nums">{plan.sortOrder}</td>
                        <td className="py-3 pr-4">
                          <StatusBadge tone={plan.isActive ? "success" : "danger"}>
                            {plan.isActive ? "Aktif" : "Nonaktif"}
                          </StatusBadge>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => openEdit(plan)}>
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={togglingId === plan.id}
                              onClick={() => toggleActive(plan)}
                              className={plan.isActive ? "text-rose-600" : "text-emerald-600"}
                            >
                              {plan.isActive ? "Nonaktifkan" : "Aktifkan"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Paket {editTarget?.name}</DialogTitle>
            <DialogDescription>
              Kode paket <span className="font-mono">{editTarget?.code}</span> tidak dapat diubah. Paket FREE wajib
              Rp 0 pada semua siklus.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Paket</Label>
                <Input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="mis. Professional"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Badge (opsional)</Label>
                  <Input
                    value={form.badge}
                    onChange={(event) => setForm({ ...form, badge: event.target.value })}
                    placeholder="mis. Terpopuler"
                    maxLength={40}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Urutan Tampil</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(event) => setForm({ ...form, sortOrder: event.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Deskripsi (opsional)</Label>
                <Textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Ringkasan singkat paket"
                  maxLength={500}
                />
              </div>

              <div className="space-y-2">
                <Label>Fitur (satu per baris)</Label>
                <Textarea
                  value={form.featuresText}
                  onChange={(event) => setForm({ ...form, featuresText: event.target.value })}
                  placeholder={"Kasir & struk\nLaporan penjualan\nMulti outlet"}
                  className="min-h-[120px] font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label>Batas Pemakaian</Label>
                <p className="text-xs text-text-muted">Kosongkan untuk tanpa batas.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-text-muted">Max Outlet</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.maxOutlets}
                      onChange={(event) => setForm({ ...form, maxOutlets: event.target.value })}
                      placeholder="∞"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-text-muted">Max User</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.maxUsers}
                      onChange={(event) => setForm({ ...form, maxUsers: event.target.value })}
                      placeholder="∞"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-text-muted">Max Produk</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.maxProducts}
                      onChange={(event) => setForm({ ...form, maxProducts: event.target.value })}
                      placeholder="∞"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-text-muted">Max SKU</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.maxSku}
                      onChange={(event) => setForm({ ...form, maxSku: event.target.value })}
                      placeholder="∞"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Modul Tambahan</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Label className="flex items-center gap-2 text-sm font-normal">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={form.kds}
                      onChange={(event) => setForm({ ...form, kds: event.target.checked })}
                    />
                    KDS
                  </Label>
                  <Label className="flex items-center gap-2 text-sm font-normal">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={form.transferStock}
                      onChange={(event) => setForm({ ...form, transferStock: event.target.checked })}
                    />
                    Transfer Stok
                  </Label>
                  <Label className="flex items-center gap-2 text-sm font-normal">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={form.centralKitchen}
                      onChange={(event) => setForm({ ...form, centralKitchen: event.target.checked })}
                    />
                    Central Kitchen
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Harga per Siklus (Rp)</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-text-muted">Bulanan</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1000}
                      value={form.monthly}
                      onChange={(event) => setForm({ ...form, monthly: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-text-muted">Triwulan</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1000}
                      value={form.quarterly}
                      onChange={(event) => setForm({ ...form, quarterly: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-text-muted">Tahunan</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1000}
                      value={form.annual}
                      onChange={(event) => setForm({ ...form, annual: event.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Label className="flex items-center gap-2 text-sm font-normal">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={form.isActive}
                  onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                />
                Paket aktif dan ditawarkan ke tenant
              </Label>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? "Menyimpan..." : <><Pencil className="h-4 w-4" /> Simpan Perubahan</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}