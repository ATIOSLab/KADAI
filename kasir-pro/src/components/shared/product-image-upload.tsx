"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { ImagePlus, Package, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ProductImageUploadProps {
  disabled?: boolean;
  error?: string;
  helperText?: string;
  value: string | null;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onRemoveImage: () => void;
}

export function ProductImageUpload({
  disabled = false,
  error,
  helperText,
  value,
  file,
  onFileChange,
  onRemoveImage,
}: ProductImageUploadProps) {
  const inputId = useId();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const activePreview = useMemo(() => previewUrl ?? value, [previewUrl, value]);

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>Gambar Produk</Label>

      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-black bg-bg-card",
          error && "border-accent-danger"
        )}
      >
        <div className="flex flex-col gap-4 p-4 md:flex-row items-center md:items-start">
          <div className="flex h-[120px] w-[120px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border-default bg-bg-main">
            {activePreview ? (
              <img
                src={activePreview}
                alt="Preview gambar produk"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-text-muted">
                <Package className="h-8 w-8" />
                <span className="text-xs font-bold">Belum ada gambar</span>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">
            <div>
              <p className="text-sm font-bold text-text-primary">
                {file ? file.name : value ? "Gambar produk tersimpan" : "Upload gambar utama produk"}
              </p>
              <p className="mt-1 text-xs font-medium text-text-muted">
                JPG, PNG, atau WEBP. Maksimal 5 MB.
              </p>
              {helperText ? (
                <p className="mt-2 text-xs font-medium text-text-muted">
                  {helperText}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <label htmlFor={inputId}>
                <input
                  id={inputId}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  disabled={disabled}
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0] ?? null;
                    onFileChange(nextFile);
                    event.currentTarget.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  className="cursor-pointer"
                  asChild
                >
                  <span>
                    {activePreview ? (
                      <ImagePlus className="h-4 w-4" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {activePreview ? "Ganti Gambar" : "Pilih Gambar"}
                  </span>
                </Button>
              </label>

              {(activePreview || file) && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  className="text-accent-danger hover:text-accent-danger"
                  onClick={onRemoveImage}
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus Gambar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {error ? <p className="text-xs font-bold text-accent-danger">{error}</p> : null}
    </div>
  );
}
