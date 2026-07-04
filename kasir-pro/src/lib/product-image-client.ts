export async function uploadProductImage(file: File) {
  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch("/api/uploads/products", {
    method: "POST",
    body: formData,
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error || "Gagal mengupload gambar produk");
  }

  return json as { data: { url: string; fileName: string } };
}

export async function cleanupUploadedProductImage(url: string) {
  await fetch("/api/uploads/products", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });
}
