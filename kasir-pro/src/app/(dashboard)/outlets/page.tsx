"use client";

import { useEffect, useState } from "react";
import {
  Building,
  Plus,
  MapPin,
  Phone,
  ShieldCheck,
  Receipt,
  Percent,
  Edit2,
  CheckCircle2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface OutletItem {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  isMain: boolean;
  taxType: string;
  taxRate: number | string;
  serviceChargeRate: number | string;
  isActive: boolean;
}

export default function OutletsPage() {
  const [outlets, setOutlets] = useState<OutletItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<OutletItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    phone: "",
    isMain: false,
    taxType: "PB1_10",
    taxRate: 10,
    serviceChargeRate: 5,
  });

  const fetchOutlets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/outlets");
      const data = await res.json();
      if (res.ok) {
        setOutlets(data.data || []);
      }
    } catch {
      toast.error("Gagal memuat data cabang");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutlets();
  }, []);

  const handleOpenAdd = () => {
    setEditingOutlet(null);
    setFormData({
      name: "",
      code: "",
      address: "",
      phone: "",
      isMain: outlets.length === 0,
      taxType: "PB1_10",
      taxRate: 10,
      serviceChargeRate: 5,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (outlet: OutletItem) => {
    setEditingOutlet(outlet);
    setFormData({
      name: outlet.name,
      code: outlet.code,
      address: outlet.address || "",
      phone: outlet.phone || "",
      isMain: outlet.isMain,
      taxType: outlet.taxType,
      taxRate: Number(outlet.taxRate),
      serviceChargeRate: Number(outlet.serviceChargeRate),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      toast.error("Nama dan kode cabang wajib diisi");
      return;
    }

    try {
      const url = "/api/outlets";
      const method = editingOutlet ? "PUT" : "POST";
      const body = editingOutlet
        ? { id: editingOutlet.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan cabang");

      toast.success(editingOutlet ? "Data cabang diperbarui" : "Cabang baru berhasil dibuat");
      setIsDialogOpen(false);
      fetchOutlets();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Building className="size-6 text-primary" />
            Manajemen Multi-Cabang & Outlet
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola profil outlet, kode fiskal operasional, tarif pajak lokal, dan service charge per unit bisnis.
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="shadow-sm">
          <Plus className="size-4 mr-2" /> Tambah Cabang
        </Button>
      </div>

      {/* Outlet Cards */}
      {loading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Memuat data cabang...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {outlets.map((outlet) => (
            <Card key={outlet.id} className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">{outlet.name}</CardTitle>
                    {outlet.isMain && (
                      <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold text-[10px] flex items-center gap-1">
                        <Star className="size-3 fill-amber-500 text-amber-500" /> Pusat (HQ)
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold text-muted-foreground">
                    KODE: {outlet.code}
                  </span>
                </div>
                <Badge variant={outlet.isActive ? "default" : "secondary"}>
                  {outlet.isActive ? "Aktif" : "Nonaktif"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-600">
                {outlet.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="line-clamp-2">{outlet.address}</span>
                  </div>
                )}
                {outlet.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-3.5 text-muted-foreground shrink-0" />
                    <span>{outlet.phone}</span>
                  </div>
                )}

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Regulasi Pajak:</span>
                    <span className="font-semibold text-slate-900">
                      {outlet.taxType === "PB1_10" ? "Pajak Restoran PB1 (10%)" : outlet.taxType === "PPN_11" ? "PPN Ritel (11%)" : "Bebas Pajak"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Service Charge:</span>
                    <span className="font-semibold text-slate-900">{outlet.serviceChargeRate}%</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => handleOpenEdit(outlet)}
                  >
                    <Edit2 className="size-3.5 mr-1" /> Konfigurasi Cabang
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingOutlet ? "Konfigurasi Cabang" : "Tambah Cabang Baru"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nama Cabang *</Label>
                <Input
                  placeholder="Contoh: Outlet Senopati"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kode Cabang *</Label>
                <Input
                  placeholder="JKT-01"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Alamat Lengkap</Label>
              <Input
                placeholder="Jl. Senopati No. 45, Jakarta Selatan"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Nomor Telepon Outlet</Label>
              <Input
                placeholder="021-5551234"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border">
              <div className="space-y-1.5">
                <Label>Tipe Pajak</Label>
                <Select
                  value={formData.taxType}
                  onValueChange={(val) => setFormData({ ...formData, taxType: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PB1_10">PB1 Pajak Resto (10%)</SelectItem>
                    <SelectItem value="PPN_11">PPN 11% (Ritel)</SelectItem>
                    <SelectItem value="NONE">Tanpa Pajak</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Service Charge (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.serviceChargeRate}
                  onChange={(e) => setFormData({ ...formData, serviceChargeRate: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isMainCheckbox"
                checked={formData.isMain}
                onChange={(e) => setFormData({ ...formData, isMain: e.target.checked })}
                className="size-4 rounded border-border"
              />
              <Label htmlFor="isMainCheckbox" className="text-xs cursor-pointer">
                Jadikan sebagai Cabang Utama (Pusat / HQ)
              </Label>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {editingOutlet ? "Simpan Perubahan" : "Buat Cabang"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
