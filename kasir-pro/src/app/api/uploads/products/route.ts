import { NextRequest, NextResponse } from "next/server";
import { validImageContent, validUploadUrl } from "@/app/api/_lib/access";
import { INVENTORY_ROLES, hasRequiredRole } from "@/lib/rbac";
import {
  deleteProductImageByUrl,
  getProductImageRules,
  saveProductImage,
} from "@/lib/product-image";
import { getSessionUserFromRequest } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat mengupload gambar produk" },
        { status: 403 }
      );
    }

    if (Number(request.headers.get("content-length")) > 6 * 1024 * 1024) {
      return NextResponse.json({ error: "Upload terlalu besar" }, { status: 413 });
    }
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File gambar wajib diunggah" },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > 5 * 1024 * 1024 ||
        !validImageContent(new Uint8Array(await file.arrayBuffer()), file.type)) {
      return NextResponse.json({ error: "Isi file gambar tidak valid" }, { status: 400 });
    }
    const uploaded = await saveProductImage(file);

    return NextResponse.json({
      data: {
        url: uploaded.url,
        fileName: uploaded.fileName,
        rules: getProductImageRules(),
      },
    });
  } catch (error) {
    console.error("POST /api/uploads/products error:", error);
    const message = "Gagal mengupload gambar produk";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(sessionUser.role, INVENTORY_ROLES)) {
      return NextResponse.json(
        { error: "Role Anda tidak dapat menghapus gambar produk" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const imageUrl =
      typeof body?.url === "string" && body.url.trim().length > 0
        ? body.url.trim()
        : null;

    if (!validUploadUrl(imageUrl)) {
      return NextResponse.json(
        { error: "URL gambar wajib dikirim" },
        { status: 400 }
      );
    }

    await deleteProductImageByUrl(imageUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/uploads/products error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus gambar produk" },
      { status: 500 }
    );
  }
}
