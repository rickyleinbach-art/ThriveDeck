import Link from "next/link";
import {
  ArrowRight,
  Check,
  Flame,
  Beef,
  Droplets,
  Dumbbell,
  Footprints,
  Scale,
  Percent,
  ListChecks,
  Moon,
  Syringe,
  Trophy,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Sparkline } from "@/components/ui/sparkline";
import { ScoreCard } from "@/components/charts/score-card";
import { getBodyMetrics } from "@/lib/weight/queries";
import { getAnalyticsData } from "@/lib/analytics/queries";
import { computeScores } from "@/lib/analytics/scores";
import { computeGamification } from "@/lib/challenges/gamification";
import { getFoodLogsForDay, getNutritionTarget } from "@/lib/nutrition/queries";
import { dayTotals } from "@/lib/nutrition/calculations";
import { getActiveWorkout, getWorkoutHistory } from "@/lib/exercise/queries";
import { getHabits, getHabitLogs } from "@/lib/habits/queries";
import { isComplete, isScheduledOn } from "@/lib/habits/calculations";
import { getUpcomingReminders } from "@/lib/peptides/queries";
import { getProfile } from "@/lib/profile/queries";
import type { Habit } from "@/lib/habits/types";

function formatValue(value: number, unit: string) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit}`;
}

function round(value: number) {
  return Math.round(value).toLocaleString();
}

// A dashboard card that links through to its module. Cards render live data
// when the underlying module has any, and an honest "get started" prompt
// otherwise — never a "coming soon" placeholder for a module that's built.
function StatCard({
  title,
  href,
  icon,
  action,
  children,
}: {
  title: string;
  href: string;
  icon: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    // `group` lets the empty-state prompt inside react to hovering the card.
    <Link href={href} className="group block h-full">
      <Card title={title} icon={icon} action={action} interactive>
        {children}
      </Card>
    </Link>
  );
}

// Pushed to the bottom of the card (mt-auto) so a grid row of mixed
// populated/empty cards still lines its prompts up.
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-auto flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground transition-colors group-hover:border-primary/50 group-hover:text-foreground">
      <span className="truncate">{children}</span>
      <Icon icon={ArrowRight} size="sm" className="ml-auto shrink-0" />
    </div>
  );
}

// Change across the loaded window, shown in the card header. Direction is
// coloured but never judged: losing weight is not universally "good".
function Delta({ entries }: { entries: { value: number; unit: string }[] }) {
  if (entries.length < 2) return null;
  const diff = entries[0].value - entries[entries.length - 1].value;
  if (Math.abs(diff) < 0.05) return null;
  const up = diff > 0;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium tabular-nums text-muted-foreground">
      <Icon icon={up ? TrendingUp : TrendingDown} size="sm" />
      {up ? "+" : ""}
      {diff.toLocaleString(undefined, { maximumFractionDigits: 1 })}
      {entries[0].unit}
    </span>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

function habitToday(
  habits: Habit[],
  logsToday: { habitId: string | null; value: number }[],
  type: Habit["habitType"]
): { habit: Habit; value: number } | null {
  const habit = habits.find((h) => h.active && h.habitType === type);
  if (!habit) return null;
  const log = logsToday.find((l) => l.habitId === habit.id);
  return { habit, value: log?.value ?? 0 };
}

export default async function DashboardPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [
    weightEntries,
    bodyFatEntries,
    analytics,
    foodLogs,
    nutritionTarget,
    activeWorkout,
    recentWorkouts,
    habits,
    habitLogsToday,
    reminders,
    profile,
  ] = await Promise.all([
    getBodyMetrics({ metricType: "WEIGHT", limit: 14 }),
    getBodyMetrics({ metricType: "BODY_FAT", limit: 14 }),
    getAnalyticsData(),
    getFoodLogsForDay(today),
    getNutritionTarget(),
    getActiveWorkout(),
    getWorkoutHistory(10),
    getHabits(),
    getHabitLogs({ since: today }),
    getUpcomingReminders({ limit: 1 }),
    getProfile(),
  ]);

  const tracksPeptides = profile?.tracksPeptides ?? true;

  const scores = computeScores(analytics);
  const streak = computeGamification(analytics, 0).currentStreak;
  const scoreCards = [
    { label: "Wellness", ...scores.wellness },
    { label: "Nutrition", ...scores.nutrition },
    { label: "Fitness", ...scores.fitness },
    { label: "Consistency", ...scores.consistency },
    { label: "Recovery", ...scores.recovery },
  ];

  // --- Nutrition ---
  const totals = dayTotals(foodLogs);
  const proteinRemaining = nutritionTarget
    ? Math.max(0, nutritionTarget.proteinG - totals.proteinG)
    : null;

  // --- Exercise ---
  const workoutDoneToday = recentWorkouts.find(
    (w) => w.completedAt && w.completedAt.slice(0, 10) === today
  );

  // --- Habits ---
  const activeHabits = habits.filter((h) => h.active);
  const todaysHabits = activeHabits.filter((h) => isScheduledOn(h, today));
  const habitsDone = todaysHabits.filter((h) => {
    const log = habitLogsToday.find((l) => l.habitId === h.id);
    return log !== undefined && isComplete(h, log.value);
  }).length;
  const water = habitToday(habits, habitLogsToday, "WATER");
  const steps = habitToday(habits, habitLogsToday, "STEPS");
  const sleep = habitToday(habits, habitLogsToday, "SLEEP");

  // --- Peptides ---
  const nextReminder = reminders[0] ?? null;

  const weightSpark = weightEntries.slice().reverse().map((e) => ({ value: e.value }));
  const bodyFatSpark = bodyFatEntries.slice().reverse().map((e) => ({ value: e.value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          What should I do today?
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your day at a glance, pulled from everything you&apos;re tracking.
        </p>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            This week
          </h2>
          <Link href="/analytics" className="text-sm text-primary hover:underline">
            View analytics
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {scoreCards.map((c) => (
            <ScoreCard
              key={c.label}
              label={c.label}
              value={c.value}
              detail={c.detail}
              href="/analytics"
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Nutrition */}
        <StatCard icon={Flame} title="Today's calories" href="/nutrition">
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {round(totals.calories)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              {nutritionTarget ? `/ ${round(nutritionTarget.calories)} kcal` : "kcal"}
            </span>
          </p>
          {nutritionTarget && (
            <ProgressBar pct={(totals.calories / nutritionTarget.calories) * 100} />
          )}
        </StatCard>

        <StatCard icon={Beef} title="Protein remaining" href="/nutrition">
          {proteinRemaining !== null ? (
            <>
              <p className="text-2xl font-semibold tabular-nums tracking-tight">
                {round(proteinRemaining)}
                <span className="ml-1 text-sm font-normal text-muted-foreground">g left</span>
              </p>
              <ProgressBar pct={(totals.proteinG / nutritionTarget!.proteinG) * 100} />
            </>
          ) : (
            <>
              <p className="text-2xl font-semibold tabular-nums tracking-tight">
                {round(totals.proteinG)}
                <span className="ml-1 text-sm font-normal text-muted-foreground">g today</span>
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-primary">
                Set a target <Icon icon={ArrowRight} size="sm" />
              </p>
            </>
          )}
        </StatCard>

        {/* Habits */}
        <StatCard icon={Droplets} title="Water remaining" href="/habits">
          {water && water.habit.targetValue ? (
            water.value >= water.habit.targetValue ? (
              <p className="text-2xl font-semibold tabular-nums tracking-tight">
                Goal hit
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  {round(water.value)} {water.habit.unit ?? "oz"}
                </span>
              </p>
            ) : (
              <>
                <p className="text-2xl font-semibold tabular-nums tracking-tight">
                  {round(water.habit.targetValue - water.value)}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    {water.habit.unit ?? "oz"} left
                  </span>
                </p>
                <ProgressBar pct={(water.value / water.habit.targetValue) * 100} />
              </>
            )
          ) : (
            <Empty>Track water</Empty>
          )}
        </StatCard>

        {/* Exercise */}
        <StatCard icon={Dumbbell} title="Today's workout" href="/exercise">
          {activeWorkout ? (
            <div>
              <p className="truncate text-lg font-semibold">{activeWorkout.name}</p>
              <p className="inline-flex items-center gap-1 text-sm text-primary">
                In progress <Icon icon={ArrowRight} size="sm" />
              </p>
            </div>
          ) : workoutDoneToday ? (
            <div>
              <p className="truncate text-lg font-semibold">{workoutDoneToday.name}</p>
              <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                Completed today <Icon icon={Check} size="sm" className="text-primary" />
              </p>
            </div>
          ) : (
            <Empty>No workout yet — start one</Empty>
          )}
        </StatCard>

        {/* Habits */}
        <StatCard icon={Footprints} title="Steps" href="/habits">
          {steps ? (
            <>
              <p className="text-2xl font-semibold tabular-nums tracking-tight">
                {round(steps.value)}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  {steps.habit.targetValue ? `/ ${round(steps.habit.targetValue)}` : "steps"}
                </span>
              </p>
              {steps.habit.targetValue && (
                <ProgressBar pct={(steps.value / steps.habit.targetValue) * 100} />
              )}
            </>
          ) : (
            <Empty>Track steps</Empty>
          )}
        </StatCard>

        {/* Weight (already wired) */}
        <StatCard
          icon={Scale}
          title="Weight trend"
          href="/weight/trend"
          action={<Delta entries={weightEntries} />}
        >
          {weightEntries.length > 0 ? (
            <div>
              <p className="text-lg font-semibold tabular-nums tracking-tight">
                {formatValue(weightEntries[0].value, weightEntries[0].unit)}
              </p>
              <Sparkline data={weightSpark} />
            </div>
          ) : (
            <Empty>Log your first weigh-in</Empty>
          )}
        </StatCard>

        <StatCard
          icon={Percent}
          title="Body fat trend"
          href="/weight/trend"
          action={<Delta entries={bodyFatEntries} />}
        >
          {bodyFatEntries.length > 0 ? (
            <div>
              <p className="text-lg font-semibold tabular-nums tracking-tight">
                {formatValue(bodyFatEntries[0].value, bodyFatEntries[0].unit)}
              </p>
              <Sparkline data={bodyFatSpark} />
            </div>
          ) : (
            <Empty>Log a body-fat reading</Empty>
          )}
        </StatCard>

        {/* Habits */}
        <StatCard icon={ListChecks} title="Today's habits" href="/habits">
          {todaysHabits.length > 0 ? (
            <p className="text-2xl font-semibold tabular-nums tracking-tight">
              {habitsDone}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / {todaysHabits.length} done
              </span>
            </p>
          ) : (
            <Empty>Build your daily checklist</Empty>
          )}
        </StatCard>

        <StatCard icon={Moon} title="Sleep" href="/habits">
          {sleep && sleep.value > 0 ? (
            <p className="text-2xl font-semibold tabular-nums tracking-tight">
              {formatValue(sleep.value, sleep.habit.unit ?? "hours")}
            </p>
          ) : (
            <Empty>Track sleep</Empty>
          )}
        </StatCard>

        {/* Peptides — hidden for users who don't track peptides */}
        {tracksPeptides && (
          <StatCard icon={Syringe} title="Next peptide reminder" href="/peptides">
            {nextReminder ? (
              <div>
                <p className="truncate text-sm font-medium">{nextReminder.title}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(nextReminder.dueAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            ) : (
              <Empty>No reminders set</Empty>
            )}
          </StatCard>
        )}

        {/* Gamification */}
        <StatCard icon={Trophy} title="Weekly streak" href="/challenges">
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            <span className={streak > 0 ? "text-achievement" : undefined}>{streak}</span>
            <span className="text-base font-normal text-muted-foreground"> day{streak === 1 ? "" : "s"}</span>
          </p>
        </StatCard>
      </div>
    </div>
  );
}
