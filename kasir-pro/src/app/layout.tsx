import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono, Saira } from "next/font/google";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { PwaRegister } from "@/components/shared/pwa-register";

import { ReferralTracker } from "@/components/shared/referral-tracker";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const saira = Saira({
  subsets: ["latin"],
  variable: "--font-saira",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kadai.asia"),
  title: {
    default: "KADAI - Satu Sistem untuk Gerai, Dapur, dan Pembukuan | Sistem Operasi Bisnis Indonesia",
    template: "%s | KADAI",
  },
  description:
    "Aplikasi kasir POS dan sistem operasi bisnis terlengkap di Indonesia. Cocok untuk usaha Non-PKP (bebas pajak 0%) maupun PKP (PB1 10%, PPN 11%). Kelola penjualan kilat, inventori multi-batch FIFO, resep dapur BOM, multi-cabang, dan legalitas NIB OSS.",
  keywords: [
    "POS",
    "aplikasi kasir online",
    "kasir non pkp",
    "point of sale indonesia",
    "aplikasi kasir toko",
    "aplikasi kasir restoran",
    "sistem operasi bisnis",
    "aplikasi kasir pb1",
    "inventori fifo indonesia",
    "resep bom kuliner",
    "kds dapur",
    "pt perorangan pos",
    "nib oss rba",
    "kadai pos",
    "aplikasi kasir offline",
    "qris dinamis pos",
    "SAK EMKM",
    "PPh Final PP 55/2022",
    "multi-cabang",
  ],
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    title: "KADAI - Sistem Operasi Bisnis Indonesia (Non-PKP & PKP)",
    description:
      "Satu aplikasi kasir terpadu untuk gerai, dapur, & pembukuan Anda. Cocok untuk usaha Non-PKP (0% pajak) & PKP. Kasir kilat, inventori FIFO, dan kepatuhan fiskal RI.",
    url: "https://kadai.asia",
    siteName: "KADAI Operating System",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "https://kadai.asia/og-image.png",
        width: 1200,
        height: 630,
        alt: "KADAI - Sistem Operasi Bisnis Indonesia | Aplikasi Kasir POS Non-PKP & PKP",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KADAI - Sistem Operasi Bisnis Indonesia (Non-PKP & PKP)",
    description:
      "Satu aplikasi kasir terpadu untuk gerai, dapur, & pembukuan Anda. Cocok untuk usaha Non-PKP (0% pajak) & PKP. Kasir kilat, inventori FIFO, dan kepatuhan fiskal RI.",
    site: "@kadai_asia",
    creator: "@kadai_asia",
    images: ["https://kadai.asia/og-image.png"],
  },
  alternates: {
    canonical: "https://kadai.asia",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

const schemaGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://kadai.asia/#website",
      "url": "https://kadai.asia",
      "name": "KADAI",
      "description": "Sistem Operasi Bisnis Indonesia: Kasir POS Kilat, Fleksibilitas Non-PKP & PKP, Inventori Multi-Batch FIFO, Kitchen Display System (KDS), dan Kepatuhan Pajak PB1 & SAK EMKM",
      "inLanguage": "id-ID",
      "publisher": {
        "@id": "https://kadai.asia/#organization",
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://kadai.asia/blog?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "Organization",
      "@id": "https://kadai.asia/#organization",
      "name": "KADAI",
      "legalName": "PT Netkrida Nusantara",
      "url": "https://kadai.asia",
      "logo": "https://kadai.asia/favicon.svg",
      "image": "https://kadai.asia/og-image.png",
      "sameAs": [
        "https://github.com/ATIOSLab/KADAI",
        "https://www.linkedin.com/company/kadai-asia"
      ],
      "areaServed": {
        "@type": "Country",
        "name": "Indonesia",
      },
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "ID"
      },
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
      "featureList": [
        "Kasir POS Kilat Latensi Rendah & Struk Thermal 58mm/80mm",
        "Fleksibel untuk Usaha Non-PKP (0% Bebas PPN) maupun PKP",
        "Legalitas Usaha RI: PT Perorangan (PP 8/2021), CV, PT, Koperasi, NIB OSS & NIK Pemilik",
        "Inventori Multi-Batch FIFO & FEFO (PSAK 14 / SAK EMKM)",
        "Kitchen Display System (KDS) & Routing Dapur Realtime",
        "Resep Bill of Materials (BOM) Produksi Kuliner",
        "Pajak Restoran PB1 10% (UU HKPD) & PPN 11%",
        "Rekap PPh Final UMKM 0.5% (PP 55/2022) Batas Omzet Bebas Pajak",
        "Multi-Cabang & Surat Jalan Transfer Stok Digital In-Transit",
        "Program Kemitraan & Referral Berkelanjutan 20% Komisi",
        "Pembayaran QRIS Dinamis & EDC Multi-Bank"
      ],
      "description":
        "Sistem Operasi Bisnis Indonesia: Kasir POS Kilat, Fleksibel Non-PKP & PKP, Inventori Multi-Batch FIFO, Resep BOM Kuliner, Kitchen Display System (KDS), dan Kepatuhan Pajak PB1 10% & SAK EMKM.",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={cn(
        "font-sans antialiased",
        plusJakartaSans.variable,
        geistMono.variable,
        saira.variable
      )}
    >
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
