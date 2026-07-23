"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import {
  deleteSet,
  deleteWorkout,
  finishWorkout,
  logSet,
} from "@/lib/exercise/actions";
import {
  DISTANCE_CATEGORIES,
  isStrengthCategory,
  logSetSchema,
} from "@/lib/validations/exercise";
import {
  displayWeight,
  distanceToKm,
  distanceUnit,
  formatSetSummary,
  weightToKg,
  weightUnit,
  type UnitSystem,
} from "@/lib/exercise/calculations";
import type { Exercise, Workout, WorkoutSet, WorkoutTemplate } from "@/lib/exercise/types";

const REST_PRESETS = [60, 90, 120, 180];

function formatClock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// Sets grouped by exercise, in first-logged order.
function groupSets(sets: WorkoutSet[]): { name: string; sets: WorkoutSet[] }[] {
  const groups: { name: string; sets: WorkoutSet[] }[] = [];
  for (const set of sets) {
    const group = groups.find((g) => g.name === set.exerciseName);
    if (group) group.sets.push(set);
    else groups.push({ name: set.exerciseName, sets: [set] });
  }
  return groups;
}

export function ActiveWorkout({
  workout,
  exercises,
  template,
  unitSystem,
}: {
  workout: Workout;
  exercises: Exercise[];
  template: WorkoutTemplate | null;
  unitSystem: UnitSystem;
}) {
  const router = useRouter();

  // One shared 1-second tick drives both timers. null until mounted so the
  // server-rendered HTML never contains a clock value that would mismatch.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsedSec =
    now !== null
      ? Math.max(0, Math.floor((now - new Date(workout.startedAt).getTime()) / 1000))
      : null;

  // Rest timer: a wall-clock end time, so background tabs stay accurate.
  const [restTotalSec, setRestTotalSec] = useState(90);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const restRemaining =
    restEndsAt !== null && now !== null
      ? Math.max(0, Math.ceil((restEndsAt - now) / 1000))
      : null;
  const restDone = restRemaining === 0;

  function startRest(seconds: number) {
    setRestTotalSec(seconds);
    setRestEndsAt(Date.now() + seconds * 1000);
  }

  // Exercise picker: template exercises first, then the rest of the library.
  const orderedExercises = useMemo(() => {
    if (!template) return exercises;
    const templateIds = template.exercises.map((te) => te.exerciseId);
    const inTemplate = templateIds
      .map((id) => exercises.find((ex) => ex.id === id))
      .filter((ex): ex is Exercise => !!ex);
    const rest = exercises.filter((ex) => !templateIds.includes(ex.id));
    return [...inTemplate, ...rest];
  }, [exercises, template]);

  const [exerciseId, setExerciseId] = useState<string>(orderedExercises[0]?.id ?? "");
  const selected = exercises.find((ex) => ex.id === exerciseId);
  const strength = selected ? isStrengthCategory(selected.category) : true;
  const showDistance = selected ? DISTANCE_CATEGORIES.includes(selected.category) : false;
  const templateEntry = template?.exercises.find((te) => te.exerciseId === exerciseId);

  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [distance, setDistance] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Finish form
  const [calories, setCalories] = useState("");
  const [notes, setNotes] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  const unit = weightUnit(unitSystem);
  const distUnit = distanceUnit(unitSystem);

  const setsForSelected = workout.sets.filter((s) => s.exerciseId === exerciseId).length;

  async function handleLogSet(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = logSetSchema.safeParse({
      workoutId: workout.id,
      exerciseId,
      reps: strength && reps ? Number(reps) : undefined,
      weightKg:
        strength && weight ? weightToKg(Number(weight), unitSystem) : undefined,
      durationMin: !strength && durationMin ? Number(durationMin) : undefined,
      distanceKm:
        showDistance && distance
          ? distanceToKm(Number(distance), unitSystem)
          : undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your set");
      return;
    }

    setSubmitting(true);
    const result = await logSet(parsed.data);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    // Auto-start the rest timer using the template's rest for this exercise,
    // falling back to the last-used duration.
    startRest(templateEntry?.restSeconds ?? restTotalSec);
    router.refresh();
  }

  async function handleDeleteSet(id: string) {
    await deleteSet(id);
    router.refresh();
  }

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFinishing(true);

    const result = await finishWorkout({
      workoutId: workout.id,
      caloriesBurned: calories ? Number(calories) : undefined,
      notes: notes || undefined,
    });

    if (!result.success) {
      setFinishing(false);
      setError(result.error);
      return;
    }

    router.refresh(); // page re-renders as the completed summary
  }

  async function handleDiscard() {
    if (!window.confirm("Discard this workout and all logged sets?")) return;
    setDiscarding(true);
    const result = await deleteWorkout(workout.id);
    if (!result.success) {
      setDiscarding(false);
      setError(result.error);
      return;
    }
    router.push("/exercise");
  }

  const groups = groupSets(workout.sets);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{workout.name}</h1>
          <p className="mt-1 text-muted-foreground">Workout in progress</p>
        </div>
        <Link href="/exercise" className="text-sm text-primary hover:underline">
          <Icon icon={ArrowLeft} size="sm" className="mr-1 inline align-[-0.2em]" />Exercise
        </Link>
      </div>

      {/* Timers */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card title="Workout timer">
          <p className="font-mono text-4xl font-semibold tabular-nums">
            {elapsedSec !== null ? formatClock(elapsedSec) : "--:--"}
          </p>
        </Card>
        <Card title="Rest timer">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p
              className={`font-mono text-4xl font-semibold tabular-nums ${
                restDone ? "text-primary" : ""
              }`}
            >
              {restRemaining !== null ? formatClock(restRemaining) : "--:--"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {REST_PRESETS.map((seconds) => (
                <Button
                  key={seconds}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => startRest(seconds)}
                >
                  {seconds}s
                </Button>
              ))}
              {restEndsAt !== null && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRestEndsAt(null)}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
          {restEndsAt !== null && restRemaining !== null && (
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${Math.min(100, 100 - (restRemaining / restTotalSec) * 100)}%`,
                }}
              />
            </div>
          )}
          {restDone && (
            <p className="mt-2 text-sm font-medium text-primary">
              Rest over — next set!
            </p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Log a set */}
        <Card title="Log a set" className="lg:col-span-1 self-start">
          <form onSubmit={handleLogSet} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="exercise">Exercise</Label>
              <Select
                id="exercise"
                value={exerciseId}
                onChange={(e) => setExerciseId(e.target.value)}
              >
                {orderedExercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {template?.exercises.some((te) => te.exerciseId === ex.id)
                      ? "★ "
                      : ""}
                    {ex.name}
                  </option>
                ))}
              </Select>
              {templateEntry && (
                <p className="text-xs text-muted-foreground">
                  Target:{" "}
                  {templateEntry.targetSets ? `${templateEntry.targetSets} sets` : ""}
                  {templateEntry.targetReps ? ` × ${templateEntry.targetReps} reps` : ""}
                  {templateEntry.targetWeightKg
                    ? ` @ ${Math.round(displayWeight(templateEntry.targetWeightKg, unitSystem) * 10) / 10} ${unit}`
                    : ""}
                  {templateEntry.targetDurationMin
                    ? ` ${templateEntry.targetDurationMin} min`
                    : ""}
                  {` · rest ${templateEntry.restSeconds}s`}
                </p>
              )}
            </div>

            {strength ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reps">Reps</Label>
                  <Input
                    id="reps"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="weight">Weight ({unit})</Label>
                  <Input
                    id="weight"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="durationMin">Duration (min)</Label>
                  <Input
                    id="durationMin"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value)}
                    required
                  />
                </div>
                {showDistance && (
                  <div className="space-y-1.5">
                    <Label htmlFor="distance">Distance ({distUnit})</Label>
                    <Input
                      id="distance"
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min="0"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting
                ? "Logging…"
                : `Log set ${setsForSelected + 1}`}
            </Button>
          </form>
        </Card>

        {/* Logged sets */}
        <Card title="This workout" className="lg:col-span-2">
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sets yet — log your first set to get going.
            </p>
          ) : (
            <div className="space-y-5">
              {groups.map((group) => (
                <div key={group.name}>
                  <h3 className="mb-2 text-sm font-medium">{group.name}</h3>
                  <ul className="divide-y divide-border rounded-lg border border-border">
                    {group.sets.map((set) => (
                      <li
                        key={set.id}
                        className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                      >
                        <span className="text-muted-foreground">
                          Set {set.setNumber}
                        </span>
                        <div className="flex items-center gap-3">
                          <span>{formatSetSummary(set, unitSystem)}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteSet(set.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Finish / discard */}
      <Card title="Finish workout">
        <form onSubmit={handleFinish} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="calories">Calories burned (optional)</Label>
              <Input
                id="calories"
                type="number"
                inputMode="numeric"
                min="0"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="Estimated automatically if left blank"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did it go?"
                maxLength={2000}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={handleDiscard}
              disabled={discarding}
            >
              {discarding ? "Discarding…" : "Discard workout"}
            </Button>
            <Button type="submit" disabled={finishing}>
              {finishing ? "Finishing…" : "Finish workout"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
