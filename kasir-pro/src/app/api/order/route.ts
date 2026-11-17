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
        taxType: store?.taxType || "NONE",
        // Angka yang sama dengan checkout: 0 berarti memang tanpa pajak,
        // bukan alasan untuk menampilkan default 10%.
        taxRate: menuRates.taxRate,
        taxInclusive: menuRates.taxInclusive,
        serviceChargeRate: menuRates.serviceChargeRate,
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

// Public QR tokens identify tables; they do not authorize payment or stock writes.
// Re-enable only with a pending-order/settlement model and abuse controls.
export async function POST() {
  return NextResponse.json(
    { error: "Pemesanan mandiri sementara dinonaktifkan. Silakan pesan melalui kasir." },
    { status: 403 }
  );
}