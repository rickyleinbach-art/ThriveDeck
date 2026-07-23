import { Skeleton, StatTileSkeleton } from "@/components/ui/skeleton";

export default function NutritionLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatTileSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-24 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
