import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jadwal Demo & Konsultasi Sistem",
  description:
    "Coba demo langsung KADAI: Sistem Operasi Bisnis Indonesia untuk kasir POS kilat, inventori multi-batch fleksibel, alur dapur KDS, dan kepatuhan pajak SAK EMKM.",
  alternates: {
    canonical: "https://kadai.asia/demo",
  },
  openGraph: {
    title: "Jadwal Demo & Konsultasi Sistem | KADAI",
    description:
      "Jadwalkan demo langsung sistem operasi bisnis terpadu untuk gerai, dapur, dan pembukuan usaha Anda.",
    url: "https://kadai.asia/demo",
    images: [{ url: "https://kadai.asia/og-image.png", width: 1200, height: 630 }],
  },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
