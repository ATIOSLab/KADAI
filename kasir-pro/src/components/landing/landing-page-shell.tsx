import React from "react";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { Badge } from "@/components/ui/badge";

interface LandingPageShellProps {
  badgeText?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "max-w-4xl" | "max-w-6xl" | "max-w-7xl";
}

export function LandingPageShell({
  badgeText,
  title,
  description,
  children,
  maxWidth = "max-w-7xl",
}: LandingPageShellProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased selection:bg-orange-500/20 selection:text-orange-900">
      <SiteHeader dashboardPath={null} />

      <main className={`flex-1 w-full ${maxWidth} mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12 sm:pb-16 space-y-16 overflow-hidden`}>
        {/* Standardized Editorial Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          {badgeText && (
            <Badge
              variant="outline"
              className="px-3.5 py-1 text-xs font-semibold rounded-lg border-primary/30 text-primary bg-primary/5 whitespace-nowrap"
            >
              {badgeText}
            </Badge>
          )}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed text-balance">
              {description}
            </p>
          )}
        </div>

        {/* Page Main Content Area */}
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
