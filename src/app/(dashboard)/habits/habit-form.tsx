"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { HABIT_PRESETS, getPreset } from "@/lib/habits/presets";
import {
  HABIT_GOAL_TYPE_LABELS,
  HABIT_GOAL_TYPES,
  habitSchema,
  WEEKDAY_LABELS,
  type HabitGoalType,
  type HabitType,
} from "@/lib/validations/habit";
import { createHabit } from "@/lib/habits/actions";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export function HabitForm() {
  const router = useRouter();
  const [habitType, setHabitType] = useState<HabitType>("CUSTOM");
  const [name, setName] = useState("");
  const [goalType, setGoalType] = useState<HabitGoalType>("CHECK");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");
  const [scheduleDays, setScheduleDays] = useState<number[]>(ALL_DAYS);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const needsTarget = goalType === "QUANTITY" || goalType === "DURATION";

  function applyPreset(type: HabitType) {
    const preset = getPreset(type);
    setHabitType(type);
    setName(type === "CUSTOM" ? "" : preset.label);
    setGoalType(preset.goalType);
    setTargetValue(preset.defaultTarget?.toString() ?? "");
    setUnit(preset.unit ?? "");
  }

  function toggleDay(day: number) {
    setScheduleDays((days) =>
      days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort()
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = habitSchema.safeParse({
      name,
      habitType,
      goalType,
      targetValue: needsTarget && targetValue ? Number(targetValue) : undefined,
      unit: unit || undefined,
      scheduleDays,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your entry");
      return;
    }

    setSubmitting(true);
    const result = await createHabit(parsed.data);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    applyPreset("CUSTOM");
    setScheduleDays(ALL_DAYS);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="habitPreset">Start from</Label>
        <Select
          id="habitPreset"
          value={habitType}
          onChange={(e) => applyPreset(e.target.value as HabitType)}
        >
          {HABIT_PRESETS.map((preset) => (
            <option key={preset.type} value={preset.type}>
              {preset.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="habitName">Name</Label>
        <Input
          id="habitName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Evening walk"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="habitGoalType">How you&apos;ll track it</Label>
        <Select
          id="habitGoalType"
          value={goalType}
          onChange={(e) => setGoalType(e.target.value as HabitGoalType)}
        >
          {HABIT_GOAL_TYPES.map((type) => (
            <option key={type} value={type}>
              {HABIT_GOAL_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>
      </div>

      {needsTarget && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="habitTarget">Daily target</Label>
            <Input
              id="habitTarget"
              type="number"
              min="0"
              step="any"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="habitUnit">Unit</Label>
            <Input
              id="habitUnit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="oz, steps, min…"
            />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Days</Label>
        <div className="flex gap-1">
          {WEEKDAY_LABELS.map((label, day) => (
            <button
              key={label}
              type="button"
              onClick={() => toggleDay(day)}
              className={cn(
                "flex-1 rounded-lg border px-1 py-1.5 text-xs font-medium transition",
                scheduleDays.includes(day)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Saving…" : "Add habit"}
      </Button>
    </form>
  );
}
