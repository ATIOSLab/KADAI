import type {
  Product,
  ProductBatch,
  Category,
  Sale,
  SaleItem,
  SaleItemBatch,
  User,
  Supplier,
  Unit,
  StockAdjustment,
  ActivityLog,
  Store,
  FinanceCategory,
  FinanceEntry,
} from "@prisma/client";
import type { PricingBatch } from "@/lib/pos-pricing";

// ============================================================
// Extended Types with Relations
// ============================================================

export type ProductWithCategory = Product & {
  category: Category;
};

export type ProductWithBatches = Product & {
  category: Category;
  batches: ProductBatch[];
};

export type ProductWithStock = ProductWithCategory & {
  totalStock: number;
  currentSellingPrice: number | null;
  batches: ProductBatch[];
  pricingBatches: PricingBatch[];
};

export type BatchWithProduct = ProductBatch & {
  product: Product;
  supplier: Supplier | null;
};

export type UnitOption = Pick<Unit, "id" | "name" | "normalizedName">;

export type SaleWithItems = Sale & {
  cashier: Pick<User, "id" | "name" | "email">;
  items: SaleItemWithProduct[];
};

export type SaleItemWithProduct = SaleItem & {
  product: Pick<Product, "id" | "name" | "sku" | "unit">;
  batchAllocations: SaleItemBatch[];
};

export type ActivityLogWithUser = ActivityLog & {
  user: Pick<User, "id" | "name" | "email" | "role">;
};

export type StockAdjustmentWithDetails = StockAdjustment & {
  product: Pick<Product, "id" | "name" | "sku">;
  user: Pick<User, "id" | "name">;
};

export type FinanceCategoryRecord = FinanceCategory;

export type FinanceEntryRecord = FinanceEntry & {
  category: Pick<FinanceCategory, "id" | "name" | "direction" | "isSystem">;
  createdByUser: Pick<User, "id" | "name" | "role"> | null;
  sale: Pick<Sale, "id" | "invoiceNumber"> | null;
  productBatch: Pick<ProductBatch, "id" | "batchNumber"> | null;
};

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================
// Dashboard Types
// ============================================================

export interface DashboardSummary {
  todaySales: number;
  todayTransactions: number;
  todayProfit: number;
  averageTransaction: number;
  lowStockCount: number;
  totalActiveProducts: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  value2?: number;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  profit: number;
}

export interface PaymentDistributionData {
  name: string;
  value: number;
  color: string;
}

export interface TopProductData {
  name: string;
  qty: number;
  revenue: number;
}

export interface CategorySalesData {
  name: string;
  value: number;
  color: string;
}

export interface HppRevenueData {
  period: string;
  hpp: number;
  revenue: number;
}

export interface HourlySalesData {
  hour: string;
  transactions: number;
}

export interface DashboardOverview {
  summary: DashboardSummary;
  charts: {
    revenueTrend: RevenueChartData[];
    paymentDistribution: PaymentDistributionData[];
    topProducts: TopProductData[];
    categorySales: CategorySalesData[];
    hppVsRevenue: HppRevenueData[];
    hourlySales: HourlySalesData[];
  };
}

// ============================================================
// Finance Types
// ============================================================

export interface FinanceSummary {
  businessBalance: number;
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
}

export interface FinanceBreakdownItem {
  key: string;
  label: string;
  direction: "IN" | "OUT";
  totalAmount: number;
}

export interface FinanceLedgerResponse {
  summary: FinanceSummary;
  sourceBreakdown: FinanceBreakdownItem[];
  categoryBreakdown: FinanceBreakdownItem[];
  entries: FinanceEntryRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================
// Cart Types (POS)
// ============================================================

export interface CartItem {
  lineId: string;
  productId: string;
  productName: string;
  image?: string | null;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  subtotal: number;
  maxStock: number;
  selectedBatchId: string | null;
  pricingBatches: PricingBatch[];
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  grandTotal: number;
}

// ============================================================
// Re-export Prisma types
// ============================================================

export type {
  Product,
  ProductBatch,
  Category,
  Sale,
  SaleItem,
  SaleItemBatch,
  User,
  Supplier,
  Unit,
  StockAdjustment,
  ActivityLog,
  Store,
  FinanceCategory,
  FinanceEntry,
};

export {
  UserRole,
  PaymentType,
  AdjustmentReason,
  ActionType,
  FinanceDirection,
  FinanceSource,
} from "@prisma/client";
