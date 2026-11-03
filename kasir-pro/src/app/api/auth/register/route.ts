import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      storeName,
      businessType = "FNB_CAFE",
      ownerName,
      email,
      password,
      tier = "PRO_BUSINESS",
      phone,
    } = body;

    if (!storeName || !ownerName || !email || !password) {
      return NextResponse.json(
        { error: "Nama Toko, Nama Pemilik, Email, dan Password wajib diisi" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Check if email already registered
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan gunakan email lain atau login." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const isFnb = businessType.startsWith("FNB");

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          name: ownerName,
          email: email.toLowerCase(),
          passwordHash,
          role: "ADMIN",
        },
      });

      // 2. Setup or Update Store
      const storeData = {
        name: storeName,
        businessType: businessType as any,
        tier: tier as any,
        phone: phone || null,
        email: email.toLowerCase(),
        taxType: isFnb ? "PB1_10" : "PPN_11",
        taxRate: isFnb ? 10 : 11,
        taxInclusive: false,
        serviceChargeRate: isFnb ? 5 : 0,
        enableRounding: true,
      };

      const existingStore = await tx.store.findFirst();
      let store;
      if (existingStore) {
        store = await tx.store.update({
          where: { id: existingStore.id },
          data: storeData,
        });
      } else {
        store = await tx.store.create({
          data: storeData,
        });
      }

      // 3. Create Default Categories if not exist
      const defaultCategories = isFnb
        ? ["Makanan Utama", "Minuman & Kopi", "Camilan / Dimsum", "Bahan Pokok"]
        : ["Barang Dagangan", "Makanan Ringan", "Minuman Kemasan", "Kebutuhan Pokok"];

      for (const catName of defaultCategories) {
        await tx.category.upsert({
          where: { name: catName },
          update: {},
          create: { name: catName, isActive: true },
        });
      }

      // 4. If F&B, create initial tables
      if (isFnb) {
        const defaultTables = [
          { tableNo: "Meja 01", section: "Lantai 1", capacity: 4, qrToken: "table-01" },
          { tableNo: "Meja 02", section: "Lantai 1", capacity: 2, qrToken: "table-02" },
          { tableNo: "Meja 03", section: "Outdoor", capacity: 4, qrToken: "table-03" },
          { tableNo: "Meja VIP", section: "VIP Room", capacity: 8, qrToken: "table-vip" },
        ];

        for (const t of defaultTables) {
          await tx.restaurantTable.upsert({
            where: { tableNo: t.tableNo },
            update: {},
            create: t,
          });
        }
      }

      return { user, store };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Pendaftaran UMKM berhasil! Silakan login untuk mengelola bisnis Anda.",
        userId: result.user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses registrasi" },
      { status: 500 }
    );
  }
}
