"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import type { SessionUser } from "@/lib/session";

export function useSessionUser() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSessionUser() {
      try {
        const response = await apiFetch<{ data: SessionUser }>("/api/auth/session");
        if (!cancelled) {
          setUser(response.data);
          setError(null);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setUser(null);
          setError(caughtError instanceof ApiError ? caughtError : null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSessionUser();

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading, error };
}
