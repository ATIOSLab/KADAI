import { randomUUID } from "crypto";
import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);

const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");
const PUBLIC_UPLOAD_PREFIX = "/uploads/products/";

function sanitizeBaseName(value: string) {
  const baseName = value
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return baseName || "product";
}

function getExtensionFromMimeType(mimeType: string) {
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  return ".jpg";
}

export function isProductImageUrl(value: string | null | undefined) {
  return Boolean(value && value.startsWith(PUBLIC_UPLOAD_PREFIX));
}

export async function ensureProductUploadDir() {
  await mkdir(PUBLIC_UPLOAD_DIR, { recursive: true });
}

export async function saveProductImage(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Format gambar tidak didukung. Gunakan JPG, PNG, atau WEBP.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Ukuran gambar maksimal 5 MB.");
  }

  await ensureProductUploadDir();

  const extension = getExtensionFromMimeType(file.type);
  const safeBaseName = sanitizeBaseName(file.name);
  const fileName = `${safeBaseName}-${randomUUID()}${extension}`;
  const filePath = path.join(PUBLIC_UPLOAD_DIR, fileName);
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, fileBuffer);

  return {
    fileName,
    url: `${PUBLIC_UPLOAD_PREFIX}${fileName}`,
  };
}

export async function deleteProductImageByUrl(url: string | null | undefined) {
  if (!isProductImageUrl(url)) {
    return;
  }

  const safeUrl = url as string;
  const fileName = safeUrl.slice(PUBLIC_UPLOAD_PREFIX.length);
  if (!fileName || fileName.includes("/") || fileName.includes("\\")) {
    return;
  }

  const filePath = path.join(PUBLIC_UPLOAD_DIR, fileName);
  await rm(filePath, { force: true });
}

export function getProductImageRules() {
  return {
    maxSizeBytes: MAX_IMAGE_SIZE,
    allowedTypes: Array.from(ALLOWED_IMAGE_TYPES),
  };
}
