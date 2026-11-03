"use client";

import { useEffect, useState } from "react";
import {
  Scale,
  Receipt,
  FileText,
  Calendar,
  Download,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface MonthlyData {
  monthIndex: number;
  monthName: string;
  transactionCount: number;
  grossRevenue: number;
  serviceCharge: number;
  taxCollected: number;
  totalHPP: number;
  grossProfit: number;
  pphFinal: number;
}

export default function TaxSummaryPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    summary: MonthlyData[];
    totals: any;
    store: any;
  } | null>(null);

  const fetchTaxData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/finance/tax-summary?year=${year}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        toast.error("Gagal memuat rekapitulasi perpajakan");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxData();
  }, [year]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Scale className="size-6 text-primary" /> Pajak & Standar SAK EMKM Indonesia
          </h1>
          <p className="text-sm text-muted-foreground">
            Buku Peredaran Bruto Bulanan, Rekap Pajak PPN/PB1, dan Kepatuhan PPh Final 0.5% (PP 55/2022).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e: any) => setYear(Number(e.target.value))}
            className="h-10 px-3 rounded-xl neo-border bg-card text-xs font-bold"
          >
            <option value={2026}>Tahun Pajak 2026</option>
            <option value={2025}>Tahun Pajak 2025</option>
            <option value={2024}>Tahun Pajak 2024</option>
          </select>
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="neo-border font-bold text-xs"
          >
            <Download className="size-3.5 mr-1.5" /> Cetak Rekap Pajak
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-border shadow-sm bg-card p-4 space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Omzet Bruto ({year})
            </span>
            <p className="text-2xl font-black text-foreground tabular-nums">
              Rp {data.totals.totalGrossRevenue.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-muted-foreground">Dasar Perhitungan Pajak (DPP)</p>
          </Card>

          <Card className="border border-border shadow-sm bg-card p-4 space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Pajak Terpungut ({data.store.taxType})
            </span>
            <p className="text-2xl font-black text-slate-800 tabular-nums">
              Rp {data.totals.totalTaxCollected.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-muted-foreground">Titipan Pajak Terhitung</p>
          </Card>

          <Card className="border border-border shadow-sm bg-card p-4 space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total HPP FIFO Persediaan
            </span>
            <p className="text-2xl font-black text-destructive tabular-nums">
              Rp {data.totals.totalHPP.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-muted-foreground">Biaya Pokok Riil Bahan/Barang</p>
          </Card>

          <Card className="border border-border shadow-sm bg-card p-4 space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Estimasi PPh Final 0.5%
            </span>
            <p className="text-2xl font-black text-primary tabular-nums">
              Rp {data.totals.totalPphFinal.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-emerald-600 font-bold">
              {data.totals.totalGrossRevenue <= 500_000_000
                ? "Bebas Pajak (PTKP < Rp 500jt)"
                : "Tarif 0.5% PP 55/2022"}
            </p>
          </Card>
        </div>
      )}

      {/* Monthly Breakdown Table */}
      <Card className="border border-border shadow-sm bg-card overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-3">
          <CardTitle className="text-base font-bold flex items-center justify-between">
            <span>Buku Peredaran Bruto Bulanan (Januari - Desember {year})</span>
            <Badge variant="outline" className="font-bold text-xs">
              SAK EMKM Compliant
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm font-bold text-muted-foreground animate-pulse">
              Memuat data pembukuan...
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border font-black text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="p-3">Bulan</th>
                  <th className="p-3 text-center">Transaksi</th>
                  <th className="p-3 text-right">Omzet Bruto</th>
                  <th className="p-3 text-right">Pajak (PB1/PPN)</th>
                  <th className="p-3 text-right">HPP FIFO</th>
                  <th className="p-3 text-right">Laba Kotor</th>
                  <th className="p-3 text-right">PPh Final 0.5%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {data?.summary.map((m) => (
                  <tr key={m.monthIndex} className="hover:bg-muted/20">
                    <td className="p-3 font-bold">{m.monthName}</td>
                    <td className="p-3 text-center">{m.transactionCount}</td>
                    <td className="p-3 text-right font-semibold">
                      Rp {m.grossRevenue.toLocaleString("id-ID")}
                    </td>
                    <td className="p-3 text-right text-accent-secondary font-semibold">
                      Rp {m.taxCollected.toLocaleString("id-ID")}
                    </td>
                    <td className="p-3 text-right text-destructive">
                      Rp {m.totalHPP.toLocaleString("id-ID")}
                    </td>
                    <td className="p-3 text-right text-accent-success font-bold">
                      Rp {m.grossProfit.toLocaleString("id-ID")}
                    </td>
                    <td className="p-3 text-right text-primary font-bold">
                      Rp {m.pphFinal.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/80 border-t-2 border-border font-black text-xs">
                <tr>
                  <td className="p-3">TOTAL {year}</td>
                  <td className="p-3 text-center">
                    {data?.summary.reduce((s: number, m: any) => s + m.transactionCount, 0)}
                  </td>
                  <td className="p-3 text-right">
                    Rp {data?.totals.totalGrossRevenue.toLocaleString("id-ID")}
                  </td>
                  <td className="p-3 text-right text-accent-secondary">
                    Rp {data?.totals.totalTaxCollected.toLocaleString("id-ID")}
                  </td>
                  <td className="p-3 text-right text-destructive">
                    Rp {data?.totals.totalHPP.toLocaleString("id-ID")}
                  </td>
                  <td className="p-3 text-right text-accent-success">
                    Rp {data?.totals.totalGrossProfit.toLocaleString("id-ID")}
                  </td>
                  <td className="p-3 text-right text-primary">
                    Rp {data?.totals.totalPphFinal.toLocaleString("id-ID")}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
