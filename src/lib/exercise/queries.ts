import { createClient } from "@/lib/supabase/server";
import {
  mapExercise,
  mapWorkout,
  mapWorkoutSet,
  mapWorkoutTemplate,
  type Exercise,
  type ExerciseRow,
  type Workout,
  type WorkoutRow,
  type WorkoutSet,
  type WorkoutSetRow,
  type WorkoutTemplate,
  type WorkoutTemplateRow,
} from "@/lib/exercise/types";
import type { UnitSystem } from "@/lib/exercise/calculations";

// Server-side reads. RLS scopes every query to the signed-in user already;
// the explicit user filters below are defense in depth, not the boundary.

// Seed rows (user_id null) plus the user's custom exercises.
export async function getExercises(): Promise<Exercise[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order("name", { ascending: true });

  if (error || !data) return [];
  return (data as ExerciseRow[]).map(mapExercise);
}

export async function getWorkoutTemplates(): Promise<WorkoutTemplate[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("workout_templates")
    .select(
      "*, workout_template_exercises(*, exercise:exercises(id, name, category))"
    )
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error || !data) return [];
  return (data as WorkoutTemplateRow[]).map(mapWorkoutTemplate);
}

// The in-progress workout, if any (completed_at is null).
export async function getActiveWorkout(): Promise<Workout | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("workouts")
    .select("*, workout_sets(*)")
    .eq("user_id", user.id)
    .is("completed_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return mapWorkout(data as WorkoutRow);
}

export async function getWorkout(id: string): Promise<Workout | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("workouts")
    .select("*, workout_sets(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return mapWorkout(data as WorkoutRow);
}

// Completed workouts, newest first, sets included (for volume/summary).
export async function getWorkoutHistory(limit = 50): Promise<Workout[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("workouts")
    .select("*, workout_sets(*)")
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as WorkoutRow[]).map(mapWorkout);
}

// Every strength set with weight + reps, for PR computation.
export async function getStrengthSets(): Promise<WorkoutSet[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("workout_sets")
    .select("*")
    .eq("user_id", user.id)
    .eq("category", "STRENGTH")
    .not("weight_kg", "is", null)
    .not("reps", "is", null)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as WorkoutSetRow[]).map(mapWorkoutSet);
}

// Profile unit system (Module 1, read-only) for weight/distance display.
export async function getUnitSystem(): Promise<UnitSystem> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "METRIC";

  const { data } = await supabase
    .from("profiles")
    .select("unit_system")
    .eq("id", user.id)
    .maybeSingle();

  return data?.unit_system === "IMPERIAL" ? "IMPERIAL" : "METRIC";
}
