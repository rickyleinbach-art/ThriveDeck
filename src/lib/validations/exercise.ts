import { z } from "zod";

// Mirrors prisma/schema.prisma ExerciseCategory / MuscleGroup.
export const EXERCISE_CATEGORIES = [
  "STRENGTH",
  "CARDIO",
  "HIIT",
  "WALKING",
  "RUNNING",
  "CYCLING",
  "SWIMMING",
  "YOGA",
  "MOBILITY",
  "STRETCHING",
  "RECOVERY",
] as const;
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  STRENGTH: "Strength",
  CARDIO: "Cardio",
  HIIT: "HIIT",
  WALKING: "Walking",
  RUNNING: "Running",
  CYCLING: "Cycling",
  SWIMMING: "Swimming",
  YOGA: "Yoga",
  MOBILITY: "Mobility",
  STRETCHING: "Stretching",
  RECOVERY: "Recovery",
};

export const MUSCLE_GROUPS = [
  "CHEST",
  "BACK",
  "SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "LEGS",
  "GLUTES",
  "CORE",
  "FULL_BODY",
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  CHEST: "Chest",
  BACK: "Back",
  SHOULDERS: "Shoulders",
  BICEPS: "Biceps",
  TRICEPS: "Triceps",
  LEGS: "Legs",
  GLUTES: "Glutes",
  CORE: "Core",
  FULL_BODY: "Full body",
};

// Strength sets log reps + weight; everything else logs duration
// (+ optional distance for the distance-based categories).
export function isStrengthCategory(category: ExerciseCategory): boolean {
  return category === "STRENGTH";
}

export const DISTANCE_CATEGORIES: readonly ExerciseCategory[] = [
  "WALKING",
  "RUNNING",
  "CYCLING",
  "SWIMMING",
];

export const customExerciseSchema = z.object({
  name: z.string().min(1, "Give this exercise a name").max(120),
  category: z.enum(EXERCISE_CATEGORIES),
  muscleGroup: z.enum(MUSCLE_GROUPS).optional(),
  equipment: z.string().max(120).optional(),
  metValue: z.number().positive().max(30).optional(),
  description: z.string().max(500).optional(),
});

export type CustomExerciseInput = z.infer<typeof customExerciseSchema>;

const templateExerciseSchema = z.object({
  exerciseId: z.string().uuid("Pick an exercise"),
  targetSets: z.number().int().min(1).max(50).optional(),
  targetReps: z.number().int().min(1).max(1000).optional(),
  targetWeightKg: z.number().min(0).max(1000).optional(),
  targetDurationMin: z.number().positive().max(1440).optional(),
  restSeconds: z.number().int().min(0).max(3600),
});

export type TemplateExerciseInput = z.infer<typeof templateExerciseSchema>;

export const workoutTemplateSchema = z.object({
  name: z.string().min(1, "Give this workout a name").max(120),
  notes: z.string().max(1000).optional(),
  exercises: z
    .array(templateExerciseSchema)
    .min(1, "Add at least one exercise")
    .max(30, "Keep templates under 30 exercises"),
});

export type WorkoutTemplateInput = z.infer<typeof workoutTemplateSchema>;

// Start either from a template (name copied server-side) or blank.
export const startWorkoutSchema = z
  .object({
    templateId: z.string().uuid().optional(),
    name: z.string().max(120).optional(),
  })
  .refine((data) => data.templateId || data.name?.trim(), {
    message: "Pick a template or name your workout",
    path: ["name"],
  });

export type StartWorkoutInput = z.infer<typeof startWorkoutSchema>;

// A set must record something: reps (strength) or duration (everything else).
export const logSetSchema = z
  .object({
    workoutId: z.string().uuid(),
    exerciseId: z.string().uuid("Pick an exercise"),
    reps: z.number().int().min(0).max(1000).optional(),
    weightKg: z.number().min(0).max(1000).optional(),
    durationMin: z.number().positive().max(1440).optional(),
    distanceKm: z.number().min(0).max(500).optional(),
  })
  .refine((data) => data.reps !== undefined || data.durationMin !== undefined, {
    message: "Log reps or a duration",
    path: ["reps"],
  });

export type LogSetInput = z.infer<typeof logSetSchema>;

export const finishWorkoutSchema = z.object({
  workoutId: z.string().uuid(),
  caloriesBurned: z.number().min(0).max(10000).optional(),
  notes: z.string().max(2000).optional(),
});

export type FinishWorkoutInput = z.infer<typeof finishWorkoutSchema>;
