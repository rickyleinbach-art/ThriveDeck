import type { Aggregation, RawPoint } from "@/lib/analytics/types";
import type { DateRange, Granularity } from "@/lib/validations/analytics";
import { bucketKey, bucketKeysInRange, bucketLabel, toDay } from "@/lib/analytics/ranges";

// A single plotted point. `value` is null for a period with no data on an
// averaged metric (a genuine gap); summed metrics report 0 for empty periods
// because "no workouts that week" really is zero.
export interface SeriesPoint {
  key: string;
  label: string;
  value: number | null;
}

function combine(values: number[], agg: Aggregation): number {
  const sum = values.reduce((a, b) => a + b, 0);
  return agg === "sum" ? sum : sum / values.length;
}

// Collapse raw samples to one value per calendar day using the metric's
// aggregation (e.g. two weigh-ins on a day average; two workouts sum).
function perDay(points: RawPoint[], agg: Aggregation): Map<string, number> {
  const byDay = new Map<string, number[]>();
  for (const p of points) {
    const day = toDay(p.date);
    const list = byDay.get(day) ?? [];
    list.push(p.value);
    byDay.set(day, list);
  }
  const out = new Map<string, number>();
  for (const [day, values] of byDay) out.set(day, combine(values, agg));
  return out;
}

// Build chart-ready points across the full range, one per bucket, aggregating
// daily values into weekly/monthly/yearly periods as needed.
export function buildSeries(
  points: RawPoint[],
  range: DateRange,
  granularity: Granularity,
  agg: Aggregation
): SeriesPoint[] {
  const daily = perDay(points, agg);
  const buckets = new Map<string, number[]>();

  for (const [day, value] of daily) {
    if (day < range.start || day > range.end) continue;
    const key = bucketKey(day, granularity);
    const list = buckets.get(key) ?? [];
    list.push(value);
    buckets.set(key, list);
  }

  return bucketKeysInRange(range, granularity).map((key) => {
    const values = buckets.get(key);
    return {
      key,
      label: bucketLabel(key, granularity),
      value: values ? combine(values, agg) : agg === "sum" ? 0 : null,
    };
  });
}

// Trailing simple moving average over `window` buckets. Null until the window
// fills and null-passthrough for gaps, so it overlays cleanly on the raw line.
export function movingAverage(
  series: SeriesPoint[],
  window: number
): (number | null)[] {
  return series.map((_, i) => {
    if (i + 1 < window) return null;
    const slice = series.slice(i - window + 1, i + 1);
    const present = slice.map((s) => s.value).filter((v): v is number => v !== null);
    if (present.length < window) return null;
    return present.reduce((a, b) => a + b, 0) / present.length;
  });
}

export interface SeriesSummary {
  count: number; // periods with data
  latest: number | null;
  average: number | null;
  min: number | null;
  max: number | null;
  // Change from first populated period to last, absolute and percent.
  change: number | null;
  changePct: number | null;
}

// Headline stats shown above each chart.
export function summarize(series: SeriesPoint[]): SeriesSummary {
  const present = series.filter((s): s is SeriesPoint & { value: number } => s.value !== null);
  if (present.length === 0) {
    return { count: 0, latest: null, average: null, min: null, max: null, change: null, changePct: null };
  }
  const values = present.map((s) => s.value);
  const first = values[0];
  const latest = values[values.length - 1];
  const change = latest - first;
  return {
    count: present.length,
    latest,
    average: values.reduce((a, b) => a + b, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    change,
    changePct: first !== 0 ? (change / first) * 100 : null,
  };
}
