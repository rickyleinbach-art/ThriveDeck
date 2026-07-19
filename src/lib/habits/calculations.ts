import type { Habit, HabitLog } from "@/lib/habits/types";

// Streaks and scores are always derived from habit_logs at read time —
// nothing here is persisted. All dates are "YYYY-MM-DD" strings treated
// as UTC calendar days, matching how the rest of the app keys days.

export function addDays(isoDate: string, delta: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function isScheduledOn(habit: Habit, isoDate: string): boolean {
  const day = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
  return habit.scheduleDays.includes(day);
}

// A log completes its habit when the check is set, the quantity/duration
// target is met, or (for ratings) the rating was recorded at all.
export function isComplete(habit: Habit, value: number): boolean {
  switch (habit.goalType) {
    case "CHECK":
      return value > 0;
    case "RATING":
      return true;
    case "QUANTITY":
    case "DURATION":
      return habit.targetValue !== null ? value >= habit.targetValue : value > 0;
  }
}

export interface StreakStats {
  current: number;
  longest: number;
}

// Walks scheduled days from the earliest log to today. Unscheduled days
// neither extend nor break a streak. An incomplete *today* doesn't break
// the current streak — the day isn't over yet.
export function computeStreaks(
  habit: Habit,
  logs: HabitLog[],
  today: string
): StreakStats {
  const completedDays = new Set(
    logs
      .filter((log) => log.habitId === habit.id && isComplete(habit, log.value))
      .map((log) => log.loggedOn)
  );
  if (completedDays.size === 0) return { current: 0, longest: 0 };

  const start = [...completedDays].sort()[0];
  let longest = 0;
  let run = 0;
  for (let day = start; day <= today; day = addDays(day, 1)) {
    if (!isScheduledOn(habit, day)) continue;
    if (completedDays.has(day)) {
      run += 1;
      if (run > longest) longest = run;
    } else if (day !== today) {
      run = 0;
    }
  }
  return { current: run, longest };
}

// Share of scheduled habits completed on a day, 0–100. Null when
// nothing is scheduled (no habits yet, or a full rest day).
export function dailyScore(
  habits: Habit[],
  logs: HabitLog[],
  isoDate: string
): number | null {
  const scheduled = habits.filter((h) => h.active && isScheduledOn(h, isoDate));
  if (scheduled.length === 0) return null;

  const done = scheduled.filter((habit) => {
    const log = logs.find((l) => l.habitId === habit.id && l.loggedOn === isoDate);
    return log !== undefined && isComplete(habit, log.value);
  }).length;

  return Math.round((done / scheduled.length) * 100);
}

// Completion rate over the trailing window ending today, counting only
// scheduled days. Null when no days were scheduled in the window.
export function completionRate(
  habit: Habit,
  logs: HabitLog[],
  today: string,
  windowDays = 30
): number | null {
  const completedDays = new Set(
    logs
      .filter((log) => log.habitId === habit.id && isComplete(habit, log.value))
      .map((log) => log.loggedOn)
  );

  let scheduled = 0;
  let done = 0;
  for (let i = 0; i < windowDays; i++) {
    const day = addDays(today, -i);
    if (!isScheduledOn(habit, day)) continue;
    scheduled += 1;
    if (completedDays.has(day)) done += 1;
  }

  if (scheduled === 0) return null;
  return Math.round((done / scheduled) * 100);
}
