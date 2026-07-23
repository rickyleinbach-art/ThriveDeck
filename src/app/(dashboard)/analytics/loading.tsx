import { Skeleton, StatTileSkeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <StatTileSkeleton key={i} />
        ))}
      </div>
      {/* Chart placeholders */}
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-56 w-full" />
        </div>
      ))}
    </div>
  );
}
