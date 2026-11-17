import type { PricingRates } from "@/lib/pricing-rates";

/**
 * Pratinjau total untuk layar kasir (keranjang & dialog pembayaran).
 *
 * `calculateSaleTotals` di src/lib/pricing-rates.ts adalah perhitungan resmi
 * (Decimal, dipakai server saat menyimpan transaksi). Modul ini menghitung
 * angka yang sama dengan aritmetika JS biasa supaya Decimal (runtime Prisma)
 * tidak ikut ke bundel browser. Kedua implementasi diuji harus menghasilkan
 * angka yang sama - lihat tests/pricing-rates.test.ts.
 */
export interface PricingPreviewInput {
  subtotal: number;
  discountAmount?: number;
  rates: PricingRates;
}

export interface PricingPreviewTotals {
  netSubtotal: number;
  serviceCharge: number;
  taxAmount: number;
  roundingAmount: number;
  totalAmount: number;
}

export const DEFAULT_PRICING_RATES: PricingRates = {
  taxRate: 0,
  serviceChargeRate: 0,
  taxInclusive: false,
  enableRounding: true,
};

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function previewSaleTotals({
  subtotal,
  discountAmount = 0,
  rates,
}: PricingPreviewInput): PricingPreviewTotals {
  const netSubtotal = round2(subtotal - discountAmount);
  if (netSubtotal < 0) {
    return {
      netSubtotal,
      serviceCharge: 0,
      taxAmount: 0,
      roundingAmount: 0,
      totalAmount: netSubtotal,
    };
  }

  const serviceCharge =
    rates.serviceChargeRate > 0 ? round2((netSubtotal * rates.serviceChargeRate) / 100) : 0;
  const taxableBase = netSubtotal + serviceCharge;

  let taxAmount = 0;
  if (rates.taxRate > 0) {
    taxAmount = round2(
      rates.taxInclusive
        ? (taxableBase * rates.taxRate) / (100 + rates.taxRate)
        : (taxableBase * rates.taxRate) / 100
    );
  }

  const preRoundingTotal = rates.taxInclusive ? taxableBase : taxableBase + taxAmount;

  if (!rates.enableRounding) {
    return { netSubtotal, serviceCharge, taxAmount, roundingAmount: 0, totalAmount: preRoundingTotal };
  }

  const rounded = Math.round(preRoundingTotal / 100) * 100;

  return {
    netSubtotal,
    serviceCharge,
    taxAmount,
    roundingAmount: round2(rounded - preRoundingTotal),
    totalAmount: rounded,
  };
}
