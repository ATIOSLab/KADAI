# KADAI × BOSS DIMSUM — Blueprint Tenant Multi-Cabang + Dapur Pusat (Central Hub & Spoke)

> **Status:** Provisioning akun & struktur tenant **SELESAI & TERVERIFIKASI LIVE** (2026-11-16).
> Perubahan kode (tenant-scoping menu) **MENUNGGU APPROVAL** — bagian bawah dokumen.
> Assessment unit: Keryx Offensive Security (KADAI Ops)

---

## 1. Ringkasan Bisnis (dari profil IG @bossdimsusms)

- **Boss Dimsum** — usaha dimsum (steamed, mentai, dimsum cake), outlet kaki lima.
- **4 cabang:** Hangtuah, Sisingamangaraja, Kaharudin NST (Marpoyan), Limbungan (Pekanbaru).
- **Dapur produksi 1 pusat** — bahan baku dibeli & diolah di pusat, hasil jadi disebar ke 4 cabang.
- **POS mandiri per cabang**, keuangan tersinkron terpusat di owner.
- Harga acuan dari promo: Rp 20K / 35K / 38K. Jam buka 08:00–22:00.

## 2. Status Eksekusi (SUDAH LIVE)

| Item | Nilai | ID |
|---|---|---|
| Tenant (Store) | **BOSS DIMSUM** — `FNB_WARUNG` | `cmwj9w4ip000ao6bmd5ms6bq1` |
| Tier / Subscription | **ENTERPRISE** · MONTHLY · ACTIVE (exp 2026-12-16) | `cmwj9w4li000co6bmwk5subnc` |
| Owner (ADMIN) | Admin Boss Dimsum — `bossdimsum@kadai.asia` | `cmwj9w4lr000eo6bmb3vfv2v9` |
| Outlet 1 | Dapur Pusat BOSS DIMSUM — `BD-CK` · **CENTRAL_KITCHEN** · KITCHEN_DISPATCH · **isMain** | `cmwj9wfml000ko6bmuc8kooi1` |
| Outlet 2 | BOSS DIMSUM Hangtuah — `BD-HTG` · RETAIL_BOOTH · DIRECT_SERVE | `cmwj9wfv0000mo6bm198ernvk` |
| Outlet 3 | BOSS DIMSUM Sisingamangaraja — `BD-SSM` · RETAIL_BOOTH · DIRECT_SERVE | `cmwj9wg8l000oo6bmfgtmcnji` |
| Outlet 4 | BOSS DIMSUM Kaharudin NST (Marpoyan) — `BD-MRP` · RETAIL_BOOTH · DIRECT_SERVE | `cmwj9wgjn000qo6bmzlquhnfb` |
| Outlet 5 | BOSS DIMSUM Limbungan — `BD-LMB` · RETAIL_BOOTH · DIRECT_SERVE | `cmwj9wgv3000so6bmz32ea5f2` |

> **Kenapa ENTERPRISE:** limit plan `PRO_BUSINESS` = maks 3 outlet (`maxOutlets: 3`), sedangkan kebutuhan = 4 cabang + 1 dapur pusat. `ENTERPRISE` = `maxOutlets: null`, `transferStock: true`, `centralKitchen: true`. Alur pembuatan via API resmi (bukan SQL mentah): `POST /api/platform/owners` (newStore) → login owner → `POST /api/outlets` ×5 — semua limit check & activity log terlewati dengan benar.

## 3. Pemetaan Konsep Bisnis → Fitur KADAI (sudah didukung, tanpa code baru)

| Kebutuhan Boss Dimsum | Fitur KADAI Existing |
|---|---|
| Dapur produksi 1 pusat | `Outlet.outletType = CENTRAL_KITCHEN` + `KitchenWorkflow.KITCHEN_DISPATCH` + `isMain` |
| Bahan baku diolah di pusat | `ProductType.RAW_MATERIAL` (bahan) + `MANUFACTURED` (produk jadi ber-BOM/`RecipeItem`) |
| Bahan baku & produk jadi disebar ke cabang | Model `StockTransfer` (hub & spoke) — `source=BD-CK` → `dest=BD-HTG/SSM/MRP/LMB`; status `DRAFT→IN_TRANSIT→RECEIVED`; API `POST/GET /api/inventory/transfers`; item + costPrice |
| Stok per cabang | `ProductBatch` relasi ke `Outlet` (batch FIFO per outlet) |
| POS mandiri per cabang | `Sale` ber-`outletId`; `OrderType` DINE_IN/TAKEAWAY/DELIVERY; KDS per station |
| Keuangan terpusat owner | Owner (ADMIN) lihat seluruh outlet; `FinanceEntry` otomatis dari sales; laporan per outlet via param `outletId` di `/api/reports` |
| Outlet kaki lima | `BusinessType.FNB_WARUNG` + `OutletType.RETAIL_BOOTH` + `KitchenWorkflow.DIRECT_SERVE` |
| Pajak | Cabang: `PB1_10` (pajak restoran daerah 10%, service charge 0). Dapur pusat: `NONE` (transfer bukan penjualan) |
| Jam operasional 08:00–22:00 | `BotSettings.closingTimeLocal` + business-day mode |

**Kesimpulan:** arsitektur KADAI *sudah dirancang* untuk model central hub & spoke ini (komentar di schema: "MUTASI & TRANSFER STOK MULTI-CABANG (CENTRAL HUB & SPOKE)"). Tidak perlu fitur baru untuk konsep dapur pusat.

