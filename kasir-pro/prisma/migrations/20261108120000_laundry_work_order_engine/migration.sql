-- CreateEnum
CREATE TYPE "LaundryServiceType" AS ENUM ('KILOAN', 'SATUAN');

-- CreateEnum
CREATE TYPE "LaundryStatus" AS ENUM ('RECEIVED', 'WASHING', 'DRYING', 'IRONING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JobPaymentStatus" AS ENUM ('UNPAID', 'PARTIAL_DP', 'PAID_FULL');

-- AlterEnum
ALTER TYPE "ActionType" ADD VALUE 'LAUNDRY_JOB_CREATED';
ALTER TYPE "ActionType" ADD VALUE 'LAUNDRY_STATUS_CHANGED';
ALTER TYPE "ActionType" ADD VALUE 'LAUNDRY_PICKED_UP';

-- CreateTable
CREATE TABLE "laundry_job_orders" (
    "id" TEXT NOT NULL,
    "jobCode" TEXT NOT NULL,
    "trackingToken" TEXT NOT NULL,
    "serviceType" "LaundryServiceType" NOT NULL DEFAULT 'KILOAN',
    "status" "LaundryStatus" NOT NULL DEFAULT 'RECEIVED',
    "paymentStatus" "JobPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "weightKg" DECIMAL(6,2),
    "itemCount" INTEGER,
    "fragrance" TEXT,
    "rackLocation" TEXT,
    "specialNotes" TEXT,
    "estimatedDoneAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "washedAt" TIMESTAMP(3),
    "driedAt" TIMESTAMP(3),
    "ironedAt" TIMESTAMP(3),
    "readyAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "downPayment" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "remainingAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pickupPaymentMethod" "PaymentType",
    "pickupPaymentRef" TEXT,
    "whatsappNotified" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "saleId" TEXT NOT NULL,
    "outletId" TEXT,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "handledById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laundry_job_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "laundry_job_orders_jobCode_key" ON "laundry_job_orders"("jobCode");

-- CreateIndex
CREATE UNIQUE INDEX "laundry_job_orders_trackingToken_key" ON "laundry_job_orders"("trackingToken");

-- CreateIndex
CREATE UNIQUE INDEX "laundry_job_orders_saleId_key" ON "laundry_job_orders"("saleId");

-- CreateIndex
CREATE INDEX "laundry_job_orders_status_idx" ON "laundry_job_orders"("status");

-- CreateIndex
CREATE INDEX "laundry_job_orders_paymentStatus_idx" ON "laundry_job_orders"("paymentStatus");

-- CreateIndex
CREATE INDEX "laundry_job_orders_customerPhone_idx" ON "laundry_job_orders"("customerPhone");

-- CreateIndex
CREATE INDEX "laundry_job_orders_jobCode_idx" ON "laundry_job_orders"("jobCode");

-- CreateIndex
CREATE INDEX "laundry_job_orders_trackingToken_idx" ON "laundry_job_orders"("trackingToken");

-- AddForeignKey
ALTER TABLE "laundry_job_orders" ADD CONSTRAINT "laundry_job_orders_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laundry_job_orders" ADD CONSTRAINT "laundry_job_orders_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laundry_job_orders" ADD CONSTRAINT "laundry_job_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laundry_job_orders" ADD CONSTRAINT "laundry_job_orders_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
