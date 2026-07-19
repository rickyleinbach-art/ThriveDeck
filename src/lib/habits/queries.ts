import { createClient } from "@/lib/supabase/server";
import {
  mapHabit,
  mapHabitLog,
  type Habit,
  type HabitLog,
  type HabitLogRow,
  type HabitRow,
} from "@/lib/habits/types";

// Server-side reads. RLS scopes every query to the signed-in user already;
// the explicit user_id filter below is defense in depth, not the boundary.
export async function getHabits(options?: { activeOnly?: boolean }): Promise<Habit[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (options?.activeOnly) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as HabitRow[]).map(mapHabit);
}

export async function getHabitLogs(options?: {
  since?: string; // "YYYY-MM-DD" lower bound
  habitId?: string;
}): Promise<HabitLog[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("habit_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("logged_on", { ascending: false });

  if (options?.since) {
    query = query.gte("logged_on", options.since);
  }
  if (options?.habitId) {
    query = query.eq("habit_id", options.habitId);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as HabitLogRow[]).map(mapHabitLog);
}
