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
    return jsonError(
      "Format data yang dikirim tidak valid",
      400,
      error.flatten().fieldErrors,
      "VALIDATION_ERROR"
    );
  }

  // 2. Prisma Database Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error(`Database error at ${context} [${error.code}]`, error, context);

    if (error.code === "P2002") {
      const target = (error.meta?.target as string[])?.join(", ") || "field";
      return jsonError(
        `Data dengan ${target} tersebut sudah digunakan`,
        409,
        undefined,
        "CONFLICT"
      );
    }

    if (error.code === "P2025") {
      return jsonError("Data yang diminta tidak ditemukan", 404, undefined, "NOT_FOUND");
    }

    return jsonError(fallbackMessage, 500, undefined, "DATABASE_ERROR");
  }

  // 3. Known Business Logic Error
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
