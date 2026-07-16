"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  CATEGORY_LABELS,
  EXERCISE_CATEGORIES,
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  customExerciseSchema,
  type ExerciseCategory,
  type MuscleGroup,
} from "@/lib/validations/exercise";
import { createCustomExercise } from "@/lib/exercise/actions";

const NONE = "__none__";

export function CustomExerciseForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ExerciseCategory>("STRENGTH");
  const [muscleGroup, setMuscleGroup] = useState<string>(NONE);
  const [equipment, setEquipment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = customExerciseSchema.safeParse({
      name,
      category,
      muscleGroup: muscleGroup === NONE ? undefined : (muscleGroup as MuscleGroup),
      equipment: equipment || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your entry");
      return;
    }

    setSubmitting(true);
    const result = await createCustomExercise(parsed.data);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setName("");
    setEquipment("");
    setMuscleGroup(NONE);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="exerciseName">Name</Label>
        <Input
          id="exerciseName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Landmine Press"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category">Category</Label>
        <Select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
        >
          {EXERCISE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </Select>
      </div>

      {category === "STRENGTH" && (
        <div className="space-y-1.5">
          <Label htmlFor="muscleGroup">Muscle group</Label>
          <Select
            id="muscleGroup"
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
          >
            <option value={NONE}>Not set</option>
            {MUSCLE_GROUPS.map((group) => (
              <option key={group} value={group}>
                {MUSCLE_GROUP_LABELS[group]}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="equipment">Equipment (optional)</Label>
        <Input
          id="equipment"
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
          placeholder="e.g. Barbell"
          maxLength={120}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Saving…" : "Add exercise"}
      </Button>
    </form>
  );
}
