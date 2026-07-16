"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { startWorkout } from "@/lib/exercise/actions";
import type { WorkoutTemplate } from "@/lib/exercise/types";

const BLANK = "__blank__";

export function StartWorkoutForm({
  templates,
  hasActiveWorkout,
}: {
  templates: WorkoutTemplate[];
  hasActiveWorkout: boolean;
}) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<string>(templates[0]?.id ?? BLANK);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isBlank = templateId === BLANK;
  const selected = templates.find((template) => template.id === templateId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await startWorkout({
      templateId: isBlank ? undefined : templateId,
      name: isBlank ? name || "Workout" : undefined,
    });

    if (!result.success) {
      setSubmitting(false);
      setError(result.error);
      return;
    }

    router.push(`/exercise/workout/${result.workoutId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="template">Workout</Label>
        <Select
          id="template"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
        >
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} ({template.exercises.length} exercise
              {template.exercises.length === 1 ? "" : "s"})
            </option>
          ))}
          <option value={BLANK}>Blank workout…</option>
        </Select>
        {selected && (
          <p className="text-xs text-muted-foreground">
            {selected.exercises.map((exercise) => exercise.exerciseName).join(" · ")}
          </p>
        )}
      </div>

      {isBlank && (
        <div className="space-y-1.5">
          <Label htmlFor="workoutName">Name</Label>
          <Input
            id="workoutName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Push day"
            maxLength={120}
          />
        </div>
      )}

      {hasActiveWorkout && (
        <p className="text-xs text-muted-foreground">
          You already have a workout in progress — resume it above, or finish it
          before starting a new one.
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting || hasActiveWorkout} className="w-full">
        {submitting ? "Starting…" : "Start workout"}
      </Button>
    </form>
  );
}
