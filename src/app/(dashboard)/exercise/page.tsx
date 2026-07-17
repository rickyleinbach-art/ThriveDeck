import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  displayWeight,
  formatMinutes,
  weeklyStats,
  weightUnit,
  workoutDayStreak,
  workoutVolumeKg,
} from "@/lib/exercise/calculations";
import {
  getActiveWorkout,
  getUnitSystem,
  getWorkoutHistory,
  getWorkoutTemplates,
} from "@/lib/exercise/queries";
import { deleteWorkoutTemplateFormAction } from "@/lib/exercise/actions";
import {
  CATEGORY_LABELS,
  DIFFICULTIES,
  DIFFICULTY_LABELS,
} from "@/lib/validations/exercise";
import { StartWorkoutForm } from "./start-workout-form";
import { StartProgramButton } from "./start-program-button";

function round(value: number): string {
  return Math.round(value).toLocaleString();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default async function ExercisePage() {
  const [activeWorkout, templates, history, unitSystem] = await Promise.all([
    getActiveWorkout(),
    getWorkoutTemplates(),
    getWorkoutHistory(90),
    getUnitSystem(),
  ]);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const stats = weeklyStats(history, weekAgo);
  const today = new Date().toISOString().slice(0, 10);
  const streak = workoutDayStreak(
    history
      .filter((w) => w.completedAt)
      .map((w) => new Date(w.completedAt!).toISOString().slice(0, 10)),
    today
  );
  const unit = weightUnit(unitSystem);
  const recent = history.slice(0, 5);
  const myTemplates = templates.filter((template) => template.isCustom);
  const guidedPrograms = templates.filter((template) => !template.isCustom);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Exercise</h1>
          <p className="mt-1 text-muted-foreground">
            Build workouts, log sets, track PRs.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/exercise/library" className="text-primary hover:underline">
            Library
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link href="/exercise/history" className="text-primary hover:underline">
            History
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link href="/exercise/prs" className="text-primary hover:underline">
            PRs
          </Link>
        </div>
      </div>

      {activeWorkout && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-primary/5 px-5 py-4">
          <div>
            <p className="text-sm font-medium">
              Workout in progress: {activeWorkout.name}
            </p>
            <p className="text-xs text-muted-foreground">
              Started {formatDate(activeWorkout.startedAt)} ·{" "}
              {activeWorkout.sets.length} set
              {activeWorkout.sets.length === 1 ? "" : "s"} logged
            </p>
          </div>
          <Link
            href={`/exercise/workout/${activeWorkout.id}`}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Resume workout
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Workouts this week">
          <p className="text-2xl font-semibold">{stats.workouts}</p>
        </Card>
        <Card title="Time this week">
          <p className="text-2xl font-semibold">{formatMinutes(stats.totalMinutes)}</p>
        </Card>
        <Card title="Volume this week">
          <p className="text-2xl font-semibold">
            {round(displayWeight(stats.totalVolumeKg, unitSystem))}
            <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
          </p>
        </Card>
        <Card title="Day streak">
          <p className="text-2xl font-semibold">
            {streak}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              day{streak === 1 ? "" : "s"}
            </span>
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Start a workout" className="lg:col-span-1">
          <StartWorkoutForm templates={templates} hasActiveWorkout={!!activeWorkout} />
        </Card>

        <Card title="My workout templates" className="lg:col-span-2">
          {myTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No templates yet.{" "}
              <Link href="/exercise/builder" className="text-primary hover:underline">
                Build your first workout
              </Link>{" "}
              or follow a guided program below.
            </p>
          ) : (
            <div className="space-y-3">
              <ul className="divide-y divide-border rounded-lg border border-border">
                {myTemplates.map((template) => (
                  <li
                    key={template.id}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{template.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {template.exercises
                          .map((exercise) => exercise.exerciseName)
                          .join(" · ")}
                      </p>
                    </div>
                    <form
                      action={deleteWorkoutTemplateFormAction.bind(null, template.id)}
                      className="shrink-0"
                    >
                      <Button
                        type="submit"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
              <Link
                href="/exercise/builder"
                className="inline-block text-sm text-primary hover:underline"
              >
                + Build a new workout
              </Link>
            </div>
          )}
        </Card>
      </div>

      {guidedPrograms.length > 0 && (
        <Card title="Guided programs">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {DIFFICULTIES.map((difficulty) => {
              const programs = guidedPrograms.filter(
                (program) => program.difficulty === difficulty
              );
              if (programs.length === 0) return null;
              return (
                <div key={difficulty}>
                  <h3 className="mb-2 text-sm font-medium">
                    {DIFFICULTY_LABELS[difficulty]}
                  </h3>
                  <ul className="divide-y divide-border rounded-lg border border-border">
                    {programs.map((program) => (
                      <li key={program.id} className="space-y-1 px-3 py-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{program.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {program.exercises
                                .map((exercise) => exercise.exerciseName)
                                .join(" · ")}
                            </p>
                          </div>
                          <StartProgramButton
                            templateId={program.id}
                            disabled={!!activeWorkout}
                          />
                        </div>
                        {program.notes && (
                          <p className="text-xs text-muted-foreground">
                            {program.notes}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card title="Recent workouts">
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing logged yet — start your first workout above.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {recent.map((workout) => {
              const volume = workoutVolumeKg(workout.sets);
              const categories = [
                ...new Set(workout.sets.map((set) => CATEGORY_LABELS[set.category])),
              ];
              return (
                <li
                  key={workout.id}
                  className="flex items-center justify-between gap-3 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{workout.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDate(workout.startedAt)}
                      {workout.durationMin
                        ? ` · ${formatMinutes(workout.durationMin)}`
                        : ""}
                      {volume > 0
                        ? ` · ${round(displayWeight(volume, unitSystem))} ${unit}`
                        : ""}
                      {categories.length > 0 ? ` · ${categories.join(", ")}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/exercise/workout/${workout.id}`}
                    className="shrink-0 text-sm text-primary hover:underline"
                  >
                    View
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
