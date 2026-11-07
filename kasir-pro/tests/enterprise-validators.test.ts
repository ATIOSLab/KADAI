import test from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";
import { createOutletSchema } from "../src/lib/validators/outlet";
import { createTransferSchema } from "../src/lib/validators/transfer";
import { produceBatchSchema } from "../src/lib/validators/produce";
import { createSupplierSchema } from "../src/lib/validators/supplier";
import { createCustomerSchema } from "../src/lib/validators/customer";
import { createTableSchema } from "../src/lib/validators/table";
import { handleApiError } from "../src/lib/api-response";

test("Outlet validation: enforces uppercase code and valid schema", () => {
  const valid = createOutletSchema.parse({
    name: "Cabang Thamrin",
    code: "thm-01",
    isMain: false,
    taxType: "PB1_10",
  });
  assert.equal(valid.code, "THM-01");
  assert.equal(valid.outletType, "RETAIL_BOOTH");
  assert.equal(valid.kitchenWorkflow, "DIRECT_SERVE");
  assert.equal(valid.costingMethod, "FIFO");

  const validFefo = createOutletSchema.parse({
    name: "Cabang Bakery FEFO",
    code: "bkr-01",
    costingMethod: "FEFO",
  });
  assert.equal(validFefo.costingMethod, "FEFO");

  // Invalid code too short
  assert.throws(() => {
    createOutletSchema.parse({ name: "Cabang", code: "A" });
  });
});

test("Transfer validation: rejects transfer where source equals destination", () => {
  assert.throws(
    () => {
      createTransferSchema.parse({
        sourceOutletId: "outlet_1",
        destinationOutletId: "outlet_1",
        items: [{ productId: "prod_1", quantity: 5 }],
      });
    },
    (err: unknown) => {
      assert(err instanceof ZodError);
      assert(err.message.includes("Cabang asal dan cabang tujuan tidak boleh sama"));
      return true;
    }
  );
});

test("Transfer validation: rejects zero or negative quantity items", () => {
  assert.throws(() => {
    createTransferSchema.parse({
      sourceOutletId: "outlet_1",
      destinationOutletId: "outlet_2",
      items: [{ productId: "prod_1", quantity: 0 }],
    });
  });
});

test("Produce validation: enforces positive integer quantity", () => {
  const valid = produceBatchSchema.parse({
    quantityToProduce: 25,
    outletId: "outlet_central_kitchen",
  });
  assert.equal(valid.quantityToProduce, 25);

  assert.throws(() => {
    produceBatchSchema.parse({ quantityToProduce: -5 });
  });
});

test("Supplier validation: validates email format and required name", () => {
  const valid = createSupplierSchema.parse({
    name: "PT Sumber Pangan Sejahtera",
    email: "kontak@sumberpangan.com",
    phone: "08123456789",
  });
  assert.equal(valid.name, "PT Sumber Pangan Sejahtera");

  assert.throws(() => {
    createSupplierSchema.parse({ name: "PT Sumber", email: "invalid-email" });
  });
});

test("Customer validation: defaults to REGULAR tier and 0 points", () => {
  const valid = createCustomerSchema.parse({
    name: "Ahmad Dahlan",
  });
  assert.equal(valid.memberTier, "REGULAR");
  assert.equal(valid.loyaltyPoints, 0);
});

test("Table validation: enforces capacity limits", () => {
  const valid = createTableSchema.parse({
    tableNo: "Meja-12",
    capacity: 6,
  });
  assert.equal(valid.tableNo, "Meja-12");
  assert.equal(valid.capacity, 6);

  assert.throws(() => {
    createTableSchema.parse({ tableNo: "Meja-12", capacity: 0 });
  });
});

test("handleApiError: cleanly formats ZodError without leaking internal details", async () => {
  try {
    createOutletSchema.parse({ name: "A" });
  } catch (err) {
    const res = handleApiError(err, "test_context");
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.code, "VALIDATION_ERROR");
    assert.equal(body.error, "Format data yang dikirim tidak valid");
    assert(body.details !== undefined);
  }
});
