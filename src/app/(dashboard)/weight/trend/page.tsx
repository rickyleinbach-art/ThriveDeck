import { Card } from "@/components/ui/card";
import { projectedGoalDate } from "@/lib/weight/calculations";
import { getBodyMetrics, getGoalForMetric } from "@/lib/weight/queries";
import { TrendChart } from "./trend-chart";

export default async function WeightTrendPage() {
  const [weightEntries, bodyFatEntries, weightGoal] = await Promise.all([
    getBodyMetrics({ metricType: "WEIGHT", limit: 365 }),
    getBodyMetrics({ metricType: "BODY_FAT", limit: 365 }),
    getGoalForMetric("WEIGHT"),
  ]);

  const projected = weightGoal
    ? projectedGoalDate(
        weightEntries.map((e) => ({ recordedAt: e.recordedAt, value: e.value })),
        weightGoal.targetValue
      )
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Trends</h1>
        <p className="mt-1 text-muted-foreground">
          Body-composition timeline, from daily entries to monthly averages.
        </p>
      </div>

      <Card title="Weight">
        <TrendChart
          unit={weightEntries[0]?.unit ?? "kg"}
          points={weightEntries.map((e) => ({ recordedAt: e.recordedAt, value: e.value }))}
          goalValue={weightGoal?.targetValue}
        />
        {weightGoal && (
          <p className="mt-3 text-sm text-muted-foreground">
            {projected
              ? `At your current pace, you're projected to hit your goal around ${projected}.`
              : "Log a few more entries to project a goal date."}
          </p>
        )}
      </Card>

      <Card title="Body fat %">
        <TrendChart
          unit="%"
          points={bodyFatEntries.map((e) => ({ recordedAt: e.recordedAt, value: e.value }))}
        />
      </Card>
    </div>
  );
}
