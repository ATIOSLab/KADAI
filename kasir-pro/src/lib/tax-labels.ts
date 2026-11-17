import type { TaxType } from "@prisma/client";

/**
 * Label manusiawi untuk kode pajak yang tersimpan di database.
 *
 * Halaman rekap pajak dulu mencetak kode mentah apa adanya, sehingga pemilik
 * melihat "Pajak Terpungut (NONE)" pada bulan yang justru memungut PB1 —
 * karena rekap membaca tarif `Store` (default NONE) sementara kasir memakai
 * tarif `Outlet` (default PB1_10). Label di sini selalu menyebut angka tarif
 * agar cocok dengan yang benar-benar ditagih di struk.
 */
export function describeTaxType(
  taxType: string | null | undefined,
  rate?: number | string | null
): string {
  const numericRate = Number(rate ?? 0);
  const hasRate = Number.isFinite(numericRate) && numericRate > 0;

  switch (taxType) {
    case "PB1_10":
      return hasRate && numericRate !== 10 ? `PB1 ${formatRate(numericRate)}%` : "PB1 10%";
    case "PPN_11":
      return hasRate && numericRate !== 11 ? `PPN ${formatRate(numericRate)}%` : "PPN 11%";
    case "PPN_12":
      return hasRate && numericRate !== 12 ? `PPN ${formatRate(numericRate)}%` : "PPN 12%";
    case "CUSTOM":
      return hasRate ? `Pajak ${formatRate(numericRate)}%` : "Pajak kustom";
    case "NONE":
      return hasRate ? `Pajak ${formatRate(numericRate)}%` : "Tanpa pajak";
    default:
      return hasRate ? `Pajak ${formatRate(numericRate)}%` : "Tanpa pajak";
  }
}

function formatRate(rate: number): string {
  return Number.isInteger(rate) ? String(rate) : rate.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

/**
 * Satu label untuk seluruh cabang dalam cakupan laporan. Bila cabang memakai
 * tarif berbeda, jangan menampilkan salah satu saja — nyatakan campuran agar
 * pemilik memeriksa konfigurasi cabangnya.
 */
export function describeEffectiveTaxProfile(
  outlets: Array<{ taxType: string; taxRate: number | string }>
): { taxType: string; label: string; rate: number; mixed: boolean } {
  if (outlets.length === 0) {
    return { taxType: "NONE", label: "Tanpa pajak", rate: 0, mixed: false };
  }

  const signatures = new Set(
    outlets.map((o) => `${o.taxType}:${Number(o.taxRate).toFixed(2)}`)
  );
  const first = outlets[0];
  const rate = Number(first.taxRate);

  if (signatures.size === 1) {
    return {
      taxType: first.taxType,
      label: describeTaxType(first.taxType, rate),
      rate,
      mixed: false,
    };
  }

  const rates = [...new Set(outlets.map((o) => Number(o.taxRate)))].sort((a, b) => a - b);
  return {
    taxType: "CAMPURAN",
    label: `Campuran (${rates.map((r) => `${formatRate(r)}%`).join(" / ")})`,
    rate: rate,
    mixed: true,
  };
}

export type { TaxType };