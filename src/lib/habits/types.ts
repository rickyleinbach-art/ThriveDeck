import type { HabitGoalType, HabitType } from "@/lib/validations/habit";

// Raw shapes returned by Supabase (snake_case columns) and their
// camelCase domain mappings, following the weight/nutrition modules.

export interface HabitRow {
  id: string;
  user_id: string;
  name: string;
  habit_type: HabitType;
  goal_type: HabitGoalType;
  target_value: number | null;
  unit: string | null;
  schedule_days: number[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  name: string;
  habitType: HabitType;
  goalType: HabitGoalType;
  targetValue: number | null;
  unit: string | null;
  scheduleDays: number[];
  active: boolean;
}

export function mapHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    habitType: row.habit_type,
    goalType: row.goal_type,
    targetValue: row.target_value,
    unit: row.unit,
    scheduleDays: row.schedule_days,
    active: row.active,
  };
}

export interface HabitLogRow {
  id: string;
  user_id: string;
  habit_id: string | null;
  habit_name: string;
  logged_on: string;
  value: number;
  notes: string | null;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habitId: string | null;
  habitName: string;
  loggedOn: string;
  value: number;
  notes: string | null;
}

export function mapHabitLog(row: HabitLogRow): HabitLog {
  return {
    id: row.id,
    habitId: row.habit_id,
    habitName: row.habit_name,
    loggedOn: row.logged_on,
    value: row.value,
    notes: row.notes,
  };
}
