-- Shift kasir disimpan sebagai baris yang bisa diaudit, bukan hanya catatan
-- aktivitas. Sebelum ini POST /api/pos/shift-summary hanya menulis ActivityLog:
-- Z-Report tidak bisa dicetak ulang, selisih kas tidak tersimpan, dan laporan
-- shift tidak bisa dipisahkan dari total harian.
CREATE TYPE "ShiftStatus" AS ENUM ('OPEN', 'CLOSED');

CREATE TABLE "cash_shifts" (
    "id" TEXT NOT NULL,
    "status" "ShiftStatus" NOT NULL DEFAULT 'OPEN',
    "outletId" TEXT,
    "openingCash" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "closingCash" DECIMAL(15,2),
    "expectedCash" DECIMAL(15,2),
    "variance" DECIMAL(15,2),
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "totalVoided" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalCashSales" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalRefunds" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalTax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalDiscount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "openingNotes" TEXT,
    "closingNotes" TEXT,
    "reportJson" JSONB,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "storeId" TEXT NOT NULL,
    "cashierId" TEXT NOT NULL,

    CONSTRAINT "cash_shifts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cash_shifts_storeId_status_idx" ON "cash_shifts"("storeId", "status");
CREATE INDEX "cash_shifts_cashierId_openedAt_idx" ON "cash_shifts"("cashierId", "openedAt");

ALTER TABLE "cash_shifts"
  ADD CONSTRAINT "cash_shifts_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cash_shifts"
  ADD CONSTRAINT "cash_shifts_cashierId_fkey"
  FOREIGN KEY ("cashierId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Satu kasir hanya boleh punya SATU laci terbuka per cabang. Dijaga di sini
-- supaya dua perangkat yang membuka shift bersamaan tidak menghasilkan dua
-- laci yang sama-sama "OPEN" (penjualan lalu terbagi ke dua laporan).
CREATE UNIQUE INDEX "cash_shifts_one_open_per_cashier_outlet_idx"
  ON "cash_shifts" ("storeId", "cashierId", (COALESCE("outletId", '')))
  WHERE "status" = 'OPEN';

-- Transaksi menempel pada shift tempat ia terjadi.
ALTER TABLE "sales" ADD COLUMN "shiftId" TEXT;
CREATE INDEX "sales_shiftId_idx" ON "sales"("shiftId");

ALTER TABLE "sales"
  ADD CONSTRAINT "sales_shiftId_fkey"
  FOREIGN KEY ("shiftId") REFERENCES "cash_shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Diskon manual: alasannya wajib tersimpan, dan bila melampaui batas kasir,
-- nama supervisor yang menyetujui ikut tercatat pada transaksinya.
ALTER TABLE "sales" ADD COLUMN "discountReason" TEXT;
ALTER TABLE "sales" ADD COLUMN "discountApprovedBy" TEXT;

-- Batas diskon kasir per tenant (persen dari subtotal). 10% default: cukup
-- untuk pembulatan/promo kecil tanpa membuka jalan menjual barang gratis.
ALTER TABLE "stores"
  ADD COLUMN "maxCashierDiscountPercent" DECIMAL(5,2) NOT NULL DEFAULT 10;