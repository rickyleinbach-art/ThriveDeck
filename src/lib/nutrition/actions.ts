"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  catalogSearchSchema,
  foodItemSchema,
  logFoodSchema,
  nutritionTargetSchema,
  type FoodItemInput,
  type LogFoodInput,
  type NutritionTargetInput,
} from "@/lib/validations/nutrition";
import {
  mapCatalogFood,
  type CatalogFood,
  type CatalogFoodRow,
  type FoodItemRow,
} from "@/lib/nutrition/types";

type ActionResult = { success: true } | { success: false; error: string };

function revalidateNutritionPages() {
  revalidatePath("/nutrition");
  revalidatePath("/nutrition/foods");
  revalidatePath("/nutrition/targets");
  revalidatePath("/dashboard");
}

// Per-serving nutrition columns shared by food_items inserts and the
// snapshot copied into food_logs. serving_unit is a plain string here:
// library rows re-read from the DB aren't narrowed to the Zod enum.
interface NutritionColumns {
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
}

function nutritionColumns(input: FoodItemInput): NutritionColumns {
  return {
    name: input.name,
    brand: input.brand || null,
    serving_size: input.servingSize,
    serving_unit: input.servingUnit,
    calories: input.calories,
    protein_g: input.proteinG,
    carbs_g: input.carbsG,
    fat_g: input.fatG,
    fiber_g: input.fiberG ?? null,
    sugar_g: input.sugarG ?? null,
    sodium_mg: input.sodiumMg ?? null,
  };
}

export async function createFoodItem(input: FoodItemInput): Promise<ActionResult> {
  const parsed = foodItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid food" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase.from("food_items").insert({
    user_id: user.id,
    ...nutritionColumns(parsed.data),
  });

  if (error) return { success: false, error: "Could not save food" };

  revalidateNutritionPages();
  return { success: true };
}

export async function toggleFavoriteFoodItem(
  id: string,
  isFavorite: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase
    .from("food_items")
    .update({ is_favorite: isFavorite })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: "Could not update favorite" };

  revalidateNutritionPages();
  return { success: true };
}

// Adapter for <form action={...}> which requires a void-returning function.
export async function toggleFavoriteFoodItemFormAction(
  id: string,
  isFavorite: boolean
): Promise<void> {
  await toggleFavoriteFoodItem(id, isFavorite);
}

export async function deleteFoodItem(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  // Past logs keep their snapshot; food_logs.food_item_id nulls out via FK.
  const { error } = await supabase
    .from("food_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: "Could not delete food" };

  revalidateNutritionPages();
  return { success: true };
}

export async function deleteFoodItemFormAction(id: string): Promise<void> {
  await deleteFoodItem(id);
}

// Type-ahead search over the shared USDA catalog. Called from the log-food
// form as the user types; RLS limits it to signed-in users.
export async function searchCatalogFoods(query: string): Promise<CatalogFood[]> {
  const parsed = catalogSearchSchema.safeParse({ query });
  if (!parsed.success) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Escape ilike wildcards so users can search for literal text.
  const term = parsed.data.query.replace(/[%_\\]/g, "\\$&");
  const { data, error } = await supabase.rpc("search_catalog_foods", {
    search_term: term,
  });

  if (error || !data) return [];
  return (data as CatalogFoodRow[]).map(mapCatalogFood);
}

export async function logFood(input: LogFoodInput): Promise<ActionResult> {
  const parsed = logFoodSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  let snapshot: ReturnType<typeof nutritionColumns>;
  let foodItemId: string | null = null;

  if (parsed.data.foodItemId) {
    // Re-read the library row server-side (RLS-scoped) and snapshot it —
    // never trust nutrition values sent from the client for library foods.
    const { data, error } = await supabase
      .from("food_items")
      .select("*")
      .eq("id", parsed.data.foodItemId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) return { success: false, error: "Food not found" };
    const item = data as FoodItemRow;
    foodItemId = item.id;
    snapshot = {
      name: item.name,
      brand: item.brand,
      serving_size: item.serving_size,
      serving_unit: item.serving_unit,
      calories: item.calories,
      protein_g: item.protein_g,
      carbs_g: item.carbs_g,
      fat_g: item.fat_g,
      fiber_g: item.fiber_g,
      sugar_g: item.sugar_g,
      sodium_mg: item.sodium_mg,
    };
  } else if (parsed.data.catalogFoodId) {
    // Same server-side re-read for catalog picks — catalog nutrition is
    // per 100 g, so the snapshot serving is 100 g.
    const { data, error } = await supabase
      .from("catalog_foods")
      .select("*")
      .eq("id", parsed.data.catalogFoodId)
      .single();

    if (error || !data) return { success: false, error: "Food not found" };
    const item = data as CatalogFoodRow;
    snapshot = {
      name: item.name,
      brand: null,
      serving_size: 100,
      serving_unit: "g",
      calories: item.calories,
      protein_g: item.protein_g,
      carbs_g: item.carbs_g,
      fat_g: item.fat_g,
      fiber_g: item.fiber_g,
      sugar_g: item.sugar_g,
      sodium_mg: item.sodium_mg,
    };

    if (parsed.data.saveToLibrary) {
      const { data: created } = await supabase
        .from("food_items")
        .insert({ user_id: user.id, source: "USDA", ...snapshot })
        .select("id")
        .single();
      foodItemId = created?.id ?? null;
    }
  } else {
    const custom = parsed.data.custom!;
    snapshot = nutritionColumns(custom);

    if (parsed.data.saveToLibrary) {
      const { data: created } = await supabase
        .from("food_items")
        .insert({ user_id: user.id, ...snapshot })
        .select("id")
        .single();
      foodItemId = created?.id ?? null;
    }
  }

  const { error } = await supabase.from("food_logs").insert({
    user_id: user.id,
    food_item_id: foodItemId,
    meal_type: parsed.data.mealType,
    logged_on: parsed.data.loggedOn,
    servings: parsed.data.servings,
    ...snapshot,
  });

  if (error) return { success: false, error: "Could not log food" };

  revalidateNutritionPages();
  return { success: true };
}

export async function deleteFoodLog(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase
    .from("food_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: "Could not delete entry" };

  revalidateNutritionPages();
  return { success: true };
}

export async function deleteFoodLogFormAction(id: string): Promise<void> {
  await deleteFoodLog(id);
}

export async function saveNutritionTarget(
  input: NutritionTargetInput
): Promise<ActionResult> {
  const parsed = nutritionTargetSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid targets" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase.from("nutrition_targets").upsert(
    {
      user_id: user.id,
      calories: parsed.data.calories,
      protein_g: parsed.data.proteinG,
      carbs_g: parsed.data.carbsG,
      fat_g: parsed.data.fatG,
      fiber_g: parsed.data.fiberG ?? null,
    },
    { onConflict: "user_id" }
  );

  if (error) return { success: false, error: "Could not save targets" };

  revalidateNutritionPages();
  return { success: true };
}
