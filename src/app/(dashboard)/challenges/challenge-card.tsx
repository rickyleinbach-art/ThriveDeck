import { Users, CheckCircle2, Crown } from "lucide-react";
import type { ChallengeView } from "@/lib/challenges/types";
import { ChallengeIcon } from "./challenge-icon";
import { JoinButton } from "./join-button";
import { cn } from "@/lib/utils";

function formatValue(value: number, unit: string): string {
  const n = unit === "days" || unit === "workouts"
    ? Math.floor(value)
    : Math.round(value);
  // Singularize the count nouns so "1 workout" doesn't read "1 workouts".
  const label = n === 1 && (unit === "days" || unit === "workouts") ? unit.slice(0, -1) : unit;
  return `${n.toLocaleString()} ${label}`;
}

export function ChallengeCard({ view }: { view: ChallengeView }) {
  const { def, joined, progress, participantCount, leaderboard } = view;

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ChallengeIcon name={def.icon} className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold tracking-tight">{def.title}</h3>
            {progress?.completed && (
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" aria-label="Completed" />
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {def.category} · {def.durationDays} days ·{" "}
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {participantCount}
            </span>
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{def.blurb}</p>

      {/* Progress (joined only) */}
      {joined && progress && (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium">
              {formatValue(progress.value, def.unit)}{" "}
              <span className="text-muted-foreground">/ {def.target.toLocaleString()} {def.unit}</span>
            </span>
            <span className="text-muted-foreground">
              {progress.completed
                ? "Complete 🎉"
                : `${progress.daysLeft} day${progress.daysLeft === 1 ? "" : "s"} left`}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                progress.completed ? "bg-[hsl(var(--success))]" : "bg-primary"
              )}
              style={{ width: `${progress.pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="mt-4 space-y-1.5 rounded-xl bg-muted/40 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Crown className="h-3.5 w-3.5" /> Leaderboard
          </p>
          {leaderboard.map((e) => (
            <div
              key={`${e.rank}-${e.displayName}`}
              className={cn(
                "flex items-center justify-between rounded-lg px-2 py-1 text-sm",
                e.isMe && "bg-primary/10 font-medium"
              )}
            >
              <span className="flex items-center gap-2 truncate">
                <span className="w-4 text-right text-xs text-muted-foreground">{e.rank}</span>
                <span className="truncate">{e.displayName}{e.isMe ? " (you)" : ""}</span>
                {e.completed && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--success))]" />}
              </span>
              <span className="text-xs text-muted-foreground">{e.progressPct}%</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <JoinButton challengeKey={def.key} joined={joined} />
      </div>
    </article>
  );
}
