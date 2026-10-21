import { cn } from "@/lib/utils";
import {
  TIER_LABELS,
  TIER_SOURCE_LABELS,
  type ReferenceTier,
} from "@/lib/peptides/reference";

// Evidence level is the most important thing on any reference entry, so it
// gets a consistent colour everywhere it appears: emerald for a regulator-
// cleared label, amber for human trials, neutral for animal/lab work.
export const TIER_CHIP_CLASSES: Record<ReferenceTier, string> = {
  approved: "border-primary/40 bg-primary/10 text-primary",
  trial:
    "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  research: "border-border bg-muted text-muted-foreground",
};

export const TIER_DOT_CLASSES: Record<ReferenceTier, string> = {
  approved: "bg-primary",
  trial: "bg-amber-500",
  research: "bg-muted-foreground/60",
};

export function TierBadge({
  tier,
  /** Show where a documented dose came from rather than the evidence level. */
  source = false,
  className,
}: {
  tier: ReferenceTier;
  source?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        TIER_CHIP_CLASSES[tier],
        className
      )}
    >
      {source ? TIER_SOURCE_LABELS[tier] : TIER_LABELS[tier]}
    </span>
  );
}
