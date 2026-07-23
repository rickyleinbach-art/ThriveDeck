"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  CATEGORY_LABELS,
  isStrengthCategory,
  workoutTemplateSchema,
} from "@/lib/validations/exercise";
import { saveWorkoutTemplate } from "@/lib/exercise/actions";
import {
  weightToKg,
  weightUnit,
  type UnitSystem,
} from "@/lib/exercise/calculations";
import type { Exercise } from "@/lib/exercise/types";

interface BuilderRow {
  key: number;
  exerciseId: string;
  targetSets: string;
  targetReps: string;
  targetWeight: string; // in the user's display unit
  targetDurationMin: string;
  restSeconds: string;
}

let nextKey = 0;

function emptyRow(defaultExerciseId: string): BuilderRow {
  nextKey += 1;
  return {
    key: nextKey,
    exerciseId: defaultExerciseId,
    targetSets: "3",
    targetReps: "10",
    targetWeight: "",
    targetDurationMin: "",
    restSeconds: "90",
  };
}

export function TemplateBuilderForm({
  exercises,
  unitSystem,
}: {
  exercises: Exercise[];
  unitSystem: UnitSystem;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<BuilderRow[]>([
    emptyRow(exercises[0]?.id ?? ""),
  ]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const unit = weightUnit(unitSystem);

  function updateRow(key: number, patch: Partial<BuilderRow>) {
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  }

  function moveRow(index: number, delta: number) {
    setRows((prev) => {
      const next = prev.slice();
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = workoutTemplateSchema.safeParse({
      name,
      notes: notes || undefined,
      exercises: rows.map((row) => {
        const exercise = exercises.find((ex) => ex.id === row.exerciseId);
        const strength = exercise ? isStrengthCategory(exercise.category) : true;
        return {
          exerciseId: row.exerciseId,
          targetSets: row.targetSets ? Number(row.targetSets) : undefined,
          targetReps:
            strength && row.targetReps ? Number(row.targetReps) : undefined,
          targetWeightKg:
            strength && row.targetWeight
              ? weightToKg(Number(row.targetWeight), unitSystem)
              : undefined,
          targetDurationMin:
            !strength && row.targetDurationMin
              ? Number(row.targetDurationMin)
              : undefined,
          restSeconds: Number(row.restSeconds) || 90,
        };
      }),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your template");
      return;
    }

    setSubmitting(true);
    const result = await saveWorkoutTemplate(parsed.data);

    if (!result.success) {
      setSubmitting(false);
      setError(result.error);
      return;
    }

    router.push("/exercise");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="templateName">Template name</Label>
          <Input
            id="templateName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Push day"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="templateNotes">Notes (optional)</Label>
          <Input
            id="templateNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Warm up 5 min first"
            maxLength={1000}
          />
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => {
          const exercise = exercises.find((ex) => ex.id === row.exerciseId);
          const strength = exercise ? isStrengthCategory(exercise.category) : true;
          return (
            <div
              key={row.key}
              className="space-y-3 rounded-lg border border-border p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Exercise {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => moveRow(index, -1)}
                    disabled={index === 0}
                    aria-label="Move up"
                  >
                    <Icon icon={ChevronUp} size="sm" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => moveRow(index, 1)}
                    disabled={index === rows.length - 1}
                    aria-label="Move down"
                  >
                    <Icon icon={ChevronDown} size="sm" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      setRows((prev) => prev.filter((r) => r.key !== row.key))
                    }
                    disabled={rows.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              </div>

              <Select
                value={row.exerciseId}
                onChange={(e) => updateRow(row.key, { exerciseId: e.target.value })}
                aria-label="Exercise"
              >
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} — {CATEGORY_LABELS[ex.category]}
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="space-y-1.5">
                  <Label>Sets</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="50"
                    value={row.targetSets}
                    onChange={(e) => updateRow(row.key, { targetSets: e.target.value })}
                  />
                </div>
                {strength ? (
                  <>
                    <div className="space-y-1.5">
                      <Label>Reps</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        value={row.targetReps}
                        onChange={(e) =>
                          updateRow(row.key, { targetReps: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Weight ({unit})</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min="0"
                        value={row.targetWeight}
                        onChange={(e) =>
                          updateRow(row.key, { targetWeight: e.target.value })
                        }
                        placeholder="optional"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <Label>Duration (min)</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min="0"
                      value={row.targetDurationMin}
                      onChange={(e) =>
                        updateRow(row.key, { targetDurationMin: e.target.value })
                      }
                      placeholder="optional"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Rest (sec)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="3600"
                    step="15"
                    value={row.restSeconds}
                    onChange={(e) =>
                      updateRow(row.key, { restSeconds: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => setRows((prev) => [...prev, emptyRow(exercises[0]?.id ?? "")])}
        disabled={rows.length >= 30}
      >
        + Add exercise
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save template"}
        </Button>
      </div>
    </form>
  );
}
