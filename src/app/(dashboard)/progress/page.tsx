import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { METRIC_LABELS } from "@/lib/validations/weight";
import {
  getBodyMetrics,
  getGoals,
  getProgressPhotosWithUrls,
} from "@/lib/weight/queries";
import type { BodyMetric, Goal } from "@/lib/weight/types";

function formatValue(value: number, unit: string) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface Milestone {
  date: string; // ISO
  title: string;
  detail: string;
  icon: string;
}

function latestOfType(metrics: BodyMetric[], type: string): BodyMetric | null {
  return metrics.find((m) => m.metricType === type) ?? null;
}

// Progress toward a goal, 0–100, using its start value (or the earliest logged
// reading) as the baseline. Works whether the target is above or below start.
function goalProgress(
  goal: Goal,
  current: number | null,
  fallbackStart: number | null
): number | null {
  const start = goal.startValue ?? fallbackStart;
  if (current === null || start === null) return null;
  const span = goal.targetValue - start;
  if (span === 0) return 100;
  const pct = ((current - start) / span) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export default async function ProgressPage() {
  const [photos, goals, metrics] = await Promise.all([
    getProgressPhotosWithUrls(),
    getGoals(),
    getBodyMetrics(),
  ]);

  const weightSeries = metrics.filter((m) => m.metricType === "WEIGHT");
  const earliestWeight = weightSeries[weightSeries.length - 1] ?? null;

  const activeGoals = goals.filter((g) => !g.achieved);
  const achievedGoals = goals.filter((g) => g.achieved && g.achievedAt);

  // Build a real, data-driven timeline: achieved goals, photo check-ins, and
  // the day tracking began. Newest first.
  const milestones: Milestone[] = [];
  for (const g of achievedGoals) {
    milestones.push({
      date: g.achievedAt!,
      title: `Reached ${METRIC_LABELS[g.metricType].toLowerCase()} goal`,
      detail: formatValue(g.targetValue, g.unit),
      icon: "🎯",
    });
  }
  for (const p of photos) {
    milestones.push({
      date: p.takenAt,
      title: "Progress photo",
      detail: p.weightKg != null ? formatValue(p.weightKg, "kg") : "Check-in",
      icon: "📸",
    });
  }
  if (earliestWeight) {
    milestones.push({
      date: earliestWeight.recordedAt,
      title: "Started tracking",
      detail: formatValue(earliestWeight.value, earliestWeight.unit),
      icon: "🚩",
    });
  }
  milestones.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
          <p className="mt-1 text-muted-foreground">
            Your photo journey and the milestones along the way.
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href="/weight" className="text-primary hover:underline">
            Add a photo
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link href="/analytics" className="text-primary hover:underline">
            Charts
          </Link>
        </div>
      </div>

      {activeGoals.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {activeGoals.map((goal) => {
            const current = latestOfType(metrics, goal.metricType);
            const pct = goalProgress(
              goal,
              current?.value ?? null,
              goal.metricType === "WEIGHT" ? earliestWeight?.value ?? null : null
            );
            return (
              <Card key={goal.id} title={`${METRIC_LABELS[goal.metricType]} goal`}>
                <p className="text-lg font-semibold">
                  {current ? formatValue(current.value, current.unit) : "—"}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    → {formatValue(goal.targetValue, goal.unit)}
                  </span>
                </p>
                {pct !== null && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
                {goal.targetDate && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Target by {formatDate(goal.targetDate)}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Progress photos" className="lg:col-span-2">
          {photos.length === 0 ? (
            <div className="flex flex-col items-start gap-2 py-4">
              <p className="text-sm text-muted-foreground">
                No progress photos yet. Photos are private to your account.
              </p>
              <Link href="/weight" className="text-sm text-primary hover:underline">
                Upload your first photo →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo) => (
                <div key={photo.id} className="space-y-1">
                  {photo.signedUrl ? (
                    <div className="relative aspect-square overflow-hidden rounded-lg border border-border">
                      <Image
                        src={photo.signedUrl}
                        alt={`Progress photo from ${photo.takenAt.slice(0, 10)}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-square items-center justify-center rounded-lg border border-border text-xs text-muted-foreground">
                      Unavailable
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {photo.takenAt.slice(0, 10)}
                    {photo.weightKg != null && ` · ${formatValue(photo.weightKg, "kg")}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Milestones">
          {milestones.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Milestones appear as you log weigh-ins, hit goals, and add photos.
            </p>
          ) : (
            <ol className="space-y-4">
              {milestones.map((m, i) => (
                <li key={`${m.date}-${i}`} className="flex gap-3">
                  <span className="text-lg leading-none">{m.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.detail} · {formatDate(m.date)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
