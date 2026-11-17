import test from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";
import { createBatchSchema } from "../src/lib/validators/batch";
import { handleApiError } from "../src/lib/api-response";

type ZodErrorLike = ZodError;

async function bodyOf(error: unknown) {
  const response = handleApiError(error, "test", "Gagal");
  return (await response.json()) as { error: string; code?: string; details?: unknown };
}

const baseBatch = {
  productId: "prod_1",
  quantity: 5,
  costPrice: 3000,
  sellingPrice: 6000,
};

test("restock tanpa tanggal pembelian diterima (formulir mengirim null)", () => {
  const parsed = createBatchSchema.safeParse({
    ...baseBatch,
    outletId: "outlet_1",
    purchaseDate: null,
    expiryDate: null,
    notes: null,
  });
  assert.equal(parsed.success, true, JSON.stringify(parsed.error?.issues));
});

test("restock tetap menolak jumlah nol dengan pesan spesifik", () => {
  const parsed = createBatchSchema.safeParse({ ...baseBatch, quantity: 0 });
  assert.equal(parsed.success, false);
  assert.match(parsed.error!.issues[0].message, /Jumlah minimal 1 unit/);
});

test("pesan Zod generik diganti dengan nama kolom berbahasa Indonesia", async () => {
  // Kasus nyata: purchaseDate dikirim sebagai null ke skema `optional()` saja
  // menghasilkan pesan "Invalid input" tanpa menyebut kolom apa pun.
  const zodError = new ZodError([
    {
      code: "invalid_type",
      expected: "string",
      received: "null",
      path: ["purchaseDate"],
      message: "Invalid input",
    } as unknown as ZodErrorLike["issues"][number],
  ]);
  const body = await bodyOf(zodError);
  assert.match(body.error, /Tanggal pembelian/);
  assert.doesNotMatch(body.error, /^Invalid input$/i);
  assert.equal(body.code, "VALIDATION_ERROR");
});

test("pesan validator yang sudah spesifik tidak ditimpa label kolom", async () => {
  const zodError = new ZodError([
    {
      code: "too_small",
      minimum: 1,
      type: "number",
      inclusive: true,
      path: ["quantity"],
      message: "Jumlah minimal 1 unit",
    } as unknown as ZodErrorLike["issues"][number],
  ]);
  const body = await bodyOf(zodError);
  assert.equal(body.error, "Jumlah minimal 1 unit");
});