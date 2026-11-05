import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { PwaRegister } from "@/components/shared/pwa-register";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kadai.asia"),
  title: {
    default: "KADAI - Enterprise POS & Rantai Pasok RI",
    template: "%s | KADAI Enterprise",
  },
  description:
    "Sistem Operasi Bisnis Indonesia: Kasir POS Kilat, Inventori Multi-Batch FIFO, Resep BOM Kuliner, Kitchen Display System (KDS), dan Kepatuhan Pajak PB1 & SAK EMKM.",
  keywords: [
    "POS",
    "kasir online",
    "point of sale indonesia",
    "inventori FIFO",
    "BOM kuliner",
    "KDS restoran",
    "SAK EMKM",
    "pajak resto PB1",
    "PPh Final PP 55/2022",
    "multi-cabang",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "KADAI - Enterprise POS & Rantai Pasok RI",
    description:
      "Satu Sistem Terpadu untuk Gerai, Dapur Pusat, & Pembukuan Anda. Dilengkapi Kasir POS kilat, FIFO batch, dan kepatuhan fiskal RI.",
    url: "https://kadai.asia",
    siteName: "KADAI Operating System",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KADAI - Enterprise POS & Rantai Pasok RI",
    description:
      "Satu Sistem Terpadu untuk Gerai, Dapur Pusat, & Pembukuan Anda.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={cn("font-sans antialiased", geistSans.variable, geistMono.variable)}>
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900 selection:bg-primary/20">
        <PwaRegister />
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
