// Analytics domain model. The registry below is the single source of truth
// for every tracked series (PRD § Analytics): its label, unit, how it
// aggregates across a bucket, and how it charts. Queries fill these keys with
// raw dated points; the series builder turns them into chart data.

// One raw sample, keyed to a UTC calendar day ("YYYY-MM-DD") so it lines up
// with how weight/nutrition/habits store days elsewhere.
export interface RawPoint {
  date: string;
  value: number;
}

// How multiple samples combine within a day and across a bucket.
// - "avg": measurements you average (weight, resting HR, macros per day)
// - "sum": counts/totals you add up (workouts, minutes, injections)
export type Aggregation = "avg" | "sum";

export type ChartType = "line" | "area" | "bar";

export type MetricGroup =
  | "Body composition"
  | "Nutrition"
  | "Fitness"
  | "Habits & wellness"
  | "Vitals"
  | "Peptides";

export type MetricKey =
  | "weight"
  | "bodyFat"
  | "leanMass"
  | "waist"
  | "calories"
  | "protein"
  | "carbs"
  | "fat"
  | "workouts"
  | "workoutMinutes"
  | "strengthVolume"
  | "water"
  | "sleep"
  | "steps"
  | "mood"
  | "energy"
  | "stress"
  | "restingHr"
  | "hrv"
  | "glucose"
  | "injections"
  | "sideEffects";

export interface MetricDef {
  key: MetricKey;
  label: string;
  unit: string; // default unit; body metrics override from the stored row
  agg: Aggregation;
  chart: ChartType;
  group: MetricGroup;
  // Overlay a trailing moving average (line/area only). Off for counts.
  movingAverage?: boolean;
}

// Order here is the order metrics render on the page.
export const METRICS: MetricDef[] = [
  { key: "weight", label: "Weight", unit: "kg", agg: "avg", chart: "area", group: "Body composition", movingAverage: true },
  { key: "bodyFat", label: "Body fat", unit: "%", agg: "avg", chart: "line", group: "Body composition", movingAverage: true },
  { key: "leanMass", label: "Lean mass", unit: "kg", agg: "avg", chart: "line", group: "Body composition" },
  { key: "waist", label: "Waist", unit: "cm", agg: "avg", chart: "line", group: "Body composition" },

  { key: "calories", label: "Calories", unit: "kcal", agg: "avg", chart: "bar", group: "Nutrition", movingAverage: true },
  { key: "protein", label: "Protein", unit: "g", agg: "avg", chart: "bar", group: "Nutrition" },
  { key: "carbs", label: "Carbs", unit: "g", agg: "avg", chart: "bar", group: "Nutrition" },
  { key: "fat", label: "Fat", unit: "g", agg: "avg", chart: "bar", group: "Nutrition" },

  { key: "workouts", label: "Workouts", unit: "sessions", agg: "sum", chart: "bar", group: "Fitness" },
  { key: "workoutMinutes", label: "Active minutes", unit: "min", agg: "sum", chart: "bar", group: "Fitness" },
  { key: "strengthVolume", label: "Strength volume", unit: "kg", agg: "sum", chart: "bar", group: "Fitness" },

  { key: "water", label: "Water", unit: "oz", agg: "avg", chart: "bar", group: "Habits & wellness" },
  { key: "sleep", label: "Sleep", unit: "h", agg: "avg", chart: "area", group: "Habits & wellness", movingAverage: true },
  { key: "steps", label: "Steps", unit: "steps", agg: "avg", chart: "bar", group: "Habits & wellness" },
  { key: "mood", label: "Mood", unit: "/10", agg: "avg", chart: "line", group: "Habits & wellness" },
  { key: "energy", label: "Energy", unit: "/10", agg: "avg", chart: "line", group: "Habits & wellness" },
  { key: "stress", label: "Stress", unit: "/10", agg: "avg", chart: "line", group: "Habits & wellness" },

  { key: "restingHr", label: "Resting heart rate", unit: "bpm", agg: "avg", chart: "line", group: "Vitals", movingAverage: true },
  { key: "hrv", label: "HRV", unit: "ms", agg: "avg", chart: "line", group: "Vitals", movingAverage: true },
  { key: "glucose", label: "Blood glucose", unit: "mg/dL", agg: "avg", chart: "line", group: "Vitals" },

  { key: "injections", label: "Injections logged", unit: "doses", agg: "sum", chart: "bar", group: "Peptides" },
  { key: "sideEffects", label: "Side effects", unit: "events", agg: "sum", chart: "bar", group: "Peptides" },
];

export const METRICS_BY_KEY: Record<MetricKey, MetricDef> = Object.fromEntries(
  METRICS.map((m) => [m.key, m])
) as Record<MetricKey, MetricDef>;

export const METRIC_GROUPS: MetricGroup[] = [
  "Body composition",
  "Nutrition",
  "Fitness",
  "Habits & wellness",
  "Vitals",
  "Peptides",
];

// Raw per-metric samples plus the context the page/scores need. Only keys with
// data are populated; empty series are omitted so the UI can hide them.
export interface AnalyticsData {
  series: Partial<Record<MetricKey, RawPoint[]>>;
  units: Partial<Record<MetricKey, string>>; // overrides METRIC_BY_KEY.unit
  today: string; // UTC "YYYY-MM-DD"
  earliest: string | null; // earliest day with any data, for the "all" range
  goalWeightKg: number | null;
  weightGoalTarget: number | null; // in the weight series' own unit
  nutritionTarget: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  } | null;
  // Peptide dose adherence over the window: logged vs scheduled+missed.
  adherence: { logged: number; missed: number };
}
