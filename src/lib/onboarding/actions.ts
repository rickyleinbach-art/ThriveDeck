"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  onboardingSchema,
  hasHealthData,
  type OnboardingInput,
  type PrimaryGoal,
} from "@/lib/validations/onboarding";
import {
  ageFromDateOfBirth,
  calculateMacroTargets,
} from "@/lib/nutrition/calculations";
import type { CalculatorGoal } from "@/lib/validations/nutrition";

type ActionResult = { success: true } | { success: false; error: string };

const KG_PER_LB = 0.45359237;

// A 6-way onboarding goal collapses to the 3-way calorie adjustment the macro
// calculator understands. Performance/health/recovery/maintain all sit at
// maintenance — we never impose a deficit or surplus the user didn't ask for.
const GOAL_TO_CALCULATOR: Record<PrimaryGoal, CalculatorGoal> = {
  LOSE_FAT: "LOSE",
  BUILD_MUSCLE: "GAIN",
  IMPROVE_PERFORMANCE: "MAINTAIN",
  GENERAL_HEALTH: "MAINTAIN",
  RECOVERY_REHAB: "MAINTAIN",
  MAINTAIN: "MAINTAIN",
};

// Completes the first-time wizard: persists every answer, records the starting
// weigh-in, and — when we have enough to do it — pre-populates calorie/macro
// targets from BMR/TDEE (Phase 5 § 5.3). Targets are a starting point only;
// they're fully editable in the Nutrition module afterward.
export async function completeOnboarding(
  input: OnboardingInput
): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Please check your answers",
    };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  // Screen-4 consent is stamped only when the user actually shared health data.
  const health = d.healthProfile ?? {
    injuryFlags: [],
    injuryNotes: "",
    conditions: "",
    consentAt: null,
  };
  const healthProfile = {
    ...health,
    consentAt: hasHealthData(health) ? new Date().toISOString() : null,
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      // Only write name when given, so skipping it never wipes an existing one.
      ...(d.fullName?.trim() ? { full_name: d.fullName.trim() } : {}),
      date_of_birth: d.dateOfBirth,
      sex: d.sex,
      height_cm: d.heightCm,
      unit_system: d.unitSystem,
      goal_weight_kg: d.goalWeightKg ?? null,
      activity_level: d.activityLevel ?? null,
      primary_goal: d.primaryGoal ?? null,
      training_experience: d.trainingExperience ?? null,
      training_days_per_week: d.trainingDaysPerWeek ?? null,
      dietary_pattern: d.dietaryPattern ?? null,
      allergies: d.allergies || null,
      tracks_peptides: d.tracksPeptides,
      peptide_category: d.tracksPeptides ? d.peptideCategory ?? null : null,
      health_profile: healthProfile,
      onboarded: true,
    })
    .eq("id", user.id);

  if (profileError) {
    return { success: false, error: "Could not save your answers" };
  }

  // Record the starting weigh-in in the user's chosen display unit, so it lines
  // up with how the Weight module shows and logs everything else.
  const useImperial = d.unitSystem === "IMPERIAL";
  const weightValue = useImperial
    ? Math.round((d.currentWeightKg / KG_PER_LB) * 10) / 10
    : Math.round(d.currentWeightKg * 10) / 10;
  await supabase.from("body_metrics").insert({
    user_id: user.id,
    metric_type: "WEIGHT",
    value: weightValue,
    unit: useImperial ? "lb" : "kg",
    recorded_at: new Date().toISOString(),
    notes: null,
  });

  // Pre-populate calorie/macro targets when we have an activity level to build
  // a TDEE from. Without it we can't estimate maintenance, so we leave targets
  // for the user to set — a wrong guess is worse than none.
  if (d.activityLevel) {
    const targets = calculateMacroTargets({
      sex: d.sex,
      age: ageFromDateOfBirth(d.dateOfBirth),
      heightCm: d.heightCm,
      weightKg: d.currentWeightKg,
      activityLevel: d.activityLevel,
      goal: d.primaryGoal ? GOAL_TO_CALCULATOR[d.primaryGoal] : "MAINTAIN",
    });
    await supabase.from("nutrition_targets").upsert(
      {
        user_id: user.id,
        calories: targets.calories,
        protein_g: targets.proteinG,
        carbs_g: targets.carbsG,
        fat_g: targets.fatG,
        fiber_g: null,
      },
      { onConflict: "user_id" }
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/nutrition");
  revalidatePath("/weight");
  revalidatePath("/analytics");
  revalidatePath("/ai-coach");
  revalidatePath("/profile");
  revalidatePath("/settings");
  return { success: true };
}
