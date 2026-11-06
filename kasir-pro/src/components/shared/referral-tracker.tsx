"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { saveReferralCode } from "@/lib/referral-client";

function ReferralTrackerContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      saveReferralCode(refCode);
    }
  }, [searchParams]);

  return null;
}

export function ReferralTracker() {
  return (
    <Suspense fallback={null}>
      <ReferralTrackerContent />
    </Suspense>
  );
}
