import { getServerSessionUser } from "@/lib/session";
import { getDefaultPathForRole } from "@/lib/rbac";
import { SiteHeader } from "@/components/landing/site-header";
import { HeroSection } from "@/components/landing/hero-section";
import { CapabilityBentoGrid } from "@/components/landing/capability-bento-grid";
import { IndustrySolutions } from "@/components/landing/industry-solutions";
import { WorkflowSection } from "@/components/landing/workflow-section";
import { AccountingTaxSection } from "@/components/landing/accounting-tax-section";
import { EnterpriseSection } from "@/components/landing/enterprise-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { FAQSection } from "@/components/landing/faq-section";
import { FinalCTA } from "@/components/landing/final-cta";
import { SiteFooter } from "@/components/landing/site-footer";

export default async function HomePage() {
  const sessionUser = await getServerSessionUser();
  const dashboardPath = sessionUser ? getDefaultPathForRole(sessionUser.role) : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B1220] flex flex-col overflow-x-hidden w-full font-sans selection:bg-primary/20">
      {/* 1. Floating Sticky Glass Navigation */}
      <SiteHeader dashboardPath={dashboardPath} />

      {/* 2. Hero Section with Atmospheric Ambient Glow & Master Product Showcase */}
      <HeroSection dashboardPath={dashboardPath} />

      {/* Live Operational Ticker */}
      <div className="border-y border-slate-200/80 bg-slate-900 text-slate-300 py-3 px-4 text-xs font-mono">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-white">Standar Operasi Platform:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-[11px]">
            <div>Transisi Kasir POS: <strong className="text-emerald-400">&lt; 0.2s</strong></div>
            <div>Metode Persediaan: <strong className="text-white">FIFO SAK EMKM</strong></div>
            <div>Pajak Terintegrasi: <strong className="text-white">PB1 10% & PPN 11%</strong></div>
            <div>Otorisasi Sensitif: <strong className="text-white">Supervisor PIN</strong></div>
            <div>Infrastruktur: <strong className="text-emerald-400">Cloudflare Edge</strong></div>
          </div>
        </div>
      </div>

      {/* 3. Product Capabilities — Premium Bento Grid */}
      <CapabilityBentoGrid />

      {/* 4. Industry Solutions */}
      <IndustrySolutions />

      {/* 5. How KADAI Works — Workflow Architecture */}
      <WorkflowSection />

      {/* 6. Accounting & Indonesian Tax Capabilities */}
      <AccountingTaxSection />

      {/* 7. Enterprise Readiness (Contrasting Dark Navy Section) */}
      <EnterpriseSection />

      {/* 8. Commercial Pricing Section (Preserved Verified Entitlements) */}
      <PricingSection />

      {/* 9. FAQ Accordion Section */}
      <FAQSection />

      {/* 10. Final Conversion Section */}
      <FinalCTA />

      {/* 11. Corporate Footer */}
      <SiteFooter />
    </div>
  );
}
