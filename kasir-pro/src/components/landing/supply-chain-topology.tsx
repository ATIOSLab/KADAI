"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2,
  ChefHat,
  Truck,
  Store,
  UtensilsCrossed,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type TopologyNode = "hub-warehouse" | "hub-kitchen" | "spoke-restaurant" | "spoke-booth" | "spoke-retail";

export function SupplyChainTopology() {
  const [activeNode, setActiveNode] = useState<TopologyNode>("hub-kitchen");

  const nodes = {
    "hub-warehouse": {
      title: "Gudang Pusat (Central Warehouse)",
      type: "HUB PUSAT",
      desc: "Pusat penerimaan pasokan vendor skala besar, penomoran batch FIFO, dan kontrol expired date bahan mentah.",
      metrics: ["Stok Terpusat: 480 SKU", "Metode HPP: FIFO Batch", "Surat Jalan: Otomatis"],
      icon: Building2,
      accent: "text-blue-600 bg-blue-50 border-blue-200",
      flowTo: "Mengirim bahan baku mentah (beras, daging, kopi, kemasan) ke Dapur Pusat & Gerai Cabang.",
    },
    "hub-kitchen": {
      title: "Dapur Pusat (Central Kitchen)",
      type: "HUB PRODUKSI",
      desc: "Pusat pengolahan resep Bill of Materials (BOM) menjadi produk jadi atau bahan setengah jadi untuk standarisasi rasa.",
      metrics: ["Eksekusi Batch: 1-Click", "Kalkulasi HPP: Otomatis", "Standar Rasa: 100% Konsisten"],
      icon: ChefHat,
      accent: "text-orange-600 bg-orange-50 border-orange-200",
      flowTo: "Mendebit bahan mentah via FIFO, memproduksi saus/porsi siap masak, dan mendistribusikannya ke seluruh cabang.",
    },
    "spoke-restaurant": {
      title: "Gerai Restoran & Kafe (Full Service)",
      type: "SPOKE GERAI",
      desc: "Operasional dine-in lengkap dengan Kitchen Display System (KDS), denah meja, self-order QR, dan pajak restoran PB1 10%.",
      metrics: ["Routing KDS: Dapur & Bar", "Self-Order: QR Smartphone", "Pajak: PB1 10%"],
      icon: UtensilsCrossed,
      accent: "text-emerald-600 bg-emerald-50 border-emerald-200",
      flowTo: "Menerima pasokan siap saji, otomatis memotong porsi saat pesanan masuk di KDS kasir/meja.",
    },
    "spoke-booth": {
      title: "Booth Kaki Lima & Pop-up Kios",
      type: "SPOKE BOOTH",
      desc: "Gerai cepat saji dengan alur Direct Serve (otomatis bypass KDS antrean dapur) untuk kecepatan transaksi tinggi.",
      metrics: ["Alur: Langsung Saji", "Kecepatan Kasir: < 0.2s", "Struk: Thermal 58mm"],
      icon: Store,
      accent: "text-amber-600 bg-amber-50 border-amber-200",
      flowTo: "Menerima transfer stok harian dari Gudang/Dapur Pusat dengan konfirmasi penerimaan 1-klik.",
    },
    "spoke-retail": {
      title: "Toko Ritel, Apotek & Minimarket",
      type: "SPOKE RITEL",
      desc: "Penjualan berbasis scan barcode scanner USB/Bluetooth, pelacakan batch expired date, dan pajak PPN 11%.",
      metrics: ["Scan Barcode: USB/BT/HP", "Pajak: PPN Ritel 11%", "Batas Restock: Alert Otomatis"],
      icon: Store,
      accent: "text-purple-600 bg-purple-50 border-purple-200",
      flowTo: "Pencatatan kartu stok mutasi otomatis keluar-masuk barang komersial per transaksi penjualan.",
    },
  };

  const selected = nodes[activeNode];

  return (
    <section id="topologi-rantai-pasok" className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-50 border-y border-border w-full">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="font-semibold rounded-full px-3.5 py-1 bg-white text-slate-800 border-slate-300">
            Topologi Arsitektur Rantai Pasok
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950">
            Arsitektur Hub-and-Spoke: Gudang Pusat ke Seluruh Jaringan Gerai
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Hilangkan selisih persediaan dan kebocoran bahan baku. KADAI menghubungkan pengadaan pusat dengan puluhan gerai cabang melalui alur transfer stok digital ber-batch.
          </p>
        </div>

        {/* Visual Topology Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Interactive Topology Nodes */}
          <div className="lg:col-span-7 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Pusat Kendali (Hub) & Jaringan Cabang (Spoke)
            </div>

            {/* Hub Group */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Tingkat 1: Pusat Distribusi & Produksi (Hub)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveNode("hub-warehouse")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeNode === "hub-warehouse"
                      ? "border-blue-600 bg-blue-50/60 shadow-xs ring-1 ring-blue-600"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="size-4 text-blue-600" />
                    <span className="font-bold text-xs text-slate-900">Gudang Pusat (HQ)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-1">Stok Bahan Baku & Vendor</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveNode("hub-kitchen")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeNode === "hub-kitchen"
                      ? "border-orange-600 bg-orange-50/60 shadow-xs ring-1 ring-orange-600"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ChefHat className="size-4 text-orange-600" />
                    <span className="font-bold text-xs text-slate-900">Dapur Pusat (CK)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-1">Produksi Resep BOM Terstandar</p>
                </button>
              </div>
            </div>

            {/* Routing Transit Indicator */}
            <div className="flex items-center justify-center gap-2 py-1 text-xs text-slate-500 font-mono">
              <Truck className="size-4 text-primary animate-bounce" />
              <span>Surat Jalan Digital & Transfer Stok In-Transit (FIFO Scoped)</span>
            </div>

            {/* Spoke Group */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Tingkat 2: Unit Usaha Penerima (Spokes)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveNode("spoke-restaurant")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeNode === "spoke-restaurant"
                      ? "border-emerald-600 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-600"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <UtensilsCrossed className="size-3.5 text-emerald-600" />
                    <span className="font-bold text-xs text-slate-900">Restoran / Kafe</span>
                  </div>
                  <p className="text-[10px] text-slate-600">KDS Dapur & PB1 10%</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveNode("spoke-booth")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeNode === "spoke-booth"
                      ? "border-amber-600 bg-amber-50/60 shadow-xs ring-1 ring-amber-600"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Store className="size-3.5 text-amber-600" />
                    <span className="font-bold text-xs text-slate-900">Booth / Kios</span>
                  </div>
                  <p className="text-[10px] text-slate-600">Direct Serve Kasir</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveNode("spoke-retail")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeNode === "spoke-retail"
                      ? "border-purple-600 bg-purple-50/60 shadow-xs ring-1 ring-purple-600"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Store className="size-3.5 text-purple-600" />
                    <span className="font-bold text-xs text-slate-900">Toko Ritel</span>
                  </div>
                  <p className="text-[10px] text-slate-600">Barcode & PPN 11%</p>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Node Deep Dive Details Card */}
          <div className="lg:col-span-5 h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeNode}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="h-full"
              >
                <Card className="h-full border border-slate-200 bg-white p-6 shadow-sm rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                        {selected.type}
                      </span>
                      <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 text-[10px] font-bold">
                        Sinkronisasi Realtime
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-950">{selected.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {selected.desc}
                      </p>
                    </div>

                    {/* Operational Flow */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
                      <span className="font-bold text-slate-900 block text-[11px]">Aliran Data & Mutasi Stok:</span>
                      <p>{selected.flowTo}</p>
                    </div>

                    {/* Node Feature Metrics */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-900 block">Karakteristik Operasional:</span>
                      <ul className="space-y-1.5 text-xs text-slate-600 font-medium">
                        {selected.metrics.map((m, i) => (
                          <li key={i} className="flex items-center gap-2 text-slate-800">
                            <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-muted-foreground font-mono">
                    <span>Audit Trail Logged</span>
                    <span className="text-slate-900 font-bold">KADAI Supply OS</span>
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
