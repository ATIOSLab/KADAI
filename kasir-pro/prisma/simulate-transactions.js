const { PrismaClient, PaymentType, OrderType } = require("@prisma/client");

const prisma = new PrismaClient();

// Script ini menulis transaksi penjualan FIKTIF (nomor invoice nyata, stok ikut
// terpotong). HANYA boleh dijalankan di lingkungan demo — guard ganda:
// non-produksi DAN SEED_DEMO_ON_START=true (produksi kini selalu false).
if (process.env.NODE_ENV === "production" || process.env.SEED_DEMO_ON_START !== "true") {
  console.error(
    "Ditolak: simulate-transactions.js hanya untuk demo. " +
      "Set SEED_DEMO_ON_START=true dan pastikan NODE_ENV != production."
  );
  process.exit(1);
}

/**
 * Alokasikan qty dari batch yang tersedia (FIFO: kadaluarsa terdekat dulu).
 * Bisa menghasilkan total < qtyMinta bila stok tinggal sedikit — pemanggil
 * memakai total alokasi, bukan angka yang diminta.
 */
function rencanakanAlokasi(batches, qtyMinta) {
  const alokasi = [];
  let sisa = qtyMinta;
  for (const b of batches) {
    if (sisa <= 0) break;
    const ambil = Math.min(b.remainingQty, sisa);
    if (ambil <= 0) continue;
    alokasi.push({ batch: b, qty: ambil });
    sisa -= ambil;
  }
  return alokasi;
}

