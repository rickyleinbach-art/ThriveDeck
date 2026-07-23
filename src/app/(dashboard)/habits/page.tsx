import { Flame, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { getHabitLogs, getHabits } from "@/lib/habits/queries";
import {
  addDays,
  completionRate,
  computeStreaks,
  dailyScore,
  isComplete,
  isScheduledOn,
} from "@/lib/habits/calculations";
import {
  deleteHabitFormAction,
  setHabitActiveFormAction,
} from "@/lib/habits/actions";
import {
  HABIT_GOAL_TYPE_LABELS,
  WEEKDAY_LABELS,
} from "@/lib/validations/habit";
import type { Habit } from "@/lib/habits/types";
import { HabitForm } from "./habit-form";
import { HabitChecklistItem } from "./habit-checklist-item";

function scheduleSummary(habit: Habit): string {
  if (habit.scheduleDays.length === 7) return "Every day";
  return habit.scheduleDays.map((day) => WEEKDAY_LABELS[day]).join(" · ");
}

function goalSummary(habit: Habit): string {
  if (habit.goalType === "QUANTITY" || habit.goalType === "DURATION") {
    return `${habit.targetValue ?? "—"}${habit.unit ? ` ${habit.unit}` : ""} daily`;
  }
  return HABIT_GOAL_TYPE_LABELS[habit.goalType];
}

export default async function HabitsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const yearAgo = addDays(today, -365);

  const [habits, logs] = await Promise.all([
    getHabits(),
    getHabitLogs({ since: yearAgo }),
  ]);

  const activeHabits = habits.filter((h) => h.active);
  const todaysHabits = activeHabits.filter((h) => isScheduledOn(h, today));
  const logsToday = logs.filter((l) => l.loggedOn === today);

  const score = dailyScore(habits, logs, today);
  const doneToday = todaysHabits.filter((habit) => {
    const log = logsToday.find((l) => l.habitId === habit.id);
    return log !== undefined && isComplete(habit, log.value);
  }).length;

  const streaksById = new Map(
    habits.map((habit) => [habit.id, computeStreaks(habit, logs, today)])
  );
  const bestCurrent = Math.max(0, ...activeHabits.map((h) => streaksById.get(h.id)!.current));
  const bestEver = Math.max(0, ...habits.map((h) => streaksById.get(h.id)!.longest));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Habits</h1>
        <p className="mt-1 text-muted-foreground">
          Small daily wins, tracked. Check things off, keep the streaks alive.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Today's score">
          <p className="text-2xl font-semibold">{score !== null ? `${score}%` : "—"}</p>
        </Card>
        <Card title="Completed today">
          <p className="text-2xl font-semibold">
            {doneToday}
            <span className="text-base font-normal text-muted-foreground">
              {" "}
              / {todaysHabits.length}
            </span>
          </p>
        </Card>
        <Card title="Best current streak">
          <p className="text-2xl font-semibold">
            <span className={bestCurrent > 0 ? "text-achievement" : undefined}>
              {bestCurrent}
            </span>
            <span className="text-base font-normal text-muted-foreground"> days</span>
          </p>
        </Card>
        <Card title="Longest streak ever">
          <p className="text-2xl font-semibold">
            <span className={bestEver > 0 ? "text-achievement" : undefined}>
              {bestEver}
            </span>
            <span className="text-base font-normal text-muted-foreground"> days</span>
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Today" className="lg:col-span-2">
          {todaysHabits.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing scheduled today. Add a habit to build your daily checklist.
            </p>
          ) : (
            <div className="space-y-2">
              {todaysHabits.map((habit) => {
                const log = logsToday.find((l) => l.habitId === habit.id);
                return (
                  <HabitChecklistItem
                    key={habit.id}
                    habit={habit}
                    todayValue={log?.value ?? null}
                    done={log !== undefined && isComplete(habit, log.value)}
                    today={today}
                  />
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Add a habit">
          <HabitForm />
        </Card>
      </div>

      <Card title="All habits">
        {habits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No habits yet.</p>
        ) : (
          <div className="space-y-2">
            {habits.map((habit) => {
              const streaks = streaksById.get(habit.id)!;
              const rate = completionRate(habit, logs, today);
              return (
                <div
                  key={habit.id}
                  className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {habit.name}
                      {!habit.active && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          Paused
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {goalSummary(habit)} · {scheduleSummary(habit)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <p className="text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-medium text-foreground">
                        <Icon icon={Flame} size="sm" className="text-achievement" />
                        {streaks.current}
                      </span>{" "}
                      · best {streaks.longest}
                      {rate !== null ? ` · ${rate}% (30d)` : ""}
                    </p>
                    <div className="flex gap-1">
                      <form
                        action={setHabitActiveFormAction.bind(null, habit.id, !habit.active)}
                      >
                        <Button type="submit" variant="outline" size="sm">
                          {habit.active ? "Pause" : "Resume"}
                        </Button>
                      </form>
                      <form action={deleteHabitFormAction.bind(null, habit.id)}>
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          aria-label="Delete habit"
                          className="text-destructive"
                        >
                          <Icon icon={Trash2} />
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
