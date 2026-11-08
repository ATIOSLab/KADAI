"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiFetch, ApiError } from "@/lib/api";
import {
  formatActivityAction,
  formatActivityDescription,
  formatActivityRelativeTime,
} from "@/lib/activity-log-presenter";
import type { SessionUser } from "@/lib/session";

interface NotificationMenuProps {
  currentUser: SessionUser | null;
}

interface NotificationLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string } | null;
}

interface NotificationResponse {
  data: NotificationLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function getStorageKey(userId: string) {
  return `kasir-pro:notifications:last-read:${userId}`;
}

export function NotificationMenu({
  currentUser,
}: NotificationMenuProps) {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);

  const canViewAll = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";

  useEffect(() => {
    if (!currentUser?.id) {
      setLastReadAt(null);
      return;
    }

    const storedValue = window.localStorage.getItem(getStorageKey(currentUser.id));
    setLastReadAt(storedValue);
  }, [currentUser?.id]);

  const fetchNotifications = useCallback(
    async (showLoader = false) => {
      if (!currentUser) {
        setLogs([]);
        setLoading(false);
        return;
      }

      if (showLoader) {
        setLoading(true);
      }

      try {
        const response = await apiFetch<NotificationResponse>(
          "/api/activity-log?page=1&limit=5"
        );
        setLogs(response.data);
        setError(null);
      } catch (caughtError) {
        const message =
          caughtError instanceof ApiError
            ? caughtError.message
            : "Gagal memuat notifikasi";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [currentUser]
  );

  useEffect(() => {
    void fetchNotifications(true);

    if (!currentUser) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void fetchNotifications(false);
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [currentUser, fetchNotifications]);

  const unreadCount = useMemo(() => {
    if (!lastReadAt) {
      return logs.length;
    }

    const lastReadTime = new Date(lastReadAt).getTime();
    return logs.filter((log) => new Date(log.createdAt).getTime() > lastReadTime).length;
  }, [lastReadAt, logs]);

  const visibleLogs = useMemo(() => {
    if (!lastReadAt) {
      return logs;
    }

    const lastReadTime = new Date(lastReadAt).getTime();
    return logs.filter((log) => new Date(log.createdAt).getTime() > lastReadTime);
  }, [lastReadAt, logs]);

  const markAllAsRead = useCallback(() => {
    if (!currentUser?.id) {
      return;
    }

    const latestTimestamp = logs[0]?.createdAt ?? new Date().toISOString();
    window.localStorage.setItem(getStorageKey(currentUser.id), latestTimestamp);
    setLastReadAt(latestTimestamp);
  }, [currentUser?.id, logs]);

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          void fetchNotifications(true);
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-muted"
          aria-label="Buka notifikasi"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-w-4 h-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[24rem] max-w-[92vw] overflow-hidden p-0"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border-default px-4 py-4">
          <div>
            <p className="text-xl font-extrabold text-text-primary">Notifikasi</p>
            <p className="text-sm text-text-muted">
              {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Tidak ada notifikasi baru"}
            </p>
          </div>
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-bold text-text-primary transition-colors hover:bg-bg-main disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            Tandai semua
          </button>
        </div>

        <div className="max-h-[22rem] overflow-y-auto">
          {loading ? (
            <div className="space-y-0">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`notification-skeleton-${index}`}
                  className="border-b border-border-default px-4 py-4"
                >
                  <Skeleton className="mb-2 h-4 w-36" />
                  <Skeleton className="mb-2 h-3 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="px-4 py-8 text-center">
              <p className="font-bold text-text-primary">Notifikasi belum tersedia</p>
              <p className="mt-1 text-sm text-text-muted">{error}</p>
            </div>
          ) : visibleLogs.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="font-bold text-text-primary">Tidak ada notifikasi baru</p>
              <p className="mt-1 text-sm text-text-muted">
                Semua notifikasi sudah ditandai dibaca.
              </p>
            </div>
          ) : (
            visibleLogs.map((log) => {
              const description = formatActivityDescription(log);

              return (
                <div
                  key={log.id}
                  className="border-b border-border-default px-4 py-4 last:border-b-0"
                >
                  <div className="flex gap-3">
                    <span className="mt-2 flex h-2 w-2 shrink-0 items-center justify-center">
                      <span className="size-2 rounded-full bg-text-primary" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="line-clamp-2 text-sm font-extrabold text-text-primary">
                          {formatActivityAction(log.action)}
                        </p>
                        <span className="shrink-0 text-xs text-text-muted">
                          {formatActivityRelativeTime(log.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-text-secondary">
                        {description
                          ? `${log.user?.name ?? "Sistem"} • ${description}`
                          : (log.user?.name ?? "Sistem")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-border-default px-4 py-3 text-center">
          {canViewAll ? (
            <Link
              href="/activity-log"
              className="text-sm font-bold text-text-primary transition-opacity hover:opacity-70"
            >
              Lihat semua notifikasi
            </Link>
          ) : (
            <p className="text-sm font-bold text-text-primary">
              Aktivitas terbaru Anda
            </p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
