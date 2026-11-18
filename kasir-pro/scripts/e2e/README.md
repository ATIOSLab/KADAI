# Uji end-to-end alur kas (bukan unit test)

Ketiga skrip di sini menembak **HTTP sungguhan** ke server KADAI yang sedang
berjalan, lalu memeriksa perilaku laci kas, koreksi susulan, bukti bayar, dan
otorisasi cron. Gunanya menangkap regresi yang tidak terlihat dari unit test
berbasis sumber (mis. urutan validasi, bentuk respons, atau pengaruh ke laci
berikutnya).

## Prasyarat

1. Database uji berisi data demo, sudah menjalankan seluruh migrasi.
2. Build produksi terbaru dan server lokal, dengan rahasia cron diset:

   ```bash
   DATABASE_URL="postgresql://kadai:kadai@localhost:55432/kadai" \
   BETTER_AUTH_SECRET="<rahasia-uji>" CRON_SECRET="<rahasia-uji>" \
   NODE_ENV=production npx next start -p 3110
   ```

3. Dua token sesi (manager dan kasir) untuk tenant demo. Token bisa dibuat lewat
   endpoint login atau skrip pembuat sesi internal, lalu diekspor:

   ```bash
   export KADAI_BASE="http://127.0.0.1:3110"
   export KADAI_TOKEN_MANAGER="<token sesi manager>"
   export KADAI_TOKEN_KASIR="<token sesi kasir>"
   ```

   PIN supervisor yang dipakai uji PIN adalah `999222` (PIN akun demo).

## Menjalankan

```bash
python scripts/e2e/regresi-siklus-kas.py      # laci A/B, refund, cetak ulang Z-Report
python scripts/e2e/regresi-bukti-bayar.py     # tempo, non-tunai >= Rp250rb, kasir vs manager
python scripts/e2e/regresi-pin-supervisor.py  # PIN salah ditolak, PIN benar diterima
python scripts/e2e/regresi-master-data.py     # CRUD pemasok, pelanggan, cabang, satuan
```

Setiap skrip mencetak `LULUS`/`GAGAL` per butir dan ringkasan di akhir. Skrip
menutup laci yang masih terbuka di awal dan di akhir, jadi aman dijalankan
berulang pada database uji.

## Catatan perilaku yang diuji (dan disengaja)

- Koreksi susulan **tidak** mengubah angka Z-Report laci yang sudah ditutup;
  penandanya `lateVoidCount`/`lastLateVoidAt` pada laci.
- Uang refund keluar dari **laci yang sedang terbuka**, sehingga `expectedCash`
  laci tersebut berkurang sebesar nilai transaksi yang dikoreksi.
- Kasir boleh membatalkan transaksi setelah laci tutup **hanya** dengan PIN
  supervisor; manager/admin tidak perlu PIN.
- Restock produk habis dipakai uji: bila stok uji habis, jalankan ulang seed
  demo sebelum mengulang skrip.

## Uji data induk (CRUD)

`regresi-master-data.py` membuktikan kelengkapan CRUD yang sebelumnya bolong:

- pemasok & pelanggan bisa dinonaktifkan, hilang dari daftar default, tetap
  terlihat dengan `?includeInactive=1`, dan bisa diaktifkan kembali lewat
  `PUT { isActive: true }` (dulu tombol "Nonaktifkan" tidak berefek apa pun
  karena validator membuang `isActive` tanpa pesan);
- pelanggan hanya bisa dinonaktifkan oleh manager/admin - kasir ditolak 403;
- cabang utama tidak bisa dinonaktifkan (`409 MAIN_OUTLET_PROTECTED`), begitu
  pula cabang aktif terakhir dan cabang yang lacinya masih terbuka;
- satuan bisa diganti nama dan namanya **ikut berubah di semua produk**;
  satuan yang masih dipakai tidak bisa dihapus (`409 UNIT_IN_USE`).

Skrip membuat nama/telepon bersufiks acak, jadi aman diulang tanpa bentrok.
