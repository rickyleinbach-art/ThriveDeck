import type { AnalyticsData, Aggregation, MetricKey, RawPoint } from "@/lib/analytics/types";
import { METRICS_BY_KEY } from "@/lib/analytics/types";
import { addDays, toDay } from "@/lib/analytics/ranges";
import type { ChallengeDef } from "@/lib/challenges/catalog";

// Deterministic challenge progress, computed from the user's own logged data
// (the same series Analytics reads). Nothing here logs or interprets health
// values; it counts qualifying days or totals toward a fixed target.

export interface ChallengeProgress {
  value: number; // measured amount (days hit, cumulative total, or kg lost)
  pct: number; // 0–100
  completed: boolean;
  daysElapsed: number;
  daysTotal: number;
  daysLeft: number;
}

const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

// One aggregated value per calendar day, the way the metric combines samples.
function dailyMap(points: RawPoint[] | undefined, agg: Aggregation): Map<string, number> {
  const byDay = new Map<string, number[]>();
  for (const p of points ?? []) {
    const day = toDay(p.date);
    const list = byDay.get(day) ?? [];
    list.push(p.value);
    byDay.set(day, list);
  }
  const out = new Map<string, number>();
  for (const [day, values] of byDay) {
    const sum = values.reduce((a, b) => a + b, 0);
    out.set(day, agg === "sum" ? sum : sum / values.length);
  }
  return out;
}

// Days in [start, min(end, today)] inclusive.
function windowDays(startIso: string, today: string, duration: number): string[] {
  const days: string[] = [];
  for (let i = 0; i < duration; i++) {
    const day = addDays(startIso, i);
    if (day > today) break;
    days.push(day);
  }
  return days;
}

export function computeChallengeProgress(
  def: ChallengeDef,
  startDate: string,
  today: string,
  data: AnalyticsData
): ChallengeProgress {
  const days = windowDays(startDate, today, def.durationDays);
  const daysElapsed = days.length;
  const daysTotal = def.durationDays;
  const daysLeft = Math.max(0, daysTotal - daysElapsed);

  // Local const so the discriminated-union narrowing survives inside closures.
  const mode = def.mode;
  let value = 0;

  switch (mode.kind) {
    case "any_log": {
      // A day counts if any tracked series has a point that day.
      const present = new Set<string>();
      for (const points of Object.values(data.series)) {
        for (const p of points ?? []) present.add(toDay(p.date));
      }
      value = days.filter((d) => present.has(d)).length;
      break;
    }
    case "days_hit": {
      const key = mode.series as MetricKey;
      const threshold = mode.threshold;
      const map = dailyMap(data.series[key], METRICS_BY_KEY[key].agg);
      value = days.filter((d) => (map.get(d) ?? 0) >= threshold).length;
      break;
    }
    case "cumulative":
    case "count": {
      const key = mode.series as MetricKey;
      const map = dailyMap(data.series[key], METRICS_BY_KEY[key].agg);
      value = days.reduce((sum, d) => sum + (map.get(d) ?? 0), 0);
      break;
    }
    case "weight_loss": {
      const map = dailyMap(data.series.weight, "avg");
      const inWindow = days.map((d) => map.get(d)).filter((v): v is number => v !== undefined);
      if (inWindow.length >= 1) {
        const start = inWindow[0];
        const latest = inWindow[inWindow.length - 1];
        value = Math.max(0, start - latest); // only count loss
      }
      break;
    }
  }

  const pct = clampPct((value / def.target) * 100);
  return { value, pct, completed: pct >= 100, daysElapsed, daysTotal, daysLeft };
}
