import { createClient } from "@/lib/supabase/server";
import {
  mapFoodItem,
  mapFoodLog,
  mapNutritionTarget,
  type FoodItem,
  type FoodItemRow,
  type FoodLog,
  type FoodLogRow,
  type NutritionTarget,
  type NutritionTargetRow,
} from "@/lib/nutrition/types";

// Server-side reads. RLS scopes every query to the signed-in user already;
// the explicit user_id filter below is defense in depth, not the boundary.
export async function getFoodItems(): Promise<FoodItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("food_items")
    .select("*")
    .eq("user_id", user.id)
    .order("is_favorite", { ascending: false })
    .order("name", { ascending: true });

  if (error || !data) return [];
  return (data as FoodItemRow[]).map(mapFoodItem);
}

export async function getFoodLogsForDay(loggedOn: string): Promise<FoodLog[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("food_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("logged_on", loggedOn)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as FoodLogRow[]).map(mapFoodLog);
}

export async function getNutritionTarget(): Promise<NutritionTarget | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("nutrition_targets")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return mapNutritionTarget(data as NutritionTargetRow);
}

export interface CalculatorProfileInfo {
  sex: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY" | null;
  dateOfBirth: string | null;
  heightCm: number | null;
  activityLevel:
    | "SEDENTARY"
    | "LIGHT"
    | "MODERATE"
    | "ACTIVE"
    | "VERY_ACTIVE"
    | null;
  unitSystem: "METRIC" | "IMPERIAL";
  latestWeightKg: number | null;
}

// Prefill for the macro calculator: profile basics (Module 1) plus the most
// recent logged weight (Module 2). Read-only across modules.
export async function getCalculatorProfileInfo(): Promise<CalculatorProfileInfo | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileResult, weightResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("sex, date_of_birth, height_cm, activity_level, unit_system")
      .eq("id", user.id)
      .single(),
    supabase
      .from("body_metrics")
      .select("value, unit")
      .eq("user_id", user.id)
      .eq("metric_type", "WEIGHT")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (profileResult.error || !profileResult.data) return null;
  const profile = profileResult.data;

  let latestWeightKg: number | null = null;
  if (weightResult.data) {
    latestWeightKg =
      weightResult.data.unit === "lb"
        ? weightResult.data.value * 0.453592
        : weightResult.data.value;
  }

  return {
    sex: profile.sex,
    dateOfBirth: profile.date_of_birth,
    heightCm: profile.height_cm,
    activityLevel: profile.activity_level,
    unitSystem: profile.unit_system,
    latestWeightKg,
  };
}
