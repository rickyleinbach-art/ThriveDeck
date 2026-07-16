import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ageFromDateOfBirth } from "@/lib/nutrition/calculations";
import { getCalculatorProfileInfo, getNutritionTarget } from "@/lib/nutrition/queries";
import { CalculatorForm } from "./calculator-form";

export default async function TargetsPage() {
  const [profile, target] = await Promise.all([
    getCalculatorProfileInfo(),
    getNutritionTarget(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Daily targets</h1>
          <p className="mt-1 text-muted-foreground">
            Estimate your calorie and macro targets, then tune them to taste.
          </p>
        </div>
        <Link href="/nutrition" className="text-sm text-primary hover:underline">
          Back to today
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Current targets" className="lg:col-span-1">
          {target ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Calories</dt>
                <dd className="font-medium">{Math.round(target.calories).toLocaleString()} kcal</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Protein</dt>
                <dd className="font-medium">{Math.round(target.proteinG)} g</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Carbs</dt>
                <dd className="font-medium">{Math.round(target.carbsG)} g</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Fat</dt>
                <dd className="font-medium">{Math.round(target.fatG)} g</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              No targets yet — run the calculator to set them.
            </p>
          )}
        </Card>

        <Card title="Macro & protein calculator" className="lg:col-span-2">
          <CalculatorForm
            defaults={{
              sex: profile?.sex ?? undefined,
              age: profile?.dateOfBirth
                ? ageFromDateOfBirth(profile.dateOfBirth)
                : undefined,
              heightCm: profile?.heightCm ?? undefined,
              weightKg: profile?.latestWeightKg ?? undefined,
              activityLevel: profile?.activityLevel ?? undefined,
            }}
          />
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        These are population-level estimates to use as a starting point, not medical or
        dietetic advice. For a plan tailored to your health, talk to a licensed provider or
        registered dietitian.
      </p>
    </div>
  );
}
