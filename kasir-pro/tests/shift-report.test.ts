import test from "node:test";
import assert from "node:assert/strict";
import {
  buildShiftReport,
  summarizeShiftSales,
  varianceStatus,
  type ShiftSaleRow,
} from "../src/lib/shift";

function sale(overrides: Partial<ShiftSaleRow> = {}): ShiftSaleRow {
  return {
    totalAmount: 100_000,
    taxAmount: 10_000,
    discountAmount: 0,
    serviceCharge: 0,
    paymentType: "CASH",
    isVoided: false,
    createdAt: new Date("2026-11-18T02:00:00.000Z"),
    ...overrides,
  };
}

const store = { name: "KADAI", address: "Jl. Test", phone: "021" };
const cashier = { id: "u1", name: "Kasir", role: "CASHIER" };

test("kas diharapkan = modal + tunai - refund tunai shift sebelumnya", () => {
  // Refund tunai dari transaksi shift sebelumnya benar-benar keluar dari laci
  // pada shift ini; tanpa dikurangkan, kasir terlihat "kurang" padahal pas.
  const numbers = summarizeShiftSales([sale(), sale({ paymentType: "QRIS" })], {
    openingCash: 200_000,
    priorCashRefunds: 50_000,
  });

  assert.equal(numbers.totalCashSales, 100_000);
  assert.equal(numbers.totalRevenue, 200_000);
  assert.equal(numbers.expectedCash, 250_000);
});

test("transaksi batal tidak dihitung sebagai penjualan tapi tetap tercatat", () => {
  const numbers = summarizeShiftSales(
    [sale(), sale({ isVoided: true, totalAmount: 75_000 })],
    { openingCash: 0 }
  );

  assert.equal(numbers.totalSales, 1);
  assert.equal(numbers.totalVoided, 1);
  assert.equal(numbers.totalRevenue, 100_000);
  assert.equal(numbers.totalCashSales, 100_000);
});

test("laporan shift menghitung selisih laci terhadap kas diharapkan", () => {
  const report = buildShiftReport({
    shift: {
      id: "shift-1",
      status: "CLOSED",
      outletId: null,
      openedAt: new Date("2026-11-18T01:00:00.000Z"),
      closedAt: new Date("2026-11-18T10:00:00.000Z"),
      openingCash: 100_000,
      closingCash: 290_000,
      notes: "tutup pagi",
    },
    store,
    cashier,
    sales: [sale(), sale({ paymentType: "E_WALLET", totalAmount: 40_000 })],
    priorCashRefunds: 10_000,
  });

  assert.equal(report.expectedCash, 190_000);
  assert.equal(report.shift.variance, 100_000);
  assert.equal(varianceStatus(report.shift.variance), "OVER");
  assert.equal(report.totalTransactions, 2);
  assert.equal(report.totalCashRefunds, 10_000);
  assert.equal(report.shift.notes, "tutup pagi");
});

test("shift yang masih terbuka belum punya selisih", () => {
  const report = buildShiftReport({
    shift: {
      id: "shift-2",
      status: "OPEN",
      outletId: null,
      openedAt: new Date("2026-11-18T01:00:00.000Z"),
      openingCash: 0,
    },
    store,
    cashier,
    sales: [sale()],
  });

  assert.equal(report.shift.closingCash, null);
  assert.equal(report.shift.variance, null);
  assert.equal(varianceStatus(null), "OPEN");
  assert.equal(varianceStatus(0.004), "BALANCED");
  assert.equal(varianceStatus(-25_000), "SHORT");
});

test("pembulatan uang tidak menyimpang karena float", () => {
  const numbers = summarizeShiftSales(
    [
      sale({ totalAmount: 0.1 }),
      sale({ totalAmount: 0.2 }),
    ],
    { openingCash: 0 }
  );

  assert.equal(numbers.totalCashSales, 0.3);
  assert.equal(numbers.expectedCash, 0.3);
});

test("peta pembayaran selalu lengkap walau tidak ada transaksi", () => {
  const numbers = summarizeShiftSales([], { openingCash: 50_000 });
  for (const type of ["CASH", "QRIS", "BANK_TRANSFER", "E_WALLET", "TEMPO"] as const) {
    assert.deepEqual(numbers.salesByPayment[type], { count: 0, total: 0 });
  }
  assert.equal(numbers.expectedCash, 50_000);
  assert.equal(numbers.firstTransactionTime, null);
  assert.equal(numbers.lastTransactionTime, null);
});