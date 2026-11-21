import { NextRequest, NextResponse } from "next/server";
import { redactCosts, SALES_READ_ROLES } from "@/app/api/_lib/access";
import { Prisma, CateringStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkoutSchema, CATERING_STATUSES } from "@/lib/validators/sale";
import {
  processFIFODeduction,
  processSelectedBatchDeduction,
  applyFIFODeductions,
} from "@/lib/fifo";
import { generateInvoiceNumber } from "@/lib/utils";
import { ApiBusinessError } from "@/lib/api-response";
import {
  calculateSaleTotals,
  resolvePricingRates,
  type PricingRateSource,
  type SaleTotals,
} from "@/lib/pricing-rates";
import { logActivity } from "@/lib/activity-logger";
import {
  FINANCE_SYSTEM_CATEGORY_KEYS,
  getSystemFinanceCategoryId,
} from "@/lib/finance";
import { Decimal } from "@prisma/client/runtime/library";
import { getSessionUserFromRequest } from "@/lib/session";
import { resolveTenantScope } from "@/lib/tenant-scope";
import { ADMIN_CASHIER_ROLES, hasRequiredRole } from "@/lib/rbac";
import { verifySupervisorPin } from "@/lib/rbac/pin";
import {
  DEFAULT_MAX_CASHIER_DISCOUNT_PERCENT,
  discountApprovalMessage,
  evaluateDiscountPolicy,
} from "@/lib/discount-policy";
import { getBusinessDayStart } from "@/lib/business-day";
import { resolveDefaultOutletId } from "@/lib/outlet-resolution";
import { evaluatePaymentPolicy } from "@/lib/payment-policy";
import { resolveBusinessTimezone } from "@/lib/business-timezone";
import { fromZonedTime } from "date-fns-tz";
import { ZodError } from "zod";

// GET /api/sales — List sales
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, SALES_READ_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat melihat transaksi" },
        { status: 403 }
      );
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const paymentType = searchParams.get("paymentType");
    const outletId = searchParams.get("outletId");
    const catering = searchParams.get("catering");
    const cateringStatus = searchParams.get("cateringStatus");
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000 ||
        !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ error: "Pagination tidak valid" }, { status: 400 });
    }

    if ((paymentType && !["CASH", "BANK_TRANSFER", "QRIS", "E_WALLET", "TEMPO"].includes(paymentType)) ||
        (catering && catering !== "true") ||
        (cateringStatus && !(CATERING_STATUSES as readonly string[]).includes(cateringStatus)) ||
        [startDate, endDate].some((d) => d !== null &&
          (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !Number.isFinite(Date.parse(d))))) {
      return NextResponse.json({ error: "Filter tidak valid" }, { status: 400 });
    }
    const timezone = await resolveBusinessTimezone();

    const where = {
      AND: [
        {
          // Isolasi tenant: penjualan milik tenant pemanggil.
          // kolom storeId ada) dikenali lewat outlet, sedangkan penjualan tanpa
          // outlet (tenant tanpa cabang) tetap terlihat lewat storeId.
          OR: [
            { storeId: scope.storeId },
            { storeId: null, outlet: { storeId: scope.storeId } },
          ],
        },
        ...(search
          ? [
              {
                OR: [
                  { invoiceNumber: { contains: search, mode: "insensitive" as const } },
                  { customerName: { contains: search, mode: "insensitive" as const } },
                ],
              },
            ]
          : []),
      ],
      ...(sessionUser.role === "CASHIER" && { cashierId: sessionUser.id }),
      ...(outletId && { outletId }),
      ...(startDate &&
        endDate && {
          // Tanggal filter adalah tanggal KALENDER zona bisnis: 00:00 hari pertama
          // sampai 23:59:59.999 hari terakhir waktu toko, bukan UTC.
          createdAt: {
            gte: fromZonedTime(`${startDate}T00:00:00.000`, timezone),
            lte: fromZonedTime(`${endDate}T23:59:59.999`, timezone),
          },
        }),
      ...(paymentType && { paymentType: paymentType as "CASH" | "BANK_TRANSFER" | "QRIS" | "E_WALLET" | "TEMPO" }),
      // Filter booking catering: `catering=true` hanya menampilkan transaksi
      // yang bertanda catering; `cateringStatus` mempersempit per tahap.
      ...(catering === "true" && { cateringStatus: { not: null } }),
      ...(cateringStatus && { cateringStatus: cateringStatus as CateringStatus }),
    };

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          cashier: { select: { id: true, name: true, email: true } },
          outlet: { select: { id: true, name: true, code: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, unit: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ]);

    return NextResponse.json({
      data: redactCosts(sales, sessionUser.role),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/sales error:", error);
    return NextResponse.json({ error: "Gagal memuat data penjualan" }, { status: 500 });
  }
}

