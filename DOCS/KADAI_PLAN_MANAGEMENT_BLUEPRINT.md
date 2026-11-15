# KADAI — Plan Management Blueprint (Paket Dikelola Superadmin)

> **Status:** DRAFT — menunggu persetujuan Kapten sebelum implementasi.
> **Tujuan:** Semua paket langganan (nama, fitur, limit, harga per siklus) dikelola dari
> modul Super Admin (`/platform/plans`) — bukan hardcode di kode marketing/billing.

---

## 1. Masalah Saat Ini (terverifikasi dari codebase + DB prod)

| # | Masalah | Bukti |
|---|---------|-------|
| 1 | Nama & harga paket hardcoded di 3 tempat | `pricing-section.tsx` (`PLANS`), `harga/page.tsx` (`tiers`), `pricing.ts` (`TIER_PRICES`) |
| 2 | Superadmin tidak bisa ubah harga/tier tanpa deploy | Tidak ada model `Plan` di schema, tidak ada API/UI plan |
| 3 | Marketing ≠ invoice engine | Professional: iklan "Rp 948rb/thn" vs engine `950.400`; Enterprise: iklan "Rp 499rb/bln" vs engine `479.200/bln` |
| 4 | Tidak ada subscription record untuk tenant | `store_subscriptions` = 0, `payment_invoices` = 0 di prod |
| 5 | Enum ≠ label tampilan | `FREE`→"Starter", `STARTER`→"Professional" (jebakan maintenance) |
| 6 | Tidak ada enforcement limit per tier | "1 gerai / 50 SKU / 3 gerai" hanya klaim marketing |

## 2. Model Data (non-destruktif)

```prisma
model SubscriptionPlan {
  id          String   @id @default(cuid())
  code        String   @unique   // nilai enum SubscriptionTier: FREE|STARTER|PRO_BUSINESS|ENTERPRISE
  name        String             // label bebas, mis. "Starter" / "Professional" (memecahkan #5)
  description String?
  badge       String?            // "Paling Banyak Dipilih" dll.
  features    Json               // ["1 Gerai & 1 Akun Kasir", ...]  (array of strings)
  limits      Json               // { maxOutlets, maxUsers, maxProducts, maxSku, kds, transferStock, ... }
  sortOrder   Int    @default(0)
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  prices      PlanPrice[]
  @@map("subscription_plans")
}

model PlanPrice {
  id        String       @id @default(cuid())
  planId    String
  plan      SubscriptionPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  cycle     BillingCycle @default(MONTHLY)   // MONTHLY | QUARTERLY | ANNUAL
  amount    Decimal      @db.Decimal(15, 2)
  @@unique([planId, cycle])
  @@map("plan_prices")
}
```

- **`code` = enum lama** → `Store.tier` tetap enum, tidak ada migrasi data tenant.
- `features`/`limits` JSONB → fleksibel tanpa migrasi per field.
- Seed idempotent: `upsert` 4 plan dari nilai `TIER_PRICES` saat ini (harga kuartal/tahunan ikut masuk, sekaligus menghapus jalur harga mati #4 di laporan sebelumnya — kuartal yang tadinya tersembunyi jadi terlihat & terkelola).

## 3. API

| Route | Method | Auth | Fungsi |
|---|---|---|---|
| `/api/platform/plans` | GET | SUPER_ADMIN | daftar semua plan (termasuk nonaktif) + harga |
| `/api/platform/plans` | POST | SUPER_ADMIN | buat/duplikat plan (guard: `code` unik) |
| `/api/platform/plans/[id]` | PATCH | SUPER_ADMIN | ubah nama/deskripsi/fitur/limit/harga/sortOrder/isActive |
| `/api/public/plans` | GET | publik (rate-limit) | hanya `isActive=true`, dipakai landing & `/harga` |

**Guard (server-authoritative, mengikuti pola platform existing):**
- `FREE` (Starter): harga **selalu Rp 0** di ketiga siklus — PATCH yang mengubah amount > 0 ditolak (400).
- `FREE` tidak bisa di-archive; last-active plan per `code` tidak bisa di-nonaktifkan (pola `ensureNotLastSuperAdmin`).
- Setiap mutasi → `ActivityLog` + `ActionType.PLAN_CREATED / PLAN_UPDATED / PLAN_ARCHIVED` (2 enum baru).
- Zod schema di `lib/validators/platform.ts` mengikuti `ownerCreateSchema`.

## 4. Wiring ke Halaman & Billing

- **`/harga` (server component, sudah `revalidate=300`)** → baca plan+prices dari DB; render tabel/feature matrix dinamis. Fallback ke `TIER_PRICES` bila DB kosong (defense-in-depth, landing tetap jalan).
- **`pricing-section.tsx` (client)** → terima `plans: Plan[]` via props dari `page.tsx` (server parent), murni presentasional.
- **`pricing.ts`** → `TIER_LABELS` digantikan `plan.name` (fallback label lama); `cyclePrice()` membaca DB via cache 300 detik + fallback konstanta. `billing-service.ts` TIDAK berubah alurnya — invoice tetap menyimpan snapshot `amount`/`tier`, jadi **perubahan harga tidak menyentuh invoice lama**.
- **`provisionInitialSubscription` / onboarding owner** → pakai harga plan DB secara otomatis.

## 5. UI Superadmin (`/platform/plans`)

- Tabel 4 plan + badge status + harga tiap siklus.
- Dialog edit: nama, deskripsi, badge, fitur (list editor), limit (number inputs), harga per siklus, urutan, aktif/nonaktif.
- Bottom-tab platform + sidebar item (ikuti pola `navigation.ts` `getBottomTabsForRole`).
- Konsisten dengan UI minimalis KADAI (Shadcn Card/Table/Dialog yang sudah dipakai owners page).

## 6. Enforcement Limit (Fase 2 — opsional, terpisah)

`limits` dari plan baru dipakai sebagai sumber kebenaran:
- API create `Outlet` → tolak bila `maxOutlets` terlampaui.
- API create `Product`/batch → tolak bila `maxProducts`/`maxSku` terlampaui.
- API create user (staff) → tolak bila `maxUsers` terlampaui.
- Ditaruh di guard service layer (bukan UI), superadmin ubah limit → berlaku instan.
- Catatan: batas "Coba Gratis 14 Hari" (masa trial) bisa jadi kolom `trialDays` di plan bila Kapten mau.

## 7. Checklist Implementasi (bila disetujui)

1. `prisma/schema.prisma` + migrasi `20261115xxxxxx_plan_management` + seed upsert 4 plan.
2. `pricing.ts` → baca DB + cache + fallback.
3. `lib/platform.ts` + `lib/validators/platform.ts` → guard plan.
4. Route `api/platform/plans` + `api/platform/plans/[id]` + `api/public/plans`.
5. UI `/platform/plans` + nav + bottom-tab.
6. Wiring `/harga` + landing dari DB.
7. Gate: `tsc --noEmit` = 0, `npm run test:security` hijau, `npm run build` hijau.
8. Deploy Dokploy + verifikasi live (superadmin ubah harga → landing ikut berubah; tenant tier tetap).

## 8. Risiko & Mitigasi

- **Regresi harga publik** → fallback konstanta + snapshot invoice; perubahan harga hanya berlaku untuk invoice baru.
- **Migrasi** → non-destruktif (2 tabel baru + seed), `Store.tier` enum tidak tersentuh.
- **Cache 300s** → konsisten dengan `revalidate=300` yang sudah ada di `/harga`.
