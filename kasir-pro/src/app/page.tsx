import { getServerSessionUser } from "@/lib/session";
import { getDefaultPathForRole } from "@/lib/rbac";
import { SiteHeader } from "@/components/landing/site-header";
import { HeroSection } from "@/components/landing/hero-section";
import { CapabilityBentoGrid } from "@/components/landing/capability-bento-grid";
import { IndustrySolutions } from "@/components/landing/industry-solutions";
import { AccountingTaxSection } from "@/components/landing/accounting-tax-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { ReferralSection } from "@/components/landing/referral-section";
import { FAQSection, FAQS } from "@/components/landing/faq-section";
import { FinalCTA } from "@/components/landing/final-cta";
import { SiteFooter } from "@/components/landing/site-footer";
import { FloatingWhatsApp } from "@/components/shared/floating-whatsapp";

export default async function HomePage() {
  const sessionUser = await getServerSessionUser();
  const dashboardPath = sessionUser ? getDefaultPathForRole(sessionUser.role) : null;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((item) => ({
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

      {/* 3. Kapabilitas Platform Terpadu (Pilar Inti KADAI: POS, FIFO, BOM, KDS, Transfer) */}
      <CapabilityBentoGrid />

      {/* 4. Solusi Lintas Industri (3 Kolom Sektor Usaha) */}
      <IndustrySolutions />

      {/* 5. Pajak & Pembukuan Standar Keuangan RI */}
      <AccountingTaxSection />

      {/* 6. Paket Langganan Komersial (4 Tier) */}
      <PricingSection />

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
