import { z } from "zod";

// Mirrors prisma/schema.prisma MealType / FoodSource.
export const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snacks",
};

export const SERVING_UNITS = [
  "g",
  "ml",
  "oz",
  "cup",
  "tbsp",
  "piece",
  "slice",
  "serving",
] as const;
export type ServingUnit = (typeof SERVING_UNITS)[number];

// Per-serving nutrition facts, shared by the food library and log snapshots.
const nutritionFactsShape = {
  calories: z.number().min(0, "Calories can't be negative").max(10000),
  proteinG: z.number().min(0).max(1000),
  carbsG: z.number().min(0).max(1000),
  fatG: z.number().min(0).max(1000),
  fiberG: z.number().min(0).max(500).optional(),
  sugarG: z.number().min(0).max(1000).optional(),
  sodiumMg: z.number().min(0).max(50000).optional(),
};

export const foodItemSchema = z.object({
  name: z.string().min(1, "Give this food a name").max(200),
  brand: z.string().max(120).optional(),
  servingSize: z.number().positive("Serving size must be greater than 0").max(10000),
  servingUnit: z.enum(SERVING_UNITS),
  ...nutritionFactsShape,
});

export type FoodItemInput = z.infer<typeof foodItemSchema>;

// Logging either references a library food (server re-reads and snapshots it)
// or carries a full custom entry inline.
export const logFoodSchema = z
  .object({
    mealType: z.enum(MEAL_TYPES),
    loggedOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
    servings: z.number().positive("Servings must be greater than 0").max(100),
    foodItemId: z.string().uuid().optional(),
    custom: foodItemSchema.optional(),
    saveToLibrary: z.boolean().optional(),
  })
  .refine((data) => data.foodItemId || data.custom, {
    message: "Pick a food or enter one manually",
    path: ["foodItemId"],
  });

export type LogFoodInput = z.infer<typeof logFoodSchema>;

export const nutritionTargetSchema = z.object({
  calories: z.number().min(0).max(20000),
  proteinG: z.number().min(0).max(2000),
  carbsG: z.number().min(0).max(2000),
  fatG: z.number().min(0).max(2000),
  fiberG: z.number().min(0).max(500).optional(),
});

export type NutritionTargetInput = z.infer<typeof nutritionTargetSchema>;

// Inputs to the macro/protein calculator. Prefilled from the profile and the
// latest logged weight, but fully editable — the calculator never writes back
// to the profile.
export const CALCULATOR_GOALS = ["LOSE", "MAINTAIN", "GAIN"] as const;
export type CalculatorGoal = (typeof CALCULATOR_GOALS)[number];

export const GOAL_LABELS: Record<CalculatorGoal, string> = {
  LOSE: "Lose weight",
  MAINTAIN: "Maintain",
  GAIN: "Gain muscle",
};

export const macroCalculatorSchema = z.object({
  sex: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]),
  age: z.number().int().min(13, "Must be at least 13").max(120),
  heightCm: z.number().positive().max(300),
  weightKg: z.number().positive().max(500),
  activityLevel: z.enum(["SEDENTARY", "LIGHT", "MODERATE", "ACTIVE", "VERY_ACTIVE"]),
  goal: z.enum(CALCULATOR_GOALS),
});

export type MacroCalculatorInput = z.infer<typeof macroCalculatorSchema>;
