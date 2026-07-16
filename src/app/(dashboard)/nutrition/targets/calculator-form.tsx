"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  CALCULATOR_GOALS,
  GOAL_LABELS,
  macroCalculatorSchema,
  type CalculatorGoal,
  type MacroCalculatorInput,
} from "@/lib/validations/nutrition";
import { calculateMacroTargets, type MacroTargets } from "@/lib/nutrition/calculations";
import { saveNutritionTarget } from "@/lib/nutrition/actions";

const SEX_OPTIONS: { value: MacroCalculatorInput["sex"]; label: string }[] = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

const ACTIVITY_OPTIONS: {
  value: MacroCalculatorInput["activityLevel"];
  label: string;
}[] = [
  { value: "SEDENTARY", label: "Sedentary (desk job, little exercise)" },
  { value: "LIGHT", label: "Light (1–3 workouts/week)" },
  { value: "MODERATE", label: "Moderate (3–5 workouts/week)" },
  { value: "ACTIVE", label: "Active (6–7 workouts/week)" },
  { value: "VERY_ACTIVE", label: "Very active (physical job + training)" },
];

export interface CalculatorDefaults {
  sex?: MacroCalculatorInput["sex"];
  age?: number;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: MacroCalculatorInput["activityLevel"];
}

export function CalculatorForm({ defaults }: { defaults: CalculatorDefaults }) {
  const router = useRouter();
  const [sex, setSex] = useState<MacroCalculatorInput["sex"]>(defaults.sex ?? "PREFER_NOT_TO_SAY");
  const [age, setAge] = useState(defaults.age?.toString() ?? "");
  const [heightCm, setHeightCm] = useState(
    defaults.heightCm ? defaults.heightCm.toFixed(0) : ""
  );
  const [weightKg, setWeightKg] = useState(
    defaults.weightKg ? defaults.weightKg.toFixed(1) : ""
  );
  const [activityLevel, setActivityLevel] = useState<
    MacroCalculatorInput["activityLevel"]
  >(defaults.activityLevel ?? "MODERATE");
  const [goal, setGoal] = useState<CalculatorGoal>("LOSE");

  const [result, setResult] = useState<MacroTargets | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const parsed = macroCalculatorSchema.safeParse({
      sex,
      age: Number(age),
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      activityLevel,
      goal,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details");
      setResult(null);
      return;
    }

    setResult(calculateMacroTargets(parsed.data));
  }

  async function handleSave() {
    if (!result) return;
    setError(null);
    setSaving(true);
    const response = await saveNutritionTarget({
      calories: result.calories,
      proteinG: result.proteinG,
      carbsG: result.carbsG,
      fatG: result.fatG,
    });
    setSaving(false);

    if (!response.success) {
      setError(response.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCalculate} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="sex">Sex</Label>
            <Select
              id="sex"
              value={sex}
              onChange={(e) => setSex(e.target.value as MacroCalculatorInput["sex"])}
            >
              {SEX_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              inputMode="numeric"
              min="13"
              max="120"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="heightCm">Height (cm)</Label>
            <Input
              id="heightCm"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="weightKg">Weight (kg)</Label>
            <Input
              id="weightKg"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="activityLevel">Activity level</Label>
            <Select
              id="activityLevel"
              value={activityLevel}
              onChange={(e) =>
                setActivityLevel(e.target.value as MacroCalculatorInput["activityLevel"])
              }
            >
              {ACTIVITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal">Goal</Label>
            <Select
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value as CalculatorGoal)}
            >
              {CALCULATOR_GOALS.map((g) => (
                <option key={g} value={g}>
                  {GOAL_LABELS[g]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <Button type="submit" variant="outline" className="w-full">
          Calculate
        </Button>
      </form>

      {result && (
        <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Calories</p>
              <p className="text-lg font-semibold">{result.calories.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Protein</p>
              <p className="text-lg font-semibold">{result.proteinG} g</p>
            </div>
            <div>
              <p className="text-muted-foreground">Carbs</p>
              <p className="text-lg font-semibold">{result.carbsG} g</p>
            </div>
            <div>
              <p className="text-muted-foreground">Fat</p>
              <p className="text-lg font-semibold">{result.fatG} g</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Estimated maintenance: {result.tdee.toLocaleString()} kcal/day (BMR{" "}
            {result.bmr.toLocaleString()}).
          </p>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save as my daily targets"}
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
