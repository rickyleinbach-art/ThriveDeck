import type { MealType } from "@/lib/validations/nutrition";

// Raw shape returned by Supabase (snake_case columns from food_items).
export interface FoodItemRow {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  is_favorite: boolean;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface FoodItem {
  id: string;
  name: string;
  brand: string | null;
  servingSize: number;
  servingUnit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  isFavorite: boolean;
  source: string;
}

export function mapFoodItem(row: FoodItemRow): FoodItem {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    servingSize: row.serving_size,
    servingUnit: row.serving_unit,
    calories: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    fiberG: row.fiber_g,
    sugarG: row.sugar_g,
    sodiumMg: row.sodium_mg,
    isFavorite: row.is_favorite,
    source: row.source,
  };
}

export interface FoodLogRow {
  id: string;
  user_id: string;
  food_item_id: string | null;
  meal_type: MealType;
  logged_on: string;
  servings: number;
  name: string;
  brand: string | null;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  created_at: string;
}

// Nutrition fields hold per-serving values snapshotted at log time;
// multiply by `servings` for what was actually eaten.
export interface FoodLog {
  id: string;
  foodItemId: string | null;
  mealType: MealType;
  loggedOn: string;
  servings: number;
  name: string;
  brand: string | null;
  servingSize: number;
  servingUnit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
}

export function mapFoodLog(row: FoodLogRow): FoodLog {
  return {
    id: row.id,
    foodItemId: row.food_item_id,
    mealType: row.meal_type,
    loggedOn: row.logged_on,
    servings: row.servings,
    name: row.name,
    brand: row.brand,
    servingSize: row.serving_size,
    servingUnit: row.serving_unit,
    calories: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    fiberG: row.fiber_g,
    sugarG: row.sugar_g,
    sodiumMg: row.sodium_mg,
  };
}

export interface NutritionTargetRow {
  id: string;
  user_id: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
  created_at: string;
  updated_at: string;
}

export interface NutritionTarget {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
}

export function mapNutritionTarget(row: NutritionTargetRow): NutritionTarget {
  return {
    calories: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    fiberG: row.fiber_g,
  };
}
