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
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-4 px-5 pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Printer className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">Pengaturan Printer Kasir</DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground">
                Koneksi langsung Web Bluetooth & WebUSB ESC/POS
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 px-5 space-y-3 overflow-y-auto">
          {/* Status Box */}
          <div className={`p-2.5 px-3 rounded-xl border flex items-center justify-between text-xs ${
            isConnected
              ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
              : "bg-slate-50 border-slate-200 text-slate-700"
          }`}>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="size-3.5 text-slate-400 shrink-0" />
              )}
              <div>
                <p className="font-bold text-xs leading-none">
                  {isConnected ? config.deviceName : "Belum Ada Printer Terhubung"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
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
                className="h-7 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 px-2"
              >
                Putuskan
              </Button>
            )}
          </div>

          {/* Connection Actions */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-800">Hubungkan Printer Baru</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`h-11 rounded-xl border flex items-center justify-center gap-2 px-2 transition-all cursor-pointer group ${
                  config.type === "bluetooth" && isConnected
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/30"
                    : "border-slate-200 bg-white hover:border-primary/50 hover:bg-slate-50 text-slate-800"
                }`}
                onClick={handleConnectBt}
                disabled={loadingBt}
              >
                {loadingBt ? (
                  <Loader2 className="size-4 animate-spin text-primary" />
                ) : (
                  <Bluetooth className={`size-4 transition-transform group-hover:scale-110 ${
                    config.type === "bluetooth" && isConnected ? "text-primary" : "text-slate-700"
                  }`} />
                )}
                <span className="text-xs font-bold">Bluetooth POS</span>
              </button>

              <button
                type="button"
                className={`h-11 rounded-xl border flex items-center justify-center gap-2 px-2 transition-all cursor-pointer group ${
                  config.type === "usb" && isConnected
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/30"
                    : "border-slate-200 bg-white hover:border-primary/50 hover:bg-slate-50 text-slate-800"
                }`}
                onClick={handleConnectUsb}
                disabled={loadingUsb}
              >
                {loadingUsb ? (
                  <Loader2 className="size-4 animate-spin text-primary" />
                ) : (
                  <Usb className={`size-4 transition-transform group-hover:scale-110 ${
                    config.type === "usb" && isConnected ? "text-primary" : "text-slate-700"
                  }`} />
                )}
                <span className="text-xs font-bold">USB Thermal</span>
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal">
              *Didukung di Chrome, Edge, dan Chromium pada Windows, Mac, dan Android.
            </p>
          </div>

          {/* Paper Width Config */}
          <div className="space-y-1 pt-1.5 border-t border-slate-100">
            <Label className="text-[11px] font-bold text-slate-800">Lebar Kertas Thermal Roll</Label>
            <Select
              value={String(config.paperWidth)}
              onValueChange={handlePaperWidthChange}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Pilih lebar kertas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="58">58 mm (Printer Mini RPP02 / Panda)</SelectItem>
                <SelectItem value="80">80 mm (Printer Standar Epson / Sunmi)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Test Strip Action */}
          {isConnected && (
            <div className="pt-1">
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs font-bold gap-1.5 h-8.5"
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

        <DialogFooter className="p-3 px-5 border-t border-slate-100 bg-muted/15 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto text-xs h-8"
            onClick={() => onOpenChange(false)}
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
