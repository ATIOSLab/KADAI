import { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Database,
  Share2,
  Clock,
  UserCheck,
  Cookie,
  Baby,
  Scale,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Kebijakan Privasi & Pelindungan Data Pribadi (UU PDP)",
  description:
    "Bagaimana KADAI mengumpulkan, menggunakan, menyimpan, dan melindungi data pribadi pengguna sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).",
  alternates: {
    canonical: "https://kadai.asia/kebijakan-privasi",
  },
};

const EFFECTIVE_DATE = "7 November 2026";
const WA_LINK = "https://wa.me/6285159081119";

interface PrivacySection {
  icon: typeof ShieldCheck;
  title: string;
  intro?: string;
  items?: string[];
  note?: string;
}

const sections: PrivacySection[] = [
  {
    icon: ShieldCheck,
    title: "1. Ringkasan",
    intro:
      "KADAI adalah platform Sistem Operasi Bisnis (POS, inventori, pembukuan, kemitraan) yang berkomitmen melindungi data pribadi penggunanya. Kami mengumpulkan data seminimal mungkin untuk menjalankan layanan, tidak pernah menjual data pribadi kepada pihak mana pun, dan memberikan Anda kendali penuh atas data yang kami kelola.",
  },
  {
    icon: UserCheck,
    title: "2. Pengendali Data Pribadi & Kontak",
    items: [
      "Pengendali data pribadi pada platform KADAI adalah manajemen KADAI di bawah naungan NEW ASIA TECH.",
      "Seluruh pertanyaan terkait privasi atau permintaan hak subjek data dapat disampaikan melalui kanal resmi: WhatsApp +62 851-5908-1119 atau formulir pada halaman permintaan demo.",
      "Setiap permintaan hak subjek data direspons paling lambat 30 (tiga puluh) hari kerja sejak permintaan terverifikasi.",
    ],
  },
  {
    icon: Database,
    title: "3. Data Pribadi yang Kami Kumpulkan",
    items: [
      "Identitas akun: nama, email, nomor telepon, peran pengguna, dan kata sandi — kata sandi hanya disimpan dalam bentuk hash satu arah dan tidak pernah dapat dibaca kembali.",
      "Data bisnis: nama outlet, daftar produk, stok dan batch, transaksi penjualan, serta data pelanggan/supplier yang Anda input ke dalam sistem.",
      "Data pembayaran: nominal, status, dan referensi transaksi dari penyedia pembayaran. Kami tidak menyimpan nomor kartu, kode CVV, atau kredensial pembayaran apa pun.",
      "Data teknis: alamat IP, jenis perangkat dan browser, serta log akses dan aktivitas (audit trail) untuk keamanan dan forensik.",
      "Data kemitraan: kode referral, profil mitra, dan pencatatan komisi bagi hasil.",
    ],
  },
  {
    icon: Scale,
    title: "4. Dasar Hukum & Tujuan Pemrosesan",
    items: [
      "Pelaksanaan kontrak (Pasal 20 UU PDP): menyediakan dan menjalankan layanan KADAI — akun, kasir, inventori FIFO, KDS, pembukuan, dan laporan.",
      "Kewajiban hukum: pencatatan pembukuan dan kepatuhan perpajakan Indonesia (UU KUP, UU HKPD), serta pemenuhan permintaan aparat berwenang yang sah.",
      "Persetujuan: pengiriman informasi produk, edukasi, dan promosi — dapat ditarik kembali kapan saja tanpa memengaruhi layanan inti.",
      "Kepentingan sah: keamanan sistem, pencegahan penipuan dan penyalahgunaan, serta pemulihan layanan setelah gangguan.",
    ],
  },
  {
    icon: Share2,
    title: "5. Pembagian & Transfer Data",
    items: [
      "Kami tidak menjual, menyewakan, atau memperdagangkan data pribadi pengguna.",
      "Data hanya dibagikan kepada sub-prosesor yang diperlukan untuk operasional: penyedia infrastruktur server/VPS, penyedia payment gateway (mis. Midtrans/Xendit), kanal komunikasi resmi (WhatsApp/Telegram), dan penyedia layanan email/analisis.",
      "Bila terdapat transfer data ke luar wilayah Indonesia, kami memastikan tingkat pelindungan yang setara dengan UU PDP, sebagaimana diatur dalam Pasal 56.",
    ],
  },
  {
    icon: Lock,
    title: "6. Keamanan Data",
    items: [
      "Enkripsi transportasi (TLS/HTTPS) pada seluruh komunikasi.",
      "Kata sandi di-hash satu arah; sesi ditandatangani kriptografis (HMAC) dengan masa berlaku terbatas.",
      "Kontrol akses berbasis peran (RBAC) dengan revalidasi identitas pada setiap permintaan yang dilindungi.",
      "Pencatatan audit trail aktivitas penting, kontrol akses minimal, dan cadangan (backup) data yang dienkripsi.",
    ],
  },
  {
    icon: Clock,
    title: "7. Penyimpanan & Retensi",
    items: [
      "Data pribadi disimpan selama akun aktif dan selama masih diperlukan untuk tujuan pemrosesan.",
      "Data transaksi dan keuangan disimpan mengikuti kewajiban perpajakan Indonesia (dokumen dasar pembukuan minimal 10 tahun sesuai UU KUP).",
      "Setelah tidak lagi diperlukan, data dihapus atau dianonimkan secara permanen.",
    ],
  },
  {
    icon: UserCheck,
    title: "8. Hak Anda sebagai Subjek Data (UU PDP)",
    items: [
      "Hak atas informasi dan akses: mengetahui data apa yang kami kelola dan memperoleh salinannya.",
      "Hak perbaikan: melengkapi, memperbarui, dan memperbaiki data yang tidak akurat.",
      "Hak penghapusan, pengakhiran pemrosesan, dan penarikan kembali persetujuan.",
      "Hak portabilitas: menerima data pribadi dalam format terstruktur yang umum digunakan.",
      "Hak menolak pengambilan keputusan otomatis yang berdampak signifikan, serta hak mengajukan gugatan dan menerima kompensasi atas pelanggaran.",
      "Cara mengajukan: gunakan kanal resmi pada bagian 2. Permintaan yang wajar kami layani tanpa biaya; penolakan akan disertai alasan dan dasar hukum.",
    ],
  },
  {
    icon: Cookie,
    title: "9. Cookie & Pelacakan",
    items: [
      "Cookie esensial sesi (login) — wajib agar layanan berfungsi.",
      "Cookie atribusi referral (kadai_ref, berlaku 30 hari) — untuk mengkreditkan komisi mitra sesuai program kemitraan.",
      "Saat ini tidak ada cookie iklan pihak ketiga. Jika di kemudian hari kami menggunakan pelacakan pemasaran, persetujuan akan diminta terlebih dahulu.",
    ],
  },
  {
    icon: Baby,
    title: "10. Data Anak",
    intro:
      "Layanan KADAI ditujukan bagi pelaku usaha dan pengelola bisnis yang merupakan orang dewasa. Kami tidak dengan sengaja mengumpulkan data pribadi anak. Apabila kami mengetahui adanya data anak yang tidak sengaja terkumpul, data tersebut akan segera dihapus.",
  },
  {
    icon: RefreshCw,
    title: "11. Pengaduan & Penyelesaian Sengketa",
    items: [
      "Sampaikan keluhan terlebih dahulu melalui kanal resmi kami pada bagian 2.",
      "Apabila tidak terselesaikan, Anda berhak mengajukan pengaduan kepada otoritas pengawas pelindungan data pribadi (sesuai ketentuan UU PDP) dan/atau menempuh jalur penyelesaian sengketa yang berlaku.",
    ],
  },
  {
    icon: MessageCircle,
    title: "12. Perubahan Kebijakan",
    intro:
      "Kebijakan ini dapat diperbarui sewaktu-waktu. Versi terbaru selalu tersedia pada halaman ini beserta tanggal efektifnya. Apabila terdapat perubahan yang bersifat material, kami akan memberitahukan melalui email atau notifikasi dalam akun Anda.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col overflow-x-hidden w-full max-w-full font-sans">
      <SiteHeader dashboardPath={null} />
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-14 sm:py-20">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary font-bold text-xs px-3 py-1">
            <ShieldCheck className="size-3.5" />
            KEPATUHAN &amp; REGULASI
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Kebijakan Privasi &amp; Pelindungan Data Pribadi
          </h1>
          <p className="text-sm text-slate-500">
            Berlaku efektif {EFFECTIVE_DATE} · Sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP) &bull; Dikelola oleh{" "}
            <a
              href="https://newasiatech.co.id"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-700 hover:text-primary transition-colors underline decoration-slate-300 underline-offset-2"
            >
              NEW ASIA TECH
            </a>
          </p>
        </div>

        <div className="mt-12 space-y-8">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
            >
              <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <section.icon className="size-4.5" />
                </span>
                {section.title}
              </h2>
              {section.intro && <p className="mt-4 text-sm leading-relaxed text-slate-600">{section.intro}</p>}
              {section.items && (
                <ul className="mt-4 space-y-3">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-600">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-slate-950 text-slate-200 p-6 sm:p-8 space-y-3">
          <h2 className="text-base font-bold text-white">Butuh bantuan terkait privasi?</h2>
          <p className="text-xs leading-relaxed text-slate-400">
            Tim pelindungan data KADAI siap membantu. Hubungi kami melalui WhatsApp resmi atau
            formulir permintaan demo — kami menanggapi permintaan hak subjek data maksimal 30 hari kerja.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90"
            >
              <MessageCircle className="size-3.5" />
              Hubungi via WhatsApp
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800"
            >
              Formulir Permintaan Demo
            </Link>
          </div>
        </div>

        <p className="mt-8 text-[11px] leading-relaxed text-slate-400">
          Dokumen ini disusun sebagai bentuk transparansi pengelolaan data pribadi dan bukan merupakan
          nasihat hukum. Untuk interpretasi hukum atas UU PDP, konsultasikan dengan penasihat hukum Anda.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
