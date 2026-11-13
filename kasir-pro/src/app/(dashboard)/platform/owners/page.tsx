"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  UserRound,
  KeyRound,
  Power,
  RotateCcw,
  Mail,
  Building2,
  Store,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge, ownerStatusTone } from "@/components/shared/status-badge";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogBody } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { TIER_LABELS } from "@/lib/pricing";
import { Skeleton } from "@/components/ui/skeleton";

interface OwnerItem {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  avatar: string | null;
  storeId: string | null;
  storeCount: number;
  store: { id: string; name: string; tier: string; businessType: string } | null;
}

interface StoreOption {
  id: string;
  name: string;
  tier: string;
}

const TIER_OPTIONS = ["FREE", "STARTER", "PRO_BUSINESS", "ENTERPRISE"];
const CYCLE_OPTIONS = ["MONTHLY", "QUARTERLY", "ANNUAL"];
const BIZ_OPTIONS = [
  "RETAIL",
  "FNB_CAFE",
  "FNB_RESTAURANT",
  "FNB_WARUNG",
  "BUILDING_SUPPLY",
  "PHARMACY",
  "SERVICE",
];

const emptyForm = {
  name: "",
  email: "",
  password: "",
  supervisorPin: "",
  mode: "new" as "new" | "existing",
  storeId: "",
  storeName: "",
  businessType: "FNB_CAFE",
  tier: "PRO_BUSINESS",
  cycle: "MONTHLY",
};

/**
 * Manajemen Owner (SUPER_ADMIN).
 * Fokus: akun pemilik tenant — buat, ubah, aktif/nonaktif, reset password.
 * Info tenant (store) ditampilkan sebagai keterangan, termasuk jumlah tenant.
 */
