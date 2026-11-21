-- Booking catering: kolom jadwal acara + DP pada penjualan, dan buku kas uang
-- muka (DP/cicilan). Aditif penuh: kolom baru nullable, tidak ada data lama yang
-- berubah, sehingga aman dijalankan pada database produksi yang sudah berisi.
CREATE TYPE "CateringStatus" AS ENUM ('BOOKED', 'CONFIRMED', 'IN_PRODUCTION', 'DELIVERED', 'COMPLETED', 'CANCELLED');

ALTER TABLE "sales" ADD COLUMN "cateringEventDate" TIMESTAMP(3);
ALTER TABLE "sales" ADD COLUMN "cateringDeliveryAt" TIMESTAMP(3);
ALTER TABLE "sales" ADD COLUMN "cateringDeposit" DECIMAL(15,2);
ALTER TABLE "sales" ADD COLUMN "cateringPaidAmount" DECIMAL(15,2);
ALTER TABLE "sales" ADD COLUMN "cateringStatus" "CateringStatus";
ALTER TABLE "sales" ADD COLUMN "cateringNote" TEXT;

CREATE TABLE "catering_payments" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "method" "PaymentType" NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catering_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sales_cateringStatus_idx" ON "sales"("cateringStatus");
CREATE INDEX "sales_cateringEventDate_idx" ON "sales"("cateringEventDate");
CREATE INDEX "catering_payments_saleId_idx" ON "catering_payments"("saleId");
CREATE INDEX "catering_payments_paidAt_idx" ON "catering_payments"("paidAt");

ALTER TABLE "catering_payments" ADD CONSTRAINT "catering_payments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catering_payments" ADD CONSTRAINT "catering_payments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
