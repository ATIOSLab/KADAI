import { Metadata } from "next";

export const revalidate = 300;
import Link from "next/link";
import { Check } from "lucide-react";
import { LandingPageShell } from "@/components/landing/landing-page-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPlans, pricesByCycle, type PlanWithPrices } from "@/lib/plan-catalog";
import { TIER_PRICES } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import type { SubscriptionTier } from "@prisma/client";

export const metadata: Metadata = {
  title: "Paket Langganan & Harga Resmi",
  description:
    "Pilihan paket langganan resmi KADAI mulai dari Starter (Rp 0/bln), Professional (Rp 99.000/bln), Business Pro (Rp 249.000/bln), hingga Enterprise (Rp 599.000/bln). Transparan tanpa biaya tersembunyi.",
  alternates: {
    canonical: "https://kadai.asia/harga",
  },
  openGraph: {
    title: "Paket Langganan & Harga Resmi | KADAI",
    description:
      "Struktur paket langganan transparan: Starter Rp 0, Professional Rp 99rb (QR Meja F&B / Barcode & Alert Expired Ritel), Business Pro Rp 249rb (Resep BOM + KDS Dapur / Multi-Batch FIFO), dan Enterprise Rp 599rb.",
    url: "https://kadai.asia/harga",
    images: [{ url: "https://kadai.asia/og-image.png", width: 1200, height: 630 }],
  },
};

type DisplayPlan = {
  code: SubscriptionTier;
  name: string;
  badge: string;
  desc: string;
  monthlyPrice: number;
  features: string[];
  limits: Record<string, unknown>;
  cta: string;
  popular: boolean;
};

const DEFAULT_BADGES: Record<SubscriptionTier, string> = {
  FREE: "UMKM Pemula",
  STARTER: "Paling Fleksibel",
  PRO_BUSINESS: "Paling Populer",
  ENTERPRISE: "Skala Besar",
};

function ctaForCode(code: SubscriptionTier): string {
  if (code === "FREE") return "Mulai Gratis";
  if (code === "ENTERPRISE") return "Hubungi Enterprise";
  return "Coba Gratis 14 Hari";
}

const STATIC_PLANS: DisplayPlan[] = [
  {
    code: "FREE",
    name: "Starter",
    badge: DEFAULT_BADGES.FREE,
    desc: "Untuk usaha mikro atau rintisan yang baru memulai pencatatan kasir digital.",
    monthlyPrice: TIER_PRICES.FREE.MONTHLY,
    features: [
      "1 Gerai (Outlet) & 1 Akun Kasir",
      "Hingga 50 Produk SKU",
      "Pencatatan Penjualan Kasir Kilat",
      "Cetak Struk Thermal Bluetooth/USB",
      "Laporan Penjualan Harian",
    ],
    limits: { maxOutlets: 1, maxUsers: 1, maxProducts: 50 },
    cta: "Mulai Gratis",
    popular: false,
  },
  {
    code: "STARTER",
    name: "Professional",
    badge: DEFAULT_BADGES.STARTER,
    desc: "Untuk kedai kafe atau toko ritel aktif yang membutuhkan operasional 1 gerai tuntas.",
    monthlyPrice: TIER_PRICES.STARTER.MONTHLY,
    features: [
      "1 Gerai & Hingga 3 Akun Kasir",
      "Produk & Transaksi Tanpa Batas",
      "F&B: QR Meja & Pemesanan Mandiri",
      "Ritel: Barcode Scanner & Peringatan Kadaluwarsa",
      "Pembukuan Kas & Pajak SAK EMKM",
      "Ekspor Laporan Excel / CSV",
    ],
    limits: { maxOutlets: 1, maxUsers: 3 },
    cta: "Coba Gratis 14 Hari",
    popular: false,
  },
  {
    code: "PRO_BUSINESS",
    name: "Business Pro",
    badge: DEFAULT_BADGES.PRO_BUSINESS,
    desc: "Solusi lengkap bisnis berkembang dengan manajemen bahan baku resep, dapur, dan multi-cabang.",
    monthlyPrice: TIER_PRICES.PRO_BUSINESS.MONTHLY,
    features: [
      "Hingga 3 Gerai (Outlet)",
      "F&B: Resep Bahan Baku (BOM) & Layar Dapur KDS",
      "Ritel: Inventori Multi-Batch (FIFO & FEFO Asli)",
      "Transfer Stok Antar Outlet (Surat Jalan)",
      "Rekap PB1/PPN & PPh Final PP 55/2022",
      "Dukungan WhatsApp Prioritas",
    ],
    limits: { maxOutlets: 3, maxUsers: 10 },
    cta: "Coba Gratis 14 Hari",
    popular: true,
  },
  {
    code: "ENTERPRISE",
    name: "Enterprise",
    badge: DEFAULT_BADGES.ENTERPRISE,
    desc: "Untuk waralaba, grup resto, jaringan minimarket, atau sentra dapur pusat dengan multi-gudang.",
    monthlyPrice: TIER_PRICES.ENTERPRISE.MONTHLY,
    features: [
      "Outlet & Gudang Tak Terbatas",
      "Sentra Dapur Pusat (Central Kitchen)",
      "Routing Pesanan Antar-Sentra Produksi",
      "Rekonsiliasi Pajak Konsolidasi Grup",
      "Akses API Integrasi Kustom",
      "Dedicated Account Manager & SLA 99.9%",
    ],
    limits: { maxOutlets: -1, maxUsers: -1 },
    cta: "Hubungi Enterprise",
    popular: false,
  },
];

