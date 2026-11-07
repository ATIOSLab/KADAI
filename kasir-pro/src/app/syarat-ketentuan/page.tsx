import { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  ShieldAlert,
  Server,
  CreditCard,
  Ban,
  Scale,
  RefreshCw,
  AlertTriangle,
  Award,
} from "lucide-react";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Syarat & Ketentuan Layanan (Terms of Service)",
  description:
    "Ketentuan penggunaan platform KADAI, mencakup hak akses, lisensi perangkat lunak, SLA, batasan tanggung jawab, dan kepatuhan regulasi transaksi elektronik Indonesia.",
  alternates: {
    canonical: "https://kadai.asia/syarat-ketentuan",
  },
};

const EFFECTIVE_DATE = "7 November 2026";
const WA_LINK = "https://wa.me/6285159081119";

interface TermSection {
  icon: typeof FileText;
  title: string;
  intro?: string;
  items?: string[];
  note?: string;
}

const sections: TermSection[] = [
  {
    icon: FileText,
    title: "1. Penerimaan Ketentuan",
    intro:
      "Dengan mendaftar, mengakses, atau menggunakan layanan KADAI (kadai.asia), Anda menyatakan telah membaca, memahami, dan menyetujui untuk terikat secara hukum oleh Syarat & Ketentuan ini serta Kebijakan Privasi KADAI. Ketentuan ini merupakan perjanjian yang sah dan mengikat antara Anda (atau badan usaha yang Anda wakili) dan ATIOSLab selaku pengembang dan pengelola platform.",
  },
  {
    icon: Server,
    title: "2. Ruang Lingkup Layanan & Lisensi Penggunaan",
    items: [
      "KADAI menyediakan Sistem Operasi Bisnis berbasis komputasi awan (SaaS), mencakup Kasir POS Kilat, Manajemen Inventori Multi-Batch FIFO, Kitchen Display System (KDS), Resep BOM Produksi, Modul Pembukuan Fiskal, dan Kemitraan Referral.",
      "ATIOSLab memberikan Anda lisensi non-eksklusif, terbatas, tidak dapat dialihkan, dan dapat dibatalkan untuk mengakses dan menggunakan antarmuka sistem sesuai paket langganan aktif Anda.",
      "Seluruh hak kekayaan intelektual (kode sumber, algoritma, desain grafis, basis data, dan merek dagang) adalah hak milik eksklusif ATIOSLab.",
    ],
  },
  {
    icon: ShieldAlert,
    title: "3. Akun, Keamanan & Kredensial",
    items: [
      "Anda bertanggung jawab penuh atas kerahasiaan kredensial akun, termasuk kata sandi dan supervisor PIN.",
      "Segala tindakan dan transaksi yang dilakukan melalui akun Anda dianggap sebagai tindakan sah dari Anda atau staf yang Anda beri wewenang.",
      "Anda wajib segera memberi tahu tim keamanan KADAI melalui kanal resmi apabila mendeteksi adanya akses tidak sah atau kebocoran keamanan akun.",
    ],
  },
  {
    icon: CreditCard,
    title: "4. Berlangganan, Penagihan & Pembayaran",
    items: [
      "Layanan KADAI tersedia dalam beberapa tier paket (Starter, Pro Business, Enterprise) dengan siklus penagihan bulanan atau tahunan sebagaimana tertera pada halaman /harga.",
      "Pembayaran diproses secara aman melalui gerbang pembayaran berlisensi Bank Indonesia (termasuk QRIS, Virtual Account bank, dan kartu pembayaran resmi).",
      "Keterlambatan pembayaran tagihan perpanjangan setelah masa tenggang (grace period) dapat mengakibatkan pembatasan akses sementara ke modul tertentu hingga tagihan diselesaikan.",
      "Biaya langganan yang telah dibayarkan bersifat final dan tidak dapat dikembalikan (non-refundable), kecuali ditentukan lain dalam perjanjian tingkat layanan korporasi (Enterprise SLA).",
    ],
  },
  {
    icon: Ban,
    title: "5. Larangan Penggunaan & Pembatasan Sistem",
    items: [
      "Dilarang merekayasa balik (reverse engineer), membongkar, mendekompilasi, atau mengekstraksi kode sumber KADAI.",
      "Dilarang menggunakan bot, scraper, atau perangkat otomatisasi tanpa izin tertulis dari KADAI.",
      "Dilarang mencatat atau memperjualbelikan komoditas atau jasa yang melanggar hukum Negara Kesatuan Republik Indonesia (seperti narkotika, senjata api terlarang, atau barang selundupan).",
      "Dilarang mengeksploitasi kerentanan keamanan atau membebani infrastruktur server secara sengaja (Denial of Service).",
    ],
  },
  {
    icon: Award,
    title: "6. Kedaulatan & Kepemilikan Data Pengguna",
    items: [
      "Seluruh data transaksi, data inventori, daftar pelanggan, dan laporan keuangan yang Anda masukkan ke dalam sistem adalah hak milik mutlak bisnis Anda.",
      "KADAI menjamin kedaulatan data dan menyediakan fasilitas ekspor data terstruktur kapan saja selama status akun Anda aktif.",
      "Penyimpanan dan perlindungan data bisnis dan data pribadi tunduk pada standar UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).",
    ],
  },
  {
    icon: AlertTriangle,
    title: "7. Ketersediaan Layanan (SLA) & Batasan Tanggung Jawab",
    items: [
      "KADAI berupaya menjaga ketersediaan layanan dengan target uptime 99.9% setiap bulan.",
      "Pemeliharaan rutin terjadwal akan diumumkan sebelumnya melalui pengumuman dasbor atau kanal notifikasi resmi.",
      "KADAI tidak bertanggung jawab atas kerugian tidak langsung, kehilangan keuntungan (loss of profit), atau kerugian data akibat kesalahan pihak ketiga, kegagalan jaringan internet lokal pengguna, atau keadaan kahar (force majeure) seperti bencana alam, kebakaran, atau gangguan telekomunikasi nasional.",
    ],
  },
  {
    icon: Scale,
    title: "8. Hukum yang Berlaku & Penyelesaian Sengketa",
    items: [
      "Syarat & Ketentuan ini diatur dan ditafsirkan berdasarkan hukum Negara Kesatuan Republik Indonesia, termasuk UU No. 1 Tahun 2024 tentang ITE dan PP No. 71 Tahun 2019 tentang PSTE.",
      "Setiap perselisihan yang timbul akan diutamakan diselesaikan secara musyawarah untuk mufakat. Apabila tidak tercapai mufakat dalam waktu 30 hari kalender, sengketa akan diselesaikan melalui yurisdiksi Pengadilan Negeri yang berwenang di Indonesia.",
    ],
  },
  {
    icon: RefreshCw,
    title: "9. Pembaruan Ketentuan",
    intro:
      "ATIOSLab berhak memperbarui Syarat & Ketentuan ini sewaktu-waktu guna menyesuaikan dengan inovasi teknologi dan regulasi pemerintah yang berlaku. Tanggal pembaruan terakhir akan selalu dicantumkan pada bagian atas dokumen ini. Penggunaan berkelanjutan atas layanan KADAI setelah pembaruan menandakan persetujuan Anda terhadap ketentuan yang diperbarui.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      <SiteHeader dashboardPath={null} />

      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-10 text-center sm:text-left border-b border-slate-200 pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
              <FileText className="size-3.5" />
              <span>Dokumen Hukum Resmi KADAI</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              Syarat & Ketentuan Layanan
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
              Panduan hukum, lisensi perangkat lunak SaaS, batasan tanggung jawab, serta komitmen kedaulatan data antara pengguna dan KADAI (ATIOSLab).
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span>Berlaku efektif sejak: <strong>{EFFECTIVE_DATE}</strong></span>
              <span>•</span>
              <span>Yurisdiksi: <strong>Republik Indonesia</strong></span>
              <span>•</span>
              <Link href="/kebijakan-privasi" className="text-primary font-bold hover:underline">
                Lihat Kebijakan Privasi (UU PDP) →
              </Link>
            </div>
          </div>

          {/* Sections List */}
          <div className="space-y-8">
            {sections.map((sec, idx) => {
              const Icon = sec.icon;
              return (
                <section
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="size-4" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-950">
                      {sec.title}
                    </h2>
                  </div>

                  {sec.intro && (
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pt-1">
                      {sec.intro}
                    </p>
                  )}

                  {sec.items && (
                    <ul className="space-y-2 pt-1 text-xs sm:text-sm text-slate-700 leading-relaxed list-disc list-inside">
                      {sec.items.map((it, i) => (
                        <li key={i} className="pl-1">
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {sec.note && (
                    <p className="text-[11px] text-slate-500 italic pt-2 border-t border-slate-100">
                      {sec.note}
                    </p>
                  )}
                </section>
              );
            })}
          </div>

          {/* Help box */}
          <div className="mt-10 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-bold text-base sm:text-lg">Ada pertanyaan seputar ketentuan layanan?</h3>
              <p className="text-xs text-slate-300">
                Tim legal dan operasional kami siap membantu klarifikasi kebutuhan kontrak bisnis Anda.
              </p>
            </div>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs whitespace-nowrap transition-transform hover:scale-105"
            >
              Hubungi Tim Legal KADAI
            </a>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}