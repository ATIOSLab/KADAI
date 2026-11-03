# 🏛️ KADAI — Multi-Tenant SaaS & Intelligent POS Platform
## Enterprise Operational Blueprint & System Architecture

> **Official Repository:** `ATIOSLab/KADAI`  
> **Architecture Status:** Active Specification (v2.0.0 Enterprise)  
> **Master Blueprints:**
> 1. Master System & POS Architecture: [`DOCS/KADAI_ENTERPRISE_BLUEPRINT.md`](./DOCS/KADAI_ENTERPRISE_BLUEPRINT.md)
> 2. Commercial SaaS RBAC & Access Control: [`DOCS/KADAI_SAAS_RBAC_BLUEPRINT.md`](./DOCS/KADAI_SAAS_RBAC_BLUEPRINT.md)

---

### 1. Ringkasan Visi Produk
KADAI adalah platform operasi bisnis terintegrasi dan Point of Sale (POS) berbasis SaaS (*Software as a Service*) multi-tenant untuk pelaku UMKM dan bisnis di Indonesia. KADAI menggabungkan:
- **Multi-Vertical Operations**: Fleksibel untuk Ritel Toko (barang langsung jual), Kuliner / F&B (bahan mentah, resep BOM, pesanan dapur), dan Jasa.
- **Batch-Based FIFO Inventory**: Akurasi pergerakan stok dan HPP per batch pembelian.
- **Standar Keuangan & Pajak Indonesia**: Menghitung PPN 11%/12%, PB1 (Pajak Restoran 10%), Service Charge, dan pembukuan berbasis **SAK EMKM** (Laba Rugi, Arus Kas, Neraca, serta rekap omzet PPh Final UMKM 0.5% PP 55/2022).
- **F&B Kitchen Display System (KDS) & Self-Order QR**: Pemesanan via scan QR code di meja kafe/resto langsung diteruskan secara real-time ke layar dapur koki & bar.
- **Multi-Tenant SaaS Self-Serve**: Registrasi mandiri UMKM, pilihan paket langganan (Free, Starter, Pro, Enterprise), manajemen staf, dan multi-outlet.

---

### 2. Status Audit & Roadmap Eksekusi

```
┌───────────────────────────────────────────────────────────────┐
│                    ROADMAP TRACKING STATUS                    │
├───────┬───────────────────────────────────────────┬───────────┤
│ FASE  │ MODUL / FITUR                             │ STATUS    │
├───────┼───────────────────────────────────────────┼───────────┤
│ FASE 1│ Multi-Tenant Schema & Onboarding Mandiri  │ [READY]   │
│ FASE 2│ Tax Engine (PPN/PB1) & Akuntansi SAK EMKM │ [READY]   │
│ FASE 3│ Recipe / Bill of Materials (BOM) & HPP F&B│ [READY]   │
│ FASE 4│ QR Code Meja & Kitchen Display System     │ [READY]   │
│ FASE 5│ Multi-Outlet & Transfer Gudang            │ [QUEUED]  │
│ FASE 6│ Hardening & Deployment Dokploy VPS        │ [QUEUED]  │
└───────┴───────────────────────────────────────────┴───────────┘
```

Untuk detail teknis lengkap, skema database, analisis kompetitor (Moka, Majoo, ESB, Olsera, Pawoon), serta formula akuntansi dan perpajakan, silakan buka:
👉 **[DOCS/KADAI_ENTERPRISE_BLUEPRINT.md](./DOCS/KADAI_ENTERPRISE_BLUEPRINT.md)**
