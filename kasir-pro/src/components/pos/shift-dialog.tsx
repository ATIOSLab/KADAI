"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import {
  Receipt,
  Printer,
  Calculator,
  Lock,
} from "lucide-react";
import { soundEffects } from "@/lib/audio-effects";

interface ShiftSummaryData {
  store: { name: string; address: string | null; phone: string | null };
  cashier: { id: string; name: string; role: string } | null;
  shiftDate: string;
  firstTransactionTime: string | null;
  lastTransactionTime: string | null;
  totalTransactions: number;
  totalVoided: number;
  totalRevenue: number;
  totalTax: number;
  totalDiscount: number;
  totalServiceCharge: number;
  salesByPayment: {
    CASH: { count: number; total: number };
    QRIS: { count: number; total: number };
    BANK_TRANSFER: { count: number; total: number };
    E_WALLET: { count: number; total: number };
    TEMPO?: { count: number; total: number };
  };
}

export function ShiftDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [data, setData] = useState<ShiftSummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [startingCash, setStartingCash] = useState<string>("200000"); // default Rp 200.000
  const [actualCash, setActualCash] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"x-report" | "z-report">("x-report");
  const [closingSuccess, setClosingSuccess] = useState(false);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<{ data: ShiftSummaryData }>("/api/pos/shift-summary");
      setData(res.data);
    } catch {
      toast.error("Gagal memuat rekap shift");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      void loadSummary();
      setClosingSuccess(false);
    }
  }, [open]);

  const numStartingCash = parseFloat(startingCash) || 0;
  const cashSalesTotal = data?.salesByPayment.CASH.total || 0;
  const expectedCashDrawer = numStartingCash + cashSalesTotal;
  const numActualCash = parseFloat(actualCash) || 0;
  const cashVariance = numActualCash - expectedCashDrawer;

  const handlePrint = () => {
    soundEffects.playScannerBeep();
    window.print();
  };

  const handleCloseShift = async () => {
    if (!actualCash) {
      toast.error("Masukkan jumlah fisik uang tunai di laci");
      return;
    }

    try {
      setLoading(true);
      const res = await apiFetch<{ data: any }>("/api/pos/shift-summary", {
        method: "POST",
        body: {
          startingCash: numStartingCash,
          actualCash: numActualCash,
          notes,
        },
      });

      soundEffects.playCashRegisterDing();
      setClosingSuccess(true);
      toast.success("Shift kasir resmi ditutup (Z-Report tersimpan)");
    } catch {
      soundEffects.playWarningBuzz();
      toast.error("Gagal menutup shift");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="size-5 text-primary" />
              <span>Laporan Kas & Tutup Shift Kasir</span>
            </DialogTitle>
          </div>
        </DialogHeader>

        <DialogBody>
          {/* Subheader Tabs */}
          <div className="flex border-b border-border mb-4">
            <button
              onClick={() => setActiveTab("x-report")}
              className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "x-report"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Receipt className="size-3.5" />
              <span>X-Report (Kas Berjalan)</span>
            </button>
            <button
              onClick={() => setActiveTab("z-report")}
              className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "z-report"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Lock className="size-3.5" />
              <span>Z-Report (Tutup Shift)</span>
            </button>
          </div>

          {loading && !data ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Memuat data transaksi shift hari ini...
            </div>
          ) : !data ? (
            <div className="py-8 text-center text-xs text-destructive">
              Tidak dapat memuat ringkasan shift.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Modal Awal / Starting Cash */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="startingCash" className="font-bold text-slate-800">
                    Modal Kas Awal (Uang Kembalian):
                  </Label>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(numStartingCash)}
                  </span>
                </div>
                {!closingSuccess && (
                  <Input
                    id="startingCash"
                    type="number"
                    value={startingCash}
                    onChange={(e) => setStartingCash(e.target.value)}
                    placeholder="Contoh: 200000"
                    className="h-8 text-xs font-mono"
                  />
                )}
              </div>

              {/* Rekap Transaksi */}
              <div className="p-3.5 rounded-xl border border-border bg-card space-y-2.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <span className="font-bold text-foreground">Total Transaksi Selesai:</span>
                  <span className="font-mono font-bold text-base text-primary">
                    {data.totalTransactions} Nota ({formatCurrency(data.totalRevenue)})
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-200">
                    <span className="text-emerald-800 font-bold block">💵 Tunai (Cash)</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(data.salesByPayment.CASH.total)}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      {data.salesByPayment.CASH.count} Transaksi
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-200">
                    <span className="text-blue-800 font-bold block">📱 QRIS Dinamis</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(data.salesByPayment.QRIS.total)}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      {data.salesByPayment.QRIS.count} Transaksi
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-200">
                    <span className="text-purple-800 font-bold block">💳 Transfer / Kartu</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(data.salesByPayment.BANK_TRANSFER.total)}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      {data.salesByPayment.BANK_TRANSFER.count} Transaksi
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-200">
                    <span className="text-amber-800 font-bold block">🏦 Pajak Resto (PB1)</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(data.totalTax)}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      Diskon: -{formatCurrency(data.totalDiscount)}
                    </span>
                  </div>
                </div>

                {/* Expected Cash in Drawer */}
                <div className="p-2.5 rounded-lg bg-slate-900 text-white flex justify-between items-center text-xs mt-2">
                  <span>Kas Diharapkan di Laci (Modal + Tunai):</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {formatCurrency(expectedCashDrawer)}
                  </span>
                </div>
              </div>

              {/* Z-Report Shift Closing Form */}
              {activeTab === "z-report" && (
                <div className="p-3.5 rounded-xl border-2 border-primary/40 bg-card space-y-3 text-xs">
                  <div className="space-y-1">
                    <Label htmlFor="actualCash" className="font-bold text-slate-900">
                      Hitung Fisik Uang di Laci Kasir (Cash Count):
                    </Label>
                    <Input
                      id="actualCash"
                      type="number"
                      placeholder="Masukkan total fisik uang tunai di kasir"
                      value={actualCash}
                      onChange={(e) => setActualCash(e.target.value)}
                      disabled={closingSuccess}
                      className="font-mono font-bold text-base h-10"
                    />
                  </div>

                  {actualCash && (
                    <div
                      className={`p-2.5 rounded-lg border text-xs flex justify-between items-center ${
                        cashVariance === 0
                          ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                          : cashVariance > 0
                          ? "bg-blue-50 border-blue-300 text-blue-900"
                          : "bg-rose-50 border-rose-300 text-rose-900"
                      }`}
                    >
                      <span className="font-bold">
                        {cashVariance === 0
                          ? "✅ Saldo Kas Pas (Balanced)"
                          : cashVariance > 0
                          ? "📈 Saldo Kas Lebih (Surplus)"
                          : "⚠️ Saldo Kas Kurang (Shortage)"}
                      </span>
                      <span className="font-mono font-black text-sm">
                        {formatCurrency(Math.abs(cashVariance))}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="shiftNotes" className="text-muted-foreground text-[11px]">
                      Catatan Shift (Opsional):
                    </Label>
                    <Textarea
                      id="shiftNotes"
                      placeholder="Catatan kendala shift, serah terima, atau voucher manual..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={closingSuccess}
                      className="text-xs h-16"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hidden Thermal Slip for @media print */}
          <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-4 font-mono text-[12px] text-black">
            <div className="text-center pb-2 border-b border-dashed border-black">
              <p className="font-bold text-sm uppercase">{data?.store.name ?? "KADAI POS"}</p>
              <p className="text-[10px]">{data?.store.address ?? "Indonesia"}</p>
              <p className="font-bold mt-1 text-[11px]">
                {activeTab === "z-report" || closingSuccess
                  ? "*** BERITA ACARA TUTUP SHIFT (Z-REPORT) ***"
                  : "*** LAPORAN KAS BERJALAN (X-REPORT) ***"}
              </p>
            </div>

            <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Tanggal/Jam:</span>
                <span>{new Date().toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{data?.cashier?.name ?? "Kasir"}</span>
              </div>
              <div className="flex justify-between">
                <span>Transaksi:</span>
                <span>{data?.totalTransactions} Nota</span>
              </div>
            </div>

            <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
              <div className="flex justify-between font-bold">
                <span>Total Omzet:</span>
                <span>{formatCurrency(data?.totalRevenue ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>- Tunai:</span>
                <span>{formatCurrency(data?.salesByPayment.CASH.total ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>- QRIS:</span>
                <span>{formatCurrency(data?.salesByPayment.QRIS.total ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>- Transfer/Bank:</span>
                <span>{formatCurrency(data?.salesByPayment.BANK_TRANSFER.total ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>- Pajak PB1 10%:</span>
                <span>{formatCurrency(data?.totalTax ?? 0)}</span>
              </div>
            </div>

            <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Modal Awal Kas:</span>
                <span>{formatCurrency(numStartingCash)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total Kas Fisik:</span>
                <span>{formatCurrency(numActualCash || expectedCashDrawer)}</span>
              </div>
              <div className="flex justify-between">
                <span>Selisih Kas:</span>
                <span>{formatCurrency(cashVariance)}</span>
              </div>
            </div>

            <div className="pt-6 grid grid-cols-2 text-center text-[10px]">
              <div>
                <p>Kasir Bertugas,</p>
                <div className="h-10" />
                <p className="border-t border-black pt-1">({data?.cashier?.name ?? "Kasir"})</p>
              </div>
              <div>
                <p>Supervisor / Manager,</p>
                <div className="h-10" />
                <p className="border-t border-black pt-1">( ........................ )</p>
              </div>
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-bold"
          >
            <Printer className="size-3.5" />
            <span>Cetak Struk Thermal (58/80mm)</span>
          </Button>

          {activeTab === "z-report" && !closingSuccess && (
            <Button
              size="sm"
              onClick={handleCloseShift}
              disabled={loading || !actualCash}
              className="text-xs font-bold bg-primary text-primary-foreground shadow-sm"
            >
              <Lock className="size-3.5 mr-1" />
              <span>Kunci & Tutup Shift Sekarang</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
