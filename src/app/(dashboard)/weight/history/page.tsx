import Link from "next/link";
import { cn } from "@/lib/utils";
import { METRIC_LABELS, METRIC_TYPES, type MetricType } from "@/lib/validations/weight";
import { getBodyMetrics } from "@/lib/weight/queries";
import { deleteBodyMetricFormAction } from "@/lib/weight/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function isMetricType(value: string): value is MetricType {
  return (METRIC_TYPES as readonly string[]).includes(value);
}

export default async function WeightHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ metric?: string }>;
}) {
  const { metric } = await searchParams;
  const activeMetric = metric && isMetricType(metric) ? metric : undefined;

  const entries = await getBodyMetrics({ metricType: activeMetric, limit: 200 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <p className="mt-1 text-muted-foreground">Every entry you&apos;ve logged.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/weight/history"
          className={cn(
            "rounded-full border border-border px-3 py-1 text-sm transition hover:bg-accent",
            !activeMetric && "bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          All
        </Link>
        {METRIC_TYPES.map((type) => (
          <Link
            key={type}
            href={`/weight/history?metric=${type}`}
            className={cn(
              "rounded-full border border-border px-3 py-1 text-sm transition hover:bg-accent",
              activeMetric === type && "bg-primary text-primary-foreground hover:opacity-90"
            )}
          >
            {METRIC_LABELS[type]}
          </Link>
        ))}
      </div>

      <Card>
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No entries yet. Log your first one from the Weight page.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Metric</th>
                  <th className="py-2 pr-4 font-medium">Value</th>
                  <th className="py-2 pr-4 font-medium">Notes</th>
                  <th className="py-2 pr-4 font-medium" />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {entry.recordedAt.slice(0, 10)}
                    </td>
                    <td className="py-2 pr-4">{METRIC_LABELS[entry.metricType]}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {entry.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}{" "}
                      {entry.unit}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{entry.notes ?? ""}</td>
                    <td className="py-2 pr-4 text-right">
                      <form action={deleteBodyMetricFormAction.bind(null, entry.id)}>
                        <Button type="submit" variant="ghost" size="sm">
                          Delete
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
