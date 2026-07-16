import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getExercises } from "@/lib/exercise/queries";
import { deleteCustomExerciseFormAction } from "@/lib/exercise/actions";
import {
  CATEGORY_LABELS,
  EXERCISE_CATEGORIES,
  MUSCLE_GROUP_LABELS,
} from "@/lib/validations/exercise";
import { CustomExerciseForm } from "./custom-exercise-form";

export default async function ExerciseLibraryPage() {
  const exercises = await getExercises();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Exercise library</h1>
          <p className="mt-1 text-muted-foreground">
            {exercises.length} exercises — built-in plus your own.
          </p>
        </div>
        <Link href="/exercise" className="text-sm text-primary hover:underline">
          ← Back to Exercise
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Add a custom exercise" className="lg:col-span-1 self-start">
          <CustomExerciseForm />
        </Card>

        <div className="space-y-4 lg:col-span-2">
          {EXERCISE_CATEGORIES.map((category) => {
            const inCategory = exercises.filter(
              (exercise) => exercise.category === category
            );
            if (inCategory.length === 0) return null;
            return (
              <Card key={category} title={CATEGORY_LABELS[category]}>
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {inCategory.map((exercise) => (
                    <li
                      key={exercise.id}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm">
                          {exercise.name}
                          {exercise.isCustom && (
                            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                              Custom
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[
                            exercise.muscleGroup
                              ? MUSCLE_GROUP_LABELS[exercise.muscleGroup]
                              : null,
                            exercise.equipment,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </div>
                      {exercise.isCustom && (
                        <form
                          action={deleteCustomExerciseFormAction.bind(null, exercise.id)}
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
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
