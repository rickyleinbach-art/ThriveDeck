"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  customExerciseSchema,
  finishWorkoutSchema,
  logSetSchema,
  startWorkoutSchema,
  workoutTemplateSchema,
  type CustomExerciseInput,
  type FinishWorkoutInput,
  type LogSetInput,
  type StartWorkoutInput,
  type WorkoutTemplateInput,
} from "@/lib/validations/exercise";
import {
  DEFAULT_MET,
  estimateCaloriesBurned,
} from "@/lib/exercise/calculations";
import type { ExerciseRow } from "@/lib/exercise/types";

type ActionResult = { success: true } | { success: false; error: string };
type StartWorkoutResult =
  | { success: true; workoutId: string }
  | { success: false; error: string };

function revalidateExercisePages() {
  revalidatePath("/exercise");
  revalidatePath("/exercise/library");
  revalidatePath("/exercise/history");
  revalidatePath("/exercise/prs");
  revalidatePath("/dashboard");
}

// ---------------------------------------------------------------------
// Exercise library
// ---------------------------------------------------------------------
export async function createCustomExercise(
  input: CustomExerciseInput
): Promise<ActionResult> {
  const parsed = customExerciseSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid exercise" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase.from("exercises").insert({
    user_id: user.id,
    name: parsed.data.name,
    category: parsed.data.category,
    muscle_group: parsed.data.muscleGroup ?? null,
    equipment: parsed.data.equipment || null,
    met_value: parsed.data.metValue ?? null,
    description: parsed.data.description || null,
  });

  if (error) return { success: false, error: "Could not save exercise" };

  revalidateExercisePages();
  return { success: true };
}

// Only custom rows are deletable: RLS blocks deleting seed rows (user_id
// null) and the .eq("user_id") filter makes that explicit here too.
export async function deleteCustomExercise(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase
    .from("exercises")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: "Could not delete exercise" };

  revalidateExercisePages();
  return { success: true };
}

// Adapter for <form action={...}> which requires a void-returning function.
export async function deleteCustomExerciseFormAction(id: string): Promise<void> {
  await deleteCustomExercise(id);
}

// ---------------------------------------------------------------------
// Workout templates (the workout builder)
// ---------------------------------------------------------------------
export async function saveWorkoutTemplate(
  input: WorkoutTemplateInput
): Promise<ActionResult> {
  const parsed = workoutTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid template" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { data: template, error: templateError } = await supabase
    .from("workout_templates")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();

  if (templateError || !template) {
    return { success: false, error: "Could not save template" };
  }

  const { error: exercisesError } = await supabase
    .from("workout_template_exercises")
    .insert(
      parsed.data.exercises.map((exercise, index) => ({
        user_id: user.id,
        template_id: template.id,
        exercise_id: exercise.exerciseId,
        position: index,
        target_sets: exercise.targetSets ?? null,
        target_reps: exercise.targetReps ?? null,
        target_weight_kg: exercise.targetWeightKg ?? null,
        target_duration_min: exercise.targetDurationMin ?? null,
        rest_seconds: exercise.restSeconds,
      }))
    );

  if (exercisesError) {
    // Best-effort cleanup so a half-written template doesn't linger.
    await supabase.from("workout_templates").delete().eq("id", template.id);
    return { success: false, error: "Could not save template exercises" };
  }

  revalidateExercisePages();
  return { success: true };
}

export async function deleteWorkoutTemplate(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  // Past workouts keep their data; workouts.template_id nulls out via FK.
  const { error } = await supabase
    .from("workout_templates")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: "Could not delete template" };

  revalidateExercisePages();
  return { success: true };
}

export async function deleteWorkoutTemplateFormAction(id: string): Promise<void> {
  await deleteWorkoutTemplate(id);
}

// ---------------------------------------------------------------------
// Workout sessions
// ---------------------------------------------------------------------
export async function startWorkout(
  input: StartWorkoutInput
): Promise<StartWorkoutResult> {
  const parsed = startWorkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid workout" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  // One active workout at a time keeps timers and the resume banner sane.
  const { data: active } = await supabase
    .from("workouts")
    .select("id")
    .eq("user_id", user.id)
    .is("completed_at", null)
    .limit(1)
    .maybeSingle();
  if (active) {
    return { success: false, error: "Finish or discard your active workout first" };
  }

  let name = parsed.data.name?.trim() || "Workout";
  const templateId = parsed.data.templateId ?? null;

  if (templateId) {
    const { data: template, error } = await supabase
      .from("workout_templates")
      .select("name")
      .eq("id", templateId)
      .eq("user_id", user.id)
      .single();
    if (error || !template) return { success: false, error: "Template not found" };
    name = parsed.data.name?.trim() || template.name;
  }

  const { data: workout, error } = await supabase
    .from("workouts")
    .insert({ user_id: user.id, template_id: templateId, name })
    .select("id")
    .single();

  if (error || !workout) return { success: false, error: "Could not start workout" };

  revalidateExercisePages();
  return { success: true, workoutId: workout.id };
}

