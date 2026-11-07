import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { PwaRegister } from "@/components/shared/pwa-register";

import { ReferralTracker } from "@/components/shared/referral-tracker";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kadai.asia"),
  title: {
    default: "KADAI - Sistem Operasi Bisnis Indonesia",
    template: "%s | KADAI",
  },
  description:
    "Sistem Operasi Bisnis Indonesia: Kasir POS Kilat, Inventori Multi-Batch FIFO, Resep BOM Kuliner, Kitchen Display System (KDS), dan Kepatuhan Pajak PB1 10% & SAK EMKM.",
  keywords: [
    "POS",
    "aplikasi kasir online",
    "point of sale indonesia",
    "inventori FIFO",
    "BOM kuliner",
    "KDS restoran",
    "SAK EMKM",
    "pajak resto PB1",
    "PPh Final PP 55/2022",
    "multi-cabang",
    "kadai pos",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "KADAI - Sistem Operasi Bisnis Indonesia",
    description:
      "Satu Sistem Terpadu untuk Gerai, Dapur, & Pembukuan Anda. Transaksi lancar, stok akurat, pajak tepat.",
    url: "https://kadai.asia",
    siteName: "KADAI Operating System",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KADAI - Sistem Operasi Bisnis Indonesia",
    description:
      "Satu Sistem Terpadu untuk Gerai, Dapur, & Pembukuan Anda. Transaksi lancar, stok akurat, pajak tepat.",
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KADAI",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const schemaGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://kadai.asia/#organization",
      "name": "KADAI",
      "url": "https://kadai.asia",
      "logo": "https://kadai.asia/icon.svg",
      "sameAs": ["https://github.com/ATIOSLab/KADAI"],
      "founder": {
        "@type": "Organization",
        "name": "ATIOSLab",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://kadai.asia/#software",
      "name": "KADAI - Sistem Operasi Bisnis Indonesia",
      "operatingSystem": "Web, Windows, macOS, Android, iOS",
      "applicationCategory": "BusinessApplication",
      "applicationSubCategory": "Point of Sale & Supply Chain Management",
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "IDR",
        "lowPrice": "0",
        "highPrice": "599000",
        "offerCount": "4",
      },
      "description":
        "Sistem Operasi Bisnis Indonesia: Kasir POS Kilat, Inventori Multi-Batch FIFO, Resep BOM Kuliner, Kitchen Display System (KDS), dan Kepatuhan Pajak PB1 10% & SAK EMKM. Transaksi lancar, stok akurat, pajak tepat.",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={cn("font-sans antialiased", plusJakartaSans.variable, geistMono.variable)}>
      <head>
        <script
          type="application/ld+json"
        >
          {JSON.stringify(schemaGraph)}
        </script>
      </head>
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900 selection:bg-primary/20">
        <PwaRegister />
        <ReferralTracker />
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            className: "font-sans text-xs border border-slate-200/90 shadow-md rounded-xl bg-white text-slate-900",
          }}
        />

      </body>
    </html>
  );
}
