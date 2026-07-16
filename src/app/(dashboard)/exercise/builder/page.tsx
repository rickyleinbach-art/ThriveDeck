import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getExercises, getUnitSystem } from "@/lib/exercise/queries";
import { TemplateBuilderForm } from "./template-builder-form";

export default async function WorkoutBuilderPage() {
  const [exercises, unitSystem] = await Promise.all([
    getExercises(),
    getUnitSystem(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workout builder</h1>
          <p className="mt-1 text-muted-foreground">
            Build a reusable template with target sets, reps, and rest times.
          </p>
        </div>
        <Link href="/exercise" className="text-sm text-primary hover:underline">
          ← Back to Exercise
        </Link>
      </div>

      <Card>
        <TemplateBuilderForm exercises={exercises} unitSystem={unitSystem} />
      </Card>
    </div>
  );
}
