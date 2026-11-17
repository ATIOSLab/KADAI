import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { logger } from "./logger";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success?: false;
  error: string;
  code?: string;
  details?: unknown;
}

export function jsonOk<T>(data: T, message?: string, status = 200, meta?: Record<string, unknown>): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message ? { message } : {}),
      ...(meta ? { meta } : {}),
    },
    { status }
  );
}

export function jsonError(
  message: string,
  status = 400,
  details?: unknown,
  code?: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(code ? { code } : {}),
      ...(details ? { details } : {}),
    },
    { status }
  );
}

/**
 * Kesalahan ATURAN BISNIS (bukan bug): pelanggaran aturan yang bisa dipahami
 * pengguna harus menjawab 4xx, bukan 500. Sebelum ini setiap business error
 * jatuh ke cabang `Error` dan dijawab 500.
 */
export class ApiBusinessError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "BUSINESS_RULE") {
    super(message);
    this.name = "ApiBusinessError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Zod v4 memberi pesan bawaan berbahasa Inggris dan tanpa konteks untuk
 * ketidakcocokan tipe ("Invalid input"). Staf hanya melihat "Invalid input"
 * tanpa tahu kolom mana. Kolom disebut namanya, pesan kustom validator
 * (sudah berbahasa Indonesia) tetap dipakai apa adanya.
 */
function describeZodIssue(issue?: { message?: string; path?: PropertyKey[]; code?: string }): string {
  const GENERIC: Record<string, string> = {
    invalid_type: "jenis data tidak sesuai",
    invalid_union: "format nilai tidak sesuai",
    invalid_format: "format nilai tidak sesuai",
    too_small: "nilai terlalu kecil",
    too_big: "nilai terlalu besar",
  };
  const FIELD_LABELS: Record<string, string> = {
    purchaseDate: "Tanggal pembelian",
    expiryDate: "Tanggal kedaluwarsa",
    productId: "Produk",
    outletId: "Cabang",
    quantity: "Jumlah",
    costPrice: "Harga modal",
    sellingPrice: "Harga jual",
    supplierId: "Pemasok",
    notes: "Catatan",
  };

  if (!issue) {
    return "Format data yang dikirim tidak valid";
  }

  const rawPath = (issue.path ?? []).find((segment) => typeof segment === "string");
  const field = typeof rawPath === "string" ? rawPath : undefined;
  const label = field ? (FIELD_LABELS[field] ?? field) : undefined;
  const message = (issue.message ?? "").trim();

  // Pesan validator yang sudah spesifik (Indonesia, menyebut aturan) dipakai
  // langsung - jangan ditimpa label kolom buatan sendiri.
  const isGenericMessage =
    !message ||
    /^invalid input/i.test(message) ||
    /^invalid/i.test(message) ||
    /^required$/i.test(message) ||
    /^expected /i.test(message) ||
    /^too (small|big)/i.test(message) ||
    /^unrecognized/i.test(message);

  if (!isGenericMessage) {
    return message;
  }

  const reason = GENERIC[issue.code ?? ""] ?? "tidak valid";
  return label
    ? `${label} ${reason}. Periksa kembali isian tersebut.`
    : `Format data yang dikirim tidak valid (${reason}).`;
}

export function handleApiError(
  error: unknown,
  context: string,
  fallbackMessage = "Terjadi kesalahan pada server"
): NextResponse<ApiErrorResponse> {
  // 1. Zod Validation Error
  if (error instanceof ZodError) {
    logger.warn(`Validation failed at ${context}`, context, {
      errors: error.flatten().fieldErrors,
    });
    // Pesan generik "Format data yang dikirim tidak valid" tidak memberi tahu
    // staf kolom mana yang salah. Pakai pesan spesifik dari validator (sudah
    // berbahasa Indonesia), detail per kolom tetap dikirim untuk form.
    const firstIssue = error.issues[0];
    return jsonError(
      describeZodIssue(firstIssue),
      400,
      error.flatten().fieldErrors,
      "VALIDATION_ERROR"
    );
  }

  // 2. Prisma Database Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error(`Database error at ${context} [${error.code}]`, error, context);

    if (error.code === "P2002") {
      // Nama kolom internal (mis. `storeId`) tidak boleh bocor ke pesan pengguna.
      const FIELD_LABELS: Record<string, string> = {
        phone: "Nomor telepon",
        sku: "SKU",
        barcode: "Barcode",
        name: "Nama",
        email: "Email",
        code: "Kode",
        normalizedName: "Nama satuan",
        jobCode: "Kode pekerjaan",
      };
      const rawFields = ((error.meta?.target as string[]) ?? []).filter(Boolean);
      const labels = [
        ...new Set(
          rawFields.filter((field) => field !== "storeId").map((field) => FIELD_LABELS[field] ?? field)
        ),
      ];
      const label = labels.length > 0 ? labels.join(" & ") : "Data";
      return jsonError(`${label} tersebut sudah digunakan`, 409, undefined, "CONFLICT");
    }

    if (error.code === "P2025") {
      return jsonError("Data yang diminta tidak ditemukan", 404, undefined, "NOT_FOUND");
    }

    return jsonError(fallbackMessage, 500, undefined, "DATABASE_ERROR");
  }

  // 3. Pelanggaran aturan bisnis dengan status eksplisit (4xx)
  if (error instanceof ApiBusinessError) {
    logger.warn(`Business rule at ${context}: ${error.message}`, context);
    return jsonError(error.message, error.status, undefined, error.code);
  }

  // 4. Known Business Logic Error
  if (error instanceof Error) {
    logger.error(`Error at ${context}: ${error.message}`, error, context);

    // If message is a clean user-facing Indonesian message or specific code
    const isUserFriendly =
      error.message &&
      !error.message.includes("prisma") &&
      !error.message.includes("SELECT") &&
      !error.message.includes("INSERT") &&
      !error.message.includes("at ") &&
      error.message.length < 200;

    return jsonError(
      isUserFriendly ? error.message : fallbackMessage,
      500,
      undefined,
      "INTERNAL_ERROR"
    );
  }

  // 4. Unknown Fallback
  logger.error(`Unhandled error at ${context}`, error, context);
  return jsonError(fallbackMessage, 500, undefined, "UNKNOWN_ERROR");
}
