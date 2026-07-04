import type { LucideIcon } from "lucide-react";
import {
  BadgeDollarSign,
  Package,
  ScrollText,
  ShoppingCart,
  Trash2,
  UserCheck,
  Warehouse,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type ActivityLogLike = {
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
};

const STOCK_REASON_LABELS: Record<string, string> = {
  DAMAGED: "Barang rusak",
  LOST: "Barang hilang",
  EXPIRED: "Kedaluwarsa",
  STOCK_OPNAME: "Stok opname",
  OTHER: "Lainnya",
};

export const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  SALE_CREATED: "Transaksi Dibuat",
  SALE_VOIDED: "Transaksi Dibatalkan",
  PRODUCT_CREATED: "Produk Ditambahkan",
  PRODUCT_UPDATED: "Produk Diperbarui",
  PRODUCT_DELETED: "Produk Dihapus",
  BATCH_CREATED: "Batch Ditambahkan",
  STOCK_ADJUSTED: "Stok Disesuaikan",
  USER_LOGIN: "Masuk ke Sistem",
  USER_LOGOUT: "Keluar dari Sistem",
  USER_CREATED: "Pengguna Ditambahkan",
  USER_UPDATED: "Pengguna Diperbarui",
  USER_DELETED: "Pengguna Dinonaktifkan",
  FINANCE_ENTRY_CREATED: "Transaksi Keuangan Ditambahkan",
  FINANCE_ENTRY_UPDATED: "Transaksi Keuangan Diperbarui",
  FINANCE_ENTRY_ARCHIVED: "Transaksi Keuangan Diarsipkan",
  FINANCE_CATEGORY_CREATED: "Kategori Keuangan Ditambahkan",
  FINANCE_CATEGORY_UPDATED: "Kategori Keuangan Diperbarui",
  FINANCE_CATEGORY_DEACTIVATED: "Kategori Keuangan Dinonaktifkan",
};

export const ACTIVITY_ACTION_STYLES: Record<
  string,
  { icon: LucideIcon; color: string }
> = {
  SALE_CREATED: { icon: ShoppingCart, color: "bg-accent-success" },
  SALE_VOIDED: { icon: ShoppingCart, color: "bg-accent-danger" },
  PRODUCT_CREATED: { icon: Package, color: "bg-accent-primary" },
  PRODUCT_UPDATED: { icon: Package, color: "bg-accent-warning" },
  PRODUCT_DELETED: { icon: Trash2, color: "bg-accent-danger" },
  BATCH_CREATED: { icon: Warehouse, color: "bg-accent-secondary" },
  STOCK_ADJUSTED: { icon: Warehouse, color: "bg-accent-warning" },
  USER_LOGIN: { icon: UserCheck, color: "bg-accent-success" },
  USER_LOGOUT: { icon: UserCheck, color: "bg-text-muted" },
  USER_CREATED: { icon: UserCheck, color: "bg-accent-purple" },
  USER_UPDATED: { icon: UserCheck, color: "bg-accent-warning" },
  USER_DELETED: { icon: UserCheck, color: "bg-accent-danger" },
  FINANCE_ENTRY_CREATED: { icon: BadgeDollarSign, color: "bg-accent-success" },
  FINANCE_ENTRY_UPDATED: { icon: BadgeDollarSign, color: "bg-accent-warning" },
  FINANCE_ENTRY_ARCHIVED: { icon: BadgeDollarSign, color: "bg-accent-danger" },
  FINANCE_CATEGORY_CREATED: { icon: BadgeDollarSign, color: "bg-accent-primary" },
  FINANCE_CATEGORY_UPDATED: { icon: BadgeDollarSign, color: "bg-accent-warning" },
  FINANCE_CATEGORY_DEACTIVATED: { icon: BadgeDollarSign, color: "bg-accent-danger" },
};