async function simulateTransactions() {
  console.log("=== Mensimulasikan Transaksi Penjualan Riil untuk Klaster Demo ===");

  // Simulasi HARUS berada dalam satu tenant demo agar tidak mencampur katalog lintas tenant
  const tenant = await prisma.store.findFirst({ where: { isDemo: true } });
  if (!tenant) {
    console.error("Tenant demo tidak ditemukan. Jalankan seed-demo-clusters.js terlebih dahulu.");
    return;
  }

  const outlet = await prisma.outlet.findFirst({
    where: { isMain: true, storeId: tenant.id },
  });
  if (!outlet) {
    console.error("Outlet utama tenant demo tidak ditemukan.");
    return;
  }

  const cashier = await prisma.user.findFirst({
    where: { role: "ADMIN", storeId: tenant.id },
  });
  if (!cashier) {
    console.error("User admin/kasir tenant demo tidak ditemukan.");
    return;
  }

  // Harga jual & HPP tinggal di batch, bukan di produk (satu produk bisa punya
  // beberapa batch dengan harga beli berbeda).
  const products = await prisma.product.findMany({
    where: {
      storeId: tenant.id,
      isActive: true,
      batches: { some: { remainingQty: { gt: 0 } } },
    },
    include: {
      batches: {
        where: { remainingQty: { gt: 0 } },
        orderBy: [{ expiryDate: "asc" }, { createdAt: "asc" }],
      },
    },
    take: 6,
  });
  if (products.length === 0) {
    console.error("Produk berstok belum terisi di database.");
    return;
  }

  const now = new Date();
  const sampleOrders = [
    { items: [{ prod: products[0], qty: 3 }, { prod: products[1] || products[0], qty: 2 }], method: PaymentType.QRIS, ref: "QR-2026-SIM-0001", type: OrderType.DINE_IN },
    { items: [{ prod: products[2] || products[0], qty: 4 }], method: PaymentType.CASH, ref: null, type: OrderType.TAKEAWAY },
    { items: [{ prod: products[0], qty: 2 }, { prod: products[3] || products[0], qty: 1 }], method: PaymentType.BANK_TRANSFER, ref: "TF-2026-SIM-0003", type: OrderType.DINE_IN },
    { items: [{ prod: products[1] || products[0], qty: 5 }], method: PaymentType.QRIS, ref: "QR-2026-SIM-0004", type: OrderType.DINE_IN },
  ];

  let totalSimulated = 0;
  let dilewati = 0;

  for (let i = 0; i < sampleOrders.length; i++) {
    const orderData = sampleOrders[i];
    const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(1001 + i)}`;

    // Idempoten: invoice unik per tenant — kalau sudah ada, jangan tambah omzet
    // atau memotong stok batch untuk kedua kalinya.
    const sudahAda = await prisma.sale.findUnique({
      where: { storeId_invoiceNumber: { storeId: tenant.id, invoiceNumber } },
      select: { id: true },
    });
    if (sudahAda) {
      console.log(`[Simulasi Transaksi] ${invoiceNumber} sudah ada — dilewati`);
      dilewati++;
      continue;
    }

    let subtotal = 0;
    let totalCost = 0;
    const saleItems = [];
    const alokasiBatch = [];

    for (const item of orderData.items) {
      const alokasi = rencanakanAlokasi(item.prod.batches, item.qty);
      if (alokasi.length === 0) continue;

      const qtyTeralokasi = alokasi.reduce((a, x) => a + x.qty, 0);
      const itemSubtotal = alokasi.reduce((a, x) => a + x.qty * Number(x.batch.sellingPrice), 0);
      const itemCost = alokasi.reduce((a, x) => a + x.qty * Number(x.batch.costPrice), 0);
      subtotal += itemSubtotal;
      totalCost += itemCost;

      saleItems.push({
        productId: item.prod.id,
        quantity: qtyTeralokasi,
        unitPrice: Number(alokasi[0].batch.sellingPrice),
        totalPrice: itemSubtotal,
        totalCost: itemCost,
        discountAmount: 0,
        batchAllocations: {
          create: alokasi.map((x) => ({
            productBatchId: x.batch.id,
            quantity: x.qty,
            costPrice: x.batch.costPrice,
            sellingPrice: x.batch.sellingPrice,
          })),
        },
      });

      for (const x of alokasi) alokasiBatch.push({ batchId: x.batch.id, qty: x.qty });
    }

    if (saleItems.length === 0) {
      console.error(`[Simulasi Transaksi] ${invoiceNumber} dilewati: stok katalog demo habis.`);
      continue;
    }

    const tax = Math.round(subtotal * 0.1); // PB1 10%
    const total = subtotal + tax;
    // Identitas laba yang berlaku sekarang: total − pajak − HPP.
    const grossProfit = total - tax - totalCost;

    await prisma.sale.create({
      data: {
        invoiceNumber,
        storeId: tenant.id,
        outletId: outlet.id,
        cashierId: cashier.id,
        subtotal,
        discountAmount: 0,
        serviceCharge: 0,
        taxAmount: tax,
        roundingAmount: 0,
        totalAmount: total,
        totalCost,
        grossProfit,
        paymentType: orderData.method,
        paymentRef: orderData.ref ?? null,
        orderType: orderData.type,
        paidAmount: total,
        changeAmount: 0,
        createdAt: new Date(Date.now() - (sampleOrders.length - i) * 3600 * 1000), // Rentang beberapa jam lalu
        items: {
          create: saleItems,
        },
      },
    });

    // Potong stok batch hanya setelah transaksi baru benar-benar tersimpan.
    for (const x of alokasiBatch) {
      await prisma.productBatch.updateMany({
        where: { id: x.batchId, remainingQty: { gte: x.qty } },
        data: { remainingQty: { decrement: x.qty } },
      });
    }

    totalSimulated += total;
    console.log(`[Simulasi Transaksi] ${invoiceNumber} -> Rp ${total.toLocaleString("id-ID")} (${orderData.method})`);
  }

  console.log(
    `\nBerhasil mensimulasikan ${sampleOrders.length - dilewati} transaksi total Rp ${totalSimulated.toLocaleString("id-ID")}!` +
      (dilewati ? ` (${dilewati} invoice dilewati karena sudah ada)` : ""),
  );
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
