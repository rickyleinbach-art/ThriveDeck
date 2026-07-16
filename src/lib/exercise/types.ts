import type {
  ExerciseCategory,
  MuscleGroup,
} from "@/lib/validations/exercise";

// Raw shape returned by Supabase (snake_case columns from exercises).
export interface ExerciseRow {
  id: string;
  user_id: string | null;
  name: string;
  category: ExerciseCategory;
  muscle_group: MuscleGroup | null;
  equipment: string | null;
  met_value: number | null;
  description: string | null;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroup: MuscleGroup | null;
  equipment: string | null;
  metValue: number | null;
  description: string | null;
  isCustom: boolean; // user-created (user_id set) vs shared seed row
}

export function mapExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    muscleGroup: row.muscle_group,
    equipment: row.equipment,
    metValue: row.met_value,
    description: row.description,
    isCustom: row.user_id !== null,
  };
}

export interface TemplateExerciseRow {
  id: string;
  template_id: string;
  exercise_id: string;
  position: number;
  target_sets: number | null;
  target_reps: number | null;
  target_weight_kg: number | null;
  target_duration_min: number | null;
  rest_seconds: number;
  // Embedded via the exercise_id FK.
  exercise: {
    id: string;
    name: string;
    category: ExerciseCategory;
  } | null;
}

export interface TemplateExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  category: ExerciseCategory;
  position: number;
  targetSets: number | null;
  targetReps: number | null;
  targetWeightKg: number | null;
  targetDurationMin: number | null;
  restSeconds: number;
}

export interface WorkoutTemplateRow {
  id: string;
  user_id: string;
  name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  workout_template_exercises: TemplateExerciseRow[];
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  notes: string | null;
  exercises: TemplateExercise[];
}

export function mapWorkoutTemplate(row: WorkoutTemplateRow): WorkoutTemplate {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    exercises: row.workout_template_exercises
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((te) => ({
        id: te.id,
        exerciseId: te.exercise_id,
        exerciseName: te.exercise?.name ?? "Unknown exercise",
        category: te.exercise?.category ?? "STRENGTH",
        position: te.position,
        targetSets: te.target_sets,
        targetReps: te.target_reps,
        targetWeightKg: te.target_weight_kg,
        targetDurationMin: te.target_duration_min,
        restSeconds: te.rest_seconds,
      })),
  };
}

export interface WorkoutSetRow {
  id: string;
  user_id: string;
  workout_id: string;
  exercise_id: string | null;
  exercise_name: string;
  category: ExerciseCategory;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  duration_min: number | null;
  distance_km: number | null;
  created_at: string;
}

export interface WorkoutSet {
  id: string;
  workoutId: string;
  exerciseId: string | null;
  exerciseName: string;
  category: ExerciseCategory;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  durationMin: number | null;
  distanceKm: number | null;
  createdAt: string;
}

export function mapWorkoutSet(row: WorkoutSetRow): WorkoutSet {
  return {
    id: row.id,
    workoutId: row.workout_id,
    exerciseId: row.exercise_id,
    exerciseName: row.exercise_name,
    category: row.category,
    setNumber: row.set_number,
    reps: row.reps,
    weightKg: row.weight_kg,
    durationMin: row.duration_min,
    distanceKm: row.distance_km,
    createdAt: row.created_at,
  };
}

export interface WorkoutRow {
  id: string;
  user_id: string;
  template_id: string | null;
  name: string;
  started_at: string;
  completed_at: string | null;
  duration_min: number | null;
  calories_burned: number | null;
  notes: string | null;
  created_at: string;
  workout_sets?: WorkoutSetRow[];
}

export interface Workout {
  id: string;
  templateId: string | null;
  name: string;
  startedAt: string;
  completedAt: string | null;
  durationMin: number | null;
  caloriesBurned: number | null;
  notes: string | null;
  sets: WorkoutSet[];
}

export function mapWorkout(row: WorkoutRow): Workout {
  return {
    id: row.id,
    templateId: row.template_id,
    name: row.name,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    durationMin: row.duration_min,
    caloriesBurned: row.calories_burned,
    notes: row.notes,
    sets: (row.workout_sets ?? [])
      .slice()
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(mapWorkoutSet),
  };
}
