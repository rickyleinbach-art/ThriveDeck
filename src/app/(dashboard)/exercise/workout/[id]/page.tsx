import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import {
  displayWeight,
  formatMinutes,
  formatSetSummary,
  weightUnit,
  workoutVolumeKg,
} from "@/lib/exercise/calculations";
import {
  getExercises,
  getUnitSystem,
  getWorkout,
  getWorkoutTemplates,
} from "@/lib/exercise/queries";
import type { Workout, WorkoutSet } from "@/lib/exercise/types";
import type { UnitSystem } from "@/lib/exercise/calculations";
import { ActiveWorkout } from "./active-workout";

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

function CompletedWorkoutSummary({
  workout,
  unitSystem,
}: {
  workout: Workout;
  unitSystem: UnitSystem;
}) {
  const volume = workoutVolumeKg(workout.sets);
  const groups = groupSets(workout.sets);
  const completed = new Date(workout.completedAt!).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{workout.name}</h1>
          <p className="mt-1 text-muted-foreground">Completed {completed}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/exercise/history" className="text-primary hover:underline">
            History
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link href="/exercise" className="text-primary hover:underline">
            Exercise
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Duration">
          <p className="text-2xl font-semibold">
            {workout.durationMin ? formatMinutes(workout.durationMin) : "—"}
          </p>
        </Card>
        <Card title="Sets">
          <p className="text-2xl font-semibold">{workout.sets.length}</p>
        </Card>
        <Card title="Volume">
          <p className="text-2xl font-semibold">
            {Math.round(displayWeight(volume, unitSystem)).toLocaleString()}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              {weightUnit(unitSystem)}
            </span>
          </p>
        </Card>
        <Card title="Calories (est.)">
          <p className="text-2xl font-semibold">
            {workout.caloriesBurned !== null
              ? Math.round(workout.caloriesBurned).toLocaleString()
              : "—"}
            <span className="ml-1 text-sm font-normal text-muted-foreground">kcal</span>
          </p>
        </Card>
      </div>

      <Card title="Exercises">
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sets were logged.</p>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.name}>
                <h3 className="mb-2 text-sm font-medium">{group.name}</h3>
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {group.sets.map((set) => (
                    <li
                      key={set.id}
                      className="flex items-center justify-between px-3 py-2 text-sm"
                    >
                      <span className="text-muted-foreground">Set {set.setNumber}</span>
                      <span>{formatSetSummary(set, unitSystem)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

      {workout.notes && (
        <Card title="Notes">
          <p className="whitespace-pre-wrap text-sm">{workout.notes}</p>
        </Card>
      )}
    </div>
  );
}

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workout = await getWorkout(id);
  if (!workout) notFound();

  const unitSystem = await getUnitSystem();

  if (workout.completedAt) {
    return <CompletedWorkoutSummary workout={workout} unitSystem={unitSystem} />;
  }

  const [exercises, templates] = await Promise.all([
    getExercises(),
    getWorkoutTemplates(),
  ]);
  const template = workout.templateId
    ? templates.find((t) => t.id === workout.templateId) ?? null
    : null;

  return (
    <ActiveWorkout
      workout={workout}
      exercises={exercises}
      template={template}
      unitSystem={unitSystem}
    />
  );
}
