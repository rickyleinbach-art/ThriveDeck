import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { dayTotals } from "@/lib/nutrition/calculations";
import {
  getFoodItems,
  getFoodLogsForDay,
  getNutritionTarget,
} from "@/lib/nutrition/queries";
import { deleteFoodLogFormAction } from "@/lib/nutrition/actions";
import { getEntitlements } from "@/lib/subscription/queries";
import { UpgradeInline } from "@/components/upgrade-gate";
import { MEAL_LABELS, MEAL_TYPES } from "@/lib/validations/nutrition";
import type { FoodLog } from "@/lib/nutrition/types";
import { LogFoodForm } from "./log-food-form";
import { LabelScan } from "./label-scan";

function isValidDate(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value));
}

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDay(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function round(value: number): string {
  return Math.round(value).toLocaleString();
}

function MacroCard({
  label,
  consumed,
  target,
  unit,
}: {
  label: string;
  consumed: number;
  target: number | null;
  unit: string;
}) {
  const pct = target && target > 0 ? Math.min(100, (consumed / target) * 100) : null;
  return (
    <Card title={label}>
      <p className="text-2xl font-semibold">
        {round(consumed)}
        <span className="ml-1 text-sm font-normal text-muted-foreground">
          {target ? `/ ${round(target)} ${unit}` : unit}
        </span>
      </p>
      {pct !== null ? (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">
          <Link href="/nutrition/targets" className="text-primary hover:underline">
            Set a target
          </Link>
        </p>
      )}
    </Card>
  );
}

function MealSection({ meal, logs }: { meal: string; logs: FoodLog[] }) {
  const mealCalories = logs.reduce((sum, log) => sum + log.calories * log.servings, 0);
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-medium">{meal}</h3>
        <span className="text-xs text-muted-foreground">
          {logs.length > 0 ? `${round(mealCalories)} kcal` : "Nothing logged"}
        </span>
      </div>
      {logs.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {logs.map((log) => (
            <li key={log.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm">
                  {log.name}
                  {log.brand && (
                    <span className="text-muted-foreground"> · {log.brand}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {log.servings} × {log.servingSize} {log.servingUnit} ·{" "}
                  {round(log.proteinG * log.servings)}g protein
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-medium">
                  {round(log.calories * log.servings)} kcal
                </span>
                <form action={deleteFoodLogFormAction.bind(null, log.id)}>
                  <Button
                    type="submit"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function NutritionPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const date = isValidDate(params.date) ? params.date : today;

  const [logs, target, foodItems, ent] = await Promise.all([
    getFoodLogsForDay(date),
    getNutritionTarget(),
    getFoodItems(),
    getEntitlements(),
  ]);

  const totals = dayTotals(logs);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nutrition</h1>
          <p className="mt-1 text-muted-foreground">{formatDay(date)}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/nutrition?date=${shiftDate(date, -1)}`}
            className="rounded-lg border border-border px-3 py-1.5 hover:bg-accent"
            aria-label="Previous day"
          >
            <Icon icon={ChevronLeft} size="sm" />
          </Link>
          {date !== today && (
            <Link href="/nutrition" className="text-primary hover:underline">
              Today
            </Link>
          )}
          {date < today && (
            <Link
              href={`/nutrition?date=${shiftDate(date, 1)}`}
              className="rounded-lg border border-border px-3 py-1.5 hover:bg-accent"
              aria-label="Next day"
            >
              <Icon icon={ChevronRight} size="sm" />
            </Link>
          )}
          <span className="text-muted-foreground">·</span>
          <Link href="/nutrition/foods" className="text-primary hover:underline">
            My foods
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link href="/nutrition/targets" className="text-primary hover:underline">
            Targets
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MacroCard
          label="Calories"
          consumed={totals.calories}
          target={target?.calories ?? null}
          unit="kcal"
        />
        <MacroCard
          label="Protein"
          consumed={totals.proteinG}
          target={target?.proteinG ?? null}
          unit="g"
        />
        <MacroCard
          label="Carbs"
          consumed={totals.carbsG}
          target={target?.carbsG ?? null}
          unit="g"
        />
        <MacroCard
          label="Fat"
          consumed={totals.fatG}
          target={target?.fatG ?? null}
          unit="g"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Log food" className="lg:col-span-1">
          <div className="mb-4 border-b border-border pb-4">
            {ent.has("label_scanner") ? (
              <LabelScan date={date} />
            ) : (
              <UpgradeInline label="Scan a label (Pro)" />
            )}
          </div>
          <LogFoodForm date={date} foodItems={foodItems} />
        </Card>

        <Card title="Meals" className="lg:col-span-2">
          <div className="space-y-5">
            {MEAL_TYPES.map((meal) => (
              <MealSection
                key={meal}
                meal={MEAL_LABELS[meal]}
                logs={logs.filter((log) => log.mealType === meal)}
              />
            ))}
          </div>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Also tracked today: {round(totals.fiberG)}g fiber · {round(totals.sugarG)}g sugar ·{" "}
        {round(totals.sodiumMg)}mg sodium
      </p>
    </div>
  );
}
