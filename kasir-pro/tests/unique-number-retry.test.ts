import test from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import { withUniqueNumberRetry, isRetryableUniqueViolation } from "../src/lib/unique-number-retry";

const uniqueViolation = (target: string[]) =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
    meta: { target },
  });

test("nomor dokumen yang bentrok diulang sampai berhasil", async () => {
  let calls = 0;
  const result = await withUniqueNumberRetry(
    async () => {
      calls += 1;
      if (calls < 3) throw uniqueViolation(["batchNumber"]);
      return "BATCH-3";
    },
    { uniqueFields: ["batchNumber"] }
  );

  assert.equal(result, "BATCH-3");
  assert.equal(calls, 3);
});

test("penolakan field unik lain tidak diulang (pesan asli diteruskan)", async () => {
  let calls = 0;
  await assert.rejects(
    () =>
      withUniqueNumberRetry(
        async () => {
          calls += 1;
          throw uniqueViolation(["storeId", "sku"]);
        },
        { uniqueFields: ["batchNumber"] }
      ),
    /Unique constraint failed/
  );

  // Sekali saja: mengulang SKU yang sudah dipakai tidak akan pernah berhasil
  assert.equal(calls, 1);
});

test("percobaan habis memakai galat yang diberikan pemanggil", async () => {
  await assert.rejects(
    () =>
      withUniqueNumberRetry(
        async () => {
          throw uniqueViolation(["transferNumber"]);
        },
        {
          attempts: 2,
          uniqueFields: ["transferNumber"],
          onExhausted: () => new Error("Restock lain sedang disimpan bersamaan"),
        }
      ),
    /Restock lain sedang disimpan bersamaan/
  );
});

test("klasifikasi hanya berlaku untuk P2002", () => {
  assert.equal(isRetryableUniqueViolation(uniqueViolation(["batchNumber"]), ["batchNumber"]), true);
  assert.equal(isRetryableUniqueViolation(uniqueViolation(["sku"]), ["batchNumber"]), false);
  assert.equal(isRetryableUniqueViolation(new Error("boom"), ["batchNumber"]), false);
});