function toDisplayPlan(plan: PlanWithPrices): DisplayPlan {
  const prices = pricesByCycle(plan);
  const tier = plan.code as SubscriptionTier;
  return {
    code: tier,
    name: plan.name,
    badge: plan.badge || DEFAULT_BADGES[tier] || plan.name,
    desc: plan.description || "",
    monthlyPrice: prices.MONTHLY ?? TIER_PRICES[tier].MONTHLY,
    features: (plan.features as string[]) || [],
    limits: (plan.limits as Record<string, unknown>) || {},
    cta: ctaForCode(tier),
    popular: tier === "PRO_BUSINESS",
  };
}

function limitCell(plan: DisplayPlan, key: string, unit: string): string {
  const value = plan.limits[key];
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "number") {
    if (value <= 0) return "Tanpa Batas";
    return value === 1 ? `1 ${unit}` : `Hingga ${value} ${unit}`;
  }
  return String(value);
}

export default async function HargaPage() {
  let plans: DisplayPlan[] = [];
  try {
    const dbPlans = await getPlans();
    plans = dbPlans.length > 0 ? dbPlans.map(toDisplayPlan) : STATIC_PLANS;
  } catch {
    plans = STATIC_PLANS;
  }

  const allFeatures: string[] = [];
  for (const plan of plans) {
    for (const feature of plan.features) {
      if (!allFeatures.includes(feature)) allFeatures.push(feature);
    }
  }

  const matrixRows: { label: string; cells: string[] }[] = [
    {
      label: "Batas Jumlah Gerai (Outlet)",
      cells: plans.map((p) => limitCell(p, "maxOutlets", "Outlet")),
    },
    {
      label: "Batas Akun Kasir (User)",
      cells: plans.map((p) => limitCell(p, "maxUsers", "Akun Kasir")),
    },
    ...allFeatures.map((feature) => ({
      label: feature,
      cells: plans.map((p) => (p.features.includes(feature) ? "✓ Termasuk" : "—")),
    })),
  ];

  return (
    <LandingPageShell
      badgeText="TRANSPARAN TANPA BIAYA TERSEMBUNYI"
      title="Investasi Terjangkau untuk Pertumbuhan Bisnis Nyata"
      description="Pilih paket yang sesuai dengan skala usaha Anda. Tanpa kontrak jangka panjang yang mengikat, bebas upgrade atau downgrade kapan saja."
    >
      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.code}
            className={`flex flex-col h-full rounded-3xl transition-all duration-200 relative ${
              plan.popular
                ? "bg-white border-2 border-primary shadow-xl scale-[1.02] z-10"
                : "bg-white/80 backdrop-blur-md border border-slate-200/90 shadow-xs hover:shadow-md"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary hover:bg-primary text-white font-bold text-[11px] px-3 py-0.5 rounded-lg shadow-sm uppercase tracking-wider">
                  {plan.badge}
                </Badge>
              </div>
            )}

            <CardHeader className="pb-4 pt-6 space-y-2">
              {!plan.popular && (
                <Badge variant="secondary" className="w-fit text-[10px] font-semibold bg-slate-100 text-slate-600">
                  {plan.badge}
                </Badge>
              )}
              <CardTitle className="text-xl font-bold text-slate-950">
                {plan.name}
              </CardTitle>
              <div className="flex items-baseline gap-1 pt-2">
                <span className="text-3xl font-black tracking-tight text-slate-950">
                  {formatCurrency(plan.monthlyPrice)}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  /bulan
                </span>
              </div>
              <CardDescription className="text-xs text-slate-600 leading-relaxed pt-1">
                {plan.desc}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col flex-1 space-y-3 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Fitur Termasuk:
              </span>
              <ul className="space-y-2.5">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2 text-xs text-slate-700">
                    <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="pt-4 mt-auto">
              <Button
                asChild
                className={`w-full font-bold text-xs h-10 rounded-xl transition-all ${
                  plan.popular
                    ? "bg-primary text-white hover:bg-primary/90 shadow-md"
                    : "bg-slate-950 text-white hover:bg-slate-900"
                }`}
              >
                <Link href="/register">{plan.cta}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Feature Comparison Matrix Table */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-950">
            Matriks Perbandingan Lengkap
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Detail spesifikasi fitur antar paket langganan resmi KADAI.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-900">
                <th className="py-3 px-4 font-bold text-sm">Fitur & Modul</th>
                {plans.map((plan) => (
                  <th
                    key={plan.code}
                    className={`py-3 px-4 font-bold text-center ${plan.popular ? "text-primary" : ""}`}
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrixRows.map((row, rIdx) => (
                <tr key={rIdx}>
                  <td className="py-3 px-4 font-medium">{row.label}</td>
                  {row.cells.map((cell, cIdx) => {
                    const popular = plans[cIdx]?.popular;
                    const isCheck = cell.startsWith("✓");
                    const isDash = cell === "—";
                    let cellClass = "py-3 px-4 text-center";
                    if (isCheck) cellClass += " text-emerald-600 font-bold";
                    else if (isDash) cellClass += " text-slate-300";
                    else if (popular) cellClass += " font-bold text-primary";
                    return (
                      <td key={cIdx} className={cellClass}>
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </LandingPageShell>
  );
}
