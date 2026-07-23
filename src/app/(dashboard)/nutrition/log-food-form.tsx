"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
import { logFood, searchCatalogFoods } from "@/lib/nutrition/actions";
import type { CatalogFood, FoodItem } from "@/lib/nutrition/types";

const CUSTOM = "__custom__";
const CATALOG = "__catalog__";

function facts(food: { calories: number; proteinG: number; carbsG: number; fatG: number }) {
  return `${Math.round(food.calories)} kcal · ${Math.round(food.proteinG)}g protein · ${Math.round(
    food.carbsG
  )}g carbs · ${Math.round(food.fatG)}g fat`;
}

export function LogFoodForm({ date, foodItems }: { date: string; foodItems: FoodItem[] }) {
  const router = useRouter();
  const [mealType, setMealType] = useState<MealType>("BREAKFAST");
  const [foodId, setFoodId] = useState<string>(foodItems[0]?.id ?? CUSTOM);
  const [servings, setServings] = useState("1");

  // Catalog search (USDA, per-100g entries).
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogResults, setCatalogResults] = useState<CatalogFood[]>([]);
  const [searching, setSearching] = useState(false);
  const [catalogFood, setCatalogFood] = useState<CatalogFood | null>(null);
  const searchSeq = useRef(0);

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
  const isCatalog = foodId === CATALOG && catalogFood !== null;
  const selectedFood = foodItems.find((f) => f.id === foodId);

  // Debounced type-ahead against the shared catalog.
  useEffect(() => {
    const query = catalogQuery.trim();
    if (query.length < 2) {
      setCatalogResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const seq = ++searchSeq.current;
    const timer = setTimeout(async () => {
      const results = await searchCatalogFoods(query);
      if (seq === searchSeq.current) {
        setCatalogResults(results);
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [catalogQuery]);

  function selectCatalogFood(food: CatalogFood) {
    setCatalogFood(food);
    setFoodId(CATALOG);
    setCatalogQuery("");
    setCatalogResults([]);
  }

  function handleFoodChange(next: string) {
    setFoodId(next);
    if (next !== CATALOG) setCatalogFood(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = logFoodSchema.safeParse({
      mealType,
      loggedOn: date,
      servings: Number(servings),
      foodItemId: isCustom || isCatalog ? undefined : foodId,
      catalogFoodId: isCatalog ? catalogFood.id : undefined,
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
      saveToLibrary: isCustom || isCatalog ? saveToLibrary : undefined,
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
    setCatalogFood(null);
    if (foodId === CATALOG) setFoodId(foodItems[0]?.id ?? CUSTOM);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <Label htmlFor="servings">
            {isCatalog ? "Servings (×100 g)" : "Servings"}
          </Label>
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
        <Label htmlFor="catalogSearch">Search food catalog</Label>
        <Input
          id="catalogSearch"
          value={catalogQuery}
          onChange={(e) => setCatalogQuery(e.target.value)}
          placeholder="e.g. chicken breast, banana, oats…"
          autoComplete="off"
        />
        {searching && <p className="text-xs text-muted-foreground">Searching…</p>}
        {catalogResults.length > 0 && (
          <ul className="max-h-56 divide-y divide-border overflow-y-auto rounded-lg border border-border">
            {catalogResults.map((food) => (
              <li key={food.id}>
                <button
                  type="button"
                  onClick={() => selectCatalogFood(food)}
                  className="w-full px-3 py-2 text-left transition hover:bg-accent"
                >
                  <p className="text-sm">{food.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Per 100 g: {facts(food)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
        {!searching && catalogQuery.trim().length >= 2 && catalogResults.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No matches — try a simpler term, or use a custom entry below.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="food">Food</Label>
        <Select id="food" value={foodId} onChange={(e) => handleFoodChange(e.target.value)}>
          {catalogFood && (
            <option value={CATALOG}>Catalog: {catalogFood.name}</option>
          )}
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
            Per {selectedFood.servingSize} {selectedFood.servingUnit}: {facts(selectedFood)}
          </p>
        )}
        {isCatalog && (
          <p className="text-xs text-muted-foreground">
            Per 100 g: {facts(catalogFood)} · USDA
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        </div>
      )}

      {(isCustom || isCatalog) && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={saveToLibrary}
            onChange={(e) => setSaveToLibrary(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          Save to my foods for next time
        </label>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Logging…" : "Log food"}
      </Button>
    </form>
  );
}
