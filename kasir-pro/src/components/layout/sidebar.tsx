"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Store, UserRound } from "lucide-react";
import { isActivePath, navigationSections } from "@/components/layout/navigation";
import { getDefaultPathForRole } from "@/lib/rbac";
import { useLogout } from "@/hooks/use-logout";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/session";
import { KadaiWordmark } from "@/components/shared/kadai-logo";

interface SidebarProps {
  collapsed: boolean;
  currentUser: SessionUser | null;
}

export function Sidebar({ collapsed, currentUser }: SidebarProps) {
  const pathname = usePathname();
  const { logout, isPending } = useLogout();
  const visibleSections = navigationSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          !item.roles ||
          (currentUser ? item.roles.includes(currentUser.role) : false)
      ),
    }))
    .filter((section) => section.items.length > 0);
  const roleLabelMap: Record<string, string> = {
    ADMIN: "Owner (Admin)",
    MANAGER: "Manager Cabang",
    CASHIER: "Kasir POS",
    KITCHEN: "Dapur & Bar (KDS)",
    INVENTORY: "Staf Gudang",
    ACCOUNTANT: "Akuntan SAK EMKM",
  };
  const roleLabel = currentUser?.role ? roleLabelMap[currentUser.role] || currentUser.role : "Kasir";
  const homeHref = getDefaultPathForRole(currentUser?.role);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 border-r border-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex",
        collapsed ? "w-16" : "w-64"
      )}
      data-collapsed={collapsed}
    >
      <div className="flex h-full w-full flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-border px-3">
          <Link
            href={homeHref}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2",
              collapsed && "justify-center"
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 p-1">
              <svg viewBox="0 0 512 512" fill="none" className="size-full">
                <defs>
                  <linearGradient id="sb-ga" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0%" stopColor="#EA580C" />
                    <stop offset="100%" stopColor="#FB923C" />
                  </linearGradient>
                  <linearGradient id="sb-gl" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#EA580C" />
                  </linearGradient>
                  <linearGradient id="sb-gs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#E2E8F0" />
                  </linearGradient>
                </defs>
                <rect x="120" y="78" width="60" height="356" rx="30" fill="url(#sb-gs)" />
                <path d="M212 256L350 114" stroke="url(#sb-ga)" strokeWidth="60" strokeLinecap="round" fill="none" />
                <path d="M212 256A150 150 0 0 1 362 406" stroke="url(#sb-gl)" strokeWidth="60" strokeLinecap="round" fill="none" />
                <circle cx="408" cy="150" r="22" fill="#F59E0B" />
              </svg>
            </span>
            {!collapsed && (
              <span className="min-w-0">
                <KadaiWordmark size="text-base" />
                <span className="block truncate text-[8px] font-bold text-muted-foreground uppercase tracking-[0.16em] font-sans">
                  SISTEM OPERASI BISNIS
                </span>
              </span>
            )}
          </Link>
        </div>

        <nav className="neo-scrollbar flex-1 overflow-y-auto px-2 py-3">
          <div className="space-y-4">
            {visibleSections.map((section) => (
              <div key={section.label} className="space-y-1.5">
                {!collapsed && (
                  <p className="px-2 text-xs font-medium text-muted-foreground">
                    {section.label}
                  </p>
                )}

                {section.items.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex h-9 items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        collapsed && "justify-center"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-border p-2">
          <div
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-2",
              collapsed && "justify-center"
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-accent">
              <UserRound className="size-4" />
            </span>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {currentUser?.name ?? "Pengguna"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {roleLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  disabled={isPending}
                  className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  aria-label={isPending ? "Sedang keluar" : "Keluar"}
                >
                  <LogOut className="size-4" />
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </aside>
  );
}