export async function logSet(input: LogSetInput): Promise<ActionResult> {
  const parsed = logSetSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid set" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .select("id, completed_at")
    .eq("id", parsed.data.workoutId)
    .eq("user_id", user.id)
    .single();
  if (workoutError || !workout) return { success: false, error: "Workout not found" };
  if (workout.completed_at) {
    return { success: false, error: "This workout is already finished" };
  }

  // Re-read the exercise server-side (seed row or the user's own) and
  // snapshot its name/category — never trust these from the client.
  const { data: exerciseData, error: exerciseError } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", parsed.data.exerciseId)
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .single();
  if (exerciseError || !exerciseData) {
    return { success: false, error: "Exercise not found" };
  }
  const exercise = exerciseData as ExerciseRow;

  // set_number counts prior sets of this exercise within the workout.
  const { count } = await supabase
    .from("workout_sets")
    .select("id", { count: "exact", head: true })
    .eq("workout_id", workout.id)
    .eq("user_id", user.id)
    .eq("exercise_id", exercise.id);

  const { error } = await supabase.from("workout_sets").insert({
    user_id: user.id,
    workout_id: workout.id,
    exercise_id: exercise.id,
    exercise_name: exercise.name,
    category: exercise.category,
    set_number: (count ?? 0) + 1,
    reps: parsed.data.reps ?? null,
    weight_kg: parsed.data.weightKg ?? null,
    duration_min: parsed.data.durationMin ?? null,
    distance_km: parsed.data.distanceKm ?? null,
  });

  if (error) return { success: false, error: "Could not log set" };

  revalidateExercisePages();
  return { success: true };
}

export async function deleteSet(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase
    .from("workout_sets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: "Could not delete set" };

  revalidateExercisePages();
  return { success: true };
}

export async function finishWorkout(input: FinishWorkoutInput): Promise<ActionResult> {
  const parsed = finishWorkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid workout" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .select("id, started_at, completed_at")
    .eq("id", parsed.data.workoutId)
    .eq("user_id", user.id)
    .single();
  if (workoutError || !workout) return { success: false, error: "Workout not found" };
  if (workout.completed_at) {
    return { success: false, error: "This workout is already finished" };
  }

  const completedAt = new Date();
  const durationMin = Math.max(
    1,
    Math.round((completedAt.getTime() - new Date(workout.started_at).getTime()) / 60000)
  );

  // Use the user's calories if given; otherwise estimate from MET values
  // of the exercises actually logged and the latest recorded body weight.
  let caloriesBurned = parsed.data.caloriesBurned ?? null;
  if (caloriesBurned === null) {
    caloriesBurned = await estimateWorkoutCalories(supabase, user.id, workout.id, durationMin);
  }

  const { error } = await supabase
    .from("workouts")
    .update({
      completed_at: completedAt.toISOString(),
      duration_min: durationMin,
      calories_burned: caloriesBurned,
      notes: parsed.data.notes || null,
    })
    .eq("id", workout.id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: "Could not finish workout" };

  revalidateExercisePages();
  return { success: true };
}

// Rough kcal estimate: average MET across the distinct exercises logged
// in this workout × latest body weight × duration. Returns null when
// there's no logged weight to estimate from.
async function estimateWorkoutCalories(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  workoutId: string,
  durationMin: number
): Promise<number | null> {
  const [weightResult, setsResult] = await Promise.all([
    supabase
      .from("body_metrics")
      .select("value, unit")
      .eq("user_id", userId)
      .eq("metric_type", "WEIGHT")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("workout_sets")
      .select("exercise_id, exercise:exercises(met_value)")
      .eq("workout_id", workoutId)
      .eq("user_id", userId),
  ]);

  if (!weightResult.data) return null;
  const bodyWeightKg =
    weightResult.data.unit === "lb"
      ? weightResult.data.value * 0.45359237
      : weightResult.data.value;

  const metByExercise = new Map<string, number>();
  for (const row of setsResult.data ?? []) {
    // Without generated DB types the embedded join is loosely typed.
    const exercise = row.exercise as unknown as { met_value: number | null } | null;
    if (row.exercise_id) {
      metByExercise.set(row.exercise_id, exercise?.met_value ?? DEFAULT_MET);
    }
  }
  if (metByExercise.size === 0) return null;

  const mets = [...metByExercise.values()];
  const avgMet = mets.reduce((sum, met) => sum + met, 0) / mets.length;

  return Math.round(
    estimateCaloriesBurned({ metValue: avgMet, bodyWeightKg, durationMin })
  );
}

// Discard an in-progress (or logged) workout entirely; sets cascade.
export async function deleteWorkout(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: "Could not delete workout" };

  revalidateExercisePages();
  return { success: true };
}

export async function deleteWorkoutFormAction(id: string): Promise<void> {
  await deleteWorkout(id);
}
