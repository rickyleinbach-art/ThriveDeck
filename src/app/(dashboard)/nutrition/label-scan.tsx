"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ShieldAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Icon } from "@/components/ui/icon";
import {
  MEAL_LABELS,
  MEAL_TYPES,
  logFoodSchema,
  type ExtractedLabel,
  type MealType,
} from "@/lib/validations/nutrition";
import { logFood } from "@/lib/nutrition/actions";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type Mode = "idle" | "reading" | "review" | "error";

// Per-serving nutrient fields, edited as strings. Scaled by the servings
// stepper for the live totals and multiplied server-side on save.
interface Fields {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
  sodium: string;
}

const EMPTY: Fields = {
  name: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  fiber: "",
  sugar: "",
  sodium: "",
};

function num(s: string): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function fieldsFromExtraction(data: ExtractedLabel): Fields {
  const str = (v: number | null) => (v === null ? "" : String(v));
  return {
    name: "",
    calories: str(data.calories),
    protein: str(data.protein_g),
    carbs: str(data.total_carb_g),
    fat: str(data.total_fat_g),
    fiber: str(data.fiber_g),
    sugar: str(data.total_sugars_g),
    sodium: str(data.sodium_mg),
  };
}

async function fileToBase64(file: File): Promise<string> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  return dataUrl.replace(/^data:.*?;base64,/, "");
}

