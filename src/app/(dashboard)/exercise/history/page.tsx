import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  displayWeight,
  formatMinutes,
  weightUnit,
  workoutVolumeKg,
} from "@/lib/exercise/calculations";
import { getUnitSystem, getWorkoutHistory } from "@/lib/exercise/queries";
import { deleteWorkoutFormAction } from "@/lib/exercise/actions";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function WorkoutHistoryPage() {
  const [history, unitSystem] = await Promise.all([
    getWorkoutHistory(100),
    getUnitSystem(),
  ]);
  const unit = weightUnit(unitSystem);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workout history</h1>
          <p className="mt-1 text-muted-foreground">
            {history.length} completed workout{history.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Link href="/exercise" className="text-sm text-primary hover:underline">
          <Icon icon={ArrowLeft} size="sm" className="mr-1 inline align-[-0.2em]" />Back to Exercise
        </Link>
      </div>

      <Card>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing here yet —{" "}
            <Link href="/exercise" className="text-primary hover:underline">
              start your first workout
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {history.map((workout) => {
              const volume = workoutVolumeKg(workout.sets);
              return (
                <li
                  key={workout.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{workout.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDate(workout.startedAt)}
                      {workout.durationMin
                        ? ` · ${formatMinutes(workout.durationMin)}`
                        : ""}
                      {` · ${workout.sets.length} set${workout.sets.length === 1 ? "" : "s"}`}
                      {volume > 0
                        ? ` · ${Math.round(displayWeight(volume, unitSystem)).toLocaleString()} ${unit}`
                        : ""}
                      {workout.caloriesBurned !== null
                        ? ` · ~${Math.round(workout.caloriesBurned)} kcal`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/exercise/workout/${workout.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View
                    </Link>
                    <form action={deleteWorkoutFormAction.bind(null, workout.id)}>
                      <Button
                        type="submit"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
