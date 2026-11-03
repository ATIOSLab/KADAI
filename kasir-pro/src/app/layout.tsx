import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "KADAI - Enterprise POS & ERP System",
  description:
    "Platform Operasi Bisnis Terpadu: Point of Sale (POS), Manajemen Persediaan FIFO, Resep BOM Kuliner, dan Kepatuhan Akuntansi SAK EMKM.",
  keywords: ["POS", "kasir", "point of sale", "inventory", "FIFO", "BOM", "KDS", "SAK EMKM", "enterprise"],
  manifest: "/manifest.json",
  themeColor: "#0F172A",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KADAI",
  },
};

export const viewport = {
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
    <html lang="id" className={cn("font-sans", geist.variable)}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              border: "2px solid #000",
              boxShadow: "4px 4px 0px #000",
              borderRadius: "0.5rem",
              fontWeight: 700,
            },
          }}
        />
      </body>
    </html>
  );
}
