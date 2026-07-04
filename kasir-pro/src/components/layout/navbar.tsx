"use client";

import Link from "next/link";
import {
  CalendarDays,
  LogOut,
  PanelLeft,
  Search,
  Settings,
  ShoppingCart,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NotificationMenu } from "@/components/layout/notification-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useLogout } from "@/hooks/use-logout";
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
  const roleLabel =
    currentUser?.role === "ADMIN"
      ? "Administrator"
      : currentUser?.role === "MANAGER"
        ? "Manager"
        : "Kasir";
  const canAccessSettings = currentUser?.role === "ADMIN";
  const canAccessPos =
    currentUser?.role === "ADMIN" || currentUser?.role === "CASHIER";

  return (
    <header className="z-40 h-14 shrink-0 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex h-full items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Cari produk, transaksi, atau menu..."
              className="h-9 rounded-md border-border bg-card pl-9 text-sm shadow-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-2 text-xs font-semibold text-text-secondary lg:flex">
            <CalendarDays className="h-4 w-4 text-accent-primary" />
            <span>{todayLabel}</span>
          </div>

          <NotificationMenu currentUser={currentUser} />

          {canAccessPos && (
            <Button
              variant="outline"
              size="icon"
              asChild
              className="hidden rounded-2xl sm:inline-flex"
            >
              <Link href="/pos" aria-label="Buka halaman kasir">
                <ShoppingCart className="h-4 w-4" />
              </Link>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/75 p-1.5 pl-1.5 pr-3 transition-colors hover:bg-white">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-bold leading-tight">
                    {currentUser?.name ?? "Pengguna"}
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
                    {roleLabel}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </Link>
                </DropdownMenuItem>
                {canAccessSettings && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Pengaturan
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
              </>
              <DropdownMenuItem
                className="cursor-pointer text-accent-danger focus:text-accent-danger"
                disabled={isPending}
                onSelect={(event) => {
                  event.preventDefault();
                  logout();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isPending ? "Keluar..." : "Keluar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
