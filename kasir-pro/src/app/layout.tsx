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
  title: "KADAI - Enterprise POS & ERP System",
  description:
    "Platform Operasi Bisnis Terpadu: Point of Sale (POS), Manajemen Persediaan FIFO, Resep BOM Kuliner, dan Kepatuhan Akuntansi SAK EMKM.",
  keywords: ["POS", "kasir", "point of sale", "inventory", "FIFO", "BOM", "KDS", "SAK EMKM", "enterprise"],
  manifest: "/manifest.json",
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
