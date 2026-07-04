"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function useLogout() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } finally {
        router.replace("/login");
        router.refresh();
      }
    });
  }

  return { logout, isPending };
}
