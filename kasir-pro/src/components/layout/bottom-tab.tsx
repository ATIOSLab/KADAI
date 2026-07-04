"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { bottomTabs, isActivePath } from "@/components/layout/navigation";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/session";

interface BottomTabProps {
  currentUser: SessionUser | null;
}

export function BottomTab({ currentUser }: BottomTabProps) {
  const pathname = usePathname();
  const visibleTabs = bottomTabs.filter(
    (tab) =>
      !tab.roles || (currentUser ? tab.roles.includes(currentUser.role) : false)
  );

  if (visibleTabs.length === 0) {
    return null;
  }

  return (
    <nav className="fixed inset-x-4 bottom-4 z-50 lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="rounded-[30px] border border-black/10 bg-white/88 p-2 shadow-[0_24px_48px_rgba(15,23,42,0.12)] backdrop-blur-xl">
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
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-primary to-accent-orange text-white shadow-[0_14px_28px_rgba(251,133,0,0.28)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold text-accent-primary">
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
                    ? "bg-accent-primary/10 text-accent-primary"
                    : "text-text-muted"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="text-[10px] font-bold">{tab.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
