"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LogOut,
  Menu,
  PanelLeft,
  Search,
  Settings,
  ShoppingCart,
  Store,
  User,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NotificationMenu } from "@/components/layout/notification-menu";
import { KadaiWordmark } from "@/components/shared/kadai-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { navigationSections, isActivePath } from "@/components/layout/navigation";
import { useLogout } from "@/hooks/use-logout";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/session";

interface NavbarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  currentUser: SessionUser | null;
}

export function Navbar({
  sidebarCollapsed,
  onToggleSidebar,
  currentUser,
}: NavbarProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { logout, isPending } = useLogout();
  const todayLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const initials =
    currentUser?.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "US";
  const roleLabelMap: Record<string, string> = {
    ADMIN: "Owner (Admin)",
    MANAGER: "Manager Cabang",
    CASHIER: "Kasir POS",
    KITCHEN: "Dapur & Bar (KDS)",
    INVENTORY: "Staf Gudang",
    ACCOUNTANT: "Akuntan SAK EMKM",
  };
  const roleLabel = currentUser?.role ? roleLabelMap[currentUser.role] || currentUser.role : "Kasir";
  const canAccessSettings = currentUser?.role === "ADMIN";
  const canAccessPos =
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "MANAGER" ||
    currentUser?.role === "CASHIER";

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

  return (
    <>
      <header className="z-40 h-14 shrink-0 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-full items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-muted lg:hidden"
              aria-label="Buka menu navigasi"
            >
              <Menu className="size-5" />
            </button>

            {/* Desktop Collapse Button */}
            <button
              type="button"
              onClick={onToggleSidebar}
              className="hidden size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:inline-flex"
              aria-label={sidebarCollapsed ? "Buka navigasi" : "Ciutkan navigasi"}
            >
              <PanelLeft className="size-4" />
            </button>
            <div className="hidden h-4 w-px bg-border lg:block" />
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari transaksi, menu, persediaan..."
                className="h-9 rounded-md border-border bg-card pl-9 text-xs shadow-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground lg:flex">
              <CalendarDays className="size-3.5 text-primary" />
              <span>{todayLabel}</span>
            </div>

            <NotificationMenu currentUser={currentUser} />

            {canAccessPos && (
              <Button
                variant="outline"
                size="icon"
                asChild
                className="hidden rounded-lg sm:inline-flex size-9"
              >
                <Link href="/pos" aria-label="Buka terminal kasir">
                  <ShoppingCart className="size-4" />
                </Link>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg border border-border bg-card p-1 sm:pl-1.5 sm:pr-2.5 transition-colors hover:bg-muted">
                  <Avatar className="size-8">
                    <AvatarFallback className="text-xs font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left md:block">
                    <p className="text-xs font-bold leading-tight text-foreground">
                      {currentUser?.name ?? "Pengguna"}
                    </p>
                    <p className="text-[10px] font-medium text-muted-foreground">
                      {roleLabel}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 size-4" />
                    Profil
                  </Link>
                </DropdownMenuItem>
                {canAccessSettings && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 size-4" />
                        Pengaturan Sistem
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  disabled={isPending}
                  onSelect={(event) => {
                    event.preventDefault();
                    logout();
                  }}
                >
                  <LogOut className="mr-2 size-4" />
                  {isPending ? "Keluar..." : "Keluar"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-card shadow-2xl border-r border-border">
            {/* Drawer Header */}
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-slate-950 p-1">
                  <svg viewBox="0 0 512 512" fill="none" className="size-full">
                    <defs>
                      <linearGradient id="nb-ga" x1="0" y1="1" x2="1" y2="0">
                        <stop offset="0%" stopColor="#EA580C" />
                        <stop offset="100%" stopColor="#FB923C" />
                      </linearGradient>
                      <linearGradient id="nb-gl" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#EA580C" />
                      </linearGradient>
                      <linearGradient id="nb-gs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="100%" stopColor="#E2E8F0" />
                      </linearGradient>
                    </defs>
                    <rect x="120" y="78" width="60" height="356" rx="30" fill="url(#nb-gs)" />
                    <path d="M212 256L350 114" stroke="url(#nb-ga)" strokeWidth="60" strokeLinecap="round" fill="none" />
                    <path d="M212 256A150 150 0 0 1 362 406" stroke="url(#nb-gl)" strokeWidth="60" strokeLinecap="round" fill="none" />
                    <circle cx="408" cy="150" r="22" fill="#F59E0B" />
                  </svg>
                </span>
                <div>
                  <KadaiWordmark size="text-base" />
                  <span className="text-[8px] font-bold text-muted-foreground uppercase block -mt-0.5 tracking-[0.16em] font-sans">
                    {roleLabel}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Tutup navigasi"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Navigation Sections */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {visibleSections.map((section) => (
                <div key={section.label} className="space-y-1.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                    {section.label}
                  </h4>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const active = isActivePath(pathname, item.href);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileNavOpen(false)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors",
                            active
                              ? "bg-primary text-primary-foreground font-bold shadow-sm"
                              : "text-slate-600 hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <Icon className="size-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-border flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-800 truncate">
                {currentUser?.name || "Staf"}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-destructive hover:text-destructive h-8 px-2"
                onClick={() => {
                  setMobileNavOpen(false);
                  logout();
                }}
              >
                <LogOut className="size-3.5 mr-1" /> Keluar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
