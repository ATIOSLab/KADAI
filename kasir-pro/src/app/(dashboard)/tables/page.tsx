"use client";

import { useEffect, useState } from "react";
import {
  QrCode,
  Plus,
  Users,
  Utensils,
  ExternalLink,
  Trash2,
  Edit2,
  CheckCircle2,
  Copy,
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

interface TableItem {
  id: string;
  tableNo: string;
  section: string;
  capacity: number;
  qrToken: string;
  isOccupied: boolean;
  sales?: Array<{
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    customerName: string | null;
  }>;
}

export default function TablesPage() {
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedQR, setSelectedQR] = useState<TableItem | null>(null);

  // Form State
  const [tableNo, setTableNo] = useState("");
  const [section, setSection] = useState("Lantai 1");
  const [capacity, setCapacity] = useState("4");
  const [submitting, setSubmitting] = useState(false);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tables");
      const data = await res.json();
      if (res.ok) {
        setTables(data.data || []);
      }
    } catch {
      toast.error("Gagal memuat data meja");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNo.trim()) {
      toast.error("Nomor meja wajib diisi");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNo,
          section,
          capacity: Number(capacity) || 4,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal membuat meja");
        return;
      }

      toast.success(`Meja ${tableNo} berhasil ditambahkan`);
      setIsAddOpen(false);
      setTableNo("");
      fetchTables();
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus ${name}? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const res = await fetch(`/api/tables?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`${name} berhasil dihapus`);
        fetchTables();
      } else {
        toast.error("Gagal menghapus meja");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    }
  };

  const copyOrderLink = (token: string) => {
    const url = `${window.location.origin}/order/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link QR Order berhasil disalin ke clipboard!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Meja & QR Code Order</h1>
          <p className="text-sm text-muted-foreground">
            Kelola denah meja kafe/restoran dan sediakan pemesanan mandiri via scan QR code.
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="neo-border neo-shadow font-bold bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4 mr-2" />
          Tambah Meja Baru
        </Button>
      </div>

      {/* Grid of Tables */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <Card className="neo-border neo-shadow p-12 text-center">
          <Utensils className="size-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-bold">Belum Ada Meja Terdaftar</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Tambahkan nomor meja pertama untuk mulai menggunakan fitur F&B Dine-In dan Self-Order QR.
          </p>
          <Button onClick={() => setIsAddOpen(true)} className="neo-border neo-shadow font-bold">
            <Plus className="size-4 mr-2" /> Tambah Meja Pertama
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map((t) => {
            const orderUrl = typeof window !== "undefined" ? `${window.location.origin}/order/${t.qrToken}` : `/order/${t.qrToken}`;
            return (
              <Card
                key={t.id}
                className="neo-border neo-shadow bg-card hover:-translate-y-1 transition-all duration-200"
              >
                <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-black">{t.tableNo}</CardTitle>
                    <span className="text-xs font-semibold text-muted-foreground">{t.section}</span>
                  </div>
                  <Badge
                    variant={t.isOccupied ? "destructive" : "secondary"}
                    className="font-bold neo-border"
                  >
                    {t.isOccupied ? "Terisi" : "Tersedia"}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Users className="size-3.5" /> Kapasitas: {t.capacity} Orang
                    </span>
                    <span className="font-mono text-[11px] bg-muted px-2 py-0.5 rounded border border-border">
                      {t.qrToken}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedQR(t)}
                      className="neo-border text-xs font-bold"
                    >
                      <QrCode className="size-3.5 mr-1.5" />
                      Lihat QR
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyOrderLink(t.qrToken)}
                      className="neo-border text-xs font-bold"
                    >
                      <Copy className="size-3.5 mr-1.5" />
                      Salin Link
                    </Button>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-border/40">
                    <a
                      href={`/order/${t.qrToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      Buka Menu Mandiri <ExternalLink className="size-3" />
                    </a>
                    <button
                      onClick={() => handleDelete(t.id, t.tableNo)}
                      className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                      title="Hapus Meja"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Table Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md neo-border neo-shadow">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Tambah Meja Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTable} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="tableNo" className="font-bold">Nomor / Nama Meja</Label>
              <Input
                id="tableNo"
                placeholder="Contoh: Meja 05, VIP-1, Bar-2"
                value={tableNo}
                onChange={(e) => setTableNo(e.target.value)}
                required
                className="neo-border font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section" className="font-bold">Area / Lantai</Label>
              <Input
                id="section"
                placeholder="Contoh: Lantai 1, Outdoor, Rooftop"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="neo-border font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity" className="font-bold">Kapasitas Tamu (Kursi)</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                max="50"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="neo-border font-medium"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="neo-border font-bold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="neo-border neo-shadow font-bold bg-primary text-primary-foreground"
              >
                {submitting ? "Menyimpan..." : "Simpan Meja"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Code Preview Modal */}
      {selectedQR && (
        <Dialog open={!!selectedQR} onOpenChange={() => setSelectedQR(null)}>
          <DialogContent className="sm:max-w-md neo-border neo-shadow text-center">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">
                QR Code Self-Order: {selectedQR.tableNo}
              </DialogTitle>
            </DialogHeader>
            <div className="py-6 flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-white rounded-2xl neo-border neo-shadow">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    typeof window !== "undefined"
                      ? `${window.location.origin}/order/${selectedQR.qrToken}`
                      : ""
                  )}`}
                  alt={`QR Code ${selectedQR.tableNo}`}
                  className="size-52"
                />
              </div>
              <div className="text-center">
                <p className="font-black text-lg">{selectedQR.tableNo}</p>
                <p className="text-xs text-muted-foreground">{selectedQR.section} • Kapasitas {selectedQR.capacity} Tamu</p>
                <p className="text-xs font-mono text-muted-foreground mt-2 bg-muted p-2 rounded neo-border break-all">
                  {typeof window !== "undefined" ? `${window.location.origin}/order/${selectedQR.qrToken}` : ""}
                </p>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => copyOrderLink(selectedQR.qrToken)}
                className="w-full neo-border font-bold"
              >
                <Copy className="size-4 mr-2" /> Salin Link
              </Button>
              <Button
                onClick={() => window.print()}
                variant="outline"
                className="w-full neo-border font-bold"
              >
                Cetak Lembar Meja
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
