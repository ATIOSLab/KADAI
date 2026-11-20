# Uji end-to-end alur kas (bukan unit test)

Skrip-skrip di sini menembak **HTTP sungguhan** ke server KADAI yang sedang
berjalan, lalu memeriksa perilaku laci kas, koreksi susulan, bukti bayar,
otorisasi cron, CRUD data induk, dan proteksi seluruh rute API. Gunanya
menangkap regresi yang tidak terlihat dari unit test berbasis sumber (mis.
urutan validasi, bentuk respons, atau pengaruh ke laci berikutnya).

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

   PIN supervisor yang dipakai uji PIN diambil dari `KADAI_PIN` (default
   `888222`, PIN manager tenant demo Resto). Rahasia cron untuk uji
   `x-cron-secret` diambil dari `KADAI_CRON_SECRET`; tanpa itu uji cron hanya
   lulus di server lokal.

Token sesi KADAI hanya berlaku **2 jam** dan mati lebih cepat bila baris user
diubah. Untuk produksi, mint ulang sesi dengan:

```bash
bash scripts/e2e/mint-produksi.sh manager.resto@kadai.asia kasir.resto@kadai.asia
# lalu, mis.:
export KADAI_TOKEN_MANAGER=$(cat scripts/e2e/.token-manager.txt)
export KADAI_TOKEN_KASIR=$(cat scripts/e2e/.token-kasir.txt)
```

Skrip itu SSH ke host produksi dan menjalankan `scripts/e2e/mint-sesi.mjs` di
dalam container app (pemegang `BETTER_AUTH_SECRET`); file token lokal ditulis ke
`scripts/e2e/.token-*.txt` yang sudah di-`.gitignore`.

## Menjalankan

Satu perintah untuk semua (skrip berhenti dengan kode ≠0 bila ada yang gagal):

```bash
npm run test:e2e          # = bash scripts/e2e/jalankan-semua.sh
```

Setiap suite dicatat ke `scripts/e2e/.logs/<waktu>/` (di-`.gitignore`). Bila
sebuah suite gagal, runner mengulangnya SEKALI dan melabeli `FLAKY` bila lolos
pada percobaan kedua — batch pertama setelah beberapa jam idle kadang gagal
oleh gangguan transport/edge Cloudflare yang tidak terlihat di log origin
(tidak ada 5xx/429 di `docker logs`); dua kegagalan berturut-turut baru
dianggap regresi. Override lokasi log: `E2E_LOG_DIR=/path bash scripts/e2e/...`.

Atau satu per satu:

```bash
python scripts/e2e/regresi-siklus-kas.py      # laci A/B, refund, cetak ulang Z-Report
python scripts/e2e/regresi-bukti-bayar.py     # tempo, non-tunai >= Rp250rb, kasir vs manager
python scripts/e2e/regresi-pin-supervisor.py  # PIN salah ditolak, PIN benar diterima
python scripts/e2e/regresi-master-data.py     # CRUD pemasok, pelanggan, cabang, satuan
python scripts/e2e/regresi-rute-api.py        # 73 rute API: anon ditolak, sesi tidak 5xx
```

`regresi-rute-api.py` menemukan sendiri daftar rute dari `src/app/api/**/route.ts`
(segmen `[id]` diganti id contoh), jadi rute baru otomatis ikut diuji. Rute yang
memang publik hanya `/api/health` dan `/api/public/plans` (`ALLOW_ANON`).

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

## Menjalankan di produksi (di belakang Cloudflare)

Produksi menolak User-Agent bawaan `urllib` (Cloudflare error 1010), jadi semua
skrip mengirim UA browser Chrome. Selalu ekspor `KADAI_BASE=https://kadai.asia`.

Rate limit PIN supervisor bersifat per IP (10 percobaan / 10 menit, kunci 30
menit). Karena trafik produksi masuk lewat edge Cloudflare, banyak penguji
berbagi satu IP: setelah beberapa putaran, uji PIN benar akan berhenti dengan
"Terlalu banyak percobaan PIN". Itu perilaku keamanan yang benar — skrip
menandainya `SKIP`, bukan gagal. Tunggu 30 menit atau jalankan lewat IP lain.
