import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { withUniqueNumberRetry } from "../src/lib/unique-number-retry";

const root = path.resolve(import.meta.dirname, "..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

/** Penolakan unique index untuk nomor dokumen, seperti yang dikirim Prisma. */
function duplicateNumber(field: string) {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
    meta: { target: [field] },
  });
}

test("percobaan ulang menerima nomor percobaan supaya bisa menggeser nomor", async () => {
  // Dulu closure dipanggil tanpa nomor percobaan, jadi hitungan ulang
  // menghasilkan nomor yang sama persis: semua percobaan menabrak nomor itu dan
  // pengguna menerima 409 "restock lain sedang disimpan bersamaan" padahal
  // nomornya hanya bolong (batch lama dihapus).
  const seen: number[] = [];
  const result = await withUniqueNumberRetry(
    async (attempt) => {
      seen.push(attempt);
      if (attempt < 2) throw duplicateNumber("batchNumber");
      return `BATCH-TEST-000${attempt + 1}`;
    },
    { uniqueFields: ["batchNumber"] }
  );

  assert.deepEqual(seen, [0, 1, 2]);
  assert.equal(result, "BATCH-TEST-0003");
});

test("penolakan selain nomor dokumen tidak diulang", async () => {
  const seen: number[] = [];
  await assert.rejects(
    withUniqueNumberRetry(
      async (attempt) => {
        seen.push(attempt);
        throw duplicateNumber("sku");
      },
      { uniqueFields: ["batchNumber"] }
    ),
    /Unique constraint failed/
  );
  assert.deepEqual(seen, [0]);
});

test("restock, transfer, dan invoice memakai nomor percobaan", () => {
  assert.match(read("src/app/api/batches/route.ts"), /todayBatchCount \+ 1 \+ attempt/);
  assert.match(
    read("src/app/api/inventory/transfers/route.ts"),
    /count \+ 1 \+ attempt/
  );
  assert.match(read("src/app/api/sales/route.ts"), /todaySalesCount \+ 1 \+ attemptOffset/);
});