import type { Metadata } from "next";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  title: "KADAI - Enterprise Multi-Tenant POS & SaaS Platform",
  description:
    "Sistem operasi bisnis, POS cerdas, inventori bahan baku (BOM) FIFO, QR dining, KDS, dan kepatuhan perpajakan SAK EMKM Indonesia.",
  keywords: ["POS", "kasir", "point of sale", "inventory", "FIFO", "UMKM", "SAK EMKM", "KDS", "F&B"],
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
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&family=Space+Grotesk:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              border: "1px solid #E2E8F0",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
              borderRadius: "0.75rem",
              fontWeight: 600,
              background: "#FFFFFF",
              color: "#0F172A",
              padding: "12px 16px",
            },
          }}
        />
      </body>
    </html>
  );
}
