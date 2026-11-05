"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface CustomerItem {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  memberTier: string;
  loyaltyPoints: number;
  totalSpent: number | string;
  visitCount: number;
  lastVisitAt: string | null;
  notes: string | null;
  isActive: boolean;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    memberTier: "BRONZE",
    notes: "",
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      let url = `/api/customers?search=${encodeURIComponent(search)}`;
      if (tierFilter !== "ALL") {
        url += `&tier=${tierFilter}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setCustomers(data.data || []);
      }
    } catch {
      toast.error("Gagal memuat data pelanggan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, tierFilter]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      memberTier: "BRONZE",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (cust: CustomerItem) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      phone: cust.phone || "",
      email: cust.email || "",
      address: cust.address || "",
      memberTier: cust.memberTier || "BRONZE",
      notes: cust.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Nama pelanggan wajib diisi");
      return;
    }

    try {
      const url = "/api/customers";
      const method = editingCustomer ? "PUT" : "POST";
      const body = editingCustomer
        ? { id: editingCustomer.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan pelanggan");

      toast.success(editingCustomer ? "Data pelanggan diperbarui" : "Pelanggan baru terdaftar");
      setIsDialogOpen(false);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "PLATINUM":
        return <Badge className="bg-slate-900 text-white font-bold">PLATINUM</Badge>;
      case "GOLD":
        return <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold">GOLD</Badge>;
      case "SILVER":
        return <Badge className="bg-slate-200 text-slate-800 font-bold">SILVER</Badge>;
      default:
        return <Badge variant="outline" className="font-bold">BRONZE</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="size-6 text-primary" />
            Direktori Pelanggan & Loyalitas
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola data member, histori akumulasi transaksi, poin loyalitas, dan program retensi pelanggan.
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="shadow-sm">
          <Plus className="size-4 mr-2" /> Daftarkan Pelanggan
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, no. HP, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-muted-foreground">Tier:</span>
          {["ALL", "BRONZE", "SILVER", "GOLD", "PLATINUM"].map((tier) => (
            <Button
              key={tier}
              variant={tierFilter === tier ? "default" : "outline"}
              size="sm"
              className="text-xs h-8"
              onClick={() => setTierFilter(tier)}
            >
              {tier}
            </Button>
          ))}
        </div>
      </div>

      {/* Table / List */}
      <Card className="border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-border text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama Pelanggan</th>
                <th className="py-3 px-4">Kontak (HP/Email)</th>
                <th className="py-3 px-4 text-center">Tier Member</th>
                <th className="py-3 px-4 text-right">Poin Loyalitas</th>
                <th className="py-3 px-4 text-right">Total Belanja</th>
                <th className="py-3 px-4 text-center">Kunjungan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="py-3.5 px-4 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></td>
                    <td className="py-3.5 px-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                    <td className="py-3.5 px-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                    <td className="py-3.5 px-4 text-center"><Skeleton className="h-4 w-8 mx-auto" /></td>
                    <td className="py-3.5 px-4 text-right"><Skeleton className="h-7 w-8 ml-auto rounded" /></td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Tidak ada pelanggan yang ditemukan.
                  </td>
                </tr>
              ) : (
                customers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>{cust.name}</div>
                      {cust.notes && (
                        <div className="text-[11px] text-muted-foreground font-normal mt-0.5">
                          {cust.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{cust.phone || "-"}</div>
                      {cust.email && <div className="text-[11px] text-muted-foreground">{cust.email}</div>}
                    </td>
                    <td className="py-3 px-4 text-center">{getTierBadge(cust.memberTier)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-600">
                      {cust.loyaltyPoints.toLocaleString("id-ID")} Pts
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatCurrency(Number(cust.totalSpent))}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {cust.visitCount}x
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleOpenEdit(cust)}
                      >
                        <Edit2 className="size-3.5 mr-1" /> Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "Perbarui Profil Pelanggan" : "Daftarkan Pelanggan Baru"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Nama Lengkap *</Label>
              <Input
                placeholder="Contoh: Budi Santoso"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nomor WhatsApp / HP</Label>
                <Input
                  placeholder="081298765432"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tier Keanggotaan</Label>
                <Select
                  value={formData.memberTier}
                  onValueChange={(val) => setFormData({ ...formData, memberTier: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRONZE">BRONZE (Dasar)</SelectItem>
                    <SelectItem value="SILVER">SILVER (Silver)</SelectItem>
                    <SelectItem value="GOLD">GOLD (Gold VIP)</SelectItem>
                    <SelectItem value="PLATINUM">PLATINUM (Prioritas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Alamat Email</Label>
              <Input
                type="email"
                placeholder="budi@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Catatan Preferensi / Alamat</Label>
              <Input
                placeholder="Preferensi meja atau alergi tertentu..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {editingCustomer ? "Simpan Perubahan" : "Simpan Pelanggan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
