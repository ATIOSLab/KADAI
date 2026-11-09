import { getServerSessionUser } from "@/lib/session";
import { getDefaultPathForRole } from "@/lib/rbac";
import { SiteHeader } from "@/components/landing/site-header";
import { HeroSection } from "@/components/landing/hero-section";
import { TrustSocialProofBar } from "@/components/landing/trust-social-proof-bar";
import { ProductShowcase } from "@/components/landing/product-showcase";
import { CapabilityBentoGrid } from "@/components/landing/capability-bento-grid";
import { IndustrySolutions } from "@/components/landing/industry-solutions";
import { AccountingTaxSection } from "@/components/landing/accounting-tax-section";
import { CompetitorComparisonSection } from "@/components/landing/competitor-comparison-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { RoiCalculatorSection } from "@/components/landing/roi-calculator-section";
import { ReferralSection } from "@/components/landing/referral-section";
import { FAQSection } from "@/components/landing/faq-section";
import { LANDING_FAQS } from "@/lib/landing-faqs";
import { FinalCTA } from "@/components/landing/final-cta";
import { SiteFooter } from "@/components/landing/site-footer";
import { FloatingWhatsApp } from "@/components/shared/floating-whatsapp";

export default async function HomePage() {
  const sessionUser = await getServerSessionUser();
  const dashboardPath = sessionUser ? getDefaultPathForRole(sessionUser.role) : null;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: LANDING_FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col overflow-x-hidden w-full max-w-full font-sans selection:bg-primary/20">
      {/* FAQPage Structured Data for Google SERP Rich Snippets */}
      <script
        type="application/ld+json"
      >
        {JSON.stringify(faqSchema)}
      </script>

      {/* 1. Header Navigation Bar */}
      <SiteHeader dashboardPath={dashboardPath} />

      {/* 2. Hero Section & Interactive Cockpit Preview */}
      <HeroSection dashboardPath={dashboardPath} />

      {/* 2.5 Trust & Social Proof Bar (Telemetri Gerai Aktif, Uptime & Kompatibilitas) */}
      <TrustSocialProofBar />

      {/* 2.8 Interactive Product Showcase (Tab Playground POS, KDS, Stok FIFO, & Pajak) */}
      <div className="py-12 sm:py-16 bg-slate-50/60 border-b border-slate-200/80">
        <ProductShowcase />
      </div>

      {/* 3. Kapabilitas Platform Terpadu (Pilar Inti KADAI: POS, FIFO, BOM, KDS, Transfer) */}
      <CapabilityBentoGrid />

      {/* 4. Solusi Lintas Industri (3 Kolom Sektor Usaha) */}
      <IndustrySolutions />

      {/* 5. Pajak & Pembukuan Standar Keuangan RI */}
      <AccountingTaxSection />

      {/* 5.5 Perbandingan Head-to-Head: Kenapa Pindah dari Moka ke KADAI */}
      <CompetitorComparisonSection />

      {/* 6. Paket Langganan Komersial (4 Tier) */}
      <PricingSection />

      {/* 6.5 Kalkulator Interaktif Penyelamatan Biaya & Efisiensi (High-Converting Tool) */}
      <RoiCalculatorSection />

      {/* 7. Program Kemitraan & Referral Resmi KADAI */}
      <ReferralSection />

      {/* 8. Tanya Jawab (FAQ) */}
      <FAQSection />

      {/* 9. Final Conversion Banner */}
      <FinalCTA />

      {/* 10. Footer Resmi */}
      <SiteFooter />
      <FloatingWhatsApp />
    </div>
  );
}