/**
 * Bentuk data penjualan yang dikembalikan ke klien, dipakai baik saat transaksi
 * baru dibuat maupun saat permintaan yang sama dikirim ulang (replay).
 */
const SALE_RESPONSE_INCLUDE = {
  items: {
    include: {
      product: { select: { id: true, name: true, sku: true, unit: true, station: true } },
      batchAllocations: true,
    },
  },
  cashier: { select: { id: true, name: true } },
  table: true,
  cateringPayments: {
    orderBy: { paidAt: "asc" as const },
    select: {
      id: true,
      amount: true,
      method: true,
      paidAt: true,
      note: true,
      createdBy: { select: { id: true, name: true } },
    },
  },
} as const;

/**
 * Kunci idempotensi pernah disimpan hanya di memori proses (TTL 60 detik).
 * Itu tidak menolong pada dua keadaan yang justru paling berbahaya: proses
 * server sempat mati/hidup ulang, atau jawaban hilang di jalan sehingga kasir
 * mengirim ulang pembayaran yang sebenarnya sudah tersimpan. Sekarang kuncinya
 * tersimpan pada baris penjualannya (unik), jadi pengiriman ulang selalu
 * mengembalikan transaksi yang sama - bukan transaksi kedua.
 */
function isIdempotencyKeyCollision(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== "P2002") return false;
  const target = (error.meta?.target as string[] | string | undefined) ?? [];
  const fields = Array.isArray(target) ? target : [target];
  return fields.some((field) => String(field).includes("idempotencyKey"));
}

// POST /api/sales — Create sale with FIFO deduction
// Nomor invoice dihitung dari jumlah penjualan tenant pada hari itu. Bila dua kasir
// checkout bersamaan, keduanya bisa mendapat nomor sama → P2002 → ulangi transaksi
// (hitungan di dalam transaksi ikut maju, jadi percobaan kedua pasti mendapat nomor baru).
// Kasir paralel (beberapa perangkat, satu cabang) sempat gagal 8 dari 12
// transaksi serentak dengan 3 percobaan. Jeda tumbuh per percobaan supaya
// penantang mundur, bukan menabrak lagi di milidetik yang sama.
// Jam sibuk: 12 kasir serentak pada satu batch FIFO sempat menyisakan 5
// penolakan walau semuanya hanya bentrok tulis. Anggaran percobaan dinaikkan
// supaya kasir menunggu (maks ~2 detik) alih-alih diminta mengulang manual.
const MAX_INVOICE_ATTEMPTS = 14;

/**
 * Transaksi Serializable yang bertabrakan ditolak PostgreSQL dengan P2034
 * ("write conflict or deadlock"). Itu bukan kegagalan server: transaksi kedua
 * hanya perlu diulang dengan jeda. Tanpa deteksi ini, dua kasir yang checkout
 * pada detik yang sama menerima 500 "Gagal membuat transaksi".
 */
function isRetryableWriteConflict(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code === "P2034") return true;
  return /write conflict|deadlock/i.test(String(error.message ?? ""));
}