export default function PlatformOwnersPage() {
  const [owners, setOwners] = useState<OwnerItem[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OwnerItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [ownerRes, storeRes] = await Promise.all([
        apiFetch<{ data: OwnerItem[] }>("/api/platform/owners?includeInactive=true"),
        // daftar tenant untuk menautkan owner ke tenant existing saat onboarding
        apiFetch<{ data: SubscriptionStore[] }>("/api/platform/subscriptions"),
      ]);
      setOwners(ownerRes.data || []);
      setStores((storeRes.data || []).map((s) => ({ id: s.storeId, name: s.storeName, tier: s.storeTier })));
    } catch {
      // halaman hanya untuk SUPER_ADMIN
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (owner: OwnerItem) => {
    setEditTarget(owner);
    setForm({
      name: owner.name,
      email: owner.email,
      password: "",
      supervisorPin: "",
      mode: "existing",
      storeId: owner.storeId ?? "",
      storeName: owner.store?.name ?? "",
      businessType: owner.store?.businessType ?? "FNB_CAFE",
      tier: owner.store?.tier ?? "PRO_BUSINESS",
      cycle: "MONTHLY",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editTarget) {
        const payload: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          ...(form.password ? { password: form.password } : {}),
          ...(form.supervisorPin ? { supervisorPin: form.supervisorPin } : {}),
          storeId: form.storeId || null,
        };
        const res = await apiFetch<{ message?: string }>(`/api/platform/owners/${editTarget.id}`, {
          method: "PUT",
          body: payload,
        });
        toast.success(res.message || "Akun owner diperbarui");
      } else {
        const payload: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          password: form.password,
          supervisorPin: form.supervisorPin || undefined,
        };
        if (form.mode === "existing") {
          payload.storeId = form.storeId;
        } else {
          payload.newStore = {
            name: form.storeName,
            businessType: form.businessType,
            tier: form.tier,
            cycle: form.cycle,
          };
        }
        const res = await apiFetch<{ message?: string }>("/api/platform/owners", {
          method: "POST",
          body: payload,
        });
        toast.success(res.message || "Akun owner dibuat");
      }
      setDialogOpen(false);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (owner: OwnerItem) => {
    setTogglingId(owner.id);
    try {
      const res = await apiFetch<{ message?: string }>(`/api/platform/owners/${owner.id}`, {
        method: "PUT",
        body: { isActive: !owner.isActive },
      });
      toast.success(res.message || (owner.isActive ? "Akun dinonaktifkan" : "Akun diaktifkan"));
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengubah status");
    } finally {
      setTogglingId(null);
    }
  };

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operator Platform"
        title="Akun Owner (Tenant)"
        description="Kelola akun pemilik tenant KADAI: buat, ubah, reset kata sandi, aktif/nonaktif, dan lihat tenant yang dikelola."
        icon={UserRound}
      >
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Tambah Owner
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Akun Owner"
          value={loading ? "—" : owners.length}
          description="Pemilik tenant (role ADMIN)"
          icon={UserRound}
          badge="Platform"
        />
        <StatCard
          title="Owner Aktif"
          value={loading ? "—" : owners.filter((o) => o.isActive).length}
          description="Dapat login ke workspace"
          icon={Power}
          badgeVariant="success"
        />
        <StatCard
          title="Owner Non-Aktif"
          value={loading ? "—" : owners.filter((o) => !o.isActive).length}
          description="Dinonaktifkan oleh platform"
          icon={RotateCcw}
          badgeVariant="warning"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-sm">Daftar Akun Owner</CardTitle>
            <CardDescription>Kelola seluruh pemilik tenant KADAI dari satu tempat</CardDescription>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Tambah Owner
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : owners.length === 0 ? (
            <p className="py-10 text-center text-sm text-text-muted">
              Belum ada akun owner. Klik &quot;Tambah Owner&quot; untuk onboarding tenant baru.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-text-muted">
                    <th className="py-2 pr-4">Owner</th>
                    <th className="py-2 pr-4">Tenant</th>
                    <th className="py-2 pr-4">Terakhir Login</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {owners.map((owner) => (
                    <tr key={owner.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <p className="font-medium">{owner.name}</p>
                        <p className="flex items-center gap-1 text-xs text-text-muted">
                          <Mail className="h-3 w-3" /> {owner.email}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        {owner.store ? (
                          <div className="space-y-1">
                            <p className="flex items-center gap-1 font-medium">
                              <Building2 className="h-3 w-3 text-text-muted" /> {owner.store.name}
                            </p>
                            <p className="flex items-center gap-1.5 text-xs text-text-muted">
                              <Store className="h-3 w-3" />
                              <StatusBadge tone="muted">{owner.storeCount} tenant</StatusBadge>
                              <span>{owner.store.businessType}</span>
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted">Belum ditautkan</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-text-muted">{fmtDate(owner.lastLoginAt)}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge tone={ownerStatusTone(owner.isActive)}>
                          {owner.isActive ? "Aktif" : "Nonaktif"}
                        </StatusBadge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(owner)}>
                            Detail &amp; Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={togglingId === owner.id}
                            onClick={() => toggleActive(owner)}
                            className={owner.isActive ? "text-rose-600" : "text-emerald-600"}
                          >
                            {owner.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ Dialog Tambah / Detail & Edit Owner ═══ */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => !open && setDialogOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? "Detail & Edit Akun Owner" : "Tambah Akun Owner (Onboarding)"}</DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Data pemilik tenant dan tenant yang dikelolanya. Kosongkan password untuk tidak mengubahnya."
                : "Buat akun pemilik tenant baru — pilih tenant existing atau buat tenant baru sekaligus."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              {editTarget && (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Tenant Dikelola
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="flex items-center gap-1.5 font-medium">
                        <Building2 className="h-3.5 w-3.5 text-text-muted" />
                        {editTarget.store?.name ?? "Belum ditautkan"}
                      </p>
                      <p className="text-xs text-text-muted">
                        {editTarget.store
                          ? `${editTarget.store.businessType} · ${TIER_LABELS[editTarget.store.tier as keyof typeof TIER_LABELS] ?? editTarget.store.tier}`
                          : "Owner ini belum memiliki tenant"}
                      </p>
                    </div>
                    <StatusBadge tone="muted">{editTarget.storeCount} tenant</StatusBadge>
                  </div>
                </div>
              )}

              {!editTarget && (
                <div className="space-y-2">
                  <Label>Mode Tenant</Label>
                  <Select
                    value={form.mode}
                    onValueChange={(v) => setForm({ ...form, mode: v as "new" | "existing" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Buat tenant baru (Store)</SelectItem>
                      <SelectItem value="existing">Tautkan ke tenant existing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!editTarget && form.mode === "existing" && (
                <div className="space-y-2">
                  <Label>Tenant (Store)</Label>
                  <SearchableSelect
                    value={form.storeId}
                    options={stores.map((s) => ({ value: s.id, label: `${s.name} (${TIER_LABELS[s.tier as keyof typeof TIER_LABELS] ?? s.tier})` }))}
                    placeholder="Pilih tenant"
                    onValueChange={(v) => setForm({ ...form, storeId: v })}
                  />
                </div>
              )}

              {!editTarget && form.mode === "new" && (
                <>
                  <div className="space-y-2">
                    <Label>Nama Tenant (Store)</Label>
                    <Input
                      value={form.storeName}
                      onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                      placeholder="mis. Kopi Senja Bandung"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Jenis Usaha</Label>
                      <Select value={form.businessType} onValueChange={(v) => setForm({ ...form, businessType: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BIZ_OPTIONS.map((b) => (
                            <SelectItem key={b} value={b}>{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tier Langganan Awal</Label>
                      <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIER_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>{TIER_LABELS[t as keyof typeof TIER_LABELS]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Siklus Billing</Label>
                    <Select value={form.cycle} onValueChange={(v) => setForm({ ...form, cycle: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CYCLE_OPTIONS.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="mis. Budi Santoso" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="owner@tenant.com" />
              </div>
              <div className="space-y-2">
                <Label>{editTarget ? "Password Baru (opsional)" : "Password"}</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editTarget ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter"}
                />
              </div>
              <div className="space-y-2">
                <Label>PIN Supervisor (opsional)</Label>
                <Input
                  value={form.supervisorPin}
                  onChange={(e) => setForm({ ...form, supervisorPin: e.target.value })}
                  placeholder="6-8 digit angka"
                  maxLength={8}
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? "Menyimpan..." : <><KeyRound className="h-4 w-4" /> Simpan</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Tipe respons subscriptions — dipakai hanya untuk memilih tenant existing saat onboarding owner
interface SubscriptionStore {
  storeId: string;
  storeName: string;
  storeTier: string;
}
