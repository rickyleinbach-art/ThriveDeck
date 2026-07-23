import { ScoreCard } from "@/components/charts/score-card";
import { Card } from "@/components/ui/card";
import { getAnalyticsData } from "@/lib/analytics/queries";
import { computeScores, weightInsights } from "@/lib/analytics/scores";
import { getProfile } from "@/lib/profile/queries";
import { getEntitlements } from "@/lib/subscription/queries";
import { AnalyticsExplorer } from "./explorer";

export const metadata = { title: "Analytics · ThriveDeck" };

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function AnalyticsPage() {
  const [data, profile, ent] = await Promise.all([
    getAnalyticsData(),
    getProfile(),
    getEntitlements(),
  ]);
  const scores = computeScores(data);
  const weight = weightInsights(data);

  const cards = [
    { label: "Wellness", ...scores.wellness },
    { label: "Nutrition", ...scores.nutrition },
    { label: "Fitness", ...scores.fitness },
    { label: "Consistency", ...scores.consistency },
    { label: "Recovery", ...scores.recovery },
    { label: "Health", ...scores.health },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Every tracked series, from daily detail to yearly trends. Weekly scores summarize the
          last 7 days.
        </p>
      </div>

      {/* Weekly scores */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <ScoreCard key={c.label} label={c.label} value={c.value} detail={c.detail} />
        ))}
      </div>

      {/* Weight outlook — trend, projection, goal progress */}
      {weight && (weight.changePerWeek !== null || weight.goalProgressPct !== null) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card title="Weekly weight change">
            <p className="text-xl font-semibold">
              {weight.changePerWeek === null
                ? "—"
                : `${weight.changePerWeek > 0 ? "+" : ""}${weight.changePerWeek.toFixed(2)} ${weight.unit}/wk`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {weight.projectedIn30Days !== null
                ? `~${weight.projectedIn30Days.toFixed(1)} ${weight.unit} projected in 30 days`
                : "Log more entries to project a trend"}
            </p>
          </Card>
          <Card title="Goal progress">
            <p className="text-xl font-semibold">
              {weight.goalProgressPct === null ? "—" : `${Math.round(weight.goalProgressPct)}%`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {weight.goalProgressPct === null
                ? "Set a weight goal to track progress"
                : "of the way to your weight goal"}
            </p>
          </Card>
          <Card title="Projected goal date">
            <p className="text-xl font-semibold">
              {weight.projectedGoalDate ? formatDate(weight.projectedGoalDate) : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {weight.projectedGoalDate
                ? "at your current pace"
                : "Not yet trending toward the goal"}
            </p>
          </Card>
        </div>
      )}

      <AnalyticsExplorer
        data={data}
        tracksPeptides={profile?.tracksPeptides ?? true}
        canExport={ent.has("analytics_export")}
        canFullRange={ent.has("analytics_full")}
      />
    </div>
  );
}