function getStringValue(
  details: Record<string, unknown>,
  key: string
) {
  const value = details[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getNumberValue(
  details: Record<string, unknown>,
  key: string
) {
  const value = details[key];
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getStringListValue(
  details: Record<string, unknown>,
  key: string
) {
  const value = details[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.length > 0)
    : [];
}

function buildFallbackDescription(log: ActivityLogLike) {
  const details = log.details ?? {};
  const fragments = Object.entries(details)
    .map(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }

      if (Array.isArray(value)) {
        return `${key}: ${value.join(", ")}`;
      }

      if (typeof value === "object") {
        return null;
      }

      return `${key}: ${String(value)}`;
    })
    .filter((value): value is string => Boolean(value));

  if (fragments.length > 0) {
    return fragments.join(" • ");
  }

  return `Aktivitas ${log.entity}`;
}

export function formatActivityAction(action: string) {
  return ACTIVITY_ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}

export function formatActivityDescription(log: ActivityLogLike) {
  const details = log.details ?? {};

  switch (log.action) {
    case "SALE_CREATED": {
      const invoiceNumber = getStringValue(details, "invoiceNumber");
      const itemCount = getNumberValue(details, "itemCount");
      const totalAmount = getNumberValue(details, "totalAmount");

      const summary = [
        invoiceNumber,
        itemCount !== null ? `${itemCount} item` : null,
        totalAmount !== null ? formatCurrency(totalAmount) : null,
      ]
        .filter(Boolean)
        .join(" • ");

      return summary || buildFallbackDescription(log);
    }
    case "SALE_VOIDED": {
      const invoiceNumber = getStringValue(details, "invoiceNumber");
      const reason = getStringValue(details, "reason");

      const summary = [invoiceNumber, reason ? `Alasan: ${reason}` : null]
        .filter(Boolean)
        .join(" • ");

      return summary || buildFallbackDescription(log);
    }
    case "PRODUCT_CREATED": {
      const name = getStringValue(details, "name");
      const sku = getStringValue(details, "sku");
      const summary = [name, sku ? `SKU ${sku}` : null].filter(Boolean).join(" • ");
      return summary || buildFallbackDescription(log);
    }
    case "PRODUCT_UPDATED": {
      const name = getStringValue(details, "name");
      const sku = getStringValue(details, "sku");
      const changes = getStringListValue(details, "changes");
      const mainLabel = name ?? sku ?? "Produk diperbarui";
      return changes.length > 0
        ? `${mainLabel} • Perubahan: ${changes.join(", ")}`
        : mainLabel;
    }
    case "PRODUCT_DELETED": {
      const name = getStringValue(details, "name");
      return name ?? "Produk dinonaktifkan";
    }
    case "BATCH_CREATED": {
      const productName = getStringValue(details, "productName");
      const batchNumber = getStringValue(details, "batchNumber");
      const quantity = getNumberValue(details, "quantity");

      const summary = [
        productName,
        batchNumber,
        quantity !== null ? `Qty ${quantity}` : null,
      ]
        .filter(Boolean)
        .join(" • ");

      return summary || buildFallbackDescription(log);
    }
    case "STOCK_ADJUSTED": {
      const productName = getStringValue(details, "productName");
      const quantityChange = getNumberValue(details, "quantityChange");
      const reason = getStringValue(details, "reason");

      const summary = [
        productName,
        quantityChange !== null
          ? `Perubahan ${quantityChange > 0 ? "+" : ""}${quantityChange}`
          : null,
        reason ? STOCK_REASON_LABELS[reason] ?? reason : null,
      ]
        .filter(Boolean)
        .join(" • ");

      return summary || buildFallbackDescription(log);
    }
    case "USER_CREATED":
    case "USER_DELETED": {
      const name = getStringValue(details, "name");
      const role = getStringValue(details, "role");
      const summary = [name, role].filter(Boolean).join(" • ");
      return summary || buildFallbackDescription(log);
    }
    case "USER_UPDATED": {
      const name = getStringValue(details, "name");
      const changes = getStringListValue(details, "changes");
      return changes.length > 0
        ? `${name ?? "Pengguna"} • Perubahan: ${changes.join(", ")}`
        : (name ?? "Data pengguna diperbarui");
    }
    case "FINANCE_ENTRY_CREATED":
    case "FINANCE_ENTRY_UPDATED": {
      const title = getStringValue(details, "title");
      const amount = getNumberValue(details, "amount");
      const categoryName = getStringValue(details, "categoryName");
      const direction = getStringValue(details, "direction");

      const summary = [
        title,
        amount !== null ? formatCurrency(amount) : null,
        categoryName,
        direction === "IN" ? "Masuk" : direction === "OUT" ? "Keluar" : null,
      ]
        .filter(Boolean)
        .join(" • ");

      return summary || buildFallbackDescription(log);
    }
    case "FINANCE_ENTRY_ARCHIVED": {
      return getStringValue(details, "title") ?? "Transaksi keuangan diarsipkan";
    }
    case "FINANCE_CATEGORY_CREATED":
    case "FINANCE_CATEGORY_UPDATED":
    case "FINANCE_CATEGORY_DEACTIVATED": {
      const name = getStringValue(details, "name");
      const direction = getStringValue(details, "direction");
      const summary = [
        name,
        direction === "IN" ? "Masuk" : direction === "OUT" ? "Keluar" : null,
      ]
        .filter(Boolean)
        .join(" • ");

      return summary || buildFallbackDescription(log);
    }
    default:
      return buildFallbackDescription(log);
  }
}

export function formatActivityRelativeTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = Date.now() - date.getTime();

  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return "Baru saja";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} menit lalu`;
  }

  if (diffHours < 24) {
    return `${diffHours} jam lalu`;
  }

  if (diffDays < 7) {
    return `${diffDays} hari lalu`;
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getActivityActionStyle(action: string) {
  return ACTIVITY_ACTION_STYLES[action] ?? {
    icon: ScrollText,
    color: "bg-bg-main",
  };
}
