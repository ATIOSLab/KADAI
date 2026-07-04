import { FinanceDirection, FinanceSource } from "@prisma/client";
import { z } from "zod";

const amountSchema = z
  .number()
  .positive("Nominal harus lebih besar dari 0");

const dateValueSchema = z.string().min(1, "Tanggal wajib diisi");

export const financeEntryPayloadSchema = z.object({
  amount: amountSchema,
  direction: z.nativeEnum(FinanceDirection),
  source: z.literal(FinanceSource.MANUAL),
  title: z
    .string()
    .trim()
    .min(2, "Judul minimal 2 karakter")
    .max(120, "Judul maksimal 120 karakter"),
  notes: z
    .string()
    .trim()
    .max(500, "Catatan maksimal 500 karakter")
    .optional()
    .nullable()
    .transform((value) => value || null),
  entryDate: dateValueSchema,
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
});

export const updateFinanceEntryPayloadSchema = financeEntryPayloadSchema;

export const financeCategoryPayloadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama kategori minimal 2 karakter")
    .max(60, "Nama kategori maksimal 60 karakter"),
  direction: z.nativeEnum(FinanceDirection),
});

export type FinanceEntryPayload = z.infer<typeof financeEntryPayloadSchema>;
export type UpdateFinanceEntryPayload = z.infer<
  typeof updateFinanceEntryPayloadSchema
>;
export type FinanceCategoryPayload = z.infer<typeof financeCategoryPayloadSchema>;
