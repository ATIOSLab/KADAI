"use client";

import { useState } from "react";
import { BottomTab } from "@/components/layout/bottom-tab";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useSessionUser } from "@/hooks/use-session-user";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useSessionUser();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={sidebarCollapsed} currentUser={user} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Navbar
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
          currentUser={user}
        />
        <main className="neo-scrollbar flex-1 overflow-auto p-4 pb-[calc(7rem+env(safe-area-inset-bottom))] lg:p-6">
          {children}
        </main>
      </div>
      <BottomTab currentUser={user} />
    </div>
  );
}
