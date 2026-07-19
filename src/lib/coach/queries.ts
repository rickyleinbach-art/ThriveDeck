import { createClient } from "@/lib/supabase/server";
import { getAnalyticsData } from "@/lib/analytics/queries";
import { computeScores, weightInsights } from "@/lib/analytics/scores";
import { addDays, toDay } from "@/lib/analytics/ranges";
import type { RawPoint } from "@/lib/analytics/types";
import type {
  CoachContext,
  Macros,
  SimpleFood,
  SimpleTemplate,
} from "@/lib/coach/types";

// Assembles everything the coach reasons over. The heavy lifting (reading
// every module's tables, RLS-scoped) is reused from the Analytics module;
// this adds only the coach-specific extras: the user's high-protein foods
// and their available workout templates. No health values are logged.

// Sum a metric's raw points that fall on a given UTC day.
function sumOnDay(points: RawPoint[] | undefined, day: string): number {
  if (!points) return 0;
  let total = 0;
  for (const p of points) if (toDay(p.date) === day) total += p.value;
  return total;
}

// Consecutive days ending today that have anything logged in any series.
function computeStreak(
  series: Partial<Record<string, RawPoint[]>>,
  today: string
): number {
  const active = new Set<string>();
  for (const points of Object.values(series)) {
    for (const p of points ?? []) active.add(toDay(p.date));
  }
  let streak = 0;
  for (let i = 0; ; i++) {
    if (active.has(addDays(today, -i))) streak++;
    else break;
  }
  return streak;
}

export async function getCoachContext(): Promise<CoachContext> {
  const analytics = await getAnalyticsData();
  const scores = computeScores(analytics);
  const weight = weightInsights(analytics);
  const today = analytics.today;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let proteinFoods: SimpleFood[] = [];
  let templates: SimpleTemplate[] = [];

  if (user) {
    const [foodRes, templateRes] = await Promise.all([
      supabase
        .from("food_items")
        .select("name, protein_g, calories, serving_size, serving_unit")
        .eq("user_id", user.id)
        .order("protein_g", { ascending: false })
        .limit(6),
      // Guided programs (shared, user_id null) plus the user's own templates.
      supabase
        .from("workout_templates")
        .select("name, difficulty, user_id")
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .limit(8),
    ]);

    proteinFoods = (foodRes.data ?? []).map((r) => ({
      name: r.name as string,
      proteinG: (r.protein_g as number) ?? 0,
      calories: (r.calories as number) ?? 0,
      servingSize: (r.serving_size as number) ?? 1,
      servingUnit: (r.serving_unit as string) ?? "serving",
    }));

    templates = (templateRes.data ?? []).map((r) => ({
      name: r.name as string,
      difficulty: (r.difficulty as string) ?? null,
      isCustom: r.user_id !== null,
    }));
  }

  // Today's consumed macros, derived from the analytics series (already
  // scaled by servings) so we don't re-read food logs.
  const consumedToday: Macros | null = analytics.series.calories
    ? {
        calories: sumOnDay(analytics.series.calories, today),
        proteinG: sumOnDay(analytics.series.protein, today),
        carbsG: sumOnDay(analytics.series.carbs, today),
        fatG: sumOnDay(analytics.series.fat, today),
      }
    : null;

  const nutritionTarget: Macros | null = analytics.nutritionTarget
    ? {
        calories: analytics.nutritionTarget.calories,
        proteinG: analytics.nutritionTarget.proteinG,
        carbsG: analytics.nutritionTarget.carbsG,
        fatG: analytics.nutritionTarget.fatG,
      }
    : null;

  // Workout activity from the workouts count series.
  const workoutPoints = analytics.series.workouts ?? [];
  let workouts30d = 0;
  let lastWorkoutDay: string | null = null;
  const cutoff = addDays(today, -29);
  for (const p of workoutPoints) {
    const day = toDay(p.date);
    if (day >= cutoff) workouts30d += p.value;
    if (lastWorkoutDay === null || day > lastWorkoutDay) lastWorkoutDay = day;
  }
  const daysSinceWorkout =
    lastWorkoutDay === null
      ? null
      : Math.round(
          (new Date(`${today}T00:00:00Z`).getTime() -
            new Date(`${lastWorkoutDay}T00:00:00Z`).getTime()) /
            86_400_000
        );

  return {
    today,
    analytics,
    scores,
    weight,
    streakDays: computeStreak(analytics.series, today),
    workouts30d,
    lastWorkoutDay,
    daysSinceWorkout,
    consumedToday,
    nutritionTarget,
    proteinFoods,
    templates,
  };
}
