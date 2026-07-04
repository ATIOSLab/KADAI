"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { ProductImageUpload } from "@/components/shared/product-image-upload";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PackagePlus, Loader2, Sparkles } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import {
  cleanupUploadedProductImage,
  uploadProductImage,
} from "@/lib/product-image-client";
import { cn } from "@/lib/utils";
import type { Category, UnitOption } from "@/types";

const OTHER_UNIT_VALUE = "__other__";
const OTHER_CATEGORY_VALUE = "__other__";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [generatingSku, setGeneratingSku] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sku, setSku] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("pcs");
  const [customUnit, setCustomUnit] = useState("");
  const [productImageFile, setProductImageFile] = useState<File | null>(null);

  useEffect(() => {
    async function loadFormOptions() {
      try {
        const [categoryRes, unitRes] = await Promise.all([
          apiFetch<{ data: Category[] }>("/api/categories"),
          apiFetch<{ data: UnitOption[] }>("/api/units"),
        ]);
        setCategories(categoryRes.data);
        setUnits(unitRes.data);
      } catch {
        toast.error("Gagal memuat opsi form");
      } finally {
        setLoadingCategories(false);
        setLoadingUnits(false);
      }
    }
    loadFormOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    let uploadedImageUrl: string | null = null;

    const formData = new FormData(e.currentTarget);

    const name = (formData.get("name") as string)?.trim();
    const resolvedSku = sku.trim();
    const resolvedUnit =
      selectedUnit === OTHER_UNIT_VALUE ? customUnit.trim() : selectedUnit;
    const customCategoryName = customCategory.trim();

    // Client-side validation
    const newErrors: Record<string, string> = {};
    if (!name) newErrors.name = "Nama produk wajib diisi";
    if (!resolvedSku) newErrors.sku = "SKU wajib diisi";
    if (!selectedCategory) newErrors.categoryId = "Kategori wajib dipilih";
    if (
      selectedCategory === OTHER_CATEGORY_VALUE &&
      !customCategoryName
    ) {
      newErrors.categoryId = "Nama kategori baru wajib diisi";
    }
    if (!resolvedUnit) newErrors.unit = "Satuan wajib dipilih atau diisi";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      let categoryId = selectedCategory;
      if (selectedCategory === OTHER_CATEGORY_VALUE) {
        const categoryResponse = await apiFetch<{ data: Category }>(
          "/api/categories",
          {
            method: "POST",
            body: {
              name: customCategoryName,
            },
          }
        );
        categoryId = categoryResponse.data.id;
      }

      if (productImageFile) {
        const uploadResponse = await uploadProductImage(productImageFile);
        uploadedImageUrl = uploadResponse.data.url;
      }

      await apiFetch("/api/products", {
        method: "POST",
        body: {
          name,
          sku: resolvedSku,
          barcode: (formData.get("barcode") as string)?.trim() || null,
          description: (formData.get("description") as string)?.trim() || null,
          unit: resolvedUnit,
          categoryId,
          lowStockThreshold:
            parseInt(formData.get("lowStockThreshold") as string) || 10,
          image: uploadedImageUrl,
        },
      });

      toast.success("Produk berhasil ditambahkan!");
      router.push("/products");
    } catch (err) {
      if (uploadedImageUrl) {
        void cleanupUploadedProductImage(uploadedImageUrl);
      }
      if (err instanceof ApiError) {
        // Check for specific SKU/barcode duplicate error
        if (
          err.message.includes("SKU") ||
          err.message.includes("barcode") ||
          err.message.includes("sudah digunakan")
        ) {
          setErrors({ sku: err.message });
        }
        toast.error(err.message);
      } else {
        toast.error("Gagal membuat produk baru");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSku = async () => {
    setGeneratingSku(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== OTHER_CATEGORY_VALUE) {
        params.set("categoryId", selectedCategory);
      }
      if (
        selectedCategory === OTHER_CATEGORY_VALUE &&
        customCategory.trim()
      ) {
        params.set("categoryName", customCategory.trim());
      }
      const productNameInput =
        (document.getElementById("name") as HTMLInputElement | null)?.value?.trim() || "";
      if (productNameInput) {
        params.set("productName", productNameInput);
      }

      const response = await apiFetch<{ data: { sku: string } }>(
        `/api/products/generate-sku?${params.toString()}`
      );
      setSku(response.data.sku);
      setErrors((current) => {
        const nextErrors = { ...current };
        delete nextErrors.sku;
        return nextErrors;
      });
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Gagal generate SKU";
      toast.error(message);
    } finally {
      setGeneratingSku(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      <PageHeader
        title="Tambah Produk Baru"
        description="Isi detail produk yang ingin ditambahkan"
        icon={PackagePlus}
      />

      <Card>
        <CardHeader>
          <CardTitle>Detail Produk</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informasi Produk */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Informasi Produk</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Produk *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Contoh: Indomie Goreng"
                  required
                  className={errors.name ? "border-accent-danger" : ""}
                />
                {errors.name && (
                  <p className="text-xs font-bold text-accent-danger">
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <div className="relative">
                  <Input
                    id="sku"
                    name="sku"
                    placeholder="Contoh: MKN-001"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className={cn(
                      "pr-32",
                      errors.sku ? "border-accent-danger" : ""
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateSku}
                    disabled={generatingSku}
                    className="absolute inset-y-1 right-1 h-auto px-3 shadow-none hover:translate-x-0 hover:translate-y-0 hover:shadow-none active:translate-x-0 active:translate-y-0"
                  >
                    {generatingSku ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-1" />
                    )}
                    Generate
                  </Button>
                </div>
                {errors.sku && (
                  <p className="text-xs font-bold text-accent-danger">
                    {errors.sku}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  name="barcode"
                  placeholder="Scan atau input barcode"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Kategori *</Label>
                {loadingCategories ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <SearchableSelect
                    value={selectedCategory}
                    onValueChange={(value) => {
                      setSelectedCategory(value);
                      if (value !== OTHER_CATEGORY_VALUE) {
                        setCustomCategory("");
                      }
                    }}
                    placeholder="Pilih Kategori"
                    searchPlaceholder="Cari kategori..."
                    emptyMessage="Kategori tidak ditemukan."
                    triggerClassName={errors.categoryId ? "border-accent-danger" : ""}
                    options={[
                      ...categories.map((category) => ({
                        value: category.id,
                        label: category.name,
                      })),
                      {
                        value: OTHER_CATEGORY_VALUE,
                        label: "Lainnya...",
                        searchText: "lainnya other custom",
                      },
                    ]}
                  />
                )}
                {selectedCategory === OTHER_CATEGORY_VALUE && (
                  <Input
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Masukkan kategori baru"
                    className={errors.categoryId ? "border-accent-danger" : ""}
                  />
                )}
                {errors.categoryId && (
                  <p className="text-xs font-bold text-accent-danger">
                    {errors.categoryId}
                  </p>
                )}
              </div>
            </div>
          </div>
            {/* Detail Produk */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Detail Produk</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Satuan</Label>
                {loadingUnits ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <SearchableSelect
                    value={selectedUnit}
                    onValueChange={(value) => {
                      setSelectedUnit(value);
                      if (value !== OTHER_UNIT_VALUE) {
                        setCustomUnit("");
                      }
                    }}
                    placeholder="Pilih Satuan"
                    searchPlaceholder="Cari satuan..."
                    emptyMessage="Satuan tidak ditemukan."
                    triggerClassName={errors.unit ? "border-accent-danger" : ""}
                    options={[
                      ...units.map((unit) => ({
                        value: unit.name,
                        label: unit.name,
                        searchText: `${unit.name} ${unit.normalizedName}`,
                      })),
                      {
                        value: OTHER_UNIT_VALUE,
                        label: "Lainnya...",
                        searchText: "lainnya other custom",
                      },
                    ]}
                  />
                )}
                {selectedUnit === OTHER_UNIT_VALUE && (
                  <Input
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    placeholder="Masukkan satuan baru"
                    className={errors.unit ? "border-accent-danger" : ""}
                  />
                )}
                {errors.unit && (
                  <p className="text-xs font-bold text-accent-danger">
                    {errors.unit}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Batas Stok Rendah</Label>
                <Input
                  id="lowStockThreshold"
                  name="lowStockThreshold"
                  type="number"
                  defaultValue="10"
                  min="0"
                />
              </div>
            </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Deskripsi produk (opsional)"
                  className="h-[120px] resize-none"
                />
              </div>
            </div>

            {/* Gambar Produk */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Gambar Produk</h3>
              <ProductImageUpload
                value={null}
                file={productImageFile}
                disabled={loading}
                error={errors.image}
                onFileChange={(file) => {
                  setProductImageFile(file);
                  setErrors((current) => {
                    const next = { ...current };
                    delete next.image;
                    return next;
                  });
                }}
                onRemoveImage={() => setProductImageFile(null)}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />{" "}
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Produk"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
