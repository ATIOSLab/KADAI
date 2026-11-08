"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getBottomTabsForRole, isActivePath } from "@/components/layout/navigation";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/session";

interface BottomTabProps {
  currentUser: SessionUser | null;
}

export function BottomTab({ currentUser }: BottomTabProps) {
  const pathname = usePathname();

  // Suppress floating bottom tab on dedicated fullscreen workstations (KDS & POS)
  if (pathname.startsWith("/kds") || pathname.startsWith("/pos")) {
    return null;
  }

  const visibleTabs = getBottomTabsForRole(currentUser?.role);

  if (visibleTabs.length === 0) {
    return null;
  }

  return (
    <nav className="fixed inset-x-4 bottom-4 z-50 lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="rounded-[28px] border border-border/80 bg-card/95 p-2 shadow-2xl backdrop-blur-xl">
        <div
          className="grid items-center gap-1"
          style={{
            gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))`,
          }}
        >
          {visibleTabs.map((tab) => {
            const isActive = isActivePath(pathname, tab.href);
            const Icon = tab.icon;

            if (tab.href === "/pos") {
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="flex flex-col items-center gap-1 py-1"
                >
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-2xl transition-all",
                      isActive
                        ? "bg-primary text-white shadow-md shadow-primary/25 ring-2 ring-primary/20 scale-105"
                        : "bg-primary/90 text-white shadow-xs hover:bg-primary"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={cn(
                      "text-[10px]",
                      isActive ? "font-bold text-primary" : "font-medium text-muted-foreground"
                    )}
                  >
                    {tab.shortLabel}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="text-[10px] font-semibold">{tab.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
