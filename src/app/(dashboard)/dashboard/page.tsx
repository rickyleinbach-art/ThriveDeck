import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Sparkline } from "@/components/ui/sparkline";
import { ScoreCard } from "@/components/charts/score-card";
import { getBodyMetrics } from "@/lib/weight/queries";
import { getAnalyticsData } from "@/lib/analytics/queries";
import { computeScores } from "@/lib/analytics/scores";

// Dashboard shell. Each card is a slot to be wired up as its module is built.
// PRD § Dashboard lists the full set; these are the MVP-relevant ones first.
// "Weight trend" and "Body fat trend" are wired to real data (Weight module);
// the rest stay placeholders until their module lands.
const SLOTS = [
  { title: "Today's calories", note: "Nutrition module" },
  { title: "Protein remaining", note: "Nutrition module" },
  { title: "Water remaining", note: "Habits module" },
  { title: "Today's workout", note: "Exercise module" },
  { title: "Steps", note: "Habits module" },
  { title: "Weight trend", note: "Weight module" },
  { title: "Body fat trend", note: "Weight module" },
  { title: "Next peptide reminder", note: "Peptides module" },
  { title: "Today's habits", note: "Habits module" },
  { title: "Sleep score", note: "Habits module" },
  { title: "Recovery score", note: "Analytics module" },
  { title: "Weekly streak", note: "Gamification module" },
];

function formatValue(value: number, unit: string) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit}`;
}

export default async function DashboardPage() {
  const [weightEntries, bodyFatEntries, analytics] = await Promise.all([
    getBodyMetrics({ metricType: "WEIGHT", limit: 14 }),
    getBodyMetrics({ metricType: "BODY_FAT", limit: 14 }),
    getAnalyticsData(),
  ]);
  const scores = computeScores(analytics);
  const scoreCards = [
    { label: "Wellness", ...scores.wellness },
    { label: "Nutrition", ...scores.nutrition },
    { label: "Fitness", ...scores.fitness },
    { label: "Consistency", ...scores.consistency },
    { label: "Recovery", ...scores.recovery },
  ];

  const weightSpark = weightEntries
    .slice()
    .reverse()
    .map((e) => ({ value: e.value }));
  const bodyFatSpark = bodyFatEntries
    .slice()
    .reverse()
    .map((e) => ({ value: e.value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          What should I do today?
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your day at a glance. Cards fill in as you connect each part of your
          routine.
        </p>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            This week
          </h2>
          <Link href="/analytics" className="text-sm text-primary hover:underline">
            View analytics
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {scoreCards.map((c) => (
            <ScoreCard
              key={c.label}
              label={c.label}
              value={c.value}
              detail={c.detail}
              href="/analytics"
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SLOTS.map((slot) => {
          if (slot.title === "Weight trend") {
            return (
              <Link key={slot.title} href="/weight/trend">
                <Card title={slot.title}>
                  {weightEntries.length > 0 ? (
                    <div>
                      <p className="text-lg font-semibold">
                        {formatValue(weightEntries[0].value, weightEntries[0].unit)}
                      </p>
                      <Sparkline data={weightSpark} />
                    </div>
                  ) : (
                    <div className="flex h-16 items-center text-sm text-muted-foreground/70">
                      Log your first weigh-in
                    </div>
                  )}
                </Card>
              </Link>
            );
          }

          if (slot.title === "Body fat trend") {
            return (
              <Link key={slot.title} href="/weight/trend">
                <Card title={slot.title}>
                  {bodyFatEntries.length > 0 ? (
                    <div>
                      <p className="text-lg font-semibold">
                        {formatValue(bodyFatEntries[0].value, bodyFatEntries[0].unit)}
                      </p>
                      <Sparkline data={bodyFatSpark} />
                    </div>
                  ) : (
                    <div className="flex h-16 items-center text-sm text-muted-foreground/70">
                      Log a body-fat reading
                    </div>
                  )}
                </Card>
              </Link>
            );
          }

          return (
            <Card key={slot.title} title={slot.title}>
              <div className="flex h-16 items-center text-sm text-muted-foreground/70">
                Coming with the {slot.note}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
