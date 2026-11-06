import { Metadata } from "next";
import { ReferralContent } from "./referral-content";

export const metadata: Metadata = {
  title: "Program Mitra Referral & Afiliasi Marketing",
  description:
    "Rekomendasikan Sistem Operasi Bisnis KADAI ke rekan pengusaha dan dapatkan komisi bagi hasil berkelanjutan 20% setiap bulan. Pendaftaran gratis 1-menit untuk komunitas bisnis dan konsultan.",
  alternates: {
    canonical: "https://kadai.asia/referral",
  },
};

export default function ReferralPage() {
  return <ReferralContent />;
}
