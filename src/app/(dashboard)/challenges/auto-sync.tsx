"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { syncMyChallenges } from "@/lib/challenges/actions";

// On page load, recompute the current user's challenge standings from their
// latest logs and refresh only if something changed. Runs once per mount.
export function ChallengeAutoSync() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    syncMyChallenges().then((res) => {
      if (res.success && res.changed) router.refresh();
    });
  }, [router]);

  return null;
}
