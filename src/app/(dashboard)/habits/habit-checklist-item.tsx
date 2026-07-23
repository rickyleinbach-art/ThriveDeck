"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { logHabit, removeHabitLog } from "@/lib/habits/actions";
import type { Habit } from "@/lib/habits/types";
import { RATING_MAX, RATING_MIN } from "@/lib/validations/habit";

// One row of the Today checklist. Checks toggle; quantities/durations
// save an amount against the target; ratings save a 1–10 score.
export function HabitChecklistItem({
  habit,
  todayValue,
  done,
  today,
}: {
  habit: Habit;
  todayValue: number | null;
  done: boolean;
  today: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(todayValue?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Optimistic check state: flips instantly on tap, reconciles with the server
  // refresh, and reverts if the write fails.
  const [optimisticDone, setOptimisticDone] = useState(done);
  useEffect(() => setOptimisticDone(done), [done]);

  async function save(value: number) {
    setError(null);
    setBusy(true);
    const result = await logHabit({ habitId: habit.id, loggedOn: today, value });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function toggleCheck() {
    setError(null);
    const next = !optimisticDone;
    setOptimisticDone(next); // optimistic flip
    setBusy(true);
    const result = next
      ? await logHabit({ habitId: habit.id, loggedOn: today, value: 1 })
      : await removeHabitLog(habit.id, today);
    setBusy(false);
    if (!result.success) {
      setOptimisticDone(!next); // revert
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition",
        optimisticDone ? "border-primary/40 bg-primary/5" : "border-border"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("truncate text-sm font-medium", optimisticDone && "text-primary")}>
            {habit.name}
          </p>
          {habit.goalType === "QUANTITY" || habit.goalType === "DURATION" ? (
            <p className="text-xs text-muted-foreground">
              {todayValue ?? 0}
              {habit.targetValue ? ` / ${habit.targetValue}` : ""}
              {habit.unit ? ` ${habit.unit}` : ""}
            </p>
          ) : habit.goalType === "RATING" && todayValue !== null ? (
            <p className="text-xs text-muted-foreground">Rated {todayValue}/10</p>
          ) : null}
        </div>

        {habit.goalType === "CHECK" ? (
          <Button
            type="button"
            variant={optimisticDone ? "default" : "outline"}
            size="sm"
            disabled={busy}
            onClick={toggleCheck}
            aria-pressed={optimisticDone}
          >
            {optimisticDone ? (
              <span className="inline-flex items-center gap-1">
                Done <Icon icon={Check} size="sm" />
              </span>
            ) : (
              "Mark done"
            )}
          </Button>
        ) : habit.goalType === "RATING" ? null : (
          <form
            className="flex shrink-0 items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const value = Number(amount);
              if (!amount || Number.isNaN(value) || value < 0) {
                setError("Enter an amount");
                return;
              }
              save(value);
            }}
          >
            <Input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-24"
              aria-label={`${habit.name} amount`}
            />
            <Button type="submit" variant="outline" size="sm" disabled={busy}>
              Save
            </Button>
          </form>
        )}
      </div>

      {habit.goalType === "RATING" && (
        <div className="mt-2 flex flex-wrap gap-1">
          {Array.from({ length: RATING_MAX - RATING_MIN + 1 }, (_, i) => RATING_MIN + i).map(
            (score) => (
              <button
                key={score}
                type="button"
                disabled={busy}
                onClick={() => save(score)}
                className={cn(
                  "h-7 w-7 rounded-md border text-xs font-medium transition",
                  todayValue === score
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-accent"
                )}
                aria-label={`Rate ${score}`}
              >
                {score}
              </button>
            )
          )}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
