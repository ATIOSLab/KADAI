# Aturan bisnis KADAI yang ditegakkan server

Dokumen ini mencatat aturan yang **sudah dipaksakan di sisi server** (bukan sekadar
peringatan di layar), lengkap dengan berkas penegak dan uji otomatisnya. Tujuan:
satu tempat untuk menilai "apakah perilaku ini memang disengaja", dan memudahkan
audit ketika ada sengketa dengan kasir, pelanggan, atau mitra.

Prinsip yang dipakai di seluruh dokumen ini:

1. **Server adalah otoritas.** Layar hanya memberi peringatan dini; keputusan akhir
   ada di route handler/library.
2. **Satu sumber kebenaran.** Logika dipakai bersama (mis. `src/lib/*`), bukan
   disalin ke tiap endpoint.
3. **Setiap penolakan punya kode** (mis. `TEMPO_REQUIRES_CUSTOMER`) supaya bisa
   diuji dan dicatat di log tanpa menebak dari teks pesan.

---

## 1. Kas, laci, dan Z-Report

| Aturan | Penegak | Uji |
| --- | --- | --- |
| Laci kas dibuka di cabang yang sama dengan cabang transaksi | `src/lib/outlet-resolution.ts` (`resolveDefaultOutletId`), dipakai `api/sales/route.ts` + `api/pos/shifts/route.ts` | `tests/void-after-shift-close.test.ts` |
| Saat laci ditutup, angka Z-Report **dibekukan** (snapshot `reportJson`) | `src/lib/shift-service.ts` (`closeCashShift`) | `tests/shift-number.test.ts`, `tests/void-after-shift-close.test.ts` |
| Pembatalan transaksi **setelah** laci ditutup = koreksi buku: kasir dilarang, manager/admin boleh dengan PIN supervisor + alasan ≥ 15 karakter; laci ditandai `lateVoidCount`/`lastLateVoidAt`; pesanan dapur ikut dibatalkan | `src/lib/void-policy.ts` (`evaluateVoidGuard`), `api/sales/[id]/void/route.ts`, `src/lib/validators/sale.ts` | `tests/void-after-shift-close.test.ts` |
| Transaksi lama yang belum menempel ke laci tetap terhitung lewat rentang waktu laci (bukan hanya `shiftId`) | `src/lib/void-policy.ts` (`resolveShiftCoveringSale`) | `tests/void-after-shift-close.test.ts` |
| Z-Report hanya bisa dicetak ulang bila laci tercatat, dan setiap cetak ulang dihitung + dicatat siapa/kapan | `api/pos/shifts/[id]/route.ts` (increment `reprintCount` + aksi `SHIFT_REPORT_REPRINTED`) | `tests/void-after-shift-close.test.ts` |
| Cetak ulang tetap menampilkan angka beku, hanya penanda koreksi susulan yang ditempel | `api/pos/shifts/[id]/route.ts` (cabang `CLOSED`) | `tests/void-after-shift-close.test.ts` |
| Nomor laci berurutan per tenant | `src/lib/shift-service.ts`, tabel `cash_shifts.shiftNumber` | `tests/shift-number.test.ts` |

## 2. Bukti bayar & uang diterima

| Aturan | Kode penolakan | Penegak |
| --- | --- | --- |
| Penjualan **tempo** wajib punya pelanggan (nama ≥ 3 karakter) agar piutang bisa ditagih | `TEMPO_REQUIRES_CUSTOMER` | `src/lib/payment-policy.ts` (`evaluatePaymentPolicy`) |
| Pembayaran **non-tunai ≥ Rp 250.000** wajib nomor referensi (no. approval EDC / ID transaksi QRIS) | `NON_CASH_REFERENCE_REQUIRED` | `src/lib/payment-policy.ts` |
| `paidAmount` hanya dicatat untuk pembayaran **tunai**; `paidAmount: 0` berarti "belum ada uang diterima" dan tidak menolak transaksi non-tunai | `PAID_AMOUNT_NOT_CASH` | `api/sales/route.ts` |
| Tunai untuk tagihan bernilai wajib mencatat uang diterima ≥ total; kembalian dihitung dari total server, bukan angka kiriman klien | `PAID_LESS_THAN_TOTAL` | `api/sales/route.ts` |
| Diskon manual (item/nota) wajib beralasan; di atas ambang kasir wajib PIN supervisor | `DISCOUNT_*` | `src/lib/validators/sale.ts`, `api/sales/route.ts` (uji: `tests/discount-policy.test.ts`) |

