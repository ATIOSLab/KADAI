# KADAI // STANDAR BRAND IDENTITY & DESIGN SYSTEM RESMI
**Kedaulatan Brand: PT Netkrida Nusantara & ATIOSLab**  
**Versi:** 1.0 (Produksi / Inviolable Standard)  
**Dokumen Acuan:** Brand Identity Sheet `kadai - SISTEM OPERASI BISNIS`

---

## 1. Filosofi & Esensi Brand
* **Nama Brand:** `kadai` (Wordmark lowercase) / `KADAI` (Caps lockup)
* **Tagline Resmi:** `SISTEM OPERASI BISNIS` (All Caps, Letter-spacing `+0.16em` / Tracking Wide)
* **Slogan Inti:** *"Satu sistem untuk gerai, dapur, dan pembukuan."*
* **Posisi Pasar:** Platform sistem operasi bisnis dan kasir POS modern terintegrasi untuk gerai (*storefront*), dapur (*kitchen display*), dan pembukuan (*accounting & fiscal compliance*) di Indonesia.

---

## 2. Palet Warna Resmi (Official Color Tokens)

Ditetapkan 4 warna pilar berwibawa:

| Nama Warna | Kode Hex | Nilai RGB / HSL | Simbolisme & Peran dalam Sistem |
| :--- | :--- | :--- | :--- |
| **Slate** | `#020617` | `rgb(2, 6, 23)` | **Disiplin Pembukuan:** Ketegasan, stabilitas keuangan, teks utama, background dark card, batang tegak K. |
| **Ember** | `#EA580C` | `rgb(234, 88, 12)` | **Aktivitas Dapur & Energi:** Lengkung wajan, tombol aksi utama (*Primary CTA*), aksen fokus. |
| **Glow** | `#FB923C` | `rgb(251, 146, 60)` | **Pertumbuhan & Kehangatan:** Keylight, radial gradient, highlight hover, lengan diagonal K. |
| **Amber** | `#F59E0B` | `rgb(245, 158, 11)` | **Percikan Bara (*Spark*):** Titik api bara, titik huruf "i" pada wordmark, status aktif, tanda vitalitas. |

### Warna Netral Pendukung
* **Pure White:** `#FFFFFF` (Surface card, teks pada dark background, struk kasir).
* **Off-White / Light Canvas:** `#F8FAFC` hingga `#F1F5F9` (Background kanvas web & dashboard).
* **Border Hairline:** `#E2E8F0` / `rgba(2, 6, 23, 0.08)` (Garis batas presisi anti-slop).

---

## 3. Anatomi Geometris Logo Mark (Huruf "K")

Huruf **"K"** kustom dirancang secara geometris dengan 4 komponen bermakna:
1. **Batang Tegak (*Vertical Stem*):**
   * Bentuk: Kapsul silindris tegak dengan ujung melengkung (*rounded caps*).
   * Makna: Disiplin pembukuan, kepatuhan hukum, dan pondasi usaha yang kokoh.
   * Warna: `#020617` (pada latar terang) atau `#FFFFFF` (pada latar gelap/squircle).
2. **Lengan Diagonal Atas (*Upper Diagonal Arm*):**
   * Bentuk: Kapsul bersudut 45 derajat ke atas.
   * Makna: Pertumbuhan omzet dan ekspansi bisnis multi-cabang.
   * Warna: Gradasi `#EA580C` (Ember) ke `#FB923C` (Glow).
3. **Kaki Melengkung (*Wok Rim / Lengkung Wajan*):**
   * Bentuk: Busur lingkaran tangensial yang menyapu ke bawah-luar, menyerupai bibir wajan kuliner Asia.
   * Makna: DNA dapur, proses memasak, dan kehangatan industri kuliner Indonesia.
   * Warna: Gradasi `#F59E0B` (Amber) ke `#EA580C` (Ember).
4. **Percikan Api Bara (*Amber Spark Dot*):**
   * Bentuk: Lingkaran penuh (*solid circle*) di ruang negatif antara lengan diagonal dan kaki lengkung.
   * Makna: Percikan bara api yang menyalakan semangat bisnis wirausaha.
   * Warna: `#F59E0B` (Amber murni).

---

## 4. Standar Tipografi

1. **Font Teks Utama & Heading (Sans-Serif):**
   * Font: **`Plus Jakarta Sans`** (Google Fonts).
   * Variabel CSS: `--font-sans`.
   * Karakteristik: Geometris, modern, mudah dibaca pada layar monitor POS kasir, tablet, dan ponsel pintar.
2. **Font Finansial & Kasir (Monospace / Tabular):**
   * Font: **`Geist Mono`** / Tabular Numbers (`tabular-nums`).
   * Variabel CSS: `--font-mono`.
   * Digunakan pada: Angka rupiah, struk thermal kasir, tabel stok inventori FIFO, barcode, dan laporan laba rugi.
3. **Wordmark & Lockup:**
   * Teks `kadai` dengan titik pada huruf `i` menggunakan warna `#F59E0B` (Amber Spark).
   * Tagline `SISTEM OPERASI BISNIS` menggunakan bobot *Bold*, huruf kapital, dan tracking lebar (`tracking-[0.16em]`).

---

## 5. Standar Struk Kasir Thermal Resmi (Thermal POS Receipt)
Hierarki cetak struk kasir thermal standar 58mm/80mm:
1. **Header Struk:** Logo Mark K + `kadai` + Metadata Meja (`Meja 04 · Dine In`).
2. **Daftar Menu & Qty:**
   - Baris item: `2x Nasi Goreng` — `Rp 64.000`
   - Baris item: `2x Es Kopi Aren` — `Rp 36.000`
3. **Pajak & Servis:**
   - Usaha PKP / Restoran: `PB1 10%` — `Rp 10.000`
   - Usaha Non-PKP: `Bebas Pajak (Non-PKP)` — `Rp 0`
4. **Grand Total:** `TOTAL` — `Rp 110.000` (Tebal, font tabular).
5. **Footer:** `Terima kasih` + Tanda transaksi sukses.

---

## 6. Aturan Invarian UI/UX (Anti-Slop Standard)
* **Zero AI-Slop:** Dilarang menggunakan shadow ungu/magenta acak, border tebal hitam kasar (neo-brutalism murahan), atau teks klise AI (*"solusi revolusioner terdepan"*).
* **Elevation & Borders:** Gunakan border hairline bersih (`border border-slate-200/90`), background glass teruji (`rgba(255,255,255,0.85)`), dan bayangan difus lembut (`shadow-xl shadow-slate-900/[0.06]`).
* **Micro-Interactions:** Tombol primer menggunakan transisi halus `active:scale-95` dan hover glow lembut pada aksen Ember.
