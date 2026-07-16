import type { FoodLog } from "@/lib/nutrition/types";
import type {
  CalculatorGoal,
  MacroCalculatorInput,
} from "@/lib/validations/nutrition";

// ---------------------------------------------------------------------
// Daily totals
// ---------------------------------------------------------------------
export interface DayTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  sodiumMg: number;
}

// Log rows store per-serving values; scale by servings when summing.
export function dayTotals(logs: FoodLog[]): DayTotals {
  return logs.reduce(
    (totals, log) => ({
      calories: totals.calories + log.calories * log.servings,
      proteinG: totals.proteinG + log.proteinG * log.servings,
      carbsG: totals.carbsG + log.carbsG * log.servings,
      fatG: totals.fatG + log.fatG * log.servings,
      fiberG: totals.fiberG + (log.fiberG ?? 0) * log.servings,
      sugarG: totals.sugarG + (log.sugarG ?? 0) * log.servings,
      sodiumMg: totals.sodiumMg + (log.sodiumMg ?? 0) * log.servings,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, sugarG: 0, sodiumMg: 0 }
  );
}

// ---------------------------------------------------------------------
// Macro / protein calculator
// These are standard population estimates (Mifflin-St Jeor + activity
// multipliers), presented as a starting point — not medical advice.
// ---------------------------------------------------------------------
const ACTIVITY_MULTIPLIERS: Record<MacroCalculatorInput["activityLevel"], number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

// Daily calorie adjustment relative to maintenance (~0.5 kg/week when losing).
const GOAL_CALORIE_ADJUSTMENT: Record<CalculatorGoal, number> = {
  LOSE: -500,
  MAINTAIN: 0,
  GAIN: 300,
};

// Protein in g per kg bodyweight — higher while losing to preserve lean mass.
const GOAL_PROTEIN_PER_KG: Record<CalculatorGoal, number> = {
  LOSE: 2.0,
  MAINTAIN: 1.6,
  GAIN: 1.8,
};

const FAT_CALORIE_SHARE = 0.275; // middle of the common 25–30% range
const MIN_CALORIES = 1200;

export function mifflinStJeorBmr(input: {
  sex: MacroCalculatorInput["sex"];
  age: number;
  heightCm: number;
  weightKg: number;
}): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  if (input.sex === "MALE") return base + 5;
  if (input.sex === "FEMALE") return base - 161;
  // No published equation exists for other/unspecified — use the midpoint.
  return base - 78;
}

export interface MacroTargets {
  bmr: number;
  tdee: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export function calculateMacroTargets(input: MacroCalculatorInput): MacroTargets {
  const bmr = mifflinStJeorBmr(input);
  const tdee = bmr * ACTIVITY_MULTIPLIERS[input.activityLevel];
  const calories = Math.max(
    MIN_CALORIES,
    Math.round(tdee + GOAL_CALORIE_ADJUSTMENT[input.goal])
  );

  const proteinG = Math.round(input.weightKg * GOAL_PROTEIN_PER_KG[input.goal]);
  const fatG = Math.round((calories * FAT_CALORIE_SHARE) / 9);
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories,
    proteinG,
    carbsG,
    fatG,
  };
}

export function ageFromDateOfBirth(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const hadBirthday =
    now.getMonth() > dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hadBirthday) age -= 1;
  return age;
}