async function createSaleWithRetry<T>(
  run: (attempt: number) => Promise<T>
): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await run(attempt - 1);
    } catch (error) {
      const isInvoiceCollision =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        !isIdempotencyKeyCollision(error) &&
        (((error.meta?.target as string[]) ?? []).includes("invoiceNumber") ||
          ((error.meta?.target as string[]) ?? []).includes("storeId_invoiceNumber"));
      const retryable = isInvoiceCollision || isRetryableWriteConflict(error);
      if (!retryable || attempt >= MAX_INVOICE_ATTEMPTS) {
        throw error;
      }
      // Jeda pendek berjitter: dua transaksi yang bentrok tidak boleh mengulang
      // pada milidetik yang sama lalu bentrok lagi.
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          // Jeda tumbuh + jitter lebar: 12 kasir serentak pada satu batch
          // (Serializable) saling menabrak kalau semuanya mencoba ulang pada
          // milidetik yang sama. Jendela total ~4 detik, tetap <1 detik untuk
          // kasus umum karena percobaan pertama tidak menunggu.
          Math.min(400, 40 * attempt) + Math.floor(Math.random() * 120)
        )
      );
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, ADMIN_CASHIER_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat membuat transaksi" },
        { status: 403 }
      );
    }

    const scope = await resolveTenantScope(sessionUser);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.message }, { status: scope.status });
    }

    // Zona bisnis: dasar penomoran invoice & jendela harian (bukan jam server UTC)
    const timezone = await resolveBusinessTimezone();

    const body = await request.json();
    const data = checkoutSchema.parse(body);

    // Isolasi tenant: cabang (outlet) yang dipilih klien wajib milik tenant pemanggil
    if (data.outletId) {
      const ownedOutlet = await prisma.outlet.findFirst({
        where: { id: data.outletId, storeId: scope.storeId },
        select: { id: true },
      });
      if (!ownedOutlet) {
        return NextResponse.json(
          { error: "Cabang tidak ditemukan pada tenant Anda" },
          { status: 404 }
        );
      }
    }

    const idempotencyKey =
      request.headers.get("x-idempotency-key")?.trim() ||
      data.idempotencyKey?.trim() ||
      null;

    if (idempotencyKey) {
      // Dibatasi tenant pemanggil: kunci milik tenant lain tidak boleh
      // membocorkan transaksi, dan pencariannya pun tidak boleh menebak-nebak.
      const sudahTersimpan = await prisma.sale.findFirst({
        where: { idempotencyKey, storeId: scope.storeId },
        include: SALE_RESPONSE_INCLUDE,
      });
      if (sudahTersimpan) {
        return NextResponse.json(
          { success: true, data: redactCosts(sudahTersimpan, sessionUser.role) },
          { status: 201, headers: { "X-Idempotent-Replay": "true" } }
        );
      }
    }

    if (data.items.length > 100 || data.items.some((item) => item.quantity > 10000 ||
            item.discountAmount > 1e12) || data.discountAmount > 1e12) {
          return NextResponse.json({ error: "Batas transaksi terlampaui" }, { status: 400 });
        }

        // Diskon tanpa alasan = uang hilang tanpa jejak. Alasan diperiksa sebelum
        // transaksi dibuka supaya tidak ada stok yang sempat terpotong.
        const adaDiskon =
          (data.discountAmount ?? 0) > 0 ||
          data.items.some((item) => (item.discountAmount ?? 0) > 0);
        if (adaDiskon && !(data.discountReason ?? "").trim()) {
          return NextResponse.json(
            {
              success: false,
              error: "Alasan diskon wajib diisi",
              code: "DISCOUNT_REASON_REQUIRED",
            },
            { status: 400 }
          );
        }

        const clientIp =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip") ||
          "unknown";

    // Process sale in a transaction.
    // Nomor invoice unik PER TENANT (storeId + invoiceNumber); retry menutup balapan
    // dua kasir yang checkout pada detik yang sama (Serializable + P2002).
    type SaleWithRelations = Prisma.SaleGetPayload<{
      include: typeof SALE_RESPONSE_INCLUDE;
    }>;
    let result: SaleWithRelations;
    try {
      result = await createSaleWithRetry((attemptOffset) =>
      prisma.$transaction(async (tx) => {
      // Resolve effective outlet, costing method, and kitchen workflow
      let effectiveOutletId = data.outletId || null;
      let outletPricing: PricingRateSource | null = null;
      if (!effectiveOutletId) {
        effectiveOutletId = await resolveDefaultOutletId(tx, {
          storeId: scope.storeId,
          userId: sessionUser.id,
        });
      }

      const store = await tx.store.findUnique({
        where: { id: scope.storeId },
      });
      let effectiveCostingMethod: "FIFO" | "FEFO" | "AVERAGE" = (store?.costingMethod as any) || "FIFO";
      let effectiveKitchenWorkflow: "DIRECT_SERVE" | "KITCHEN_DISPATCH" | "HYBRID" =
        store?.kitchenWorkflow || "KITCHEN_DISPATCH";

      if (effectiveOutletId) {
        const targetOutlet = await tx.outlet.findUnique({
          where: { id: effectiveOutletId },
          select: {
            costingMethod: true,
            kitchenWorkflow: true,
            // Tarif per cabang: halaman Cabang adalah satu-satunya tempat
            // PB1 & service charge bisa diatur, jadi cabang yang menang.
            taxRate: true,
            serviceChargeRate: true,
          },
        });
        if (targetOutlet) {
          effectiveCostingMethod = targetOutlet.costingMethod as any;
          effectiveKitchenWorkflow = targetOutlet.kitchenWorkflow;
          outletPricing = targetOutlet;
        }
      }

      // 1. Process Stock Deduction (FIFO or Weighted Average) for each item
      const processedItems = [];
      let totalCost = new Decimal(0);
      let subtotal = new Decimal(0);
      let itemDiscountTotal = new Decimal(0);

      for (const item of data.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, storeId: scope.storeId },
          include: {
            recipesAsParent: {
              include: { ingredient: true },
            },
          },
        });

        // Isolasi tenant: produk tenant lain tidak boleh bisa dijual (404, bukan 500)
        // Isolasi tenant: id produk tenant lain harus tampak "tidak ada" (404),
        // bukan kegagalan server (500) - dan tidak membocorkan keberadaannya.
        if (!product) {
          throw new ApiBusinessError(
            "Produk tidak ditemukan pada tenant Anda",
            404,
            "PRODUCT_NOT_FOUND"
          );
        }
        if (!product.isActive) {
          throw new ApiBusinessError("Produk tidak tersedia", 409, "PRODUCT_INACTIVE");
        }

        if (product.productType === "MANUFACTURED" && product.recipesAsParent.length > 0) {
          // F&B Manufactured Product with Recipe (e.g. Makanan, Kopi)
          // Deduct from raw material ingredients' batches
          let itemCost = new Decimal(0);
          const rawAllocations: any[] = [];

          for (const recipe of product.recipesAsParent) {
            const qtyNeeded = Math.ceil(
              Number(recipe.quantityNeeded) * item.quantity * (1 + Number(recipe.wastagePercent) / 100)
            );
            if (qtyNeeded > 0) {
              const rawFifo = await processFIFODeduction(tx, recipe.ingredientId, qtyNeeded, {
                outletId: effectiveOutletId,
                method: effectiveCostingMethod,
              });
              itemCost = itemCost.add(rawFifo.totalCost);
              rawAllocations.push(...rawFifo.allocations);
              await applyFIFODeductions(tx, rawFifo.allocations);
            }
          }

          // Manufactured prices must also come from the server, never the POS body.
          const priceBatch = await tx.productBatch.findFirst({
            where: {
              productId: product.id,
              remainingQty: { gt: 0 },
              ...(effectiveOutletId ? { OR: [{ outletId: effectiveOutletId }, { outletId: null }] } : {}),
            },
            orderBy: { purchaseDate: "asc" },
          });
          if (!priceBatch) {
            throw new ApiBusinessError(
              "Harga produk belum tersedia",
              409,
              "PRICE_UNAVAILABLE"
            );
          }

          // Stok PRODUK JADI ikut berkurang (FIFO). Sebelumnya hanya bahan baku
          // yang terpotong sehingga angka inventori produk manufaktur tidak pernah
          // turun walau terjual berkali-kali (stok fisik != sistem).
          const finishedFifo = await processFIFODeduction(tx, product.id, item.quantity, {
            outletId: effectiveOutletId,
            method: effectiveCostingMethod,
          });
          if (finishedFifo.allocations.length > 0) {
            await applyFIFODeductions(tx, finishedFifo.allocations);
            // Alokasi produk jadi ikut disimpan ke saleItem.batchAllocations agar
            // void memulihkan stok bahan baku DAN produk jadi secara konsisten.
            rawAllocations.push(...finishedFifo.allocations);
          }

          const unitSellingPrice = priceBatch.sellingPrice;
          const lineRevenue = unitSellingPrice.mul(item.quantity);
          const itemDiscount = new Decimal(item.discountAmount || 0);
          const itemTotalPrice = lineRevenue.sub(itemDiscount);

          processedItems.push({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: unitSellingPrice,
            totalPrice: itemTotalPrice,
            totalCost: itemCost,
            discountAmount: item.discountAmount || 0,
            allocations: rawAllocations,
          });

          totalCost = totalCost.add(itemCost);
          subtotal = subtotal.add(lineRevenue);
          itemDiscountTotal = itemDiscountTotal.add(itemDiscount);
        } else {
          // Standard Retail Finished Good deduction (FIFO or AVERAGE)
          const fifoResult = item.selectedBatchId
            ? await processSelectedBatchDeduction(
                tx,
                item.productId,
                item.selectedBatchId,
                item.quantity,
                { outletId: effectiveOutletId }
              )
            : await processFIFODeduction(tx, item.productId, item.quantity, {
                outletId: effectiveOutletId,
                method: effectiveCostingMethod,
              });
          const itemDiscount = new Decimal(item.discountAmount || 0);
          const itemTotalPrice = fifoResult.totalRevenue.sub(itemDiscount);

          processedItems.push({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: fifoResult.averageSellingPrice,
            totalPrice: itemTotalPrice,
            totalCost: fifoResult.totalCost,
            discountAmount: item.discountAmount || 0,
            allocations: fifoResult.allocations,
          });

          totalCost = totalCost.add(fifoResult.totalCost);
          subtotal = subtotal.add(fifoResult.totalRevenue);
          itemDiscountTotal = itemDiscountTotal.add(itemDiscount);

          await applyFIFODeductions(tx, fifoResult.allocations);
        }
      }

      // 2. Generate invoice number
      // Jendela harian & tanggal pada nomor memakai zona bisnis, bukan jam server
      // (UTC): urutan reset pada tengah malam WIB dan struk dini hari tetap
      // bertanggal hari setempat.
      const todaySalesCount = await tx.sale.count({
        where: {
          // Isolasi tenant: nomor invoice dihitung per tenant (termasuk penjualan
          // tanpa cabang dan baris lama yang hanya punya relasi outlet)
          OR: [
            { storeId: scope.storeId },
            { storeId: null, outlet: { storeId: scope.storeId } },
          ],
          createdAt: { gte: getBusinessDayStart(new Date(), timezone) },
        },
      });
      const invoiceNumber = generateInvoiceNumber(
        todaySalesCount + 1 + attemptOffset,
        new Date(),
        timezone
      );

      // 3. Tarif PB1 & service charge - satu implementasi bersama pratinjau
      //    keranjang POS dan menu QR publik (src/lib/pricing-rates.ts)
      const pricingRates = resolvePricingRates({ outlet: outletPricing, store });

      // 4. Calculate totals
      const transactionDiscount = new Decimal(data.discountAmount || 0);
      const discountAmount = itemDiscountTotal.add(transactionDiscount);

      let totals: SaleTotals;
      try {
        totals = calculateSaleTotals({
          subtotal,
          discountAmount,
          rates: pricingRates,
        });
      } catch {
        // calculateSaleTotals menolak diskon yang melebihi nilai transaksi
        throw new ApiBusinessError(
          "Diskon melebihi nilai transaksi",
          400,
          "INVALID_DISCOUNT"
        );
      }
      const { netSubtotal, serviceCharge, taxAmount, roundingAmount, totalAmount } = totals;
      if (processedItems.some((item) => item.totalPrice.isNegative())) {
        throw new ApiBusinessError(
          "Diskon melebihi nilai transaksi",
          400,
          "INVALID_DISCOUNT"
        );
      }

      // 4b. Kebijakan diskon manual: kasir dibatasi Store.maxCashierDiscountPercent,
      //     di atas itu wajib PIN supervisor. `discountAmount` di sini sudah
      //     mencakup diskon per baris + diskon nota, jadi kasir tidak bisa
      //     menghindari batas dengan memotong harga per item.
      const discountPolicy = evaluateDiscountPolicy({
        role: sessionUser.role,
        subtotal: Number(subtotal),
        discountAmount: Number(discountAmount),
        maxCashierDiscountPercent:
          store?.maxCashierDiscountPercent !== undefined
            ? Number(store.maxCashierDiscountPercent)
            : DEFAULT_MAX_CASHIER_DISCOUNT_PERCENT,
        supervisorApproved: false,
      });

      let discountApprovedBy: string | null = null;
      if (discountPolicy.decision === "NEEDS_APPROVAL") {
        if (!data.supervisorPin) {
          throw new ApiBusinessError(
            discountApprovalMessage(discountPolicy),
            403,
            "DISCOUNT_APPROVAL_REQUIRED"
          );
        }
        const pinCheck = await verifySupervisorPin(data.supervisorPin, clientIp, scope.storeId);
        if (!pinCheck.valid) {
          throw new ApiBusinessError(
            pinCheck.error || "PIN Supervisor tidak valid",
            403,
            "DISCOUNT_APPROVAL_INVALID"
          );
        }
        discountApprovedBy = `${pinCheck.supervisor?.name} (${pinCheck.supervisor?.role})`;
      }

      // 4c. Shift kasir: transaksi menempel ke laci yang sedang terbuka supaya
      //     Z-Report bisa dihitung ulang dan dicetak kembali kapan pun.
      //     Laci lama (dibuka sebelum perbaikan cabang) tidak punya outletId:
      //     laci tingkat toko itu tetap sah untuk transaksi cabang mana pun,
      //     jadi jangan sampai transaksi kehilangan lacinya.
      const openShift = await tx.cashShift.findFirst({
          where: {
            storeId: scope.storeId,
            cashierId: sessionUser.id,
            status: "OPEN",
            ...(effectiveOutletId
              ? { OR: [{ outletId: effectiveOutletId }, { outletId: null }] }
              : {}),
          },
          orderBy: { openedAt: "desc" },
          select: { id: true },
      });

      // Uang yang dipegang kasir. Divalidasi terhadap total yang SUDAH dihitung
      // server, bukan terhadap angka kiriman klien, supaya tidak ada jalan
      // mencatat "kembalian" dari total yang dipalsukan.
      //
      // `paidAmount: 0` diperlakukan sama dengan tidak dikirim: bagi pembayaran
      // non-tunai (termasuk tempo) nilai 0 hanya berarti "belum ada uang diterima",
      // dan klien yang selalu menyertakan kolomnya tidak boleh ditolak.
      let paidAmount: Decimal | null = null;
      let changeAmount: Decimal | null = null;
      const uangDiterima =
        data.paidAmount !== undefined && data.paidAmount !== null
          ? new Decimal(data.paidAmount)
          : null;
      if (uangDiterima !== null && uangDiterima.greaterThan(0)) {
        if (data.paymentType !== "CASH") {
          throw new ApiBusinessError(
            "Uang diterima hanya dicatat untuk pembayaran tunai",
            400,
            "PAID_AMOUNT_NOT_CASH"
          );
        }
        if (uangDiterima.lessThan(totalAmount)) {
          throw new ApiBusinessError(
            "Uang diterima kurang dari total tagihan",
            400,
            "PAID_LESS_THAN_TOTAL"
          );
        }
        paidAmount = uangDiterima.toDecimalPlaces(2);
        changeAmount = paidAmount.sub(totalAmount).toDecimalPlaces(2);
      } else if (uangDiterima !== null && data.paymentType === "CASH" && totalAmount.greaterThan(0)) {
        // Tunai untuk tagihan bernilai: uang diterima tidak boleh nol.
        throw new ApiBusinessError(
          "Uang diterima kurang dari total tagihan",
          400,
          "PAID_LESS_THAN_TOTAL"
        );
      }

      // Bukti bayar: piutang harus punya penanggung utang, dan pembayaran
      // non-tunai bernilai besar harus punya nomor referensi yang bisa
      // dicocokkan dengan mutasi bank/EDC.
      const paymentPolicy = evaluatePaymentPolicy({
        paymentType: data.paymentType,
        totalAmount: Number(totalAmount),
        paymentRef: data.paymentRef,
        customerId: data.customerId,
        customerName: data.customerName,
      });
      if (!paymentPolicy.ok) {
        throw new ApiBusinessError(
          paymentPolicy.message ?? "Bukti bayar belum lengkap",
          400,
          paymentPolicy.code
        );
      }

      // Booking catering (katering & event): transaksi bertanggal acara.
      // Aturan yang ditegakkan di server, bukan di layar:
      //  - pemesan wajib bernama (yang menanggung sisa tagihan harus jelas),
      //  - selalu dicatat sebagai TEMPO (tagihan) supaya sisa tagihan punya satu
      //    arti: total - akumulasi uang yang benar-benar diterima,
      //  - DP tidak boleh melebihi total, dan bila ada DP metodenya wajib jelas.
      const isCateringBooking =
        data.cateringEventDate !== undefined && data.cateringEventDate !== null;
      if (isCateringBooking) {
        // Vertikal usaha: hanya toko bertipe CATERING yang boleh mencatat
        // booking acara. Toko lain yang mengirim kolom catering ditolak, supaya
        // modul ini tidak bisa dipakai diam-diam di luar tipe usahanya.
        const cateringStore = await prisma.store.findFirst({
          where: { id: scope.storeId },
          select: { businessType: true },
        });
        if (cateringStore?.businessType !== "CATERING") {
          throw new ApiBusinessError(
            "Tipe usaha toko ini tidak mendukung booking catering",
            400,
            "CATERING_BUSINESS_TYPE_REQUIRED"
          );
        }
      }
      let cateringDeposit = new Decimal(0);
      let cateringPaidAmount: Decimal | null = null;
      let cateringEventDate: Date | null = null;
      let cateringDeliveryAt: Date | null = null;
      if (isCateringBooking) {
        cateringEventDate = new Date(data.cateringEventDate as string);
        const namaPemesan = (data.customerName ?? "").trim();
        if (namaPemesan.length < 2) {
          throw new ApiBusinessError(
            "Nama pemesan wajib diisi untuk booking catering",
            400,
            "CATERING_CUSTOMER_REQUIRED"
          );
        }
        if (data.paymentType !== "TEMPO") {
          throw new ApiBusinessError(
            "Booking catering dicatat sebagai tagihan (TEMPO) dengan uang muka",
            400,
            "CATERING_MUST_BE_TEMPO"
          );
        }
        cateringDeposit = new Decimal(data.cateringDeposit ?? 0).toDecimalPlaces(2);
        if (cateringDeposit.greaterThan(totalAmount)) {
          throw new ApiBusinessError(
            "Uang muka tidak boleh melebihi total tagihan",
            400,
            "CATERING_DEPOSIT_EXCEEDS_TOTAL"
          );
        }
        if (cateringDeposit.greaterThan(0) && !data.cateringDepositMethod) {
          throw new ApiBusinessError(
            "Metode pembayaran uang muka wajib diisi",
            400,
            "CATERING_DEPOSIT_METHOD_REQUIRED"
          );
        }
        if (data.cateringDeliveryAt) {
          cateringDeliveryAt = new Date(data.cateringDeliveryAt);
        }
        cateringPaidAmount = cateringDeposit;
      }

      // Laba kotor = pendapatan usaha dikurangi HPP. Service charge adalah
      // pendapatan jasa milik usaha, jadi ikut dihitung; PB1 tidak, karena
      // uang itu titipan negara dan hanya lewat di kas.
      // Pembulatan tunai adalah uang yang benar-benar diterima kasir, jadi ikut
      // dihitung. Tanpa ini laba kotor + HPP tidak akan pernah sama dengan
      // omzet neto (selisih sebesar total pembulatan pada laporan).
      const grossProfit = netSubtotal
        .add(serviceCharge)
        .add(roundingAmount)
        .sub(totalCost);

      // 5. Create sale record
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          idempotencyKey: idempotencyKey ?? null,
          storeId: scope.storeId,
          orderType: data.orderType || "DINE_IN",
          outletId: effectiveOutletId,
          tableId: data.tableId || null,
          subtotal,
          discountAmount,
          discountReason: data.discountReason?.trim() || null,
          discountApprovedBy,
          shiftId: openShift?.id ?? null,
          serviceCharge,
          taxAmount,
          roundingAmount,
          totalAmount,
          paidAmount,
          changeAmount,
          totalCost,
          grossProfit,
          paymentType: data.paymentType,
          paymentRef: data.paymentRef,
          customerName: data.customerName,
          customerId: data.customerId || null,
          notes: data.notes,
          // Booking catering
          cateringEventDate,
          cateringDeliveryAt,
          cateringDeposit: isCateringBooking ? cateringDeposit : null,
          cateringPaidAmount,
          cateringStatus: isCateringBooking ? "BOOKED" : null,
          cateringNote: isCateringBooking ? (data.cateringNote ?? "").trim() || null : null,
          cashierId: sessionUser.id,
          items: {
            create: processedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              totalCost: item.totalCost,
              discountAmount: item.discountAmount,
              batchAllocations: {
                create: item.allocations.map((alloc) => ({
                  productBatchId: alloc.batchId,
                  quantity: alloc.quantity,
                  costPrice: alloc.costPrice,
                  sellingPrice: alloc.sellingPrice,
                })),
              },
            })),
          },
        },
        include: SALE_RESPONSE_INCLUDE,
      });

      // 5b. Buku kas catering: DP pertama (bila ada) tercatat sebagai baris kas
      // tersendiri, supaya setiap rupiah yang diterima punya jejak kejadiannya.
      if (isCateringBooking && cateringDeposit.greaterThan(0)) {
        await tx.cateringPayment.create({
          data: {
            saleId: sale.id,
            amount: cateringDeposit,
            method: data.cateringDepositMethod as
              | "CASH"
              | "BANK_TRANSFER"
              | "QRIS"
              | "E_WALLET",
            paidAt: new Date(),
            note: "Uang muka (DP) saat booking",
            createdById: sessionUser.id,
          },
        });
      }

      // 6. Update table occupancy if dine-in
      if (data.tableId) {
        // Isolasi tenant: meja wajib milik outlet tenant pemanggil
        const ownedTable = await tx.restaurantTable.findFirst({
          where: {
            id: data.tableId,
            OR: [{ outlet: { storeId: scope.storeId } }, { outletId: null }],
          },
          select: { id: true },
        });
        if (ownedTable) {
          await tx.restaurantTable.update({
            where: { id: data.tableId },
            data: { isOccupied: true },
          });
        }
      }

      // 7. Route to Kitchen Display System (KDS) according to KitchenWorkflow
      const shouldDispatchKDS =
        effectiveKitchenWorkflow === "KITCHEN_DISPATCH" ||
        (effectiveKitchenWorkflow === "HYBRID" && (data.orderType || "DINE_IN") === "DINE_IN");

      if (shouldDispatchKDS) {
        const kitchenItems = sale.items.filter(
          (i: any) => i.product.station === "KITCHEN" || i.product.station === "GENERAL"
        );
        const barItems = sale.items.filter((i: any) => i.product.station === "BAR");

        if (kitchenItems.length > 0) {
          await tx.kDSOrder.create({
            data: {
              saleId: sale.id,
              station: "KITCHEN",
              status: "QUEUED",
              tableNo: sale.table?.tableNo || null,
              orderType: data.orderType || "DINE_IN",
              notes: data.notes || null,
              itemsJson: kitchenItems.map((k: any) => ({
                productId: k.productId,
                name: k.product.name,
                quantity: k.quantity,
                unit: k.product.unit,
                station: k.product.station,
                notes: null,
              })),
            },
          });
        }

        if (barItems.length > 0) {
          await tx.kDSOrder.create({
            data: {
              saleId: sale.id,
              station: "BAR",
              status: "QUEUED",
              tableNo: sale.table?.tableNo || null,
              orderType: data.orderType || "DINE_IN",
              notes: data.notes || null,
              itemsJson: barItems.map((b: any) => ({
                productId: b.productId,
                name: b.product.name,
                quantity: b.quantity,
                unit: b.product.unit,
                station: b.product.station,
                notes: null,
              })),
            },
          });
        }
      }

      const saleCategoryId = await getSystemFinanceCategoryId(
        tx,
        FINANCE_SYSTEM_CATEGORY_KEYS.SALE_INCOME
      );

      await tx.financeEntry.create({
        data: {
          amount: totalAmount,
          direction: "IN",
          source: "SALE",
          title: `Penjualan ${sale.invoiceNumber}`,
          notes: sale.notes,
          entryDate: sale.createdAt,
          categoryId: saleCategoryId,
          createdByUserId: sessionUser.id,
          saleId: sale.id,
          storeId: scope.storeId,
        },
      });

      // 8. Update customer CRM stats
      if (data.customerId) {
        // Isolasi tenant: pelanggan (CRM) wajib milik tenant pemanggil
        const ownedCustomer = await tx.customer.findFirst({
          where: { id: data.customerId, storeId: scope.storeId },
          select: { id: true },
        });
        if (ownedCustomer) {
          const loyaltyEarned = Math.floor(Number(totalAmount) / 10000);
          await tx.customer.update({
            where: { id: data.customerId },
            data: {
              totalSpent: { increment: totalAmount },
              visitCount: { increment: 1 },
              loyaltyPoints: { increment: loyaltyEarned },
              lastVisitAt: new Date(),
            },
          });
        }
      }

      return sale;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    })
      );
    } catch (error) {
      if (!idempotencyKey || !isIdempotencyKeyCollision(error)) {
        throw error;
      }
      // Dua permintaan identik masuk hampir bersamaan (kasir menekan Bayar dua
      // kali, atau pengiriman ulang otomatis). Yang kalah menabrak indeks unik:
      // jawabannya bukan "gagal", melainkan transaksi yang sudah dibuat kembarnya.
      const kembar = await prisma.sale.findFirst({
        where: { idempotencyKey, storeId: scope.storeId },
        include: SALE_RESPONSE_INCLUDE,
      });
      if (!kembar) {
        throw error;
      }
      return NextResponse.json(
        { success: true, data: redactCosts(kembar, sessionUser.role) },
        { status: 201, headers: { "X-Idempotent-Replay": "true" } }
      );
    }

    await logActivity({
      userId: sessionUser.id,
      action: "SALE_CREATED",
      entity: "Sale",
      entityId: result.id,
      details: {
        invoiceNumber: result.invoiceNumber,
        totalAmount: result.totalAmount.toString(),
        itemCount: result.items.length,
        discountAmount: result.discountAmount.toString(),
        shiftId: result.shiftId ?? null,
      },
    });

        // Diskon manual punya jejak auditnya sendiri: siapa memberi, berapa persen,
        // alasannya apa, dan siapa yang menyetujui bila melampaui batas kasir.
        if (Number(result.discountAmount) > 0) {
          await logActivity({
            userId: sessionUser.id,
            action: "SALE_DISCOUNTED",
            entity: "Sale",
            entityId: result.id,
            details: {
              invoiceNumber: result.invoiceNumber,
              discountAmount: result.discountAmount.toString(),
              subtotal: result.subtotal.toString(),
              percent:
                Number(result.subtotal) > 0
                  ? Math.round((Number(result.discountAmount) / Number(result.subtotal)) * 10000) / 100
                  : 0,
              reason: result.discountReason ?? null,
              approvedBy: result.discountApprovedBy ?? `${sessionUser.name} (${sessionUser.role})`,
            },
          });
        }

    const finalPayload = { success: true, data: redactCosts(result, sessionUser.role) };

    return NextResponse.json(finalPayload, { status: 201 });
  } catch (error) {
    console.error("POST /api/sales error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Data checkout tidak valid" },
        { status: 400 }
      );
    }
    // ApiBusinessError sudah membawa status + kode (409 INSUFFICIENT_STOCK,
    // 404 PRODUCT_NOT_FOUND, ...) beserta pesan yang menyebut sisa stok. Jangan
    // diratakan menjadi 400 tanpa kode: kasir kehilangan info jumlah tersedia.
    if (error instanceof ApiBusinessError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status }
      );
    }

    // Tabrakan tulis yang tetap gagal walau sudah diulang: kasir harus tahu
    // untuk mengulang, bukan melihat 500 yang tampak seperti server rusak.
    if (isRetryableWriteConflict(error)) {
      return NextResponse.json(
        {
          success: false,
          error: "Transaksi lain sedang diproses bersamaan. Silakan ulangi sebentar lagi.",
          code: "TRANSACTION_CONFLICT",
        },
        { status: 409 }
      );
    }

    const message = error instanceof Error ? error.message : "Gagal membuat transaksi";
    const isStockError =
      message.includes("Stok tidak cukup") || message.includes("Kurang");
    const isNotFound = message.includes("tidak ditemukan");
    const isUnavailable = message === "Produk tidak tersedia";
    const isConflict =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
    const status = isStockError
      ? 409
      : isNotFound
        ? 404
        : isUnavailable || isConflict
          ? 400
          : 500;
    const clientMessage = isStockError
      ? "Stok tidak mencukupi"
      : isConflict
        ? "Nomor transaksi bentrok, silakan ulangi"
        : status === 500
          ? "Gagal membuat transaksi"
          : message;
    return NextResponse.json({ error: clientMessage }, { status });
  }
}
