-- Stok yang tersimpan tanpa cabang tidak bisa dijual di cabang mana pun:
-- pemotongan FIFO dan laporan stok menyaring per cabang (outletId), sehingga
-- batch dengan outletId NULL "hilang" dari stok fisik yang bisa dipakai.
--
-- Sebelumnya POST /api/batches (restock) dan impor produk membuat batch tanpa
-- outletId. Penulisan sudah diperbaiki; migrasi ini menyelamatkan data lama
-- dengan memindahkannya ke cabang utama tenant (isMain), atau bila tenant tidak
-- punya cabang utama, ke cabang dengan kode terkecil. Nominal stok, HPP, dan
-- tanggal tidak diubah, jadi bisa dipindahkan lagi lewat Transfer Stok bila
-- penempatannya tidak sesuai.
UPDATE product_batches AS pb
SET "outletId" = target.outlet_id
FROM (
  SELECT
    p.id AS product_id,
    COALESCE(
      (
        SELECT o.id
        FROM outlets o
        WHERE o."storeId" = p."storeId" AND o."isMain" = true
        ORDER BY o.code ASC
        LIMIT 1
      ),
      (
        SELECT o.id
        FROM outlets o
        WHERE o."storeId" = p."storeId"
        ORDER BY o.code ASC
        LIMIT 1
      )
    ) AS outlet_id
  FROM products p
) AS target
WHERE pb."outletId" IS NULL
  AND pb."productId" = target.product_id
  AND target.outlet_id IS NOT NULL;
