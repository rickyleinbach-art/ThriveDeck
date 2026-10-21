import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { ArrowLeft, Scale } from "lucide-react";
import { PageHeader } from "@/components/page-header";
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
      <PageHeader
        icon={Scale}
        title="Trends"
        description={"Body-composition timeline, from daily entries to monthly averages."}
        actions={
          <Link
            href="/weight"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
          >
            <Icon icon={ArrowLeft} size="sm" />
            Back to Weight
          </Link>
        }
      />

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
