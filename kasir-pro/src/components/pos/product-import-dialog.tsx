"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface ParsedProduct {
  name: string;
  sku?: string;
  barcode?: string;
  categoryName?: string;
  price: number;
  costPrice?: number;
  initialStock?: number;
  unit?: string;
}

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ProductImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedProduct[]>([]);
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simple CSV & Tab Delimited Parser with Smart Column Detection
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsing(true);
    setImportSummary(null);

    try {
      const text = await selectedFile.text();
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        throw new Error("Berkas kosong atau tidak memiliki baris data produk.");
      }

      // Deteksi delimiter (, atau ; atau \t)
      const firstLine = lines[0];
      const delimiter = firstLine.includes(";")
        ? ";"
        : firstLine.includes("\t")
        ? "\t"
        : ",";

      const headers = firstLine
        .split(delimiter)
        .map((h) => h.replace(/^["']|["']$/g, "").trim().toLowerCase());

      // Smart Mapping Index
      const nameIdx = headers.findIndex(
        (h) =>
          h.includes("nama") ||
          h.includes("name") ||
          h.includes("produk") ||
          h.includes("item")
      );
      const priceIdx = headers.findIndex(
        (h) =>
          h.includes("harga jual") ||
          h.includes("price") ||
          h.includes("jual") ||
          h.includes("selling")
      );
      const costIdx = headers.findIndex(
        (h) =>
          h.includes("hpp") ||
          h.includes("modal") ||
          h.includes("cost") ||
          h.includes("harga beli")
      );
      const stockIdx = headers.findIndex(
        (h) =>
          h.includes("stok") ||
          h.includes("stock") ||
          h.includes("qty") ||
          h.includes("jumlah")
      );
      const categoryIdx = headers.findIndex(
        (h) => h.includes("kategori") || h.includes("category")
      );
      const skuIdx = headers.findIndex(
        (h) => h.includes("sku") || h.includes("kode") || h.includes("code")
      );
      const barcodeIdx = headers.findIndex(
        (h) => h.includes("barcode") || h.includes("upc")
      );

      if (nameIdx === -1 || priceIdx === -1) {
        throw new Error(
          "Gagal memetakan kolom. Pastikan berkas memiliki kolom 'Nama Produk' dan 'Harga Jual'."
        );
      }

      const items: ParsedProduct[] = [];

      for (let i = 1; i < lines.length; i++) {
        // Safe split respect quotes
        const rawRow = lines[i].split(delimiter);
        if (rawRow.length <= nameIdx) continue;

        const cleanVal = (idx: number) =>
          idx !== -1 && rawRow[idx]
            ? rawRow[idx].replace(/^["']|["']$/g, "").trim()
            : "";

        const name = cleanVal(nameIdx);
        if (!name) continue;

        const rawPrice = cleanVal(priceIdx).replace(/[^0-9.]/g, "");
        const price = Number(rawPrice) || 0;

        const rawCost = cleanVal(costIdx).replace(/[^0-9.]/g, "");
        const costPrice = rawCost ? Number(rawCost) : 0;

        const rawStock = cleanVal(stockIdx).replace(/[^0-9.]/g, "");
        const initialStock = rawStock ? Number(rawStock) : 0;

        items.push({
          name,
          price,
          costPrice,
          initialStock,
          sku: cleanVal(skuIdx) || undefined,
          barcode: cleanVal(barcodeIdx) || undefined,
          categoryName: cleanVal(categoryIdx) || "Umum",
          unit: "pcs",
        });
      }

      setParsedItems(items);
      toast.success(`${items.length} produk siap diimpor dari berkas.`);
    } catch (err: any) {
      toast.error(err.message || "Gagal membaca berkas.");
      setParsedItems([]);
    } finally {
      setParsing(false);
    }
  };

  const handleExecuteImport = async () => {
    if (parsedItems.length === 0) return;
    setSubmitting(true);
    try {
      const res = await apiFetch<{
        data: { importedCount: number; skippedCount: number; errors: string[] };
      }>("/api/products/import-batch", {
        method: "POST",
        body: JSON.stringify({
          products: parsedItems,
        }),
      });

      setImportSummary({
        imported: res.data.importedCount,
        skipped: res.data.skippedCount,
        errors: res.data.errors,
      });

      toast.success(
        `Sukses! ${res.data.importedCount} produk berhasil masuk ke katalog KADAI.`
      );
      onSuccess();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Gagal mengeksekusi impor data.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedItems([]);
    setImportSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-orange-100 text-primary flex items-center justify-center">
              <UploadCloud className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Migrasi Cepat & Impor Produk
              </DialogTitle>
              <DialogDescription className="text-xs">
                Pindahkan data produk & stok dari aplikasi kasir sebelumnya atau Excel lama tanpa ribet.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!importSummary ? (
          <div className="space-y-4 py-2">
            {/* File Upload Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-primary/60 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50 flex flex-col items-center justify-center space-y-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.xlsx"
                className="hidden"
                onChange={handleFileUpload}
              />
              <UploadCloud className="size-10 text-slate-400" />
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {file ? file.name : "Klik untuk memilih berkas CSV / Excel Ekspor"}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Mendukung ekspor langsung dari aplikasi kasir sebelumnya atau spreadsheet CSV/Excel.
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] bg-white border-slate-200">
                Deteksi Otomatis: Nama, SKU, Kategori, Harga Jual & HPP
              </Badge>
            </div>

            {/* Preview Box */}
            {parsedItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span>{parsedItems.length} Produk Terdeteksi</span>
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Siap dialihkan ke katalog KADAI
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs bg-white">
                  {parsedItems.slice(0, 10).map((it, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <div className="min-w-0 pr-4">
                        <span className="font-semibold text-slate-900 block truncate">
                          {it.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {it.categoryName || "Umum"} {it.sku ? `• SKU: ${it.sku}` : ""}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-primary block">
                          {formatCurrency(it.price)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Stok: {it.initialStock || 0} {it.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                  {parsedItems.length > 10 && (
                    <div className="p-2 text-center text-[11px] text-slate-400 font-medium bg-slate-50">
                      + {parsedItems.length - 10} produk lainnya...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Result Summary */
          <div className="space-y-4 py-4 text-center">
            <div className="size-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <CheckCircle2 className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-950">
                Migrasi Produk Selesai!
              </h3>
              <p className="text-xs text-slate-600">
                {importSummary.imported} produk baru berhasil dimasukkan ke katalog toko Anda.
              </p>
              {importSummary.skipped > 0 && (
                <p className="text-[11px] text-amber-600 font-medium">
                  {importSummary.skipped} produk dilewati (SKU sudah terdaftar).
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {!importSummary ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={submitting || parsing}
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleExecuteImport}
                disabled={parsedItems.length === 0 || submitting || parsing}
                className="bg-primary text-white font-bold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    Memproses Migrasi...
                  </>
                ) : (
                  <>
                    <span>Mulai Migrasi ke KADAI</span>
                    <ArrowRight className="size-3.5 ml-1.5" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                handleReset();
                onOpenChange(false);
              }}
              className="w-full bg-slate-950 text-white font-bold"
            >
              Selesai & Buka Katalog
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
