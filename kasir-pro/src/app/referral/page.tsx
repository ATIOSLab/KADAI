import { Metadata } from "next";
import { ReferralContent } from "./referral-content";

export const metadata: Metadata = {
  title: "Program Mitra Referral & Afiliasi Marketing",
  description:
    "Rekomendasikan Sistem Operasi Bisnis KADAI ke rekan pengusaha dan dapatkan komisi bagi hasil berkelanjutan 20% setiap bulan. Pendaftaran gratis 1-menit untuk komunitas bisnis dan konsultan.",
  alternates: {
    canonical: "https://kadai.asia/referral",
  },
  openGraph: {
    title: "Program Mitra Referral & Afiliasi Marketing | KADAI",
    description:
      "Dapatkan komisi bagi hasil 20% setiap bulan dengan merekomendasikan KADAI ke rekan pengusaha dan merchant UMKM di Indonesia.",
    url: "https://kadai.asia/referral",
    images: [{ url: "https://kadai.asia/og-image.png", width: 1200, height: 630 }],
  },
};

export default function ReferralPage() {
  return <ReferralContent />;
}
