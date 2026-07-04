import {
  FinanceDirection,
  FinanceSource,
  Prisma,
  UserRole,
} from "@prisma/client";
import { prisma } from "./prisma";
import type { SessionUser } from "./session";

type FinanceDbClient = Prisma.TransactionClient | typeof prisma;

export const FINANCE_SYSTEM_CATEGORY_KEYS = {
  SALE_INCOME: "SALE_INCOME",
  SALE_VOID_OUTFLOW: "SALE_VOID_OUTFLOW",
  RESTOCK_EXPENSE: "RESTOCK_EXPENSE",
} as const;

export const FINANCE_SOURCE_LABELS: Record<FinanceSource, string> = {
  MANUAL: "Manual",
  SALE: "Penjualan",
  SALE_VOID: "Pembatalan Penjualan",
  RESTOCK: "Restock",
};

export const FINANCE_DIRECTION_LABELS: Record<FinanceDirection, string> = {
  IN: "Masuk",
  OUT: "Keluar",
};

const financeSeedCategories = [
  {
    name: "Penjualan",
    direction: FinanceDirection.IN,
    isSystem: true,
    systemKey: FINANCE_SYSTEM_CATEGORY_KEYS.SALE_INCOME,
  },
  {
    name: "Pembatalan Penjualan",
    direction: FinanceDirection.OUT,
    isSystem: true,
    systemKey: FINANCE_SYSTEM_CATEGORY_KEYS.SALE_VOID_OUTFLOW,
  },
  {
    name: "Pembelian Stok",
    direction: FinanceDirection.OUT,
    isSystem: true,
    systemKey: FINANCE_SYSTEM_CATEGORY_KEYS.RESTOCK_EXPENSE,
  },
  {
    name: "Modal Masuk",
    direction: FinanceDirection.IN,
    isSystem: false,
    systemKey: null,
  },
  {
    name: "Pendapatan Lain",
    direction: FinanceDirection.IN,
    isSystem: false,
    systemKey: null,
  },
  {
    name: "Biaya Operasional",
    direction: FinanceDirection.OUT,
    isSystem: false,
    systemKey: null,
  },
  {
    name: "Pengeluaran Lain",
    direction: FinanceDirection.OUT,
    isSystem: false,
    systemKey: null,
  },
] as const;

export async function ensureFinanceCategories(db: FinanceDbClient = prisma) {
  for (const category of financeSeedCategories) {
    if (category.systemKey) {
      await db.financeCategory.upsert({
        where: { systemKey: category.systemKey },
        update: {
          name: category.name,
          direction: category.direction,
          isSystem: true,
          isActive: true,
        },
        create: {
          name: category.name,
          direction: category.direction,
          isSystem: true,
          systemKey: category.systemKey,
          isActive: true,
        },
      });
      continue;
    }

    const existing = await db.financeCategory.findFirst({
      where: {
        name: category.name,
        direction: category.direction,
        isSystem: false,
      },
      select: { id: true, isActive: true },
    });

    if (existing) {
      if (!existing.isActive) {
        await db.financeCategory.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
      }
      continue;
    }

    await db.financeCategory.create({
      data: {
        name: category.name,
        direction: category.direction,
        isSystem: false,
        isActive: true,
      },
    });
  }
}

export async function getSystemFinanceCategoryId(
  db: FinanceDbClient,
  systemKey: (typeof FINANCE_SYSTEM_CATEGORY_KEYS)[keyof typeof FINANCE_SYSTEM_CATEGORY_KEYS]
) {
  await ensureFinanceCategories(db);

  const category = await db.financeCategory.findUnique({
    where: { systemKey },
    select: { id: true },
  });

  if (!category) {
    throw new Error(`Kategori finance sistem tidak ditemukan: ${systemKey}`);
  }

  return category.id;
}

export function canAccessFinance(user: SessionUser | null) {
  return user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;
}

export function assertFinanceAccess(user: SessionUser | null) {
  if (!canAccessFinance(user)) {
    throw new Error("FORBIDDEN_FINANCE");
  }
}
