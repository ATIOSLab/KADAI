"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { ProductImage } from "@/components/shared/product-image";
import { ProductImageUpload } from "@/components/shared/product-image-upload";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogBody,
} from "@/components/ui/dialog";
import { paginateItems } from "@/lib/pagination";
import { cn, formatCurrency } from "@/lib/utils";
import { apiFetch, ApiError } from "@/lib/api";
import {
  cleanupUploadedProductImage,
  uploadProductImage,
} from "@/lib/product-image-client";
import {
  Package,
  Edit,
  ArrowLeft,
  Trash2,
  Loader2,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import type { ProductWithBatches, Category, UnitOption } from "@/types";

const OTHER_UNIT_VALUE = "__other__";
const OTHER_CATEGORY_VALUE = "__other__";

interface ProductDetailData extends ProductWithBatches {
  totalStock: number;
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [generatingSku, setGeneratingSku] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("pcs");
  const [customUnit, setCustomUnit] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    description: "",
    unit: "pcs",
    categoryId: "",
    lowStockThreshold: 10,
    image: null as string | null,
  });

  // Delete dialog state
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [batchPage, setBatchPage] = useState(1);
  const [batchPageSize, setBatchPageSize] = useState(10);

  // Fetch product detail
  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: ProductDetailData }>(
        `/api/products/${id}`
      );
      setProduct(res.data);
      // Populate edit form
      setEditForm({
        name: res.data.name,
        sku: res.data.sku,
        barcode: res.data.barcode || "",
        description: res.data.description || "",
        unit: res.data.unit,
        categoryId: res.data.categoryId,
        lowStockThreshold: res.data.lowStockThreshold,
        image: res.data.image || null,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError("Produk tidak ditemukan");
      } else {
        setError("Gagal memuat data produk");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const paginatedBatches = paginateItems(product?.batches ?? [], batchPage, batchPageSize);

  useEffect(() => {
    setBatchPage((current) =>
      Math.min(current, paginatedBatches.pagination.totalPages)
    );
  }, [paginatedBatches.pagination.totalPages]);

  // Fetch categories when entering edit mode
  const startEditing = async () => {
    if (product) {
      setEditForm({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || "",
        description: product.description || "",
        unit: product.unit,
        categoryId: product.categoryId,
        lowStockThreshold: product.lowStockThreshold,
        image: product.image || null,
      });
    }

    try {
      setLoadingUnits(true);
      const [categoryRes, unitRes] = await Promise.all([
        apiFetch<{ data: Category[] }>("/api/categories"),
        apiFetch<{ data: UnitOption[] }>("/api/units"),
      ]);
      setCategories(categoryRes.data);
      setUnits(unitRes.data);
      setSelectedCategory(product?.categoryId ?? "");
      setCustomCategory("");

      const matchedUnit = unitRes.data.find(
        (unit) => unit.name.toLowerCase() === product?.unit.toLowerCase()
      );
      if (matchedUnit) {
        setSelectedUnit(matchedUnit.name);
        setCustomUnit("");
      } else if (product?.unit) {
        setSelectedUnit(OTHER_UNIT_VALUE);
        setCustomUnit(product.unit);
      }
      setEditImageFile(null);
      setRemoveExistingImage(false);
    } catch {
      toast.error("Gagal memuat kategori atau satuan");
    } finally {
      setLoadingUnits(false);
    }
    setEditing(true);
  };

  const stopEditing = () => {
    if (product) {
      setEditForm({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || "",
        description: product.description || "",
        unit: product.unit,
        categoryId: product.categoryId,
        lowStockThreshold: product.lowStockThreshold,
        image: product.image || null,
      });
    }
    setEditing(false);
    setEditImageFile(null);
    setRemoveExistingImage(false);
  };

  // Save edits
  const handleSave = async () => {
    setSaving(true);
    let uploadedImageUrl: string | null = null;
    try {
      let categoryId = selectedCategory;
      if (!categoryId) {
        toast.error("Kategori wajib dipilih");
        setSaving(false);
        return;
      }

      if (selectedCategory === OTHER_CATEGORY_VALUE) {
        const customCategoryName = customCategory.trim();
        if (!customCategoryName) {
          toast.error("Nama kategori baru wajib diisi");
          setSaving(false);
          return;
        }

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

      const resolvedUnit =
        selectedUnit === OTHER_UNIT_VALUE ? customUnit.trim() : selectedUnit;
      if (!resolvedUnit) {
        toast.error("Satuan wajib dipilih atau diisi");
        setSaving(false);
        return;
      }

      if (editImageFile) {
        const uploadResponse = await uploadProductImage(editImageFile);
        uploadedImageUrl = uploadResponse.data.url;
      }

      const nextImage =
        uploadedImageUrl ??
        (removeExistingImage ? null : editForm.image);

      await apiFetch(`/api/products/${id}`, {
        method: "PUT",
        body: {
          name: editForm.name,
          sku: editForm.sku,
          barcode: editForm.barcode || null,
          description: editForm.description || null,
          unit: resolvedUnit,
          categoryId,
          lowStockThreshold: editForm.lowStockThreshold,
          image: nextImage,
        },
      });
      toast.success("Produk berhasil diperbarui!");
      stopEditing();
      fetchProduct();
    } catch (err) {
      if (uploadedImageUrl) {
        void cleanupUploadedProductImage(uploadedImageUrl);
      }
      const message =
        err instanceof ApiError ? err.message : "Gagal mengupdate produk";
      toast.error(message);
    } finally {
      setSaving(false);
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
      if (editForm.name.trim()) {
        params.set("productName", editForm.name.trim());
      }

      const response = await apiFetch<{ data: { sku: string } }>(
        `/api/products/generate-sku?${params.toString()}`
      );
      setEditForm((current) => ({
        ...current,
        sku: response.data.sku,
      }));
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Gagal generate SKU";
      toast.error(message);
    } finally {
      setGeneratingSku(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiFetch(`/api/products/${id}`, { method: "DELETE" });
      toast.success("Produk berhasil dihapus");
      router.push("/products");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Gagal menghapus produk";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-3 w-20 mb-2" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full mb-4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="space-y-6 animate-slide-up">
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-extrabold mb-2">
            {error || "Produk tidak ditemukan"}
          </h2>
          <p className="text-sm text-text-muted mb-6">
            Produk mungkin telah dihapus atau ID tidak valid.
          </p>
          <Button asChild>
            <Link href="/products">
              <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Daftar Produk
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title={product.name}
        description={`SKU: ${product.sku}`}
        icon={Package}
      >
        <Button variant="outline" asChild>
          <Link href="/products">
            <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
          </Link>
        </Button>
        <Button onClick={startEditing}>
          <Edit className="w-4 h-4 mr-1" /> Ubah
        </Button>
        <Button variant="danger" onClick={() => setShowDelete(true)}>
          <Trash2 className="w-4 h-4 mr-1" /> Hapus
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informasi Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <p className="text-xs font-bold text-text-muted uppercase mb-2">
                  Gambar Produk
                </p>
                <ProductImage
                  src={product.image}
                  alt={product.name}
                  className="h-56 w-full rounded-2xl"
                  iconClassName="h-10 w-10"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-text-muted uppercase">
                  Nama
                </p>
                <p className="font-bold">{product.name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-text-muted uppercase">
                  SKU
                </p>
                <p className="font-mono font-bold">{product.sku}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-text-muted uppercase">
                  Barcode
                </p>
                <p className="font-mono font-bold">
                  {product.barcode || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-text-muted uppercase">
                  Satuan
                </p>
                <p className="font-bold">{product.unit}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-text-muted uppercase">
                  Kategori
                </p>
                <Badge
                  variant="outline"
                  style={{
                    borderColor: product.category?.color || undefined,
                    color: product.category?.color || undefined,
                  }}
                >
                  {product.category?.name || "-"}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-bold text-text-muted uppercase">
                  Batas Stok Rendah
                </p>
                <p className="font-bold">
                  {product.lowStockThreshold} {product.unit}
                </p>
              </div>
              {product.description && (
                <div className="col-span-2">
                  <p className="text-xs font-bold text-text-muted uppercase">
                    Deskripsi
                  </p>
                  <p className="text-sm text-text-secondary">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stock Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Stok</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4 neo-card bg-bg-main">
              <p className="text-4xl font-black text-accent-primary">
                {product.totalStock}
              </p>
              <p className="text-sm font-bold text-text-muted">
                {product.unit} tersedia
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase">
                Batch Aktif
              </p>
              <p className="font-bold">
                {product.batches.filter((b) => b.remainingQty > 0).length} batch
              </p>
            </div>
            <Button variant="secondary" className="w-full" asChild>
              <Link href="/inventory/restock">Tambah Stok</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Batch History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Batch Pembelian</CardTitle>
        </CardHeader>
        <CardContent>
          {product.batches.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              <p className="font-bold">Belum ada batch</p>
              <p className="text-sm">
                Tambahkan stok melalui menu Restock untuk membuat batch pertama.
              </p>
            </div>
          ) : (
            <>
              <div className="neo-table overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-3">Batch Number</th>
                      <th className="text-right p-3">Qty Awal</th>
                      <th className="text-right p-3">Sisa Stok</th>
                      <th className="text-right p-3">Harga Modal</th>
                      <th className="text-right p-3">Harga Jual</th>
                      <th className="text-right p-3">Margin</th>
                      <th className="text-left p-3">Tgl Beli</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBatches.data.map((batch) => {
                      const costPrice = Number(batch.costPrice);
                      const sellingPrice = Number(batch.sellingPrice);
                      const margin =
                        sellingPrice > 0
                          ? (
                              ((sellingPrice - costPrice) / sellingPrice) *
                              100
                            ).toFixed(1)
                          : "0";
                      return (
                        <tr key={batch.id} className="hover:bg-bg-main/50">
                          <td className="p-3 font-mono text-xs font-bold">
                            {batch.batchNumber}
                          </td>
                          <td className="p-3 text-right">{batch.quantity}</td>
                          <td className="p-3 text-right font-bold">
                            <Badge
                              variant={
                                batch.remainingQty > 0 ? "success" : "outline"
                              }
                            >
                              {batch.remainingQty}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            {formatCurrency(costPrice)}
                          </td>
                          <td className="p-3 text-right font-bold text-accent-primary">
                            {formatCurrency(sellingPrice)}
                          </td>
                          <td className="p-3 text-right">
                            <Badge variant="success">{margin}%</Badge>
                          </td>
                          <td className="p-3 text-xs">
                            {new Date(batch.purchaseDate).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <TablePagination
                page={paginatedBatches.pagination.page}
                pageSize={paginatedBatches.pagination.limit}
                totalItems={paginatedBatches.pagination.total}
                totalPages={paginatedBatches.pagination.totalPages}
                itemLabel="batch"
                className="pt-4"
                onPageChange={setBatchPage}
                onPageSizeChange={(nextPageSize) => {
                  setBatchPageSize(nextPageSize);
                  setBatchPage(1);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editing} onOpenChange={(open) => !open && stopEditing()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Produk</DialogTitle>
            <DialogDescription>
              Ubah detail produk. Klik Simpan untuk menyimpan perubahan.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-8 py-4">
            {/* Informasi Produk */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Informasi Produk</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Produk</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <div className="relative">
                    <Input
                      value={editForm.sku}
                      onChange={(e) =>
                        setEditForm({ ...editForm, sku: e.target.value })
                      }
                      className={cn("pr-32")}
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
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Barcode</Label>
                  <Input
                    value={editForm.barcode}
                    onChange={(e) =>
                      setEditForm({ ...editForm, barcode: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <SearchableSelect
                    value={selectedCategory}
                    onValueChange={(val) => {
                      setSelectedCategory(val);
                      if (val !== OTHER_CATEGORY_VALUE) {
                        setCustomCategory("");
                      }
                    }}
                    placeholder="Pilih kategori"
                    searchPlaceholder="Cari kategori..."
                    emptyMessage="Kategori tidak ditemukan."
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
                  {selectedCategory === OTHER_CATEGORY_VALUE && (
                    <Input
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Masukkan kategori baru"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Detail Produk */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Detail Produk</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Satuan</Label>
                  {loadingUnits ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <SearchableSelect
                      value={selectedUnit}
                      onValueChange={(val) => {
                        setSelectedUnit(val);
                        if (val !== OTHER_UNIT_VALUE) {
                          setCustomUnit("");
                        }
                      }}
                      placeholder="Pilih satuan"
                      searchPlaceholder="Cari satuan..."
                      emptyMessage="Satuan tidak ditemukan."
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
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Batas Stok Rendah</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editForm.lowStockThreshold}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        lowStockThreshold: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="h-[120px] resize-none"
                />
              </div>
            </div>

            {/* Gambar Produk */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Gambar Produk</h3>
              <ProductImageUpload
                value={removeExistingImage ? null : editForm.image}
                file={editImageFile}
                disabled={saving}
                helperText="Upload gambar baru untuk mengganti gambar produk saat ini."
                onFileChange={(file) => {
                  setEditImageFile(file);
                  if (file) {
                    setRemoveExistingImage(false);
                  }
                }}
                onRemoveImage={() => {
                  setEditImageFile(null);
                  setRemoveExistingImage(true);
                }}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={stopEditing}
              disabled={saving}
            >
              <X className="w-4 h-4 mr-1" /> Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />{" "}
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" /> Simpan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Produk</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-text-muted">
              Apakah Anda yakin ingin menghapus produk{" "}
              <strong>&ldquo;{product.name}&rdquo;</strong>? Produk akan
              dinonaktifkan dan tidak tampil di daftar.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDelete(false)}
              disabled={deleting}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />{" "}
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-1" /> Hapus
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
