"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  MEAL_LABELS,
  MEAL_TYPES,
  SERVING_UNITS,
  logFoodSchema,
  type MealType,
  type ServingUnit,
} from "@/lib/validations/nutrition";
import { logFood } from "@/lib/nutrition/actions";
import type { FoodItem } from "@/lib/nutrition/types";

const CUSTOM = "__custom__";

export function LogFoodForm({ date, foodItems }: { date: string; foodItems: FoodItem[] }) {
  const router = useRouter();
  const [mealType, setMealType] = useState<MealType>("BREAKFAST");
  const [foodId, setFoodId] = useState<string>(foodItems[0]?.id ?? CUSTOM);
  const [servings, setServings] = useState("1");

  // Custom-entry fields (only used when foodId === CUSTOM).
  const [name, setName] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [servingUnit, setServingUnit] = useState<ServingUnit>("g");
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const [saveToLibrary, setSaveToLibrary] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isCustom = foodId === CUSTOM;
  const selectedFood = foodItems.find((f) => f.id === foodId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = logFoodSchema.safeParse({
      mealType,
      loggedOn: date,
      servings: Number(servings),
      foodItemId: isCustom ? undefined : foodId,
      custom: isCustom
        ? {
            name,
            servingSize: Number(servingSize),
            servingUnit,
            calories: Number(calories),
            proteinG: Number(proteinG) || 0,
            carbsG: Number(carbsG) || 0,
            fatG: Number(fatG) || 0,
          }
        : undefined,
      saveToLibrary: isCustom ? saveToLibrary : undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your entry");
      return;
    }

    setSubmitting(true);
    const result = await logFood(parsed.data);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setServings("1");
    setName("");
    setServingSize("");
    setCalories("");
    setProteinG("");
    setCarbsG("");
    setFatG("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="mealType">Meal</Label>
          <Select
            id="mealType"
            value={mealType}
            onChange={(e) => setMealType(e.target.value as MealType)}
          >
            {MEAL_TYPES.map((meal) => (
              <option key={meal} value={meal}>
                {MEAL_LABELS[meal]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="servings">Servings</Label>
          <Input
            id="servings"
            type="number"
            inputMode="decimal"
            step="0.25"
            min="0.25"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="food">Food</Label>
        <Select id="food" value={foodId} onChange={(e) => setFoodId(e.target.value)}>
          {foodItems.map((food) => (
            <option key={food.id} value={food.id}>
              {food.isFavorite ? "★ " : ""}
              {food.name}
              {food.brand ? ` (${food.brand})` : ""}
            </option>
          ))}
          <option value={CUSTOM}>+ Custom entry…</option>
        </Select>
        {selectedFood && (
          <p className="text-xs text-muted-foreground">
            Per {selectedFood.servingSize} {selectedFood.servingUnit}:{" "}
            {Math.round(selectedFood.calories)} kcal · {Math.round(selectedFood.proteinG)}g
            protein · {Math.round(selectedFood.carbsG)}g carbs · {Math.round(selectedFood.fatG)}g
            fat
          </p>
        )}
      </div>

      {isCustom && (
        <div className="space-y-4 rounded-lg border border-border p-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Greek yogurt bowl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="servingSize">Serving size</Label>
              <Input
                id="servingSize"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
                placeholder="e.g. 100"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="servingUnit">Unit</Label>
              <Select
                id="servingUnit"
                value={servingUnit}
                onChange={(e) => setServingUnit(e.target.value as ServingUnit)}
              >
                {SERVING_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proteinG">Protein (g)</Label>
              <Input
                id="proteinG"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={proteinG}
                onChange={(e) => setProteinG(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="carbsG">Carbs (g)</Label>
              <Input
                id="carbsG"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={carbsG}
                onChange={(e) => setCarbsG(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fatG">Fat (g)</Label>
              <Input
                id="fatG"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={fatG}
                onChange={(e) => setFatG(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={saveToLibrary}
              onChange={(e) => setSaveToLibrary(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            Save to my foods for next time
          </label>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Logging…" : "Log food"}
      </Button>
    </form>
  );
}
