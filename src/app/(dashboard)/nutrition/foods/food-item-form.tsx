"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  SERVING_UNITS,
  foodItemSchema,
  type ServingUnit,
} from "@/lib/validations/nutrition";
import { createFoodItem } from "@/lib/nutrition/actions";

export function FoodItemForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [servingUnit, setServingUnit] = useState<ServingUnit>("g");
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const [fiberG, setFiberG] = useState("");
  const [sugarG, setSugarG] = useState("");
  const [sodiumMg, setSodiumMg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = foodItemSchema.safeParse({
      name,
      brand: brand || undefined,
      servingSize: Number(servingSize),
      servingUnit,
      calories: Number(calories),
      proteinG: Number(proteinG) || 0,
      carbsG: Number(carbsG) || 0,
      fatG: Number(fatG) || 0,
      fiberG: fiberG ? Number(fiberG) : undefined,
      sugarG: sugarG ? Number(sugarG) : undefined,
      sodiumMg: sodiumMg ? Number(sodiumMg) : undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the food details");
      return;
    }

    setSubmitting(true);
    const result = await createFoodItem(parsed.data);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setName("");
    setBrand("");
    setServingSize("");
    setCalories("");
    setProteinG("");
    setCarbsG("");
    setFatG("");
    setFiberG("");
    setSugarG("");
    setSodiumMg("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rolled oats"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="brand">Brand (optional)</Label>
        <Input
          id="brand"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="e.g. Quaker"
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
            placeholder="e.g. 40"
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="fiberG">Fiber (g)</Label>
          <Input
            id="fiberG"
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={fiberG}
            onChange={(e) => setFiberG(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sugarG">Sugar (g)</Label>
          <Input
            id="sugarG"
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={sugarG}
            onChange={(e) => setSugarG(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sodiumMg">Sodium (mg)</Label>
          <Input
            id="sodiumMg"
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={sodiumMg}
            onChange={(e) => setSodiumMg(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Saving…" : "Add food"}
      </Button>
    </form>
  );
}
