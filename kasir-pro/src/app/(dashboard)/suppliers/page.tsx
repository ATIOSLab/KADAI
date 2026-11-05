"use client";

import { useEffect, useState } from "react";
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  PackageCheck,
  Edit2,
  Building2,
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
import { toast } from "sonner";
import { CardGridSkeleton } from "@/components/shared/loading-skeleton";

interface SupplierItem {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  isActive: boolean;
  _count?: {
    batches: number;
  };
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/suppliers?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (res.ok) {
        setSuppliers(data.data || []);
      }
    } catch {
      toast.error("Gagal memuat data pemasok");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({ name: "", phone: "", email: "", address: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (sup: SupplierItem) => {
    setEditingSupplier(sup);
    setFormData({
      name: sup.name,
      phone: sup.phone || "",
      email: sup.email || "",
      address: sup.address || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Nama pemasok wajib diisi");
      return;
    }

    try {
      const url = "/api/suppliers";
      const method = editingSupplier ? "PUT" : "POST";
      const body = editingSupplier
        ? { id: editingSupplier.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan pemasok");

      toast.success(editingSupplier ? "Data pemasok berhasil diperbarui" : "Pemasok baru berhasil ditambahkan");
      setIsDialogOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleToggleStatus = async (sup: SupplierItem) => {
    try {
      const res = await fetch("/api/suppliers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sup.id, isActive: !sup.isActive }),
      });
      if (res.ok) {
        toast.success(`Status pemasok berhasil diubah`);
        fetchSuppliers();
      }
    } catch {
      toast.error("Gagal mengubah status");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Truck className="size-6 text-primary" />
            Manajemen Pemasok & Vendor
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola data vendor, histori pengiriman batch persediaan, dan kontak pembelian.
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="shadow-sm">
          <Plus className="size-4 mr-2" /> Tambah Pemasok
        </Button>
      </div>

      {/* Filter & Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari pemasok, telepon, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
      </div>

      {/* Supplier Grid / List */}
      {loading ? (
        <CardGridSkeleton count={3} />
      ) : suppliers.length === 0 ? (
        <Card className="p-12 text-center space-y-3 bg-card border-border">
          <Building2 className="size-12 mx-auto text-muted-foreground opacity-40" />
          <h3 className="font-bold text-base text-slate-800">Belum Ada Pemasok Terdaftar</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Daftarkan vendor bahan baku atau distributor barang ritel Anda untuk memudahkan pelacakan batch FIFO.
          </p>
          <Button onClick={handleOpenAdd} variant="outline" size="sm">
            <Plus className="size-3.5 mr-1.5" /> Tambah Sekarang
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((sup) => (
            <Card key={sup.id} className="border border-border bg-card hover:shadow-sm transition-shadow">
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">{sup.name}</CardTitle>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <PackageCheck className="size-3.5 text-emerald-600" />
                    {sup._count?.batches || 0} Batch Pasokan Tercatat
                  </span>
                </div>
                <Badge variant={sup.isActive ? "default" : "secondary"}>
                  {sup.isActive ? "Aktif" : "Nonaktif"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-600">
                {sup.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-3.5 text-muted-foreground" />
                    <span>{sup.phone}</span>
                  </div>
                )}
                {sup.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 text-muted-foreground" />
                    <span>{sup.email}</span>
                  </div>
                )}
                {sup.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3.5 text-muted-foreground" />
                    <span className="line-clamp-2">{sup.address}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8 text-slate-600 hover:text-slate-900"
                    onClick={() => handleOpenEdit(sup)}
                  >
                    <Edit2 className="size-3.5 mr-1" /> Ubah Data
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-xs h-8 ${sup.isActive ? "text-rose-600" : "text-emerald-600"}`}
                    onClick={() => handleToggleStatus(sup)}
                  >
                    {sup.isActive ? "Nonaktifkan" : "Aktifkan"}
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
              {editingSupplier ? "Perbarui Data Pemasok" : "Tambah Pemasok Baru"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Nama Pemasok / Perusahaan *</Label>
              <Input
                placeholder="Contoh: PT Sumber Pangan Makmur"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nomor Telepon / WA</Label>
                <Input
                  placeholder="08123456789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="order@supplier.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Alamat Lengkap</Label>
              <Input
                placeholder="Jl. Pergudangan No. 8, Jakarta Barat"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {editingSupplier ? "Simpan Perubahan" : "Tambahkan Pemasok"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