## 4. GAP Teknis — Butuh Perubahan Kode (PENDING APPROVAL)

### G1 — KRITIS: Menu (Category/Product) belum tenant-scoped ⚠️
> **Update 16 Nov 2026 — audit diperluas.** Kebocoran bukan hanya menu: 8 model tanpa kunci tenant (`Category`, `Product`, `Customer`, `Supplier`, `Unit`, `FinanceCategory`, `FinanceEntry`, `StockAdjustment`) dan 19 dari 69 route API tanpa scoping. Rencana perbaikan lengkap + keputusan yang dibutuhkan ada di **`DOCS/KADAI_TENANT_ISOLATION_BLUEPRINT.md`**. Seed menu Boss Dimsum tetap ditahan sampai Fase 1 (Category+Product scoping) selesai.
- `Category` dan `Product` **tidak punya `storeId`**; `GET /api/products` dan `GET /api/categories` tidak memfilter tenant. `Category.name` bahkan `@unique` global.
- **Dampak:** kalau menu Boss Dimsum di-seed sekarang, menu itu **bocor & tercampur** dengan tenant lain (KADAI, demo, client berikutnya). Kuota produk `checkProductLimit` juga menghitung global.
- **Usulan:**
  1. Migrasi: tambah `storeId String?` pada `Category` & `Product` (+ index), ubah `Category.name` unique → compound `@@unique([storeId, name])` (nullable storeId → null tetap global/demo).
  2. Backfill: kategori/produk demo & tenant KADAI diberi storeId masing-masing (atau biarkan null = shared legacy).
  3. Scoping di: `GET/POST /api/products`, `GET/POST /api/categories`, POS `product-search`, KDS, laporan. Rule: `storeId = session.storeId` untuk tenant user; SUPER_ADMIN lihat semua (opsi filter).
  4. `checkProductLimit` dihitung per `storeId`.
- **Estimasi:** migrasi + scoping ~3-4 jam; perlu deploy.

### G2 — Produksi Dapur Pusat (opsional, bisa manual dulu)
- Belum ada endpoint "produksi": konsumsi batch bahan baku → hasil batch produk jadi di BD-CK. **Workaround awal:** penyesuaian stok manual (StockAdjustment) di BD-CK. Endpoint produksi bisa menyusul (Fase 3).

### G3 — Laporan konsolidasi lintas outlet (opsional)
- `/api/reports` sudah mendukung filter `outletId`; kalau butuh ringkasan konsolidasi 4 cabang + dapur pusat dalam satu dashboard → usulan tambahan (Fase 3).

## 5. Rencana Seed Menu (eksekusi setelah G1 approve)

**Kategori:** Dimsum Kukus · Dimsum Mentai · Dimsum Cake · Minuman & Lainnya

**Produk jadi (MANUFACTURED, dengan BOM/RecipeItem):**
| Produk | Harga | BOM (contoh, per porsi) |
|---|---|---|
| Dimsum Ayam (4 pcs) | Rp 20.000 | kulit dimsum 8 lbr · ayam giling 120 g · tepung tapioka 30 g · bumbu 10 g · wastage 3% |
| Dimsum Mentai (4 pcs) | Rp 35.000 | basis dimsum ayam + saus mentai 40 g |
| Dimsum Cake | Rp 38.000 | sesuai resep cake (daging/ayam/udang + lapisan) |

**Bahan baku (RAW_MATERIAL):** ayam fillet (kg) · udang (kg) · kulit dimsum (lbr) · saus mentai (kg) · tepung tapioka (kg) · bumbu racik (kg) · minyak (L) · dll.

**Satuan:** pcs, porsi, kg, gram, lbr, L — pastikan ada di `Unit` (cek saat seed).

## 6. Alur Operasional Harian (setelah go-live)

1. **Dapur pusat (BD-CK):** pembelian bahan baku → batch RAW_MATERIAL masuk BD-CK. Produksi via BOM → batch produk jadi di BD-CK.
2. **Distribusi:** `POST /api/inventory/transfers` BD-CK → masing-masing cabang (produk jadi + bahan baku), status IN_TRANSIT → cabang terima (RECEIVED).
3. **POS:** tiap cabang transaksi mandiri (kasir per outlet), stok berkurang per batch cabang, PB1 10%.
4. **Keuangan:** owner login → laporan per outlet & konsolidasi; FinanceEntry otomatis dari tiap transaksi.

## 7. Rencana Eksekusi Bertahap

- **Fase 1 (menunggu approval G1):** migrasi skema + scoping → deploy → seed menu Boss Dimsum + BOM → seed batch awal di BD-CK → uji transfer stok ke 4 cabang.
- **Fase 2:** akun kasir/koki per cabang (`User.outletId`), konfigurasi POS & KDS per cabang, jam operasional bot.
- **Fase 3 (opsional):** endpoint produksi dapur pusat, dashboard konsolidasi lintas outlet.

## 8. Akses & Kredensial

- Owner login: `bossdimsum@kadai.asia` (password disampaikan via kanal Telegram terpisah — tidak disimpan di repo).
- Superadmin platform: `superadmin@kadai.asia`.
- Admin Kadai (tenant lama): `admin@kadai.com`.
