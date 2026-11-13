"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Settings2,
  Receipt,
  CalendarClock,
  Ban,
  FilePlus2,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogBody } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { TIER_LABELS } from "@/lib/pricing";
import { Skeleton } from "@/components/ui/skeleton";

interface SubscriptionRow {
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

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  storeId: string;
  tier: string;
  cycle: string;
  amount: string | number;
  status: string;
  createdAt: string;
}

const TIER_OPTIONS = ["FREE", "STARTER", "PRO_BUSINESS", "ENTERPRISE"];
const CYCLE_OPTIONS = ["MONTHLY", "QUARTERLY", "ANNUAL"];
const STATUS_OPTIONS = ["ACTIVE", "PAST_DUE", "EXPIRED", "CANCELLED"];

const SUB_STATUS_TONE: Record<string, StatusTone> = {
  ACTIVE: "success",
  PAST_DUE: "warning",
  EXPIRED: "danger",
  CANCELLED: "muted",
};

const INVOICE_STATUS_TONE: Record<string, StatusTone> = {
  PENDING: "warning",
  SETTLED: "success",
  FAILED: "danger",
  REFUNDED: "muted",
};

const fmtIDR = (n: number | string) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    typeof n === "string" ? Number(n) : n
  );

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function PlatformSubscriptionsPage() {
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [manageTarget, setManageTarget] = useState<SubscriptionRow | null>(null);
  const [manageForm, setManageForm] = useState({ tier: "PRO_BUSINESS", cycle: "MONTHLY", status: "ACTIVE", expiresAt: "" });
  const [savingManage, setSavingManage] = useState(false);

  const [invoiceTarget, setInvoiceTarget] = useState<SubscriptionRow | null>(null);
  const [newInvoice, setNewInvoice] = useState({ tier: "PRO_BUSINESS", cycle: "MONTHLY", amount: "" });
  const [issuing, setIssuing] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [subRes, invRes] = await Promise.all([
        apiFetch<{ data: SubscriptionRow[] }>("/api/platform/subscriptions"),
        apiFetch<{ data: InvoiceItem[] }>("/api/billing/invoices"),
      ]);
      setRows(subRes.data || []);
      setInvoices(invRes.data || []);
    } catch {
      // halaman hanya untuk SUPER_ADMIN
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openManage = (row: SubscriptionRow) => {
    setManageTarget(row);
    setManageForm({
      tier: row.subscription?.tier ?? row.storeTier ?? "PRO_BUSINESS",
      cycle: row.subscription?.cycle ?? "MONTHLY",
      status: row.subscription?.status ?? "ACTIVE",
      expiresAt: row.subscription?.expiresAt ? row.subscription.expiresAt.slice(0, 10) : "",
    });
  };

  const manageAction = async (action: string, extra: Record<string, unknown> = {}) => {
    if (!manageTarget) return;
    setSavingManage(true);
    try {
      const res = await apiFetch<{ message?: string }>(`/api/platform/subscriptions/${manageTarget.storeId}`, {
        method: "PUT",
        body: { action, ...extra },
      });
      toast.success(res.message || "Langganan diperbarui");
      setManageTarget(null);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui langganan");
    } finally {
      setSavingManage(false);
    }
  };

  const issueInvoice = async () => {
    if (!invoiceTarget) return;
    setIssuing(true);
    try {
      const payload: Record<string, unknown> = {
        storeId: invoiceTarget.storeId,
        tier: newInvoice.tier,
        cycle: newInvoice.cycle,
      };
      if (newInvoice.amount) payload.amount = Number(newInvoice.amount);
      const res = await apiFetch<{ message?: string }>("/api/billing/invoices", {
        method: "POST",
        body: payload,
      });
      toast.success(res.message || "Tagihan diterbitkan");
      setNewInvoice({ tier: "PRO_BUSINESS", cycle: "MONTHLY", amount: "" });
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menerbitkan tagihan");
    } finally {
      setIssuing(false);
    }
  };

  const settleInvoice = async (invoice: InvoiceItem) => {
    setSettlingId(invoice.id);
    try {
      const res = await apiFetch<{ message?: string }>(`/api/billing/invoices/${invoice.id}`, {
        method: "PATCH",
        body: { action: "SETTLE", notes: "Pelunasan manual oleh Super Admin" },
      });
      toast.success(res.message || "Tagihan dilunasi");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal melunasi tagihan");
    } finally {
      setSettlingId(null);
    }
  };

  const activeCount = rows.filter((r) => r.subscription?.status === "ACTIVE").length;
  const expiringCount = rows.filter((r) => r.daysRemaining !== null && r.daysRemaining <= 30).length;
  const pendingCount = rows.reduce((s, r) => s + r.pendingInvoiceCount, 0);

  const targetInvoices = invoiceTarget ? invoices.filter((i) => i.storeId === invoiceTarget.storeId) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Billing SaaS"
        title="Langganan & Invoice"
        description="Kelola tier langganan, siklus billing, status, dan jatuh tempo tenant KADAI."
        icon={Receipt}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Langganan Aktif" value={loading ? "—" : activeCount} description={`dari ${rows.length} tenant`} icon={CheckCircle2} badgeVariant="success" />
        <StatCard title="Jatuh Tempo ≤ 30 Hari" value={loading ? "—" : expiringCount} description="Perlu tindak lanjut billing" icon={CalendarClock} badgeVariant="warning" />
        <StatCard title="Invoice Pending" value={loading ? "—" : pendingCount} description="Menunggu pelunasan" icon={Receipt} badgeVariant="danger" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Langganan Tenant</CardTitle>
          <CardDescription>Kelola tier, siklus, status, dan tagihan seluruh tenant KADAI</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-text-muted">Belum ada tenant terdaftar.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-text-muted">
                    <th className="py-2 pr-4">Tenant</th>
                    <th className="py-2 pr-4">Tier / Siklus</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Jatuh Tempo</th>
                    <th className="py-2 pr-4">Invoice Pending</th>
                    <th className="py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.storeId} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <p className="flex items-center gap-1 font-medium">
                          <Building2 className="h-3 w-3 text-text-muted" /> {row.storeName}
                        </p>
                        <p className="text-xs text-text-muted">
                          {row.businessType} · {row.userCount} user · {row.outletCount} outlet
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <p>{TIER_LABELS[(row.subscription?.tier ?? row.storeTier) as keyof typeof TIER_LABELS] ?? row.storeTier}</p>
                        <p className="text-xs text-text-muted">{row.subscription?.cycle ?? "—"}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge tone={SUB_STATUS_TONE[row.subscription?.status ?? ""] ?? "neutral"}>
                          {row.subscription?.status ?? "BELUM BERLANGGANAN"}
                        </StatusBadge>
                      </td>
                      <td className="py-3 pr-4">
                        <p>{fmtDate(row.subscription?.expiresAt ?? null)}</p>
                        {row.daysRemaining !== null && (
                          <p className={`text-xs ${row.daysRemaining < 0 ? "text-rose-600" : row.daysRemaining <= 30 ? "text-amber-600" : "text-text-muted"}`}>
                            {row.daysRemaining < 0 ? `Lewat ${Math.abs(row.daysRemaining)} hari` : `Sisa ${row.daysRemaining} hari`}
                          </p>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {row.pendingInvoiceCount > 0 ? (
                          <span className="font-semibold text-amber-600">
                            {row.pendingInvoiceCount} · {fmtIDR(row.pendingInvoiceAmount)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => openManage(row)}>
                            <Settings2 className="h-3.5 w-3.5" /> Kelola
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              setInvoiceTarget(row);
                              setNewInvoice({ tier: row.subscription?.tier ?? "PRO_BUSINESS", cycle: row.subscription?.cycle ?? "MONTHLY", amount: "" });
                            }}
                          >
                            <Receipt className="h-3.5 w-3.5" /> Invoice
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

      {/* ═══ Dialog Kelola Langganan ═══ */}
      <Dialog open={!!manageTarget} onOpenChange={(open) => !open && setManageTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kelola Langganan — {manageTarget?.storeName}</DialogTitle>
            <DialogDescription>Ubah tier, siklus, status, atau jatuh tempo langganan tenant ini.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tier</Label>
                  <Select value={manageForm.tier} onValueChange={(v) => setManageForm({ ...manageForm, tier: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIER_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>{TIER_LABELS[t as keyof typeof TIER_LABELS]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Siklus</Label>
                  <Select value={manageForm.cycle} onValueChange={(v) => setManageForm({ ...manageForm, cycle: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CYCLE_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                disabled={savingManage}
                onClick={() => manageAction("SET_TIER_CYCLE", { tier: manageForm.tier, cycle: manageForm.cycle })}
              >
                Simpan Tier & Siklus
              </Button>

              <div className="space-y-2">
                <Label>Status Langganan</Label>
                <div className="flex gap-2">
                  <Select value={manageForm.status} onValueChange={(v) => setManageForm({ ...manageForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" disabled={savingManage} onClick={() => manageAction("SET_STATUS", { status: manageForm.status })}>
                    Simpan
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Jatuh Tempo (expiresAt)</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={manageForm.expiresAt}
                    onChange={(e) => setManageForm({ ...manageForm, expiresAt: e.target.value })}
                  />
                  <Button
                    variant="outline"
                    disabled={savingManage}
                    onClick={() => manageAction("SET_EXPIRY", { expiresAt: manageForm.expiresAt ? `${manageForm.expiresAt}T23:59:59+07:00` : null })}
                  >
                    Simpan
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-rose-700">
                  <Ban className="h-4 w-4" /> Suspend Tenant
                </p>
                <p className="mb-3 text-xs text-rose-600">
                  Menghentikan langganan (CANCELLED) dan menonaktifkan seluruh akun owner tenant ini.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={savingManage}
                  onClick={() => {
                    if (confirm(`Suspend tenant "${manageTarget?.storeName}"? Akses owner akan dicabut.`)) {
                      manageAction("SUSPEND_TENANT", { suspendOwners: true });
                    }
                  }}
                >
                  Suspend Tenant
                </Button>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageTarget(null)} disabled={savingManage}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Dialog Invoice ═══ */}
      <Dialog open={!!invoiceTarget} onOpenChange={(open) => !open && setInvoiceTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tagihan — {invoiceTarget?.storeName}</DialogTitle>
            <DialogDescription>Terbitkan tagihan baru atau lunasi tagihan pending tenant ini.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div className="rounded-lg border p-3">
                <p className="mb-3 flex items-center gap-1.5 text-sm font-medium">
                  <FilePlus2 className="h-4 w-4" /> Terbitkan Tagihan Baru
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Tier</Label>
                    <Select value={newInvoice.tier} onValueChange={(v) => setNewInvoice({ ...newInvoice, tier: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIER_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>{TIER_LABELS[t as keyof typeof TIER_LABELS]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Siklus</Label>
                    <Select value={newInvoice.cycle} onValueChange={(v) => setNewInvoice({ ...newInvoice, cycle: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CYCLE_OPTIONS.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <Label>Nominal Manual (opsional)</Label>
                  <Input
                    type="number"
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                    placeholder="Kosongkan untuk harga resmi sesuai tier & siklus"
                  />
                </div>
                <Button className="mt-3 w-full" onClick={issueInvoice} disabled={issuing}>
                  {issuing ? "Menerbitkan..." : "Terbitkan Tagihan"}
                </Button>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Riwayat Tagihan</p>
                {targetInvoices.length === 0 ? (
                  <p className="py-4 text-center text-xs text-text-muted">Belum ada tagihan.</p>
                ) : (
                  <ul className="space-y-2">
                    {targetInvoices.map((inv) => (
                      <li key={inv.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                        <div>
                          <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                          <p className="text-xs text-text-muted">
                            {TIER_LABELS[inv.tier as keyof typeof TIER_LABELS] ?? inv.tier} · {inv.cycle} · {fmtIDR(inv.amount)} · {fmtDate(inv.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge tone={INVOICE_STATUS_TONE[inv.status] ?? "neutral"}>{inv.status}</StatusBadge>
                          {inv.status === "PENDING" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              disabled={settlingId === inv.id}
                              onClick={() => settleInvoice(inv)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Lunas
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceTarget(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
