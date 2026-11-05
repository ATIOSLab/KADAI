const { PrismaClient, PaymentMethod, PaymentStatus, OrderType } = require("@prisma/client");

const prisma = new PrismaClient();

async function simulateTransactions() {
  console.log("=== Mensimulasikan Transaksi Penjualan Riil untuk Klaster Demo ===");

  const outlet = await prisma.outlet.findFirst({ where: { isMain: true } });
  if (!outlet) {
    console.error("Outlet utama tidak ditemukan.");
    return;
  }

  const cashier = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!cashier) {
    console.error("User admin/kasir tidak ditemukan.");
    return;
  }

  const products = await prisma.product.findMany({ take: 6 });
  if (products.length === 0) {
    console.error("Produk belum terisi di database.");
    return;
  }

  const now = new Date();
  const sampleOrders = [
    { items: [{ prod: products[0], qty: 3 }, { prod: products[1] || products[0], qty: 2 }], method: PaymentMethod.QRIS, type: OrderType.DINE_IN },
    { items: [{ prod: products[2] || products[0], qty: 4 }], method: PaymentMethod.CASH, type: OrderType.TAKEAWAY },
    { items: [{ prod: products[0], qty: 2 }, { prod: products[3] || products[0], qty: 1 }], method: PaymentMethod.DEBIT, type: OrderType.DINE_IN },
    { items: [{ prod: products[1] || products[0], qty: 5 }], method: PaymentMethod.QRIS, type: OrderType.DINE_IN },
  ];

  let totalSimulated = 0;
  for (let i = 0; i < sampleOrders.length; i++) {
    const orderData = sampleOrders[i];
    const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(1001 + i)}`;

    let subtotal = 0;
    const saleItems = [];

    for (const item of orderData.items) {
      const price = Number(item.prod.price);
      const cost = Number(item.prod.cost);
      const itemSubtotal = price * item.qty;
      subtotal += itemSubtotal;

      saleItems.push({
        productId: item.prod.id,
        quantity: item.qty,
        unitPrice: price,
        costPrice: cost,
        subtotal: itemSubtotal,
      });
    }

    const tax = Math.round(subtotal * 0.1); // PB1 10%
    const total = subtotal + tax;

    await prisma.sale.upsert({
      where: { invoiceNumber },
      update: {},
      create: {
        invoiceNumber,
        outletId: outlet.id,
        cashierId: cashier.id,
        subtotal,
        tax,
        discount: 0,
        total,
        paymentMethod: orderData.method,
        paymentStatus: PaymentStatus.PAID,
        orderType: orderData.type,
        paidAmount: total,
        changeAmount: 0,
        createdAt: new Date(Date.now() - (sampleOrders.length - i) * 3600 * 1000), // Rentang beberapa jam lalu
        items: {
          create: saleItems,
        },
      },
    });

    totalSimulated += total;
    console.log(`[Simulasi Transaksi] ${invoiceNumber} -> Rp ${total.toLocaleString("id-ID")} (${orderData.method})`);
  }

  console.log(`\nBerhasil mensimulasikan ${sampleOrders.length} transaksi total Rp ${totalSimulated.toLocaleString("id-ID")}!`);
}

module.exports = simulateTransactions;

if (require.main === module) {
  simulateTransactions()
    .catch((e) => {
      console.error("Error simulating transactions:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}