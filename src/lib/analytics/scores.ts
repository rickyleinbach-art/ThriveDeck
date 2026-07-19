import type { AnalyticsData, Aggregation, MetricKey, RawPoint } from "@/lib/analytics/types";
import { addDays, toDay } from "@/lib/analytics/ranges";

// Dashboard scores (PRD § Analytics). Everything here is a lifestyle/activity
// summary derived from what the user logged — NOT medical scoring or advice.
// Scores never interpret labs or suggest dosing (CLAUDE.md § Health & safety).
// Each score is 0–100, or null when there isn't enough data to be meaningful.

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const round = (n: number) => Math.round(n);

export interface ScoreResult {
  value: number | null;
  detail: string;
}

// One value per calendar day, aggregated the way the metric wants.
function dailyMap(points: RawPoint[], agg: Aggregation): Map<string, number> {
  const byDay = new Map<string, number[]>();
  for (const p of points) {
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

// Values from the trailing `days` window ending today (missing days omitted).
function trailingValues(
  points: RawPoint[] | undefined,
  today: string,
  days: number,
  agg: Aggregation
): number[] {
  if (!points || points.length === 0) return [];
  const map = dailyMap(points, agg);
  const out: number[] = [];
  for (let i = 0; i < days; i++) {
    const day = addDays(today, -i);
    const v = map.get(day);
    if (v !== undefined) out.push(v);
  }
  return out;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

// How close a value sits to a target, as 0–100 (exact = 100, off by the
// target's full size or more = 0). Direction-agnostic.
function adherence(actual: number, target: number): number {
  if (target <= 0) return 0;
  return clamp(100 - (Math.abs(actual - target) / target) * 100);
}

// ---- Weekly composite scores (trailing 7 days) --------------------------

export function nutritionScore(data: AnalyticsData): ScoreResult {
  const t = data.nutritionTarget;
  if (!t) return { value: null, detail: "Set macro targets to score nutrition" };

  const cal = dailyMap(data.series.calories ?? [], "avg");
  const pro = dailyMap(data.series.protein ?? [], "avg");
  let logged = 0;
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const day = addDays(data.today, -i);
    const c = cal.get(day);
    if (c === undefined) continue;
    logged++;
    const calAdh = adherence(c, t.calories);
    const p = pro.get(day);
    // Protein at or above target is full marks; short is scored by closeness.
    const proAdh = p === undefined ? calAdh : p >= t.proteinG ? 100 : adherence(p, t.proteinG);
    total += (calAdh + proAdh) / 2;
  }
  if (logged === 0) return { value: null, detail: "No meals logged this week" };
  // Reward accuracy, then scale by how many days were actually logged.
  const score = round((total / logged) * (logged / 7));
  return { value: score, detail: `${logged}/7 days logged` };
}

export function fitnessScore(data: AnalyticsData): ScoreResult {
  if (!data.series.workouts) return { value: null, detail: "No workouts logged yet" };
  const sessions = trailingValues(data.series.workouts, data.today, 7, "sum").reduce((a, b) => a + b, 0);
  const minutes = trailingValues(data.series.workoutMinutes, data.today, 7, "sum").reduce((a, b) => a + b, 0);
  // Guidelines: ~4 sessions and ~150 active minutes per week.
  const sessionScore = clamp((sessions / 4) * 100);
  const minuteScore = clamp((minutes / 150) * 100);
  const score = round(0.6 * sessionScore + 0.4 * minuteScore);
  return { value: score, detail: `${sessions} workout${sessions === 1 ? "" : "s"} this week` };
}

// Breadth of tracking: share of the last 7 days with anything logged anywhere.
export function consistencyScore(data: AnalyticsData): ScoreResult {
  const keys = Object.keys(data.series) as MetricKey[];
  if (keys.length === 0) return { value: null, detail: "Start logging to build a streak" };

  const dayMaps = keys.map((k) => dailyMap(data.series[k] ?? [], "avg"));
  let active = 0;
  for (let i = 0; i < 7; i++) {
    const day = addDays(data.today, -i);
    if (dayMaps.some((m) => m.has(day))) active++;
  }
  return { value: round((active / 7) * 100), detail: `Tracked ${active}/7 days` };
}

export function recoveryScore(data: AnalyticsData): ScoreResult {
  const sleep = trailingValues(data.series.sleep, data.today, 7, "avg");
  if (sleep.length === 0) return { value: null, detail: "Log sleep to score recovery" };
  const avg = mean(sleep);
  // 8h = full marks; scales linearly below that.
  const score = round(clamp((avg / 8) * 100));
  return { value: score, detail: `${avg.toFixed(1)}h avg sleep` };
}

// Lifestyle "health" composite: the physical-input scores that are available.
export function healthScore(data: AnalyticsData): ScoreResult {
  const parts = [nutritionScore(data), recoveryScore(data), consistencyScore(data)]
    .map((s) => s.value)
    .filter((v): v is number => v !== null);
  if (parts.length === 0) return { value: null, detail: "Not enough data yet" };
  return { value: round(mean(parts)), detail: `Across ${parts.length} signals` };
}

// Overall wellness: mean of every weekly score we could compute.
export function wellnessScore(data: AnalyticsData): ScoreResult {
  const parts = [
    nutritionScore(data),
    fitnessScore(data),
    consistencyScore(data),
    recoveryScore(data),
  ]
    .map((s) => s.value)
    .filter((v): v is number => v !== null);
  if (parts.length === 0) return { value: null, detail: "Not enough data yet" };
  return { value: round(mean(parts)), detail: `Blended from ${parts.length} scores` };
}

export interface DashboardScores {
  wellness: ScoreResult;
  health: ScoreResult;
  nutrition: ScoreResult;
  fitness: ScoreResult;
  consistency: ScoreResult;
  recovery: ScoreResult;
}

export function computeScores(data: AnalyticsData): DashboardScores {
  return {
    wellness: wellnessScore(data),
    health: healthScore(data),
    nutrition: nutritionScore(data),
    fitness: fitnessScore(data),
    consistency: consistencyScore(data),
    recovery: recoveryScore(data),
  };
}

// ---- Trend & projection (weight) ----------------------------------------

interface Trend {
  slopePerDay: number;
  intercept: number; // value at t0 (first point's day)
  t0Day: string;
  lastDay: string;
  n: number;
}

// Least-squares fit over daily-averaged points. x is days since the first day.
function linearTrend(points: RawPoint[]): Trend | null {
  const map = dailyMap(points, "avg");
  const days = [...map.keys()].sort();
  if (days.length < 3) return null;

  const t0 = new Date(`${days[0]}T00:00:00Z`).getTime();
  const xs = days.map((d) => (new Date(`${d}T00:00:00Z`).getTime() - t0) / 86_400_000);
  const ys = days.map((d) => map.get(d)!);
  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sumXX = xs.reduce((a, x) => a + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slopePerDay: slope, intercept, t0Day: days[0], lastDay: days[days.length - 1], n };
}

export interface WeightInsights {
  changePerWeek: number | null; // in the weight series unit
  projectedIn30Days: number | null;
  projectedGoalDate: string | null;
  goalProgressPct: number | null; // 0–100
  unit: string;
}

export function weightInsights(data: AnalyticsData): WeightInsights | null {
  const points = data.series.weight;
  const unit = data.units.weight ?? "kg";
  if (!points || points.length === 0) return null;

  const trend = linearTrend(points);
  const map = dailyMap(points, "avg");
  const latest = map.get([...map.keys()].sort().pop()!) ?? null;

  let projectedIn30Days: number | null = null;
  let projectedGoalDate: string | null = null;
  let changePerWeek: number | null = null;

  if (trend) {
    changePerWeek = trend.slopePerDay * 7;
    const daysFromT0 = (new Date(`${data.today}T00:00:00Z`).getTime() - new Date(`${trend.t0Day}T00:00:00Z`).getTime()) / 86_400_000;
    projectedIn30Days = trend.intercept + trend.slopePerDay * (daysFromT0 + 30);

    const target = data.weightGoalTarget;
    if (target !== null && trend.slopePerDay !== 0) {
      const daysToTarget = (target - trend.intercept) / trend.slopePerDay;
      const lastX = (new Date(`${trend.lastDay}T00:00:00Z`).getTime() - new Date(`${trend.t0Day}T00:00:00Z`).getTime()) / 86_400_000;
      if (daysToTarget > lastX) {
        const d = new Date(new Date(`${trend.t0Day}T00:00:00Z`).getTime() + daysToTarget * 86_400_000);
        projectedGoalDate = d.toISOString().slice(0, 10);
      }
    }
  }

  // Goal progress needs a start (earliest reading) and a target.
  let goalProgressPct: number | null = null;
  const target = data.weightGoalTarget;
  if (target !== null && latest !== null) {
    const start = map.get([...map.keys()].sort()[0])!;
    const total = start - target;
    if (total !== 0) goalProgressPct = clamp(((start - latest) / total) * 100);
  }

  return { changePerWeek, projectedIn30Days, projectedGoalDate, goalProgressPct, unit };
}
