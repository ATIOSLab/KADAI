"use client";

import { useState, useEffect } from "react";
import {
  Printer,
  Bluetooth,
  Usb,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { thermalPrinter, type PrinterConfig } from "@/lib/escpos/driver";

interface PrinterSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigChange?: (config: PrinterConfig) => void;
}

export function PrinterSettingsDialog({
  open,
  onOpenChange,
  onConfigChange,
}: PrinterSettingsDialogProps) {
  const [config, setConfig] = useState<PrinterConfig>({
    type: "none",
    deviceName: null,
    paperWidth: 58,
    kickDrawer: false,
  });
  const [loadingBt, setLoadingBt] = useState(false);
  const [loadingUsb, setLoadingUsb] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (open) {
      const cfg = thermalPrinter.loadConfig();
      setConfig(cfg);
    }
  }, [open]);

  const handleConnectBt = async () => {
    try {
      setLoadingBt(true);
      const name = await thermalPrinter.connectBluetooth();
      const updated = thermalPrinter.config;
      setConfig({ ...updated });
      onConfigChange?.(updated);
      toast.success(`Terhubung ke ${name}`);
    } catch (err: any) {
      toast.error(err?.message || "Gagal menghubungkan printer Bluetooth");
    } finally {
      setLoadingBt(false);
    }
  };

  const handleConnectUsb = async () => {
    try {
      setLoadingUsb(true);
      const name = await thermalPrinter.connectUsb();
      const updated = thermalPrinter.config;
      setConfig({ ...updated });
      onConfigChange?.(updated);
      toast.success(`Terhubung ke ${name}`);
    } catch (err: any) {
      toast.error(err?.message || "Gagal menghubungkan printer USB");
    } finally {
      setLoadingUsb(false);
    }
  };

  const handleDisconnect = () => {
    thermalPrinter.disconnect();
    const updated = thermalPrinter.config;
    setConfig({ ...updated });
    onConfigChange?.(updated);
    toast.info("Printer dinonaktifkan");
  };

  const handlePaperWidthChange = (val: string) => {
    const width = Number(val) as 58 | 80;
    thermalPrinter.saveConfig({ paperWidth: width });
    const updated = { ...config, paperWidth: width };
    setConfig(updated);
    onConfigChange?.(updated);
  };

  const handleTestPrint = async () => {
    try {
      setTesting(true);
      await thermalPrinter.printTest();
      toast.success("Uji coba cetak ESC/POS berhasil!");
    } catch (err: any) {
      toast.error(err?.message || "Gagal mencetak struk uji coba");
    } finally {
      setTesting(false);
    }
  };

  const isConnected = config.type !== "none" && !!config.deviceName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Printer className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Pengaturan Printer Kasir</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Koneksi langsung Web Bluetooth & WebUSB ESC/POS (Tanpa dialog browser)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status Box */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
            isConnected
              ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
              : "bg-slate-50 border-slate-200 text-slate-700"
          }`}>
            <div className="flex items-center gap-2.5">
              {isConnected ? (
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="size-4 text-slate-400 shrink-0" />
              )}
              <div>
                <p className="font-bold">
                  {isConnected ? config.deviceName : "Belum Ada Printer Terhubung"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isConnected
                    ? `Mode: ${config.type.toUpperCase()} • Kertas: ${config.paperWidth}mm`
                    : "Cetak default menggunakan jendela cetak sistem"}
                </p>
              </div>
            </div>

            {isConnected && (
              <Button
                variant="outline"
                size="xs"
                onClick={handleDisconnect}
                className="text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                Putuskan
              </Button>
            )}
          </div>

          {/* Connection Actions */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Hubungkan Printer Baru</Label>
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="outline"
                className="h-12 flex flex-col items-center justify-center gap-1 text-xs font-bold border-slate-300 hover:border-primary hover:text-primary transition-all"
                onClick={handleConnectBt}
                disabled={loadingBt}
              >
                {loadingBt ? (
                  <Loader2 className="size-4 animate-spin text-primary" />
                ) : (
                  <Bluetooth className="size-4 text-blue-600" />
                )}
                <span>Bluetooth POS</span>
              </Button>

              <Button
                variant="outline"
                className="h-12 flex flex-col items-center justify-center gap-1 text-xs font-bold border-slate-300 hover:border-primary hover:text-primary transition-all"
                onClick={handleConnectUsb}
                disabled={loadingUsb}
              >
                {loadingUsb ? (
                  <Loader2 className="size-4 animate-spin text-primary" />
                ) : (
                  <Usb className="size-4 text-slate-700" />
                )}
                <span>USB Thermal</span>
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              *Didukung di Google Chrome, Microsoft Edge, dan browser berbasis Chromium pada Windows, Mac, dan Android.
            </p>
          </div>

          {/* Paper Width Config */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <Label className="text-xs font-bold text-slate-700">Lebar Kertas Thermal Roll</Label>
            <Select
              value={String(config.paperWidth)}
              onValueChange={handlePaperWidthChange}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Pilih lebar kertas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="58">58 mm (Printer Mini / Mobile Bluetooth)</SelectItem>
                <SelectItem value="80">80 mm (Printer Desktop Kasir Besar / Standar)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Test Strip Action */}
          {isConnected && (
            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs font-bold gap-1.5 h-9"
                onClick={handleTestPrint}
                disabled={testing}
              >
                {testing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Printer className="size-3.5" />
                )}
                <span>Cetak Struk Uji Coba (Test Print)</span>
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-slate-100 pt-3">
          <Button
            variant="outline"
            className="w-full sm:w-auto text-xs"
            onClick={() => onOpenChange(false)}
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
