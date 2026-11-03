import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token meja diperlukan" }, { status: 400 });
    }

    // Find table by QR token
    const table = await prisma.restaurantTable.findUnique({
      where: { qrToken: token },
    });

    if (!table) {
      return NextResponse.json({ error: "Meja tidak ditemukan atau kode QR tidak valid" }, { status: 404 });
    }

    // Get store settings
    const store = await prisma.store.findFirst();

    // Get available products (only finished goods & manufactured items with remaining batch stock or recipe)
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        productType: { in: ["FINISHED_GOOD", "MANUFACTURED"] },
      },
      include: {
        category: true,
        batches: {
          where: { remainingQty: { gt: 0 } },
          select: {
            id: true,
            batchNumber: true,
            remainingQty: true,
            sellingPrice: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Format products with available price
    const formattedProducts = products.map((p: any) => {
      const activeBatch = p.batches[0];
      const price = activeBatch ? Number(activeBatch.sellingPrice) : 0;
      const totalStock = p.batches.reduce((sum: number, b: any) => sum + b.remainingQty, 0);

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category.name,
        categoryId: p.categoryId,
        price,
        image: p.image,
        unit: p.unit,
        station: p.station,
        isAvailable: p.productType === "MANUFACTURED" ? true : totalStock > 0,
      };
    });

    // Group categories
    const categories = Array.from(
      new Set(formattedProducts.map((p: any) => p.category))
    );

    return NextResponse.json({
      table: {
        id: table.id,
        tableNo: table.tableNo,
        section: table.section,
      },
      store: {
        name: store?.name || "KADAI Indonesia",
        taxType: store?.taxType || "PB1_10",
        taxRate: Number(store?.taxRate || 10),
        taxInclusive: store?.taxInclusive ?? false,
        serviceChargeRate: Number(store?.serviceChargeRate || 5),
      },
      categories,
      products: formattedProducts,
    });
  } catch (error) {
    console.error("GET /api/order error:", error);
    return NextResponse.json(
      { error: "Gagal memuat katalog menu meja" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, customerName, items, notes } = body;

    if (!token || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Data pesanan tidak lengkap" },
        { status: 400 }
      );
    }

    const table = await prisma.restaurantTable.findUnique({
      where: { qrToken: token },
    });

    if (!table) {
      return NextResponse.json(
        { error: "Meja tidak valid" },
        { status: 404 }
      );
    }

    const store = await prisma.store.findFirst();
    const adminUser = await prisma.user.findFirst({
      where: { role: { in: ["ADMIN", "CASHIER"] }, isActive: true },
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: "Sistem kasir sedang tidak aktif" },
        { status: 500 }
      );
    }

    // Generate Invoice Number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;

    // Calculate subtotal
    let subtotal = new Decimal(0);
    const saleItemsData: Array<{
      productId: string;
      quantity: number;
      unitPrice: Decimal;
      totalPrice: Decimal;
      totalCost: Decimal;
      notes: string | null;
    }> = [];
    const kdsItemsSnapshot: Array<{
      productId: string;
      name: string;
      quantity: number;
      unit: string;
      station: string;
      notes: string | null;
    }> = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          batches: {
            where: { remainingQty: { gt: 0 } },
            orderBy: { purchaseDate: "asc" },
            take: 1,
          },
        },
      });

      if (!product) continue;

      const unitPrice = product.batches[0]
        ? product.batches[0].sellingPrice
        : new Decimal(0);
      const qty = Number(item.quantity) || 1;
      const lineSubtotal = unitPrice.mul(qty);
      subtotal = subtotal.add(lineSubtotal);

      saleItemsData.push({
        productId: product.id,
        quantity: qty,
        unitPrice,
        totalPrice: lineSubtotal,
        totalCost: new Decimal(0),
        notes: item.notes || null,
      });

      kdsItemsSnapshot.push({
        productId: product.id,
        name: product.name,
        quantity: qty,
        unit: product.unit,
        station: product.station,
        notes: item.notes || null,
      });
    }

    // Tax & Service Charge Calculations
    const serviceRate = Number(store?.serviceChargeRate || 0);
    const taxRate = Number(store?.taxRate || 0);
    const taxInclusive = store?.taxInclusive ?? false;

    let serviceCharge = new Decimal(0);
    let taxAmount = new Decimal(0);
    let totalAmount = new Decimal(0);

    if (serviceRate > 0) {
      serviceCharge = subtotal.mul(serviceRate).div(100);
    }

    const baseForTax = subtotal.add(serviceCharge);

    if (taxRate > 0) {
      if (taxInclusive) {
        // DPP = Total / (1 + taxRate/100)
        const dpp = baseForTax.div(1 + taxRate / 100);
        taxAmount = baseForTax.sub(dpp);
        totalAmount = baseForTax;
      } else {
        taxAmount = baseForTax.mul(taxRate).div(100);
        totalAmount = baseForTax.add(taxAmount);
      }
    } else {
      totalAmount = baseForTax;
    }

    // Execute Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Sale
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          orderType: "DINE_IN",
          tableId: table.id,
          subtotal,
          discountAmount: new Decimal(0),
          serviceCharge,
          taxAmount,
          roundingAmount: new Decimal(0),
          totalAmount,
          totalCost: new Decimal(0),
          grossProfit: totalAmount.sub(taxAmount),
          paymentType: "CASH",
          paymentRef: "QR_SELF_ORDER",
          customerName: customerName || `Tamu ${table.tableNo}`,
          notes: notes || "Pemesanan Mandiri via Scan QR Meja",
          cashierId: adminUser.id,
          items: {
            create: saleItemsData,
          },
        },
        include: { items: true },
      });

      // 2. Mark Table as Occupied
      await tx.restaurantTable.update({
        where: { id: table.id },
        data: { isOccupied: true },
      });

      // 3. Create KDS Order for Kitchen
      const kitchenItems = kdsItemsSnapshot.filter(
        (i) => i.station === "KITCHEN" || i.station === "GENERAL"
      );
      const barItems = kdsItemsSnapshot.filter((i) => i.station === "BAR");

      if (kitchenItems.length > 0) {
        await tx.kDSOrder.create({
          data: {
            saleId: sale.id,
            station: "KITCHEN",
            status: "QUEUED",
            tableNo: table.tableNo,
            orderType: "DINE_IN",
            notes: notes || null,
            itemsJson: kitchenItems,
          },
        });
      }

      if (barItems.length > 0) {
        await tx.kDSOrder.create({
          data: {
            saleId: sale.id,
            station: "BAR",
            status: "QUEUED",
            tableNo: table.tableNo,
            orderType: "DINE_IN",
            notes: notes || null,
            itemsJson: barItems,
          },
        });
      }

      return sale;
    });

    return NextResponse.json({
      success: true,
      message: "Pesanan berhasil dikirim ke kasir & dapur!",
      saleId: result.id,
      invoiceNumber: result.invoiceNumber,
      totalAmount: Number(result.totalAmount),
    });
  } catch (error) {
    console.error("POST /api/order error:", error);
    return NextResponse.json(
      { error: "Gagal memproses pesanan meja" },
      { status: 500 }
    );
  }
}
