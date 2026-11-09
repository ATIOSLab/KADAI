import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity-logger";
import { INVENTORY_ROLES, hasRequiredRole } from "@/lib/rbac";
import { z } from "zod";

// Schema item batch import
const importItemSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  categoryName: z.string().optional(),
  price: z.number().nonnegative("Harga jual harus non-negatif"),
  costPrice: z.number().nonnegative("HPP harus non-negatif").optional(),
  initialStock: z.number().nonnegative("Stok awal harus non-negatif").optional(),
  unit: z.string().optional(),
  description: z.string().optional(),
});

const batchImportPayloadSchema = z.object({
  products: z.array(importItemSchema).min(1, "Minimal 1 produk untuk diimpor"),
  defaultUnit: z.string().default("pcs"),
});

// POST /api/products/import-batch — Import produk dari kasir lama (Excel/CSV)
export async function POST(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return jsonError("Unauthorized", 401);
    }

    if (!hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return jsonError("Wewenang tidak cukup untuk impor produk", 403);
    }

    const body = await request.json();
    const validated = batchImportPayloadSchema.parse(body);

    const results = {
      importedCount: 0,
      skippedCount: 0,
      errors: [] as string[],
    };

    // Cache kategori yang ada
    const existingCategories = await prisma.category.findMany();
    const categoryMap = new Map<string, string>();
    for (const cat of existingCategories) {
      categoryMap.set(cat.name.toLowerCase().trim(), cat.id);
    }

    // Pastikan ada default kategori "Umum" jika kategori kosong
    let defaultCatId = categoryMap.get("umum");
    if (!defaultCatId) {
      const defCat = await prisma.category.create({
        data: { name: "Umum", color: "#64748B" },
      });
      defaultCatId = defCat.id;
      categoryMap.set("umum", defaultCatId);
    }

    // Default unit
    const fallbackUnit = await prisma.unit.findFirst();
    const defaultUnitName = fallbackUnit?.name || "pcs";

    for (let i = 0; i < validated.products.length; i++) {
      const item = validated.products[i];
      try {
        // Resolve Kategori (buat otomatis jika belum ada)
        let categoryId: string = defaultCatId;
        if (item.categoryName && item.categoryName.trim()) {
          const cleanCatName = item.categoryName.trim();
          const lowerCat = cleanCatName.toLowerCase();
          if (categoryMap.has(lowerCat)) {
            categoryId = categoryMap.get(lowerCat)!;
          } else {
            const newCat = await prisma.category.create({
              data: {
                name: cleanCatName,
                color: "#F97316", // default KADAI Ember
              },
            });
            categoryMap.set(lowerCat, newCat.id);
            categoryId = newCat.id;
          }
        }

        // Generate SKU jika kosong
        const finalSku =
          item.sku?.trim() ||
          `KDI-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

        // Cek apakah SKU sudah ada
        const existingProduct = await prisma.product.findUnique({
          where: { sku: finalSku },
        });

        if (existingProduct) {
          results.skippedCount++;
          results.errors.push(`Baris ${i + 1}: SKU ${finalSku} sudah ada di katalog.`);
          continue;
        }

        const unitName = item.unit?.trim().toLowerCase() || defaultUnitName;
        const initialQty = item.initialStock ?? 0;

        // Buat produk baru beserta initial batch (karena harga jual & HPP di KADAI berbasis batch FIFO)
        await prisma.$transaction(async (tx) => {
          const product = await tx.product.create({
            data: {
              name: item.name.trim(),
              sku: finalSku,
              barcode: item.barcode?.trim() || undefined,
              description: item.description?.trim() || undefined,
              unit: unitName,
              categoryId,
              lowStockThreshold: 10,
              productType: "FINISHED_GOOD",
            },
          });

          // Buat batch awal untuk menyimpan harga jual, HPP, dan stok awal
          const batchNumber = `BATCH-INIT-${Date.now().toString(36).toUpperCase()}-${i}`;
          await tx.productBatch.create({
            data: {
              productId: product.id,
              batchNumber,
              purchaseDate: new Date(),
              quantity: initialQty,
              remainingQty: initialQty,
              costPrice: item.costPrice ?? 0,
              sellingPrice: item.price,
              notes: "Impor data migrasi dari aplikasi kasir sebelumnya",
            },
          });
        });

        results.importedCount++;
      } catch (rowErr: any) {
        results.skippedCount++;
        results.errors.push(`Baris ${i + 1} (${item.name}): ${rowErr.message}`);
      }
    }

    // Log Activity
    await logActivity({
      userId: sessionUser.id,
      action: "PRODUCT_CREATED",
      entity: "ProductCatalog",
      entityId: `IMPORT-${Date.now()}`,
      details: {
        totalUploaded: validated.products.length,
        importedCount: results.importedCount,
        skippedCount: results.skippedCount,
      },
    });

    return jsonOk({
      success: true,
      data: results,
      message: `Berhasil mengimpor ${results.importedCount} produk ke katalog KADAI.`,
    });
  } catch (error) {
    return handleApiError(error, "POST /api/products/import-batch", "Gagal memproses impor batch produk");
  }
}
