import type { Workout, WorkoutSet } from "@/lib/exercise/types";

// ---------------------------------------------------------------------
// Strength / PR math
// ---------------------------------------------------------------------

// Epley estimated one-rep max. For a single rep it's just the weight.
export function epleyOneRepMax(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

// Total tonnage of the strength sets in a workout (reps × weight).
export function workoutVolumeKg(sets: WorkoutSet[]): number {
  return sets.reduce((sum, set) => {
    if (set.reps && set.weightKg) return sum + set.reps * set.weightKg;
    return sum;
  }, 0);
}

export interface PersonalRecord {
  exerciseName: string;
  bestWeightKg: number;
  bestWeightReps: number;
  bestWeightDate: string;
  estOneRepMaxKg: number;
  setCount: number;
}

// Best-weight PR per exercise across all logged strength sets, with the
// Epley estimate computed from the heaviest set.
export function personalRecords(sets: WorkoutSet[]): PersonalRecord[] {
  const byExercise = new Map<string, PersonalRecord>();

  for (const set of sets) {
    if (!set.weightKg || !set.reps) continue;
    const existing = byExercise.get(set.exerciseName);
    const est = epleyOneRepMax(set.weightKg, set.reps);

    if (!existing) {
      byExercise.set(set.exerciseName, {
        exerciseName: set.exerciseName,
        bestWeightKg: set.weightKg,
        bestWeightReps: set.reps,
        bestWeightDate: set.createdAt,
        estOneRepMaxKg: est,
        setCount: 1,
      });
      continue;
    }

    existing.setCount += 1;
    if (est > existing.estOneRepMaxKg) existing.estOneRepMaxKg = est;
    if (
      set.weightKg > existing.bestWeightKg ||
      (set.weightKg === existing.bestWeightKg && set.reps > existing.bestWeightReps)
    ) {
      existing.bestWeightKg = set.weightKg;
      existing.bestWeightReps = set.reps;
      existing.bestWeightDate = set.createdAt;
    }
  }

  return [...byExercise.values()].sort((a, b) =>
    a.exerciseName.localeCompare(b.exerciseName)
  );
}

// ---------------------------------------------------------------------
// Calories
// kcal ≈ MET × weight (kg) × hours. A population estimate, not a
// measurement — always shown as "estimated" in the UI.
// ---------------------------------------------------------------------
export const DEFAULT_MET = 5.0;

export function estimateCaloriesBurned(input: {
  metValue: number;
  bodyWeightKg: number;
  durationMin: number;
}): number {
  return input.metValue * input.bodyWeightKg * (input.durationMin / 60);
}

// ---------------------------------------------------------------------
// Streaks & weekly stats
// ---------------------------------------------------------------------

// Consecutive calendar days with a completed workout, counting back from
// today (or yesterday, so an unfinished today doesn't break the streak).
export function workoutDayStreak(completedAtDates: string[], today: string): number {
  const days = new Set(completedAtDates);
  let cursor = today;
  if (!days.has(cursor)) cursor = shiftDate(cursor, -1);

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}

export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface WeeklyStats {
  workouts: number;
  totalMinutes: number;
  totalVolumeKg: number;
  totalCalories: number;
}

export function weeklyStats(recentCompleted: Workout[], since: Date): WeeklyStats {
  const inWindow = recentCompleted.filter(
    (w) => w.completedAt && new Date(w.completedAt) >= since
  );
  return {
    workouts: inWindow.length,
    totalMinutes: inWindow.reduce((sum, w) => sum + (w.durationMin ?? 0), 0),
    totalVolumeKg: inWindow.reduce((sum, w) => sum + workoutVolumeKg(w.sets), 0),
    totalCalories: inWindow.reduce((sum, w) => sum + (w.caloriesBurned ?? 0), 0),
  };
}

// ---------------------------------------------------------------------
// Unit display. Weights/distances are stored metric (kg / km); these
// convert at the display/input edge based on the profile's unit system.
// ---------------------------------------------------------------------
export const KG_PER_LB = 0.45359237;
export const KM_PER_MILE = 1.609344;

export type UnitSystem = "METRIC" | "IMPERIAL";

export function weightUnit(unitSystem: UnitSystem): string {
  return unitSystem === "IMPERIAL" ? "lb" : "kg";
}

export function distanceUnit(unitSystem: UnitSystem): string {
  return unitSystem === "IMPERIAL" ? "mi" : "km";
}

export function displayWeight(kg: number, unitSystem: UnitSystem): number {
  return unitSystem === "IMPERIAL" ? kg / KG_PER_LB : kg;
}

export function weightToKg(value: number, unitSystem: UnitSystem): number {
  return unitSystem === "IMPERIAL" ? value * KG_PER_LB : value;
}

export function displayDistance(km: number, unitSystem: UnitSystem): number {
  return unitSystem === "IMPERIAL" ? km / KM_PER_MILE : km;
}

export function distanceToKm(value: number, unitSystem: UnitSystem): number {
  return unitSystem === "IMPERIAL" ? value * KM_PER_MILE : value;
}

// One-line summary of a logged set, e.g. "8 × 100 kg" or "30 min · 5 km".
export function formatSetSummary(set: WorkoutSet, unitSystem: UnitSystem): string {
  const parts: string[] = [];
  if (set.reps !== null) {
    if (set.weightKg !== null && set.weightKg > 0) {
      const weight = Math.round(displayWeight(set.weightKg, unitSystem) * 10) / 10;
      parts.push(`${set.reps} × ${weight} ${weightUnit(unitSystem)}`);
    } else {
      parts.push(`${set.reps} reps`);
    }
  }
  if (set.durationMin !== null) parts.push(formatMinutes(set.durationMin));
  if (set.distanceKm !== null && set.distanceKm > 0) {
    const dist = Math.round(displayDistance(set.distanceKm, unitSystem) * 10) / 10;
    parts.push(`${dist} ${distanceUnit(unitSystem)}`);
  }
  return parts.join(" · ") || "—";
}

export function formatMinutes(totalMinutes: number): string {
  const minutes = Math.round(totalMinutes);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
