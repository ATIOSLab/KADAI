-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'CASHIER', 'KITCHEN', 'INVENTORY', 'ACCOUNTANT');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('RETAIL', 'FNB_CAFE', 'FNB_RESTAURANT', 'FNB_WARUNG', 'SERVICE');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'STARTER', 'PRO_BUSINESS', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('FINISHED_GOOD', 'RAW_MATERIAL', 'MANUFACTURED', 'SERVICE');

-- CreateEnum
CREATE TYPE "StationType" AS ENUM ('KITCHEN', 'BAR', 'DESSERT', 'GENERAL');

-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('NONE', 'PPN_11', 'PPN_12', 'PB1_10', 'CUSTOM');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('DINE_IN', 'TAKEAWAY', 'DELIVERY');

-- CreateEnum
CREATE TYPE "KDSStatus" AS ENUM ('QUEUED', 'COOKING', 'READY', 'SERVED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('CASH', 'BANK_TRANSFER', 'QRIS', 'E_WALLET');

-- CreateEnum
CREATE TYPE "AdjustmentReason" AS ENUM ('DAMAGED', 'LOST', 'EXPIRED', 'STOCK_OPNAME', 'OTHER');

-- CreateEnum
CREATE TYPE "OutletType" AS ENUM ('CENTRAL_WAREHOUSE', 'CENTRAL_KITCHEN', 'RETAIL_BOOTH', 'FULL_SERVICE_STORE');

-- CreateEnum
CREATE TYPE "CostingMethod" AS ENUM ('FIFO', 'AVERAGE');

-- CreateEnum
CREATE TYPE "KitchenWorkflow" AS ENUM ('DIRECT_SERVE', 'KITCHEN_DISPATCH', 'HYBRID');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('DRAFT', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('SALE_CREATED', 'SALE_VOIDED', 'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_DELETED', 'BATCH_CREATED', 'STOCK_ADJUSTED', 'STOCK_TRANSFERRED', 'BATCH_PRODUCED', 'TABLE_CREATED', 'TABLE_UPDATED', 'TABLE_DELETED', 'RECIPE_UPDATED', 'KDS_STATUS_CHANGED', 'USER_LOGIN', 'USER_LOGOUT', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'FINANCE_ENTRY_CREATED', 'FINANCE_ENTRY_UPDATED', 'FINANCE_ENTRY_ARCHIVED', 'FINANCE_CATEGORY_CREATED', 'FINANCE_CATEGORY_UPDATED', 'FINANCE_CATEGORY_DEACTIVATED');

-- CreateEnum
CREATE TYPE "FinanceDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "FinanceSource" AS ENUM ('MANUAL', 'SALE', 'SALE_VOID', 'RESTOCK');

-- CreateEnum
CREATE TYPE "BotBusinessDayMode" AS ENUM ('CLOSING_CUTOFF');

-- CreateEnum
CREATE TYPE "BotJobType" AS ENUM ('TELEGRAM_MESSAGE', 'DAILY_SUMMARY');

-- CreateEnum
CREATE TYPE "BotJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DemoRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'CONTACTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ReferralLeadStatus" AS ENUM ('LEAD', 'TRIAL', 'SUBSCRIBED', 'CHURNED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MANUAL', 'MIDTRANS', 'XENDIT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SETTLED', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "supervisorPin" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CASHIER',
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "outletId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessType" "BusinessType" NOT NULL DEFAULT 'FNB_CAFE',
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'PRO_BUSINESS',
    "costingMethod" "CostingMethod" NOT NULL DEFAULT 'FIFO',
    "kitchenWorkflow" "KitchenWorkflow" NOT NULL DEFAULT 'KITCHEN_DISPATCH',
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logo" TEXT,
    "taxType" "TaxType" NOT NULL DEFAULT 'PB1_10',
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "taxInclusive" BOOLEAN NOT NULL DEFAULT false,
    "serviceChargeRate" DECIMAL(5,2) NOT NULL DEFAULT 5,
    "enableRounding" BOOLEAN NOT NULL DEFAULT true,
    "defaultMarkup" DECIMAL(5,2) NOT NULL DEFAULT 30,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_settings" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "closingTimeLocal" TEXT NOT NULL DEFAULT '22:00',
    "summaryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "openaiModel" TEXT NOT NULL DEFAULT 'gpt-5.5',
    "openaiApiKeyEncrypted" TEXT,
    "telegramBotTokenEncrypted" TEXT,
    "businessDayMode" "BotBusinessDayMode" NOT NULL DEFAULT 'CLOSING_CUTOFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_chat_bindings" (
    "id" TEXT NOT NULL,
    "telegramChatId" TEXT NOT NULL,
    "chatType" TEXT NOT NULL,
    "title" TEXT,
    "username" TEXT,
    "isAuthorized" BOOLEAN NOT NULL DEFAULT false,
    "canReceiveSummary" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_chat_bindings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_jobs" (
    "id" TEXT NOT NULL,
    "type" "BotJobType" NOT NULL,
    "status" "BotJobStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "memberTier" TEXT NOT NULL DEFAULT 'BRONZE',
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "lastVisitAt" TIMESTAMP(3),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outlets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "outletType" "OutletType" NOT NULL DEFAULT 'RETAIL_BOOTH',
    "kitchenWorkflow" "KitchenWorkflow" NOT NULL DEFAULT 'DIRECT_SERVE',
    "costingMethod" "CostingMethod" NOT NULL DEFAULT 'FIFO',
    "address" TEXT,
    "phone" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "taxType" "TaxType" NOT NULL DEFAULT 'PB1_10',
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "serviceChargeRate" DECIMAL(5,2) NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outlets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "description" TEXT,
    "productType" "ProductType" NOT NULL DEFAULT 'FINISHED_GOOD',
    "station" "StationType" NOT NULL DEFAULT 'GENERAL',
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "image" TEXT,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_items" (
    "id" TEXT NOT NULL,
    "parentProductId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantityNeeded" DECIMAL(12,4) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'gram',
    "wastagePercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_batches" (
    "id" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "remainingQty" INTEGER NOT NULL,
    "costPrice" DECIMAL(15,2) NOT NULL,
    "sellingPrice" DECIMAL(15,2) NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,
    "outletId" TEXT,
    "supplierId" TEXT,

    CONSTRAINT "product_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_tables" (
    "id" TEXT NOT NULL,
    "tableNo" TEXT NOT NULL,
    "section" TEXT NOT NULL DEFAULT 'Utama',
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "qrToken" TEXT NOT NULL,
    "isOccupied" BOOLEAN NOT NULL DEFAULT false,
    "outletId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "orderType" "OrderType" NOT NULL DEFAULT 'DINE_IN',
    "outletId" TEXT,
    "tableId" TEXT,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "discountAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "serviceCharge" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "roundingAmount" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "totalCost" DECIMAL(15,2) NOT NULL,
    "grossProfit" DECIMAL(15,2) NOT NULL,
    "paymentType" "PaymentType" NOT NULL,
    "paymentRef" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "notes" TEXT,
    "isVoided" BOOLEAN NOT NULL DEFAULT false,
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cashierId" TEXT NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "totalPrice" DECIMAL(15,2) NOT NULL,
    "totalCost" DECIMAL(15,2) NOT NULL,
    "discountAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_item_batches" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "costPrice" DECIMAL(15,2) NOT NULL,
    "sellingPrice" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "saleItemId" TEXT NOT NULL,
    "productBatchId" TEXT NOT NULL,

    CONSTRAINT "sale_item_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kds_orders" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "station" "StationType" NOT NULL DEFAULT 'KITCHEN',
    "status" "KDSStatus" NOT NULL DEFAULT 'QUEUED',
    "itemsJson" JSONB NOT NULL,
    "notes" TEXT,
    "tableNo" TEXT,
    "orderType" "OrderType" NOT NULL DEFAULT 'DINE_IN',
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "readyAt" TIMESTAMP(3),
    "servedAt" TIMESTAMP(3),

    CONSTRAINT "kds_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjustments" (
    "id" TEXT NOT NULL,
    "quantityChange" INTEGER NOT NULL,
    "reason" "AdjustmentReason" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "action" "ActionType" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "direction" "FinanceDirection" NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "systemKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_entries" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "direction" "FinanceDirection" NOT NULL,
    "source" "FinanceSource" NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "saleId" TEXT,
    "productBatchId" TEXT,

    CONSTRAINT "finance_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfers" (
    "id" TEXT NOT NULL,
    "transferNumber" TEXT NOT NULL,
    "sourceOutletId" TEXT NOT NULL,
    "destinationOutletId" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'IN_TRANSIT',
    "notes" TEXT,
    "createdById" TEXT,
    "receivedById" TEXT,
    "shippedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfer_items" (
    "id" TEXT NOT NULL,
    "stockTransferId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "costPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_transfer_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_requests" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "outletCount" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "accessCode" TEXT NOT NULL,
    "referralCode" TEXT,
    "status" "DemoRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demo_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_partners" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "bankAccountName" TEXT,
    "referralCode" TEXT NOT NULL,
    "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "status" "PartnerStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_leads" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "leadName" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "packageTier" TEXT,
    "status" "ReferralLeadStatus" NOT NULL DEFAULT 'LEAD',
    "subscriptionAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "commissionEarned" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "commissionPaid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "linkedStoreId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_payouts" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "period" TEXT,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "paymentProof" TEXT,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_subscriptions" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'PRO_BUSINESS',
    "cycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_invoices" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'PRO_BUSINESS',
    "cycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "amount" DECIMAL(15,2) NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'MANUAL',
    "providerRef" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "paidBy" TEXT,
    "paymentProof" TEXT,
    "notes" TEXT,
    "referralLeadId" TEXT,
    "commissionEarned" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_chat_bindings_telegramChatId_key" ON "telegram_chat_bindings"("telegramChatId");

-- CreateIndex
CREATE INDEX "telegram_chat_bindings_isAuthorized_idx" ON "telegram_chat_bindings"("isAuthorized");

-- CreateIndex
CREATE INDEX "telegram_chat_bindings_canReceiveSummary_idx" ON "telegram_chat_bindings"("canReceiveSummary");

-- CreateIndex
CREATE UNIQUE INDEX "bot_jobs_dedupeKey_key" ON "bot_jobs"("dedupeKey");

-- CreateIndex
CREATE INDEX "bot_jobs_status_nextRetryAt_idx" ON "bot_jobs"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "bot_jobs_type_status_idx" ON "bot_jobs"("type", "status");

-- CreateIndex
CREATE INDEX "bot_jobs_lockedAt_idx" ON "bot_jobs"("lockedAt");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "units_normalizedName_key" ON "units"("normalizedName");

-- CreateIndex
CREATE INDEX "units_isActive_idx" ON "units"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "units_name_key" ON "units"("name");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_name_idx" ON "customers"("name");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "outlets_code_key" ON "outlets"("code");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "products"("barcode");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_items_parentProductId_ingredientId_key" ON "recipe_items"("parentProductId", "ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "product_batches_batchNumber_key" ON "product_batches"("batchNumber");

-- CreateIndex
CREATE INDEX "product_batches_productId_remainingQty_idx" ON "product_batches"("productId", "remainingQty");

-- CreateIndex
CREATE INDEX "product_batches_productId_purchaseDate_idx" ON "product_batches"("productId", "purchaseDate");

-- CreateIndex
CREATE INDEX "product_batches_outletId_idx" ON "product_batches"("outletId");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_tables_tableNo_key" ON "restaurant_tables"("tableNo");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_tables_qrToken_key" ON "restaurant_tables"("qrToken");

-- CreateIndex
CREATE UNIQUE INDEX "sales_invoiceNumber_key" ON "sales"("invoiceNumber");

-- CreateIndex
CREATE INDEX "sales_cashierId_idx" ON "sales"("cashierId");

-- CreateIndex
CREATE INDEX "sales_outletId_idx" ON "sales"("outletId");

-- CreateIndex
CREATE INDEX "sales_createdAt_idx" ON "sales"("createdAt");

-- CreateIndex
CREATE INDEX "sales_invoiceNumber_idx" ON "sales"("invoiceNumber");

-- CreateIndex
CREATE INDEX "sale_items_saleId_idx" ON "sale_items"("saleId");

-- CreateIndex
CREATE INDEX "sale_items_productId_idx" ON "sale_items"("productId");

-- CreateIndex
CREATE INDEX "sale_item_batches_saleItemId_idx" ON "sale_item_batches"("saleItemId");

-- CreateIndex
CREATE INDEX "sale_item_batches_productBatchId_idx" ON "sale_item_batches"("productBatchId");

-- CreateIndex
CREATE INDEX "kds_orders_station_status_idx" ON "kds_orders"("station", "status");

-- CreateIndex
CREATE INDEX "stock_adjustments_productId_idx" ON "stock_adjustments"("productId");

-- CreateIndex
CREATE INDEX "stock_adjustments_userId_idx" ON "stock_adjustments"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_entity_entityId_idx" ON "activity_logs"("entity", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "finance_categories_systemKey_key" ON "finance_categories"("systemKey");

-- CreateIndex
CREATE INDEX "finance_categories_direction_isActive_idx" ON "finance_categories"("direction", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "finance_categories_name_direction_key" ON "finance_categories"("name", "direction");

-- CreateIndex
CREATE INDEX "finance_entries_entryDate_idx" ON "finance_entries"("entryDate");

-- CreateIndex
CREATE INDEX "finance_entries_direction_entryDate_idx" ON "finance_entries"("direction", "entryDate");

-- CreateIndex
CREATE INDEX "finance_entries_source_entryDate_idx" ON "finance_entries"("source", "entryDate");

-- CreateIndex
CREATE INDEX "finance_entries_categoryId_entryDate_idx" ON "finance_entries"("categoryId", "entryDate");

-- CreateIndex
CREATE INDEX "finance_entries_createdByUserId_idx" ON "finance_entries"("createdByUserId");

-- CreateIndex
CREATE INDEX "finance_entries_saleId_idx" ON "finance_entries"("saleId");

-- CreateIndex
CREATE INDEX "finance_entries_productBatchId_idx" ON "finance_entries"("productBatchId");

-- CreateIndex
CREATE INDEX "finance_entries_isArchived_entryDate_idx" ON "finance_entries"("isArchived", "entryDate");

-- CreateIndex
CREATE UNIQUE INDEX "stock_transfers_transferNumber_key" ON "stock_transfers"("transferNumber");

-- CreateIndex
CREATE INDEX "stock_transfers_sourceOutletId_idx" ON "stock_transfers"("sourceOutletId");

-- CreateIndex
CREATE INDEX "stock_transfers_destinationOutletId_idx" ON "stock_transfers"("destinationOutletId");

-- CreateIndex
CREATE INDEX "stock_transfers_status_idx" ON "stock_transfers"("status");

-- CreateIndex
CREATE INDEX "stock_transfer_items_stockTransferId_idx" ON "stock_transfer_items"("stockTransferId");

-- CreateIndex
CREATE INDEX "stock_transfer_items_productId_idx" ON "stock_transfer_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "demo_requests_accessCode_key" ON "demo_requests"("accessCode");

-- CreateIndex
CREATE INDEX "demo_requests_status_idx" ON "demo_requests"("status");

-- CreateIndex
CREATE INDEX "demo_requests_phone_idx" ON "demo_requests"("phone");

-- CreateIndex
CREATE INDEX "demo_requests_accessCode_idx" ON "demo_requests"("accessCode");

-- CreateIndex
CREATE INDEX "demo_requests_referralCode_idx" ON "demo_requests"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "referral_partners_referralCode_key" ON "referral_partners"("referralCode");

-- CreateIndex
CREATE INDEX "referral_partners_phone_idx" ON "referral_partners"("phone");

-- CreateIndex
CREATE INDEX "referral_partners_referralCode_idx" ON "referral_partners"("referralCode");

-- CreateIndex
CREATE INDEX "referral_partners_status_idx" ON "referral_partners"("status");

-- CreateIndex
CREATE INDEX "referral_leads_partnerId_idx" ON "referral_leads"("partnerId");

-- CreateIndex
CREATE INDEX "referral_leads_phone_idx" ON "referral_leads"("phone");

-- CreateIndex
CREATE INDEX "referral_leads_status_idx" ON "referral_leads"("status");

-- CreateIndex
CREATE INDEX "referral_payouts_partnerId_idx" ON "referral_payouts"("partnerId");

-- CreateIndex
CREATE INDEX "referral_payouts_status_idx" ON "referral_payouts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "referral_payouts_partnerId_period_key" ON "referral_payouts"("partnerId", "period");

-- CreateIndex
CREATE INDEX "store_subscriptions_storeId_idx" ON "store_subscriptions"("storeId");

-- CreateIndex
CREATE INDEX "store_subscriptions_status_idx" ON "store_subscriptions"("status");

-- CreateIndex
CREATE INDEX "store_subscriptions_expiresAt_idx" ON "store_subscriptions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_invoices_invoiceNumber_key" ON "payment_invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "payment_invoices_storeId_idx" ON "payment_invoices"("storeId");

-- CreateIndex
CREATE INDEX "payment_invoices_status_idx" ON "payment_invoices"("status");

-- CreateIndex
CREATE INDEX "payment_invoices_invoiceNumber_idx" ON "payment_invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "payment_invoices_referralLeadId_idx" ON "payment_invoices"("referralLeadId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_parentProductId_fkey" FOREIGN KEY ("parentProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_tables" ADD CONSTRAINT "restaurant_tables_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "restaurant_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_item_batches" ADD CONSTRAINT "sale_item_batches_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "sale_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_item_batches" ADD CONSTRAINT "sale_item_batches_productBatchId_fkey" FOREIGN KEY ("productBatchId") REFERENCES "product_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kds_orders" ADD CONSTRAINT "kds_orders_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "finance_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_productBatchId_fkey" FOREIGN KEY ("productBatchId") REFERENCES "product_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_sourceOutletId_fkey" FOREIGN KEY ("sourceOutletId") REFERENCES "outlets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_destinationOutletId_fkey" FOREIGN KEY ("destinationOutletId") REFERENCES "outlets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_stockTransferId_fkey" FOREIGN KEY ("stockTransferId") REFERENCES "stock_transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_leads" ADD CONSTRAINT "referral_leads_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "referral_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_payouts" ADD CONSTRAINT "referral_payouts_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "referral_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_subscriptions" ADD CONSTRAINT "store_subscriptions_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_invoices" ADD CONSTRAINT "payment_invoices_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_invoices" ADD CONSTRAINT "payment_invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "store_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_invoices" ADD CONSTRAINT "payment_invoices_referralLeadId_fkey" FOREIGN KEY ("referralLeadId") REFERENCES "referral_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

