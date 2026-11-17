import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePricingRates } from "@/lib/pricing-rates";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token meja diperlukan" }, { status: 400 });
    }

    // Find table by QR token (sertakan store pemilik outlet meja untuk isolasi tenant)
    const table = await prisma.restaurantTable.findUnique({
      where: { qrToken: token },
      include: {
        outlet: {
          select: {
            storeId: true,
            // Tarif cabang: dipakai menu QR supaya cocok dengan checkout POS
            taxRate: true,
            serviceChargeRate: true,
          },
        },
      },
    });

    if (!table) {
      return NextResponse.json({ error: "Meja tidak ditemukan atau kode QR tidak valid" }, { status: 404 });
    }

    // Get store settings milik tenant pemilik meja
    const storeId = table.outlet?.storeId ?? null;
    const store = storeId
      ? await prisma.store.findUnique({ where: { id: storeId } })
      : null;

    // Tarif yang dipakai meja ini HARUS sama dengan tarif yang dipakai checkout:
    // tarif cabang menang atas tarif toko (halaman Cabang yang mengaturnya).
    // Sebelumnya menu QR memakai default 10/5 sehingga tamu melihat pajak &
    // service charge yang tidak pernah muncul di struk.
    const menuRates = resolvePricingRates({
      outlet: table.outlet,
      store,
    });

    // Get available products (only finished goods & manufactured items with remaining batch stock or recipe)
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        storeId,
        productType: { in: ["FINISHED_GOOD", "MANUFACTURED"] },
      },
      include: {
        category: true,
        batches: {
          // Batch yang dijual dari cabang meja ini (plus stok lama tanpa
          // cabang), urut FIFO - batch pertama inilah yang benar-benar
          // dipotong kasir, jadi harganya yang harus tampil di menu.
          where: {
            remainingQty: { gt: 0 },
            OR: [{ outletId: table.outletId }, { outletId: null }],
          },
          orderBy: [{ purchaseDate: "asc" }, { createdAt: "asc" }],
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
    const formattedProducts = products
      .map((p: any) => {
        // Tanpa orderBy, batches[0] bisa batch mana saja: menu sempat menampilkan
        // Rp 7.000 sementara kasir menagih Rp 12.000 untuk produk yang sama.
        const activeBatch = p.batches[0];
        const price = activeBatch ? Number(activeBatch.sellingPrice) : 0;
        const totalStock = p.batches.reduce((sum: number, b: any) => sum + b.remainingQty, 0);

        return {
          product: p,
          price,
          totalStock,
        };
      })
      // Produk tanpa harga tidak boleh tampil "Rp 0" dan bisa dipesan gratis.
      .filter((row: any) => row.price > 0)
      .map(({ product: p, price, totalStock }: any) => {

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
        taxType: store?.taxType || "NONE",
        // Angka yang sama dengan checkout: 0 berarti memang tanpa pajak,
        // bukan alasan untuk menampilkan default 10%.
        taxRate: menuRates.taxRate,
        taxInclusive: menuRates.taxInclusive,
        serviceChargeRate: menuRates.serviceChargeRate,
      },
      categories,
      products: formattedProducts,
      // POST masih ditutup (token QR publik tidak boleh menulis stok/menagih).
      // UI wajib membaca flag ini supaya tamu tidak menyusun keranjang yang
      // akhirnya ditolak 403.
      selfOrderEnabled: false,
    });
  } catch (error) {
    console.error("GET /api/order error:", error);
    return NextResponse.json(
      { error: "Gagal memuat katalog menu meja" },
      { status: 500 }
    );
  }
}

// Public QR tokens identify tables; they do not authorize payment or stock writes.
// Re-enable only with a pending-order/settlement model and abuse controls.
export async function POST() {
  return NextResponse.json(
    { error: "Pemesanan mandiri sementara dinonaktifkan. Silakan pesan melalui kasir." },
    { status: 403 }
  );
}