Uji: `tests/payment-policy.test.ts`, `tests/paid-amount-non-cash.test.ts`,
`tests/sale-cash-received.test.ts`.

## 3. Transaksi & penomoran

| Aturan | Penegak |
| --- | --- |
| Kirim ulang keranjang tidak menggandakan transaksi (`x-idempotency-key` atau `items.idempotencyKey`) | `api/sales/route.ts` (`idempotencyKey` unik per toko) |
| Nomor invoice unik **per tenant**; bentrok ditangani dengan mengambil nomor berikutnya | `api/sales/route.ts`, `prisma` `@@unique([storeId, invoiceNumber])` |
| Penyesuaian stok bernilai 0 ditolak (tidak ada kejadian nyata) | `api/inventory/adjustment/route.ts` |
| Transfer stok wajib beda cabang, idempotent saat diterima, dan tidak boleh membuat stok sumber minus | `api/inventory/transfers/route.ts`, `src/lib/validators/transfer.ts` |

Uji: `tests/sale-idempotency-durable.test.ts`, `tests/unique-number-retry.test.ts`,
`tests/transient-failure-recovery.test.ts`, `tests/stock-adjustment-outlet.test.ts`.

## 4. Tagihan langganan, komisi mitra, dan cron

| Aturan | Kode/penegak |
| --- | --- |
| Endpoint cron **gagal-tertutup**: tanpa `CRON_SECRET` di server, cron tidak dijalankan (503). Rahasia hanya lewat header `x-cron-secret` / `Authorization: Bearer`, dibandingkan konstan-waktu; tidak ada nilai cadangan di kode dan tidak menerima rahasia dari query string | `src/lib/cron-auth.ts`, dipakai `api/cron/billing-referral`, `api/cron/daily-summary` |
| Rahasia cron **tidak disimpan di repo**; nilainya hanya di environment Dokploy | `docker-compose.yml` (`${CRON_SECRET:-}`) |
| Webhook pembayaran melunasi tagihan hanya bila **nominal yang diterima ≥ nilai tagihan** | `src/lib/billing-service.ts` (`settleInvoice`), `api/webhooks/payment/{midtrans,xendit}` |
| Webhook diverifikasi tanda tangan/notify token sebelum diproses | `api/webhooks/payment/{midtrans,xendit}` |
| Nomor tagihan `INV-YYYYMM-####` tahan penerbitan berbarengan (bentrok → nomor berikutnya) | `src/lib/billing-service.ts` (`createInvoice`) |
| Payout komisi periode berjalan **akumulatif**: komisi baru menambah nilai yang masih menunggu bayar, tidak menimpanya; payout yang sudah final tidak diubah | `src/lib/referral-engine.ts` (`akumulasiPayout`, `generatePayoutBatch`) |
| Tagihan perpanjangan tidak digandakan selama masih ada tagihan menunggu | `src/lib/billing-service.ts` (`renewDueSubscriptions`) |

Uji: `tests/cron-and-payment-settlement.test.ts`,
`tests/referral-payout-accumulation.test.ts`, `tests/billing-invoice-numbering.test.ts`,
`tests/referral-billing.test.ts`.

## 5. Data publik

| Aturan | Penegak |
| --- | --- |
| Pelacakan pesanan laundry publik wajib kode **dan** nomor HP; nomor HP tampil tersamarkan (`08xx****123`) | `api/laundry/track/route.ts` |
| Ringkasan pajak hanya menghitung penjualan yang tidak dibatalkan | `api/finance/tax-summary/route.ts` (uji: `tests/tax-summary.test.ts`) |
| Data satu toko tidak bisa dibaca toko lain (isolasi tenant) | `src/lib/tenant-scope.ts` (uji: `tests/tenant-isolation.test.ts`) |

---

## Cara memverifikasi sendiri

```bash
cd kasir-pro
npx tsc -p tsconfig.json --noEmit     # tipe
npm run test:security                 # aturan bisnis + regresi keamanan
npx next build                        # build produksi
```

Semua aturan di atas dijaga uji berbasis sumber (memastikan penegakannya tidak
dihapus tanpa sengaja) **dan** sudah dibuktikan lewat pemanggilan HTTP nyata
terhadap server produksi lokal pada saat penegakannya ditambahkan.
