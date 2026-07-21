"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { joinChallenge, leaveChallenge } from "@/lib/challenges/actions";

export function JoinButton({ challengeKey, joined }: { challengeKey: string; joined: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function act() {
    setError(null);
    startTransition(async () => {
      const res = joined
        ? await leaveChallenge({ challengeKey })
        : await joinChallenge({ challengeKey });
      if (!res.success) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <Button
        type="button"
        size="sm"
        variant={joined ? "outline" : "default"}
        onClick={act}
        disabled={pending}
      >
        {pending ? "…" : joined ? "Leave" : "Join challenge"}
      </Button>
    </div>
  );
}
