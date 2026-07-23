"use client";

import { useMemo, useState } from "react";
import { Download, FileText, ArrowUp, ArrowDown } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnalyticsChart } from "@/components/charts/analytics-chart";
import { buildSeries, summarize, type SeriesPoint } from "@/lib/analytics/series";
import { seriesToCsv } from "@/lib/analytics/export";
import { defaultGranularity, resolveRange } from "@/lib/analytics/ranges";
import {
  METRICS,
  METRIC_GROUPS,
  type AnalyticsData,
  type MetricDef,
  type MetricGroup,
} from "@/lib/analytics/types";
import {
  GRANULARITIES,
  GRANULARITY_LABELS,
  RANGE_PRESETS,
  RANGE_PRESET_LABELS,
  type DateRange,
  type Granularity,
  type RangePreset,
} from "@/lib/validations/analytics";

// Chart accent per group — design tokens where they exist, plus two
// theme-complementary hues for vitals/peptides so groups read apart.
const GROUP_COLOR: Record<MetricGroup, string> = {
  "Body composition": "hsl(var(--primary))",
  Nutrition: "hsl(var(--warning))",
  Fitness: "hsl(var(--success))",
  "Habits & wellness": "hsl(var(--primary))",
  Vitals: "hsl(200 70% 45%)",
  Peptides: "hsl(262 52% 55%)",
};

function fmt(value: number | null, unit: string): string {
  if (value === null) return "—";
  const n = value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  return unit.startsWith("/") ? `${n}${unit}` : `${n} ${unit}`;
}

export function AnalyticsExplorer({
  data,
  tracksPeptides = true,
}: {
  data: AnalyticsData;
  tracksPeptides?: boolean;
}) {
  const [preset, setPreset] = useState<RangePreset>("30d");
  const [granularity, setGranularity] = useState<Granularity>("daily");
  const [custom, setCustom] = useState<DateRange>({
    start: data.earliest ?? data.today,
    end: data.today,
  });

  const range = useMemo(
    () => resolveRange(preset, data.today, data.earliest, custom),
    [preset, data.today, data.earliest, custom]
  );

  function choosePreset(p: RangePreset) {
    setPreset(p);
    if (p !== "custom") setGranularity(defaultGranularity(p));
  }

  // Only metrics with data; each carries its bucketed series for the range.
  // Peptide metrics are dropped entirely when the user doesn't track peptides,
  // so the "Peptides" group never appears in filters or charts (Phase 5 § 5.2).
  const active = useMemo(() => {
    return METRICS.filter((def) => tracksPeptides || def.group !== "Peptides")
      .map((def) => {
        const raw = data.series[def.key];
        if (!raw || raw.length === 0) return null;
        const series = buildSeries(raw, range, granularity, def.agg);
        const unit = data.units[def.key] ?? def.unit;
        return { def, series, unit, summary: summarize(series) };
      })
      .filter((m): m is ActiveMetric => m !== null);
  }, [data, range, granularity, tracksPeptides]);

  const byGroup = useMemo(() => {
    const map = new Map<MetricGroup, ActiveMetric[]>();
    for (const m of active) {
      const list = map.get(m.def.group) ?? [];
      list.push(m);
      map.set(m.def.group, list);
    }
    return map;
  }, [active]);

  function exportCsv() {
    const csv = seriesToCsv(active.map((m) => ({ label: `${m.def.label} (${m.unit})`, series: m.series })));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `thrivedeck-analytics-${range.start}_to_${range.end}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-card print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1">
            {RANGE_PRESETS.map((p) => (
              <Button
                key={p}
                size="sm"
                variant={preset === p ? "default" : "outline"}
                onClick={() => choosePreset(p)}
              >
                {RANGE_PRESET_LABELS[p]}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <FileText className="h-4 w-4" /> PDF
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1">
            {GRANULARITIES.map((g) => (
              <Button
                key={g}
                size="sm"
                variant={granularity === g ? "default" : "outline"}
                onClick={() => setGranularity(g)}
              >
                {GRANULARITY_LABELS[g]}
              </Button>
            ))}
          </div>
          {preset === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={custom.start}
                max={custom.end}
                onChange={(e) => setCustom((c) => ({ ...c, start: e.target.value }))}
                className="h-9 w-auto"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="date"
                value={custom.end}
                min={custom.start}
                max={data.today}
                onChange={(e) => setCustom((c) => ({ ...c, end: e.target.value }))}
                className="h-9 w-auto"
              />
            </div>
          )}
        </div>
      </div>

      {/* Print-only header so a saved PDF is self-describing */}
      <div className="hidden print:block">
        <h2 className="text-lg font-semibold">
          Analytics report · {range.start} to {range.end} · {GRANULARITY_LABELS[granularity]}
        </h2>
      </div>

      {active.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No tracked data in this range yet. Log weight, meals, workouts, or habits to see charts here.
        </div>
      ) : (
        METRIC_GROUPS.filter((g) => byGroup.has(g)).map((group) => (
          <section key={group} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {group}
            </h2>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {byGroup.get(group)!.map((m) => (
                <MetricCard key={m.def.key} metric={m} color={GROUP_COLOR[group]} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

interface ActiveMetric {
  def: MetricDef;
  series: SeriesPoint[];
  unit: string;
  summary: ReturnType<typeof summarize>;
}

function MetricCard({ metric, color }: { metric: ActiveMetric; color: string }) {
  const { def, series, unit, summary } = metric;
  const change = summary.change;

  return (
    <div className="break-inside-avoid rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{def.label}</h3>
          <p className="mt-0.5 text-xl font-semibold">{fmt(summary.latest, unit)}</p>
        </div>
        {change !== null && (
          <div className="text-right text-xs text-muted-foreground">
            <span>
              {change > 0 ? (
                <Icon icon={ArrowUp} size="sm" className="inline align-[-0.2em]" />
              ) : change < 0 ? (
                <Icon icon={ArrowDown} size="sm" className="inline align-[-0.2em]" />
              ) : null}{" "}
              {fmt(Math.abs(change), unit)}
            </span>
            {summary.average !== null && (
              <p className="mt-0.5">avg {fmt(summary.average, unit)}</p>
            )}
          </div>
        )}
      </div>
      <AnalyticsChart
        data={series}
        type={def.chart}
        unit={unit}
        color={color}
        showAverage={def.movingAverage}
      />
    </div>
  );
}
