import { z } from "zod";

// Habits (Module 6). One flexible model: a habit is either a plain
// daily check, a quantity (oz, steps, …), a duration (min, hours), or
// a 1–10 rating (mood / energy / stress). Mirrors prisma/schema.prisma.

export const HABIT_TYPES = [
  "SLEEP",
  "WATER",
  "MEDITATION",
  "READING",
  "STRETCHING",
  "PROTEIN",
  "FIBER",
  "SUPPLEMENTS",
  "STEPS",
  "WALK",
  "ROUTINE",
  "SUNLIGHT",
  "MOOD",
  "ENERGY",
  "STRESS",
  "CUSTOM",
] as const;
export type HabitType = (typeof HABIT_TYPES)[number];

export const HABIT_GOAL_TYPES = ["CHECK", "QUANTITY", "DURATION", "RATING"] as const;
export type HabitGoalType = (typeof HABIT_GOAL_TYPES)[number];

export const HABIT_GOAL_TYPE_LABELS: Record<HabitGoalType, string> = {
  CHECK: "Done / not done",
  QUANTITY: "Hit an amount",
  DURATION: "Time spent",
  RATING: "Rate 1–10",
};

export const RATING_MIN = 1;
export const RATING_MAX = 10;

// 0 = Sunday … 6 = Saturday, matching Date#getUTCDay().
export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const habitSchema = z
  .object({
    name: z.string().min(1, "Name your habit").max(120),
    habitType: z.enum(HABIT_TYPES).default("CUSTOM"),
    goalType: z.enum(HABIT_GOAL_TYPES),
    targetValue: z
      .number()
      .positive("Target must be greater than 0")
      .max(1000000)
      .optional(),
    unit: z.string().max(30).optional(),
    scheduleDays: z
      .array(z.number().int().min(0).max(6))
      .min(1, "Pick at least one day")
      .max(7),
  })
  .refine(
    (data) =>
      data.goalType !== "QUANTITY" && data.goalType !== "DURATION"
        ? true
        : data.targetValue !== undefined,
    { message: "Set a daily target", path: ["targetValue"] }
  );

export type HabitInput = z.infer<typeof habitSchema>;

// value: 1 for a check, the measured amount for quantity/duration, or
// the 1–10 score for ratings (range enforced server-side per habit).
export const habitLogSchema = z.object({
  habitId: z.string().uuid(),
  loggedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  value: z.number().min(0).max(1000000),
  notes: z.string().max(500).optional(),
});

export type HabitLogInput = z.infer<typeof habitLogSchema>;
