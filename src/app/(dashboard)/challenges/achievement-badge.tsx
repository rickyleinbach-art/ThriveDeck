import { Lock } from "lucide-react";
import type { Achievement } from "@/lib/challenges/gamification";
import { ChallengeIcon } from "./challenge-icon";
import { cn } from "@/lib/utils";

export function AchievementBadge({ achievement: a }: { achievement: Achievement }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center",
        a.unlocked
          ? "border-primary/40 bg-primary/5"
          : "border-dashed border-border bg-card opacity-70"
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full",
          a.unlocked ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        {a.unlocked ? (
          <ChallengeIcon name={a.icon} className="h-5 w-5" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
      </div>
      <div>
        <p className="text-xs font-semibold">{a.title}</p>
        <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{a.description}</p>
      </div>
    </div>
  );
}
