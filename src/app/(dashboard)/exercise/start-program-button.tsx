"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { startWorkout } from "@/lib/exercise/actions";

// One-click "follow along" start for a guided program (or any template).
export function StartProgramButton({
  templateId,
  disabled,
}: {
  templateId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleStart() {
    setError(null);
    setSubmitting(true);
    const result = await startWorkout({ templateId });
    if (!result.success) {
      setSubmitting(false);
      setError(result.error);
      return;
    }
    router.push(`/exercise/workout/${result.workoutId}`);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleStart}
        disabled={disabled || submitting}
      >
        {submitting ? "Starting…" : "Start"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
