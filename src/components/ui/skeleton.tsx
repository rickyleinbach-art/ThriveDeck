import { cn } from "@/lib/utils";

// Lightweight placeholder block for loading states. Uses the muted token so it
// reads correctly in both light and dark themes.
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-muted", className)}
      aria-hidden="true"
    />
  );
}

// A stat-tile-shaped skeleton, matching the summary cards used across modules.
export function StatTileSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-7 w-16" />
    </div>
  );
}
