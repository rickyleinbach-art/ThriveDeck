import { createClient } from "@/lib/supabase/server";
import type { AnalyticsData, MetricKey, RawPoint } from "@/lib/analytics/types";
import { addDays, todayIso, toDay } from "@/lib/analytics/ranges";
import type { HabitType } from "@/lib/validations/habit";

// Server-side reads that assemble the raw dated series for every tracked
// metric from the existing module tables. RLS scopes every query to the
// signed-in user already; the explicit user_id filters are defense in depth.
//
// No new tables — this module only reads what modules 2–6 already store.
// Health data values are aggregated for charts and never logged (CLAUDE.md
// § Health & safety rules).

// Which habit types feed which analytics metric. A user may have several
// habits of the same type; their values are combined per day downstream.
const HABIT_METRIC: Partial<Record<HabitType, MetricKey>> = {
  WATER: "water",
  SLEEP: "sleep",
  STEPS: "steps",
  MOOD: "mood",
  ENERGY: "energy",
  STRESS: "stress",
};

// Default lookback used to hydrate the explorer. The client filters this down
// to the selected range without re-querying.
export const DEFAULT_WINDOW_DAYS = 365;

export async function getAnalyticsData(
  windowDays = DEFAULT_WINDOW_DAYS
): Promise<AnalyticsData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = todayIso();
  const sinceDay = addDays(today, -(windowDays - 1));
  const sinceIso = `${sinceDay}T00:00:00Z`;

  const empty: AnalyticsData = {
    series: {},
    units: {},
    today,
    earliest: null,
    goalWeightKg: null,
    weightGoalTarget: null,
    nutritionTarget: null,
    adherence: { logged: 0, missed: 0 },
  };
  if (!user) return empty;

  const uid = user.id;
  const [
    bodyRes,
    foodRes,
    workoutRes,
    setRes,
    habitRes,
    habitLogRes,
    healthRes,
    injectionRes,
    sideEffectRes,
    goalRes,
    targetRes,
  ] = await Promise.all([
    supabase
      .from("body_metrics")
      .select("metric_type, value, unit, recorded_at")
      .eq("user_id", uid)
      .gte("recorded_at", sinceIso),
    supabase
      .from("food_logs")
      .select("logged_on, servings, calories, protein_g, carbs_g, fat_g")
      .eq("user_id", uid)
      .gte("logged_on", sinceDay),
    supabase
      .from("workouts")
      .select("started_at, duration_min, completed_at")
      .eq("user_id", uid)
      .not("completed_at", "is", null)
      .gte("started_at", sinceIso),
    supabase
      .from("workout_sets")
      .select("category, reps, weight_kg, created_at")
      .eq("user_id", uid)
      .eq("category", "STRENGTH")
      .not("weight_kg", "is", null)
      .not("reps", "is", null)
      .gte("created_at", sinceIso),
    supabase.from("habits").select("id, habit_type").eq("user_id", uid),
    supabase
      .from("habit_logs")
      .select("habit_id, logged_on, value")
      .eq("user_id", uid)
      .gte("logged_on", sinceDay),
    supabase
      .from("health_metrics")
      .select("kind, value, measured_at")
      .eq("user_id", uid)
      .gte("measured_at", sinceIso),
    supabase
      .from("peptide_injections")
      .select("status, injected_at")
      .eq("user_id", uid)
      .gte("injected_at", sinceIso),
    supabase
      .from("peptide_side_effects")
      .select("occurred_at")
      .eq("user_id", uid)
      .gte("occurred_at", sinceIso),
    supabase
      .from("goals")
      .select("metric_type, target_value, achieved")
      .eq("user_id", uid)
      .eq("metric_type", "WEIGHT")
      .eq("achieved", false)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("nutrition_targets")
      .select("calories, protein_g, carbs_g, fat_g")
      .eq("user_id", uid)
      .maybeSingle(),
  ]);

  const series: Partial<Record<MetricKey, RawPoint[]>> = {};
  const units: Partial<Record<MetricKey, string>> = {};
  const push = (key: MetricKey, date: string, value: number) => {
    (series[key] ??= []).push({ date: toDay(date), value });
  };

  // Body composition (body_metrics) — carry the stored unit through.
  const BODY_METRIC: Record<string, MetricKey> = {
    WEIGHT: "weight",
    BODY_FAT: "bodyFat",
    LEAN_MASS: "leanMass",
    WAIST: "waist",
  };
  for (const row of bodyRes.data ?? []) {
    const key = BODY_METRIC[row.metric_type as string];
    if (!key) continue;
    push(key, row.recorded_at as string, row.value as number);
    units[key] ??= row.unit as string;
  }

  // Nutrition (food_logs) — snapshot values are per serving; scale by servings.
  for (const row of foodRes.data ?? []) {
    const s = (row.servings as number) ?? 1;
    const day = row.logged_on as string;
    push("calories", day, (row.calories as number) * s);
    push("protein", day, (row.protein_g as number) * s);
    push("carbs", day, (row.carbs_g as number) * s);
    push("fat", day, (row.fat_g as number) * s);
  }

  // Fitness (workouts + strength sets).
  for (const row of workoutRes.data ?? []) {
    push("workouts", row.started_at as string, 1);
    if (row.duration_min !== null) {
      push("workoutMinutes", row.started_at as string, row.duration_min as number);
    }
  }
  for (const row of setRes.data ?? []) {
    const volume = (row.weight_kg as number) * (row.reps as number);
    push("strengthVolume", row.created_at as string, volume);
  }

  // Habits (habit_logs) mapped through habit type.
  const habitTypeById = new Map<string, HabitType>();
  for (const h of habitRes.data ?? []) {
    habitTypeById.set(h.id as string, h.habit_type as HabitType);
  }
  for (const row of habitLogRes.data ?? []) {
    const type = row.habit_id ? habitTypeById.get(row.habit_id as string) : undefined;
    const key = type ? HABIT_METRIC[type] : undefined;
    if (!key) continue;
    push(key, row.logged_on as string, row.value as number);
  }

  // Vitals (health_metrics) — value only; blood pressure is not charted here.
  const HEALTH_METRIC: Record<string, MetricKey> = {
    RESTING_HEART_RATE: "restingHr",
    HRV: "hrv",
    BLOOD_GLUCOSE: "glucose",
  };
  for (const row of healthRes.data ?? []) {
    const key = HEALTH_METRIC[row.kind as string];
    if (!key) continue;
    push(key, row.measured_at as string, row.value as number);
  }

  // Peptides: one point per logged dose (count series) + adherence tally.
  let logged = 0;
  let missed = 0;
  for (const row of injectionRes.data ?? []) {
    if (row.status === "MISSED") {
      missed++;
    } else {
      logged++;
      push("injections", row.injected_at as string, 1);
    }
  }
  for (const row of sideEffectRes.data ?? []) {
    push("sideEffects", row.occurred_at as string, 1);
  }

  // Drop empty series so the UI can hide metrics the user doesn't track.
  for (const key of Object.keys(series) as MetricKey[]) {
    if ((series[key] ?? []).length === 0) delete series[key];
  }

  // Earliest logged day across everything, for the "all time" range.
  let earliest: string | null = null;
  for (const points of Object.values(series)) {
    for (const p of points ?? []) {
      if (earliest === null || p.date < earliest) earliest = p.date;
    }
  }

  const goal = goalRes.data?.[0];
  const target = targetRes.data;

  return {
    series,
    units,
    today,
    earliest,
    goalWeightKg: goal ? (goal.target_value as number) : null,
    weightGoalTarget: goal ? (goal.target_value as number) : null,
    nutritionTarget: target
      ? {
          calories: target.calories as number,
          proteinG: target.protein_g as number,
          carbsG: target.carbs_g as number,
          fatG: target.fat_g as number,
        }
      : null,
    adherence: { logged, missed },
  };
}
