import { z } from "zod";

// Mirrors prisma/schema.prisma MealType / FoodSource.
export const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const FOOD_SOURCES = [
  "MANUAL",
  "BARCODE",
  "USDA",
  "RESTAURANT",
  "LABEL_SCAN",
] as const;
export type FoodSource = (typeof FOOD_SOURCES)[number];

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

// Logging references a library food or a shared catalog food (the server
// re-reads and snapshots either one), or carries a full custom entry inline.
export const logFoodSchema = z
  .object({
    mealType: z.enum(MEAL_TYPES),
    loggedOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
    servings: z.number().positive("Servings must be greater than 0").max(100),
    foodItemId: z.string().uuid().optional(),
    catalogFoodId: z.string().uuid().optional(),
    custom: foodItemSchema.optional(),
    saveToLibrary: z.boolean().optional(),
    // Provenance (Phase 2 label scan). Optional so existing callers are
    // unaffected; only written to food_logs when present.
    source: z.enum(FOOD_SOURCES).optional(),
    extractedJson: z.unknown().optional(),
  })
  .refine((data) => data.foodItemId || data.catalogFoodId || data.custom, {
    message: "Pick a food or enter one manually",
    path: ["foodItemId"],
  });

export const catalogSearchSchema = z.object({
  query: z.string().trim().min(2, "Type at least 2 characters").max(100),
});

export type LogFoodInput = z.infer<typeof logFoodSchema>;

// ---------------------------------------------------------------------------
// Nutrition-label camera extraction
// ---------------------------------------------------------------------------
// The label-extraction API route asks the model to return JSON matching this
// exact shape. We never trust the model's output — every field is validated and
// range-clamped server-side before it reaches the client. Values are per the
// label's stated serving size; nulls mean "not visible / not present".

// Tolerant nullable number: accepts a number, null, "", or a numeric-ish string
// ("2.5", "230mg"), rejecting anything outside [0, max] to null.
const labelNumber = (max: number) =>
  z.preprocess((v) => {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "string") {
      const n = Number(v.replace(/[^0-9.]/g, ""));
      return Number.isFinite(n) ? n : null;
    }
    return v;
  }, z.number().min(0).max(max).nullable().catch(null));

export const extractedLabelSchema = z.object({
  serving_size: z.string().max(120).nullable().catch(null),
  servings_per_container: labelNumber(10000),
  calories: labelNumber(10000),
  total_fat_g: labelNumber(1000),
  saturated_fat_g: labelNumber(1000),
  trans_fat_g: labelNumber(1000),
  cholesterol_mg: labelNumber(100000),
  sodium_mg: labelNumber(100000),
  total_carb_g: labelNumber(1000),
  fiber_g: labelNumber(500),
  total_sugars_g: labelNumber(1000),
  added_sugars_g: labelNumber(1000),
  protein_g: labelNumber(1000),
  confidence: z.enum(["high", "medium", "low"]).catch("low"),
});

export type ExtractedLabel = z.infer<typeof extractedLabelSchema>;

// Payload the client POSTs to /api/nutrition/extract-label.
export const extractLabelRequestSchema = z.object({
  imageBase64: z.string().min(1).max(9_000_000), // ~6.7 MB decoded ceiling
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
});

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
