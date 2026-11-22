import type { Metadata } from "next";
import type { ReactNode } from "react";

// Halaman lacak pesanan: token privat & unguessable — wajib noindex agar
// soft-404/halaman token tidak pernah masuk indeks mesin pencari.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function LacakTokenLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
