import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("id-ID");

function padSequence(value: number, length: number) {
  return String(value).padStart(length, "0");
}

function formatDateSegment(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

export function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return currencyFormatter.format(Number.isFinite(amount) ? amount : 0);
}

export function formatNumber(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return numberFormatter.format(Number.isFinite(amount) ? amount : 0);
}

export function generateInvoiceNumber(sequence: number, date = new Date()) {
  return `INV-${formatDateSegment(date)}-${padSequence(sequence, 4)}`;
}

export function generateBatchNumber(
  sku: string,
  sequence: number,
  date = new Date()
) {
  const normalizedSku = sku.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `BATCH-${normalizedSku}-${formatDateSegment(date)}-${padSequence(
    sequence,
    3
  )}`;
}

function sanitizeSkuSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9\s]/g, " ").trim();
}

export function buildSkuPrefix(categoryName?: string | null, productName?: string | null) {
  const primarySource = sanitizeSkuSegment(categoryName || "");
  const fallbackSource = sanitizeSkuSegment(productName || "");
  const source = primarySource || fallbackSource || "PRD";

  const words = source
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length >= 3) {
    return words
      .slice(0, 3)
      .map((word) => word[0] || "")
      .join("")
      .toUpperCase();
  }

  if (words.length === 2) {
    const [first, second] = words;
    return `${(first.slice(0, 2) || "").toUpperCase()}${(second[0] || "").toUpperCase()}`;
  }

  const collapsed = words.join("");
  return (collapsed.slice(0, 3) || "PRD").toUpperCase();
}

export function formatSku(prefix: string, sequence: number) {
  return `${prefix}-${padSequence(sequence, 3)}`;
}
