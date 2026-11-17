import { Decimal } from "@prisma/client/runtime/library";

/**
 * Satu sumber kebenaran untuk tarif pajak (PB1) & service charge.
 *
 * Sebelumnya POS membaca tarif hanya dari `Store`, sementara halaman Cabang
 * (satu-satunya tempat tarif ini bisa diatur di UI) menyimpan tarif di `Outlet`.
 * Akibatnya cabang dengan PB1 10% + service 5% tidak pernah memungut keduanya,
 * dan menu QR publik malah memakai default 10/5 yang tidak pernah ditagih.
 */
export interface PricingRateSource {
  taxRate?: Decimal | number | string | null;
  serviceChargeRate?: Decimal | number | string | null;
  taxInclusive?: boolean | null;
  enableRounding?: boolean | null;
}

export interface PricingRates {
  taxRate: number;
  serviceChargeRate: number;
  taxInclusive: boolean;
  enableRounding: boolean;
}

type RateValue = Decimal | number | string | null | undefined;

function toRate(value: RateValue): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Tarif cabang menang atas tarif toko. Angka 0 tetap dihormati ("tanpa PB1" /
 * "tanpa service charge") — jangan diganti default, karena itu membuat struk
 * berbeda dari pengaturan yang terlihat pengguna.
 */
export function resolvePricingRates(options: {
  outlet?: PricingRateSource | null;
  store?: PricingRateSource | null;
}): PricingRates {
  const { outlet, store } = options;

  return {
    taxRate: toRate(outlet?.taxRate) ?? toRate(store?.taxRate) ?? 0,
    serviceChargeRate:
      toRate(outlet?.serviceChargeRate) ?? toRate(store?.serviceChargeRate) ?? 0,
    taxInclusive: outlet?.taxInclusive ?? store?.taxInclusive ?? false,
    enableRounding: outlet?.enableRounding ?? store?.enableRounding ?? true,
  };
}

export interface SaleTotalsInput {
  /** Subtotal barang sebelum diskon (dan setelah diskon per baris). */
  subtotal: Decimal | number | string;
  discountAmount?: Decimal | number | string | null;
  rates: PricingRates;
}

export interface SaleTotals {
  netSubtotal: Decimal;
  serviceCharge: Decimal;
  taxAmount: Decimal;
  roundingAmount: Decimal;
  totalAmount: Decimal;
}

/**
 * Hitung service charge, PB1, pembulatan, dan total akhir.
 * Dipakai checkout POS dan pratinjau keranjang supaya angka di layar kasir
 * sama dengan angka di struk.
 */
export function calculateSaleTotals({
  subtotal,
  discountAmount = 0,
  rates,
}: SaleTotalsInput): SaleTotals {
  const netSubtotal = new Decimal(subtotal).sub(new Decimal(discountAmount ?? 0));
  if (netSubtotal.isNegative()) {
    throw new Error("Diskon melebihi nilai transaksi");
  }

  const serviceCharge =
    rates.serviceChargeRate > 0
      ? netSubtotal.mul(rates.serviceChargeRate).div(100)
      : new Decimal(0);

  const taxableBase = netSubtotal.add(serviceCharge);
  let taxAmount = new Decimal(0);

  if (rates.taxRate > 0) {
    // Pajak inklusif: harga barang sudah termasuk PB1, jadi dari basis kotor.
    taxAmount = rates.taxInclusive
      ? taxableBase.mul(rates.taxRate).div(100 + rates.taxRate)
      : taxableBase.mul(rates.taxRate).div(100);
  }

  const preRoundingTotal = rates.taxInclusive ? taxableBase : taxableBase.add(taxAmount);
  if (!rates.enableRounding) {
    return {
      netSubtotal,
      serviceCharge,
      taxAmount,
      roundingAmount: new Decimal(0),
      totalAmount: preRoundingTotal,
    };
  }

  const rounded = new Decimal(Math.round(Number(preRoundingTotal) / 100) * 100);

  return {
    netSubtotal,
    serviceCharge,
    taxAmount,
    roundingAmount: rounded.sub(preRoundingTotal),
    totalAmount: rounded,
  };
}

/**
 * Laba kotor = pendapatan usaha (setelah diskon + service charge) - HPP.
 * PB1 tidak dihitung karena uang itu titipan negara yang hanya lewat di kas.
 */
export function calculateGrossProfit(totals: SaleTotals, totalCost: Decimal | number | string): Decimal {
  return totals.netSubtotal.add(totals.serviceCharge).sub(new Decimal(totalCost));
}
