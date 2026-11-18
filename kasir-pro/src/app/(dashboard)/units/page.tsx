"use client";

import { useCallback, useEffect, useState } from "react";
import { Ruler, Plus, Edit2, Trash2, Info } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface UnitItem {
  id: string;
  name: string;
  normalizedName: string;
  storeId: string | null;
  dipakai: number;
  bisaDiubah: boolean;
}

/**
 * Halaman Satuan.
 *
 * Satuan adalah data induk yang dipakai setiap produk, tetapi sebelumnya hanya
 * bisa ditambah - tidak ada tempat untuk mengganti nama atau menghapusnya, dan
 * tidak ada satu pun layar yang menampilkan satuan mana yang sudah dipakai
 * berapa produk. Akibatnya salah tulis ("pcs" vs "Pcs" vs "buah") menumpuk dan
 * laporan stok terpecah.
 */
export default function UnitsPage() {
  const confirm = useConfirm();
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UnitItem | null>(null);
  const [nama, setNama] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);

  const fetchUnits = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/units", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setUnits(data.data || []);
      else toast.error(data.error || "Gagal memuat daftar satuan");
    } catch {
      toast.error("Gagal memuat daftar satuan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const bukaTambah = () => {
    setEditing(null);
    setNama("");
    setDialogOpen(true);
  };

  const bukaUbah = (unit: UnitItem) => {
    setEditing(unit);
    setNama(unit.name);
    setDialogOpen(true);
  };

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    const bersih = nama.trim();
    if (!bersih) {
      toast.error("Nama satuan wajib diisi");
      return;
    }

    try {
      setMenyimpan(true);
      const res = editing
        ? await fetch("/api/units", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editing.id, name: bersih }),
          })
        : await fetch("/api/units", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: bersih }),
          });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan satuan");
        return;
      }
      toast.success(data.message || (editing ? "Satuan diperbarui" : "Satuan ditambahkan"));
      setDialogOpen(false);
      fetchUnits();
    } catch {
      toast.error("Gagal menyimpan satuan");
    } finally {
      setMenyimpan(false);
    }
  };

  const hapus = async (unit: UnitItem) => {
    if (unit.dipakai > 0) {
      toast.error(`Satuan "${unit.name}" masih dipakai ${unit.dipakai} produk`);
      return;
    }
    const setuju = await confirm(
      `Satuan "${unit.name}" akan dihapus dari daftar. Produk tidak terpengaruh karena tidak ada yang memakainya.`,
      { title: "Hapus satuan?", confirmLabel: "Ya, hapus", variant: "danger" }
    );
    if (!setuju) return;

    try {
      const res = await fetch(`/api/units?id=${encodeURIComponent(unit.id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Gagal menghapus satuan");
        return;
      }
      toast.success(data.message || "Satuan dihapus");
      fetchUnits();
    } catch {
      toast.error("Gagal menghapus satuan");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Satuan & Kemasan"
        description="Daftar satuan yang bisa dipilih saat membuat produk. Ganti nama di sini dan semua produk yang memakainya ikut berubah."
        icon={Ruler}
      >
        <Button onClick={bukaTambah} className="shadow-sm">
          <Plus className="size-4 mr-1.5" /> Tambah Satuan
        </Button>
      </PageHeader>

      <Card className="p-4 border-amber-200 bg-amber-50/60">
        <div className="flex gap-2 text-xs text-amber-900">
          <Info className="size-4 shrink-0 mt-0.5" />
          <p>
            Satuan <strong>bawaan platform</strong> hanya bisa dipakai, tidak bisa diubah atau dihapus. Satuan yang
            masih dipakai produk tidak bisa dihapus - pindahkan produknya ke satuan lain terlebih dahulu.
          </p>
        </div>
      </Card>

      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : units.length === 0 ? (
        <EmptyState
          icon={Ruler}
          title="Belum ada satuan"
          description="Tambahkan satuan pertama, misalnya pcs, kg, atau gelas."
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-3 px-4">Nama Satuan</th>
                <th className="py-3 px-4 text-center">Dipakai Produk</th>
                <th className="py-3 px-4 text-center">Sumber</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr key={unit.id} className="border-b last:border-0 hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-semibold text-slate-900">{unit.name}</td>
                  <td className="py-3 px-4 text-center font-mono tabular-nums">
                    {unit.dipakai > 0 ? `${unit.dipakai} produk` : <span className="text-slate-400">belum dipakai</span>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={unit.bisaDiubah ? "default" : "secondary"} className="text-[10px]">
                      {unit.bisaDiubah ? "Milik Anda" : "Bawaan Platform"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        disabled={!unit.bisaDiubah}
                        title={unit.bisaDiubah ? undefined : "Satuan bawaan platform tidak bisa diubah"}
                        onClick={() => bukaUbah(unit)}
                      >
                        <Edit2 className="size-3.5 mr-1" /> Ubah
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 text-rose-600 hover:text-rose-700"
                        disabled={!unit.bisaDiubah}
                        title={
                          unit.bisaDiubah
                            ? unit.dipakai > 0
                              ? `Masih dipakai ${unit.dipakai} produk`
                              : undefined
                            : "Satuan bawaan platform tidak bisa dihapus"
                        }
                        onClick={() => hapus(unit)}
                      >
                        <Trash2 className="size-3.5 mr-1" /> Hapus
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <form onSubmit={simpan}>
            <DialogHeader>
              <DialogTitle>{editing ? "Ubah Nama Satuan" : "Tambah Satuan"}</DialogTitle>
              <DialogDescription>
                {editing
                  ? "Semua produk yang memakai satuan ini akan ikut memakai nama baru."
                  : "Nama pendek yang dikenali kasir, misalnya pcs, kg, atau gelas."}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <Label htmlFor="nama-satuan">Nama Satuan *</Label>
              <Input
                id="nama-satuan"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="pcs"
                maxLength={50}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={menyimpan}>
                {menyimpan ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}