import test from "node:test";
import assert from "node:assert/strict";
import { checkoutSchema, saleFilterSchema } from "../src/lib/validators/sale";

const errorOf = (schema: { safeParse: (v: unknown) => { success: boolean; error?: { issues: { message: string }[] } } }, value: unknown) => {
  const result = schema.safeParse(value);
  if (result.success) throw new Error("seharusnya tidak valid");
  return result.error!.issues.map((issue) => issue.message).join(" | ");
};

// Kasir melihat pesan galat ini langsung di layar; pesan bawaan Zod berbahasa
// Inggris ("Invalid option: expected one of ...") tidak dapat ditindaklanjuti.
test("metode pembayaran yang salah dijawab dengan pesan Indonesia", () => {
  const message = errorOf(checkoutSchema, {
    items: [{ productId: "p", productName: "Produk", quantity: 1, unitPrice: 1000 }],
    paymentType: "GOPAY",
  });
  assert.match(message, /Metode pembayaran tidak dikenal/);
  assert.doesNotMatch(message, /Invalid option/);
});

test("jenis pesanan yang salah dijawab dengan pesan Indonesia", () => {
  const message = errorOf(checkoutSchema, {
    items: [{ productId: "p", productName: "Produk", quantity: 1, unitPrice: 1000 }],
    paymentType: "CASH",
    orderType: "TAKE_AWAY",
  });
  assert.match(message, /Jenis pesanan tidak dikenal/);
  assert.doesNotMatch(message, /Invalid option/);
});

test("nilai pesanan yang sah tetap lolos", () => {
  const parsed = checkoutSchema.parse({
    items: [{ productId: "p", productName: "Produk", quantity: 1, unitPrice: 1000 }],
    paymentType: "E_WALLET",
    orderType: "TAKEAWAY",
  });
  assert.equal(parsed.orderType, "TAKEAWAY");
  assert.equal(parsed.paymentType, "E_WALLET");
  assert.equal(parsed.discountAmount, 0);
});

test("filter daftar transaksi memakai daftar metode yang sama", () => {
  const message = errorOf(saleFilterSchema, { paymentType: "GOPAY" });
  assert.match(message, /Metode pembayaran tidak dikenal/);
});