export function LabelScan({ date }: { date: string }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lowConfidence, setLowConfidence] = useState(false);

  const [fields, setFields] = useState<Fields>(EMPTY);
  const [servingText, setServingText] = useState<string | null>(null);
  const [servings, setServings] = useState(1);
  const [mealType, setMealType] = useState<MealType>("BREAKFAST");
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [raw, setRaw] = useState<ExtractedLabel | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof Fields>(key: K, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function openCamera() {
    setError(null);
    fileInput.current?.click();
  }

  function reset() {
    setMode("idle");
    setError(null);
    setLowConfidence(false);
    setFields(EMPTY);
    setServingText(null);
    setServings(1);
    setRaw(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED.includes(file.type as (typeof ALLOWED)[number])) {
      setError("That image format isn't supported — try a JPEG or PNG photo.");
      setMode("error");
      return;
    }

    setMode("reading");
    setError(null);
    setLowConfidence(false);

    try {
      const imageBase64 = await fileToBase64(file);
      const res = await fetch("/api/nutrition/extract-label", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageBase64, mediaType: file.type }),
      });

      if (res.ok) {
        const { data } = (await res.json()) as { data: ExtractedLabel };
        setRaw(data);
        setFields(fieldsFromExtraction(data));
        setServingText(data.serving_size);
        setServings(1);
        setLowConfidence(data.confidence !== "high");
        setMode("review");
      } else if (res.status === 422) {
        // Low confidence / unreadable → graceful fallback to a manual review.
        setRaw(null);
        setFields(EMPTY);
        setServingText(null);
        setLowConfidence(true);
        setMode("review");
      } else {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Couldn't read the label. Try again.");
        setMode("error");
      }
    } catch {
      setError("Network problem while reading the label. Try again.");
      setMode("error");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = logFoodSchema.safeParse({
      mealType,
      loggedOn: date,
      servings,
      custom: {
        name: fields.name,
        servingSize: 1,
        servingUnit: "serving",
        calories: num(fields.calories),
        proteinG: num(fields.protein),
        carbsG: num(fields.carbs),
        fatG: num(fields.fat),
        fiberG: fields.fiber ? num(fields.fiber) : undefined,
        sugarG: fields.sugar ? num(fields.sugar) : undefined,
        sodiumMg: fields.sodium ? num(fields.sodium) : undefined,
      },
      saveToLibrary,
      source: "LABEL_SCAN",
      extractedJson: raw ?? undefined,
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

    reset();
    router.refresh();
  }

  // Live-scaled totals shown as the servings stepper changes.
  const totals = {
    calories: Math.round(num(fields.calories) * servings),
    protein: Math.round(num(fields.protein) * servings),
    carbs: Math.round(num(fields.carbs) * servings),
    fat: Math.round(num(fields.fat) * servings),
  };

  const hidden = (
    <input
      ref={fileInput}
      type="file"
      accept="image/*"
      capture="environment"
      className="hidden"
      onChange={handleFile}
    />
  );

  if (mode === "idle") {
    return (
      <div>
        {hidden}
        <Button
          type="button"
          variant="outline"
          onClick={openCamera}
          className="w-full justify-center gap-2"
        >
          <Icon icon={Camera} size="sm" />
          Scan a nutrition label
        </Button>
      </div>
    );
  }

  if (mode === "reading") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        {hidden}
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        Reading label…
      </div>
    );
  }

  if (mode === "error") {
    return (
      <div className="space-y-3 rounded-lg border border-destructive/40 bg-card p-4">
        {hidden}
        <p className="text-sm text-destructive">{error}</p>
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={openCamera} className="gap-2">
            <Icon icon={RotateCcw} size="sm" />
            Retake
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setFields(EMPTY);
              setRaw(null);
              setServingText(null);
              setLowConfidence(false);
              setMode("review");
            }}
          >
            Enter manually
          </Button>
        </div>
      </div>
    );
  }

  // review
  return (
    <form
      onSubmit={handleSave}
      className="space-y-4 rounded-lg border border-border bg-card p-4"
    >
      {hidden}

      {lowConfidence && (
        <p className="flex items-start gap-2 rounded-lg bg-accent p-2 text-xs text-accent-foreground">
          <Icon icon={ShieldAlert} size="sm" className="mt-0.5 shrink-0" />
          Double-check these values — the label was hard to read.
        </p>
      )}

      {servingText && (
        <p className="text-xs text-muted-foreground">
          Label serving: <span className="font-medium">{servingText}</span>. Values
          below are per serving.
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="scanName">Name</Label>
        <Input
          id="scanName"
          value={fields.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Chobani vanilla yogurt"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="scanCalories">Calories (per serving)</Label>
          <Input
            id="scanCalories"
            type="number"
            step="any"
            min="0"
            value={fields.calories}
            onChange={(e) => set("calories", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scanProtein">Protein (g)</Label>
          <Input
            id="scanProtein"
            type="number"
            step="any"
            min="0"
            value={fields.protein}
            onChange={(e) => set("protein", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scanCarbs">Carbs (g)</Label>
          <Input
            id="scanCarbs"
            type="number"
            step="any"
            min="0"
            value={fields.carbs}
            onChange={(e) => set("carbs", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scanFat">Fat (g)</Label>
          <Input
            id="scanFat"
            type="number"
            step="any"
            min="0"
            value={fields.fat}
            onChange={(e) => set("fat", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scanFiber">Fiber (g)</Label>
          <Input
            id="scanFiber"
            type="number"
            step="any"
            min="0"
            value={fields.fiber}
            onChange={(e) => set("fiber", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scanSugar">Sugar (g)</Label>
          <Input
            id="scanSugar"
            type="number"
            step="any"
            min="0"
            value={fields.sugar}
            onChange={(e) => set("sugar", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scanSodium">Sodium (mg)</Label>
          <Input
            id="scanSodium"
            type="number"
            step="any"
            min="0"
            value={fields.sodium}
            onChange={(e) => set("sodium", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scanMeal">Meal</Label>
          <Select
            id="scanMeal"
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
      </div>

      {/* Servings stepper — scales all values live */}
      <div className="space-y-1.5">
        <Label htmlFor="scanServings">Servings</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Fewer servings"
            onClick={() => setServings((s) => Math.max(0.25, Math.round((s - 0.25) * 100) / 100))}
          >
            –
          </Button>
          <Input
            id="scanServings"
            type="number"
            inputMode="decimal"
            step="0.25"
            min="0.25"
            value={servings}
            onChange={(e) => setServings(Math.max(0.25, num(e.target.value)))}
            className="w-24 text-center"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="More servings"
            onClick={() => setServings((s) => Math.round((s + 0.25) * 100) / 100)}
          >
            +
          </Button>
        </div>
      </div>

      {/* Live totals for the selected servings */}
      <div className="grid grid-cols-2 gap-3 rounded-lg bg-secondary p-3 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Calories</p>
          <p className="font-semibold">{totals.calories}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Protein</p>
          <p className="font-semibold">{totals.protein} g</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Carbs</p>
          <p className="font-semibold">{totals.carbs} g</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Fat</p>
          <p className="font-semibold">{totals.fat} g</p>
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

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? "Logging…" : "Log food"}
        </Button>
        <Button type="button" variant="outline" onClick={reset}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
